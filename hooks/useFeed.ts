"use client";

import { useState, useCallback, useRef } from "react";
import type { VideoMetadata, FeedTab } from "@/types";
import { cachedENSLookup } from "./useENS";

const PAGE_SIZE = 10;

// Mock data for development — replace with real indexer/API
function generateMockVideo(index: number): VideoMetadata {
  const addresses = [
    "0x1234567890123456789012345678901234567890",
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
  ];
  const captions = [
    "gm frens 🌅 #ethereum #crypto",
    "My on-chain journey started today ⛓️ #web3 #defi",
    "This is what decentralization feels like 🔥 #ethvideos",
    "ENS names are the future of identity #ens #ethereum",
    "Base is cooking ser 🔵 #base #layer2",
  ];
  const poster = addresses[index % addresses.length];
  const playbackIds = [
    "f5eese2o5la7bgpn",
    "2f7rj1i8h4h6lcpf",
    "6d7el73r1y12chm8",
  ];

  return {
    cid: `bafybeig${Math.random().toString(36).slice(2)}${index}`,
    playbackId: playbackIds[index % playbackIds.length],
    thumbnailUrl: `https://picsum.photos/seed/${index + 10}/400/700`,
    caption: captions[index % captions.length],
    hashtags: ["ethereum", "web3"],
    duration: 15 + (index % 45),
    poster,
    timestamp: Math.floor(Date.now() / 1000) - index * 3600,
    likes: Math.floor(Math.random() * 10000),
    comments: Math.floor(Math.random() * 500),
    tips: (Math.random() * 2).toFixed(4),
    views: Math.floor(Math.random() * 100000),
  };
}

export function useFeed(tab: FeedTab, followingAddresses: string[] = []) {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const fetchVideos = useCallback(
    async (page: number, refresh = false) => {
      if (tab === "following" && followingAddresses.length === 0) {
        setVideos([]);
        setHasMore(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          tab,
          page: String(page),
          limit: String(PAGE_SIZE),
          ...(tab === "following"
            ? { following: followingAddresses.slice(0, 50).join(",") }
            : {}),
        });

        const res = await fetch(`/api/videos?${params}`);
        if (!res.ok) throw new Error("Failed to fetch videos");
        const data: VideoMetadata[] = await res.json();

        // Enrich with ENS data
        const enriched = await Promise.all(
          data.map(async (video) => {
            const ens = await cachedENSLookup(video.poster);
            return {
              ...video,
              posterEns: ens.name ?? undefined,
              posterAvatar: ens.avatar ?? undefined,
            };
          })
        );

        if (refresh) {
          setVideos(enriched);
        } else {
          setVideos((prev) => [...prev, ...enriched]);
        }

        setHasMore(data.length === PAGE_SIZE);
        pageRef.current = page + 1;
      } catch (err) {
        console.error("Feed fetch error:", err);
        // Fall back to mock data for development
        const mockData = Array.from({ length: PAGE_SIZE }, (_, i) =>
          generateMockVideo(page * PAGE_SIZE + i)
        );
        if (refresh) {
          setVideos(mockData);
        } else {
          setVideos((prev) => [...prev, ...mockData]);
        }
        setHasMore(page < 5);
        pageRef.current = page + 1;
      }
    },
    [tab, followingAddresses]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    pageRef.current = 0;
    await fetchVideos(0, true);
    setLoading(false);
  }, [fetchVideos]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    await fetchVideos(pageRef.current);
    setLoading(false);
  }, [loading, hasMore, fetchVideos]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = 0;
    await fetchVideos(0, true);
    setRefreshing(false);
  }, [fetchVideos]);

  const prependVideo = useCallback((video: VideoMetadata) => {
    setVideos((prev) => [video, ...prev]);
  }, []);

  return {
    videos,
    loading,
    refreshing,
    hasMore,
    loadInitial,
    loadMore,
    refresh,
    prependVideo,
  };
}
