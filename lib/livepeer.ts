// Livepeer utility functions — no SDK import needed client-side.
// Video upload and transcoding go through our API routes (server-side).
// Playback uses hls.js directly with Livepeer's CDN URLs.

export async function createLivepeerUpload(name: string): Promise<{
  url: string;
  assetId: string;
}> {
  const response = await fetch("/api/livepeer/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) throw new Error("Failed to create upload URL");
  return response.json();
}

export async function uploadToLivepeer(
  file: File,
  name: string,
  onProgress: (percent: number) => void
): Promise<{ assetId: string; playbackId: string }> {
  // Step 1: Get upload URL from our API route
  const { url, assetId } = await createLivepeerUpload(name);

  // Step 2: Upload directly to Livepeer
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.statusText}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });

  // Step 3: Poll for playback ID
  const playbackId = await pollForPlaybackId(assetId);
  return { assetId, playbackId };
}

async function pollForPlaybackId(
  assetId: string,
  maxAttempts = 30,
  intervalMs = 3000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/livepeer/asset/${assetId}`);
    if (res.ok) {
      const asset = await res.json();
      if (asset.playbackId) return asset.playbackId;
      if (asset.status?.phase === "failed") throw new Error("Transcoding failed");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timed out waiting for playback ID");
}

export function getLivepeerThumbnail(playbackId: string): string {
  return `https://livepeercdn.studio/hls/${playbackId}/thumbnails/keyframe_0.png`;
}

export function getLivepeerHLS(playbackId: string): string {
  return `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;
}
