"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { ENSAvatar } from "@/components/ui/ENSAvatar";
import { TipModal } from "@/components/tips/TipModal";
import { formatRelativeTime, formatCount, formatDisplayName } from "@/lib/utils";
import type { VideoMetadata } from "@/types";

export function VideoPageClient({ cid }: { cid: string }) {
  const router = useRouter();
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    fetch(`/api/videos/${cid}`)
      .then((r) => r.json())
      .then(setVideo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-eth-dark">
        <Loader2 className="text-neon-cyan animate-spin" size={32} />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-eth-dark gap-4">
        <p className="text-muted-foreground">Video not found</p>
        <button onClick={() => router.back()} className="text-neon-cyan text-sm">
          Go back
        </button>
      </div>
    );
  }

  return (
    <main className="bg-black h-dvh flex flex-col">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-50 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="flex-1 relative">
        <VideoPlayer
          playbackId={video.playbackId}
          thumbnailUrl={video.thumbnailUrl}
          isActive={true}
          className="absolute inset-0"
        />
      </div>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-eth-card border-t border-eth-border px-5 py-4 max-h-[40vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <ENSAvatar
              address={video.poster}
              ensName={video.posterEns}
              avatarUrl={video.posterAvatar}
              size="md"
              showRing
            />
            <div>
              <p className="text-white font-bold text-sm">
                @{formatDisplayName(video.poster, video.posterEns)}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatRelativeTime(video.timestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowTip(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-eth-dark"
            style={{ background: "linear-gradient(135deg, #00f5ff, #bf5af2)" }}
          >
            Tip
          </button>
        </div>

        <p className="text-white text-sm leading-relaxed mb-3">{video.caption}</p>

        <div className="flex gap-4 text-muted-foreground text-xs">
          <span>♥ {formatCount(video.likes)}</span>
          <span>💬 {formatCount(video.comments)}</span>
          <span>👁 {formatCount(video.views)}</span>
        </div>

        <div className="mt-3 pt-3 border-t border-eth-border">
          <a
            href={`https://ipfs.io/ipfs/${cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-cyan text-xs font-mono hover:underline"
          >
            ipfs://{cid.slice(0, 20)}...
          </a>
        </div>
      </motion.div>

      <TipModal
        open={showTip}
        onClose={() => setShowTip(false)}
        creatorAddress={video.poster}
        creatorEns={video.posterEns}
        creatorAvatar={video.posterAvatar}
        videoCid={video.cid}
      />
    </main>
  );
}
