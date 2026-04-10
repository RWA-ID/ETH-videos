export const dynamic = "force-static";
export function generateStaticParams() { return []; }
import { NextRequest, NextResponse } from "next/server";
import { fetchFromIPFSWithFallback } from "@/lib/ipfs";
import type { VideoMetadata, IPFSVideoMetadata } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;

  try {
    const metadata = await fetchFromIPFSWithFallback<IPFSVideoMetadata>(cid);

    const video: VideoMetadata = {
      cid,
      playbackId: metadata.properties.livepeerPlaybackId,
      thumbnailUrl: metadata.image.startsWith("ipfs://")
        ? `https://gateway.pinata.cloud/ipfs/${metadata.image.slice(7)}`
        : metadata.image,
      caption: metadata.properties.caption,
      hashtags: metadata.properties.hashtags,
      duration: metadata.properties.duration,
      poster: metadata.properties.poster,
      timestamp: metadata.properties.timestamp,
      likes: 0,
      comments: 0,
      tips: "0",
      views: 0,
      remixOf: metadata.properties.remixOf,
    };

    return NextResponse.json(video);
  } catch {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
}
