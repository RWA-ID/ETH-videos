import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatDisplayName(
  address?: string,
  ensName?: string,
  maxLength = 20
): string {
  if (ensName) {
    return ensName.length > maxLength
      ? ensName.slice(0, maxLength - 3) + "..."
      : ensName;
  }
  if (address) return truncateAddress(address);
  return "Unknown";
}

export function formatRelativeTime(timestamp: number): string {
  try {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
  } catch {
    return "recently";
  }
}

export function formatTipAmount(
  amount: string,
  token: "ETH" | "USDC_MAINNET" | "USDC_BASE"
): string {
  const num = parseFloat(amount);
  if (token === "ETH") {
    if (num < 0.001) return `${(num * 1000000).toFixed(0)} gwei`;
    if (num < 1) return `${num.toFixed(4)} ETH`;
    return `${num.toFixed(3)} ETH`;
  }
  const symbol = "USDC";
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k ${symbol}`;
  return `$${num.toFixed(2)} ${symbol}`;
}

export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function getIPFSUrl(cid: string, gateway = "https://ipfs.io"): string {
  if (!cid) return "";
  if (cid.startsWith("http")) return cid;
  if (cid.startsWith("ipfs://")) return `${gateway}/ipfs/${cid.slice(7)}`;
  return `${gateway}/ipfs/${cid}`;
}

export function ipfsToHttp(url: string): string {
  if (!url) return "";
  if (url.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${url.slice(7)}`;
  }
  return url;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g);
  return matches ? [...new Set(matches)] : [];
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: "Ethereum",
    8453: "Base",
    11155111: "Sepolia",
    84532: "Base Sepolia",
  };
  return chains[chainId] || `Chain ${chainId}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Video validation (size + type only — duration checked separately after load)
export function validateVideoFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 500 * 1024 * 1024; // 500MB
  const allowedTypes = ["video/mp4", "video/webm", "video/mov", "video/quicktime"];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Please upload an MP4, WebM, or MOV file" };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be under 500MB" };
  }

  return { valid: true };
}

// Validate video duration (15–60 seconds)
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error("Could not read video duration"));
  });
}

export function validateVideoDuration(
  duration: number,
  minSeconds = 15,
  maxSeconds = 180 // 3 minutes
): { valid: boolean; error?: string } {
  if (duration < minSeconds) {
    return {
      valid: false,
      error: `Video must be at least ${minSeconds} seconds (yours is ${Math.round(duration)}s)`,
    };
  }
  if (duration > maxSeconds) {
    return {
      valid: false,
      error: `Video must be ${maxSeconds / 60} minutes or less (yours is ${Math.round(duration)}s)`,
    };
  }
  return { valid: true };
}

// Generate video thumbnail from file
export async function generateThumbnail(
  file: File,
  timeSeconds = 1
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    video.muted = true;
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = timeSeconds;
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(video.src);
        resolve(blob);
      }, "image/jpeg", 0.85);
    };

    video.onerror = () => resolve(null);
  });
}

// Color palette for neon accents based on address
export function getAddressColor(address: string): string {
  const colors = [
    "#00f5ff", // cyan
    "#bf5af2", // purple
    "#ff375f", // pink
    "#30d158", // green
    "#ff9f0a", // orange
    "#64d2ff", // light blue
    "#ff6961", // coral
  ];
  const index = parseInt(address.slice(2, 4), 16) % colors.length;
  return colors[index];
}
