export interface VideoMetadata {
  cid: string;
  playbackId: string;
  thumbnailCid?: string;
  thumbnailUrl?: string;
  caption: string;
  hashtags: string[];
  duration: number;
  poster: string; // ethereum address
  posterEns?: string;
  posterAvatar?: string;
  timestamp: number;
  likes: number;
  comments: number;
  tips: string; // in ETH equivalent
  views: number;
  remixOf?: string; // original video CID if this is a remix
  txHash?: string; // on-chain post tx
}

export interface UserProfile {
  address: string;
  ensName?: string;
  avatar?: string;
  bio?: string;
  bannerCid?: string;
  bannerUrl?: string;
  profileCid?: string; // IPFS CID of profile metadata
  followers?: number;
  following?: number;
  videoCount?: number;
  joinedAt?: number;
}

export interface Comment {
  id: string;
  author: string;
  authorEns?: string;
  authorAvatar?: string;
  content: string;
  timestamp: number;
  txHash?: string;
}

export interface TipPayment {
  from: string;
  to: string;
  amount: string;
  token: "ETH" | "USDC_MAINNET" | "USDC_BASE";
  videoCid: string;
  txHash: string;
  timestamp: number;
}

export type FeedTab = "for-you" | "following";

export type ChainOption = "ethereum" | "base";

export interface UploadProgress {
  stage: "idle" | "uploading" | "transcoding" | "pinning" | "posting" | "done" | "error";
  percent: number;
  message: string;
  playbackId?: string;
  cid?: string;
  txHash?: string;
  error?: string;
}

export interface TipOption {
  amount: string;
  label: string;
  token: "ETH" | "USDC";
  chain: ChainOption;
}

export interface OnboardingState {
  step: "splash" | "connect" | "sign" | "ens-check" | "profile" | "welcome" | "done";
  address?: string;
  ensName?: string;
  avatar?: string;
}

export interface EFPStats {
  followers: number;
  following: number;
}

export interface LivepeerAsset {
  id: string;
  playbackId: string;
  status: {
    phase: string;
    progress?: number;
  };
  videoSpec?: {
    duration: number;
  };
}

export interface IPFSVideoMetadata {
  name: string;
  description: string;
  image: string; // thumbnail IPFS URL
  animation_url: string; // video IPFS URL
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    poster: string;
    caption: string;
    hashtags: string[];
    duration: number;
    livepeerPlaybackId: string;
    timestamp: number;
    remixOf?: string;
  };
}
