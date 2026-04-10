import type { IPFSVideoMetadata } from "@/types";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";
const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

export async function uploadFileToPinata(
  file: File | Blob,
  name: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, name);
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name,
      keyvalues: { app: "ethvideos-eth" },
    })
  );
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.IpfsHash);
      } else {
        reject(new Error(`Pinata upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));

    xhr.open("POST", "https://api.pinata.cloud/pinning/pinFileToIPFS");
    xhr.setRequestHeader("Authorization", `Bearer ${PINATA_JWT}`);
    xhr.send(formData);
  });
}

export async function uploadJSONToPinata(
  metadata: object,
  name: string
): Promise<string> {
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: { name, keyvalues: { app: "ethvideos-eth" } },
        pinataOptions: { cidVersion: 1 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to pin JSON: ${response.statusText}`);
  }

  const data = await response.json();
  return data.IpfsHash as string;
}

export async function buildVideoMetadata(params: {
  videoCid: string;
  thumbnailCid: string;
  playbackId: string;
  caption: string;
  hashtags: string[];
  duration: number;
  poster: string;
  posterEns?: string;
  remixOf?: string;
}): Promise<IPFSVideoMetadata> {
  return {
    name: params.caption || "Untitled Video",
    description: params.caption,
    image: `ipfs://${params.thumbnailCid}`,
    animation_url: `ipfs://${params.videoCid}`,
    attributes: [
      { trait_type: "Duration", value: params.duration },
      { trait_type: "Poster", value: params.posterEns || params.poster },
      { trait_type: "Platform", value: "ethvideos.eth" },
      ...params.hashtags.map((tag) => ({ trait_type: "Hashtag", value: tag })),
    ],
    properties: {
      poster: params.poster,
      caption: params.caption,
      hashtags: params.hashtags,
      duration: params.duration,
      livepeerPlaybackId: params.playbackId,
      timestamp: Math.floor(Date.now() / 1000),
      ...(params.remixOf ? { remixOf: params.remixOf } : {}),
    },
  };
}

export function ipfsUrl(cid: string, gateway?: string): string {
  const gw = gateway || PINATA_GATEWAY;
  if (!cid) return "";
  if (cid.startsWith("http")) return cid;
  if (cid.startsWith("ipfs://")) return `${gw}/ipfs/${cid.slice(7)}`;
  return `${gw}/ipfs/${cid}`;
}

export async function fetchFromIPFS<T = unknown>(cid: string): Promise<T> {
  const url = ipfsUrl(cid);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IPFS fetch failed for ${cid}`);
  return res.json() as Promise<T>;
}

// Fallback gateway list for resilience
export const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud",
  "https://ipfs.io",
  "https://cloudflare-ipfs.com",
  "https://w3s.link",
];

export async function fetchFromIPFSWithFallback<T = unknown>(
  cid: string
): Promise<T> {
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}/ipfs/${cid.replace("ipfs://", "")}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return res.json() as Promise<T>;
    } catch {
      continue;
    }
  }
  throw new Error(`Failed to fetch ${cid} from all gateways`);
}
