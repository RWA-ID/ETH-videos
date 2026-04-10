export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import type { VideoMetadata } from "@/types";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

const VIDEOS_QUERY = `
  query GetVideos($skip: Int!, $first: Int!) {
    videos(
      skip: $skip
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { removed: false }
    ) {
      id
      tokenId
      poster
      ipfsCid
      playbackId
      caption
      timestamp
      likes
    }
  }
`;

const POSTER_QUERY = `
  query GetPosterVideos($skip: Int!, $first: Int!, $poster: Bytes!) {
    videos(
      skip: $skip
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { removed: false, poster: $poster }
    ) {
      id
      tokenId
      poster
      ipfsCid
      playbackId
      caption
      timestamp
      likes
    }
  }
`;

const FOLLOWING_QUERY = `
  query GetFollowingVideos($skip: Int!, $first: Int!, $posters: [Bytes!]!) {
    videos(
      skip: $skip
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: {
        removed: false
        poster_in: $posters
      }
    ) {
      id
      tokenId
      poster
      ipfsCid
      playbackId
      caption
      timestamp
      likes
    }
  }
`;

async function querySubgraph(
  query: string,
  variables: Record<string, unknown>
): Promise<{ data?: { videos: SubgraphVideo[] }; errors?: unknown[] }> {
  const res = await fetch(SUBGRAPH_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 10 }, // cache for 10s
  });
  return res.json();
}

interface SubgraphVideo {
  id: string;
  tokenId: string;
  poster: string;
  ipfsCid: string;
  playbackId: string;
  caption: string;
  timestamp: string;
  likes: string;
}

function mapToVideoMetadata(v: SubgraphVideo): VideoMetadata {
  return {
    cid: v.ipfsCid,
    playbackId: v.playbackId,
    thumbnailUrl: v.playbackId
      ? `https://livepeercdn.studio/hls/${v.playbackId}/thumbnails/keyframe_0.png`
      : "",
    caption: v.caption,
    hashtags: extractHashtags(v.caption),
    duration: 0,
    poster: v.poster,
    timestamp: parseInt(v.timestamp),
    likes: parseInt(v.likes),
    comments: 0,   // fetched separately via comments API
    tips: "0",     // fetched separately via on-chain events
    views: 0,
  };
}

function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#(\w+)/g);
  return matches ? matches.map((t) => t.slice(1)).slice(0, 5) : [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "for-you";
  const page = parseInt(searchParams.get("page") || "0");
  const limit = parseInt(searchParams.get("limit") || "10");
  const following = searchParams.get("following")?.split(",").filter(Boolean) || [];
  const poster = searchParams.get("poster")?.toLowerCase() || null;

  // Fall back to mock data if subgraph URL isn't configured yet
  if (!SUBGRAPH_URL || SUBGRAPH_URL.includes("<YOUR_SUBGRAPH_ID>")) {
    return NextResponse.json(getMockVideos(page, limit, tab, following));
  }

  try {
    let result;

    if (poster) {
      result = await querySubgraph(POSTER_QUERY, {
        skip: page * limit,
        first: limit,
        poster,
      });
    } else if (tab === "following" && following.length > 0) {
      result = await querySubgraph(FOLLOWING_QUERY, {
        skip: page * limit,
        first: limit,
        posters: following.map((a) => a.toLowerCase()),
      });
    } else {
      result = await querySubgraph(VIDEOS_QUERY, {
        skip: page * limit,
        first: limit,
      });
    }

    if (result.errors?.length) {
      console.error("Subgraph errors:", result.errors);
      return NextResponse.json(
        { error: "Subgraph query failed" },
        { status: 502 }
      );
    }

    const videos = (result.data?.videos ?? []).map(mapToVideoMetadata);
    return NextResponse.json(videos);
  } catch (error) {
    console.error("Videos API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

// ─── Mock fallback (used until subgraph is deployed) ─────────────────────────

function getMockVideos(
  page: number,
  limit: number,
  tab: string,
  following: string[]
): VideoMetadata[] {
  const addresses = [
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    "0x1234567890123456789012345678901234567890",
  ];

  return Array.from({ length: limit }, (_, i) => {
    const poster = addresses[(page * limit + i) % addresses.length];
    if (tab === "following" && following.length > 0 && !following.includes(poster)) {
      return null;
    }
    return {
      cid: `bafybei${Math.random().toString(36).slice(2)}${page}${i}`,
      playbackId: "f5eese2o5la7bgpn",
      thumbnailUrl: `https://picsum.photos/seed/${page * 10 + i}/400/700`,
      caption: [
        "gm frens 🌅 #ethereum #web3",
        "Building on Base today 🔵 #base",
        "ENS names are forever ⛓️ #ens",
        "DeFi summer but make it 2025 🌊 #defi",
        "Zero knowledge everything 🕶️ #zk",
      ][(page * limit + i) % 5],
      hashtags: ["ethereum", "web3"],
      duration: 15 + ((page * limit + i) % 45),
      poster,
      timestamp: Math.floor(Date.now() / 1000) - (page * limit + i) * 3600,
      likes: Math.floor(Math.random() * 10000),
      comments: Math.floor(Math.random() * 500),
      tips: (Math.random() * 2).toFixed(4),
      views: Math.floor(Math.random() * 100000),
    };
  }).filter(Boolean) as VideoMetadata[];
}
