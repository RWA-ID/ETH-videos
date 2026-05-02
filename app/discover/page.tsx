"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Flame, Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { BackgroundLights } from "@/components/ui/BackgroundLights";
import { formatCount, formatDisplayName } from "@/lib/utils";
import type { VideoMetadata } from "@/types";

// Mock trending data
const TRENDING_HASHTAGS = [
  { tag: "ethereum", count: 24800 },
  { tag: "base", count: 18200 },
  { tag: "defi", count: 15600 },
  { tag: "nft", count: 12400 },
  { tag: "web3", count: 10800 },
  { tag: "ens", count: 8900 },
  { tag: "zk", count: 7200 },
  { tag: "layer2", count: 6100 },
];

export default function DiscoverPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [trendingVideos, setTrendingVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock trending videos
    const mock: VideoMetadata[] = Array.from({ length: 12 }, (_, i) => ({
      cid: `trending-${i}`,
      playbackId: "",
      thumbnailUrl: `https://picsum.photos/seed/trending${i}/300/530`,
      caption: `Trending video #${i + 1}`,
      hashtags: ["ethereum"],
      duration: 30,
      poster: `0x${i.toString().padStart(40, "0")}`,
      timestamp: Date.now() / 1000 - i * 1800,
      likes: Math.floor(Math.random() * 50000) + 10000,
      comments: Math.floor(Math.random() * 1000),
      tips: (Math.random() * 5).toFixed(4),
      views: Math.floor(Math.random() * 500000) + 50000,
    }));
    setTrendingVideos(mock);
    setLoading(false);
  }, []);

  return (
    <main className="bg-eth-dark min-h-dvh pb-20">
      <BackgroundLights variant="subtle" />
      <Header title="Discover" showSearch onHome={() => router.push("/")} />

      <div className="pt-16 px-4">
        {/* Search bar */}
        <div className="relative mb-6 mt-4">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search videos, creators, hashtags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 bg-eth-surface border border-eth-border rounded-xl pl-10 pr-4 text-white text-sm placeholder:text-muted-foreground/60 outline-none focus:border-neon-cyan/50 transition-colors"
          />
        </div>

        {/* Trending hashtags */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-neon-cyan" />
            <h2 className="text-white font-bold text-sm">Trending Tags</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_HASHTAGS.map(({ tag, count }, i) => (
              <motion.button
                key={tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-1.5 bg-eth-surface border border-eth-border rounded-full px-3 py-1.5 hover:border-neon-cyan/40 transition-colors"
              >
                <span className="text-neon-cyan text-sm font-medium">#{tag}</span>
                <span className="text-muted-foreground text-xs">
                  {formatCount(count)}
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Trending videos */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flame size={16} className="text-neon-pink" />
            <h2 className="text-white font-bold text-sm">Top Videos This Week</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[9/16] skeleton rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {trendingVideos.map((video, i) => (
                <motion.div
                  key={video.cid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link href={`/video/${video.cid}`}>
                    <div className="aspect-[9/16] relative rounded-xl overflow-hidden bg-eth-surface group">
                      {video.thumbnailUrl && (
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.caption}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="200px"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      {/* Rank badge */}
                      {i < 3 && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-neon-cyan flex items-center justify-center">
                          <span className="text-eth-dark text-[10px] font-black">
                            {i + 1}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-white/80 text-[10px]">
                            ♥ {formatCount(video.likes)}
                          </span>
                          <span className="text-white/30 text-[10px]">·</span>
                          <span className="text-white/80 text-[10px]">
                            {formatCount(video.views)} views
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
