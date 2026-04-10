"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  Share2,
  Repeat2,
  MoreHorizontal,
} from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { ENSAvatar } from "@/components/ui/ENSAvatar";
import { TipModal } from "@/components/tips/TipModal";
import { CommentsSheet } from "@/components/video/CommentsSheet";
import { DMButton } from "@/components/messaging/DMButton";
import { useIsFollowing } from "@/hooks/useEFP";
import {
  formatCount,
  formatRelativeTime,
  formatDisplayName,
  cn,
} from "@/lib/utils";
import { CONTRACTS, REACTIONS_ABI } from "@/lib/contracts";
import type { VideoMetadata } from "@/types";

interface VideoCardProps {
  video: VideoMetadata;
  isActive: boolean;
  onComment?: () => void;
}

export function VideoCard({ video, isActive, onComment }: VideoCardProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { isFollowing } = useIsFollowing(address, video.poster);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [showTip, setShowTip] = useState(false);
  const [tipToken, setTipToken] = useState<"ETH" | "USDC">("ETH");
  const [showComments, setShowComments] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);

  const handleLike = useCallback(async () => {
    if (!address) return;
    setLiked((l) => !l);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    setLikeAnimation(true);
    setTimeout(() => setLikeAnimation(false), 600);

    try {
      await writeContractAsync({
        address: CONTRACTS.mainnet.reactions,
        abi: REACTIONS_ABI,
        functionName: liked ? "unlike" : "like",
        args: [video.cid],
      });
    } catch {
      setLiked((l) => !l);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
    }
  }, [address, liked, video.cid, writeContractAsync]);

  const handleDoubleTap = useCallback(() => {
    if (!liked) handleLike();
  }, [liked, handleLike]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/video/${video.cid}`;
    navigator.share?.({ url, title: video.caption }) ??
      navigator.clipboard.writeText(url);
  }, [video.cid, video.caption]);

  const displayName = formatDisplayName(video.poster, video.posterEns);

  return (
    <div className="feed-item relative overflow-hidden bg-black">
      {/* Full-screen video */}
      <VideoPlayer
        playbackId={video.playbackId}
        thumbnailUrl={video.thumbnailUrl}
        isActive={isActive}
        onDoubleTap={handleDoubleTap}
        className="absolute inset-0"
      />

      {/* Vignette — top + bottom */}
      <div className="absolute inset-0 video-gradient-overlay pointer-events-none" />

      {/* ── Right action bar — frosted command pod ── */}
      <div
        className="absolute right-2 bottom-6 z-10"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          padding: "14px 8px",
          borderRadius: 40,
          background: "rgba(6, 8, 20, 0.62)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow:
            "0 4px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        {/* Avatar + Follow */}
        <Link href={`/profile/${video.poster}`}>
          <div className="relative mb-1">
            <ENSAvatar
              address={video.poster}
              ensName={video.posterEns}
              avatarUrl={video.posterAvatar}
              size="lg"
              showRing
            />
            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px 3px 5px",
                  borderRadius: 20,
                  background: isFollowing
                    ? "rgba(0,245,255,0.14)"
                    : "rgba(8,10,24,0.88)",
                  border: isFollowing
                    ? "1px solid rgba(0,245,255,0.45)"
                    : "1px solid rgba(255,255,255,0.18)",
                  backdropFilter: "blur(10px)",
                  cursor: "pointer",
                  boxShadow: isFollowing
                    ? "0 0 12px rgba(0,245,255,0.2)"
                    : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: isFollowing ? "#00f5ff" : "rgba(255,255,255,0.85)",
                    lineHeight: 1,
                    padding: "0 2px",
                  }}
                >
                  {isFollowing ? "✓" : "+"}
                </span>
              </button>
            </div>
          </div>
        </Link>

        {/* Separator */}
        <div
          style={{
            width: 28,
            height: 1,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 1,
            margin: "10px 0 4px",
          }}
        />

        {/* Like */}
        <ActionButton
          icon={
            <motion.div
              animate={likeAnimation ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Heart
                size={32}
                className={cn(
                  "transition-all duration-200",
                  liked
                    ? "fill-neon-pink text-neon-pink drop-shadow-[0_0_10px_rgba(255,55,95,0.9)]"
                    : "text-white"
                )}
              />
            </motion.div>
          }
          count={likeCount}
          onClick={handleLike}
          label="Like"
        />

        {/* Comments */}
        <ActionButton
          icon={
            <MessageCircle
              size={32}
              style={{ color: "#00f5ff", filter: "drop-shadow(0 0 6px rgba(0,245,255,0.4))" }}
            />
          }
          count={video.comments}
          onClick={() => setShowComments(true)}
          label="Comment"
        />

        {/* Remix */}
        <ActionButton
          icon={
            <Repeat2
              size={28}
              style={{ color: "#bf5af2", filter: "drop-shadow(0 0 6px rgba(191,90,242,0.4))" }}
            />
          }
          count="Remix"
          onClick={() => {}}
          label="Remix"
        />

        {/* Share */}
        <ActionButton
          icon={<Share2 size={28} className="text-white/85" />}
          count="Share"
          onClick={handleShare}
          label="Share"
        />

        {/* DM creator */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-14 h-14 flex items-center justify-center">
            <DMButton
              peerAddress={video.poster}
              variant="icon"
              className="w-10 h-10 bg-transparent border-none text-white/70 hover:text-white"
            />
          </div>
        </div>

        {/* More */}
        <button
          className="w-14 h-14 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors tap-highlight-none"
          aria-label="More"
        >
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* Bottom info */}
      <div
        className="absolute bottom-4 left-4 right-24 z-10"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
      >
        {/* Author */}
        <Link href={`/profile/${video.poster}`} className="flex items-center gap-2 mb-2">
          <span
            style={{
              fontFamily: "Satoshi, Inter, sans-serif",
              fontWeight: 700,
              fontSize: 17,
              color: "white",
              letterSpacing: "-0.01em",
            }}
          >
            @{displayName}
          </span>
          {video.posterEns && (
            <span
              style={{
                fontFamily: "Satoshi, Inter, sans-serif",
                fontWeight: 700,
                fontSize: 12,
                color: "#00f5ff",
                background: "rgba(0,245,255,0.1)",
                border: "1px solid rgba(0,245,255,0.25)",
                padding: "2px 7px",
                borderRadius: 20,
              }}
            >
              .eth
            </span>
          )}
        </Link>

        {/* Caption */}
        <p
          className="mb-2.5 line-clamp-3"
          style={{
            fontFamily: "Satoshi, Inter, sans-serif",
            fontWeight: 500,
            fontSize: 15,
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.92)",
          }}
        >
          {video.caption}
        </p>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {video.hashtags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "Satoshi, Inter, sans-serif",
                fontWeight: 500,
                fontSize: 13,
                color: "#00f5ff",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Timestamp + views */}
        <div className="flex items-center gap-2 mb-4">
          <span
            style={{
              fontFamily: "Satoshi, Inter, sans-serif",
              fontWeight: 400,
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {formatRelativeTime(video.timestamp)}
          </span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>·</span>
          <span
            style={{
              fontFamily: "Satoshi, Inter, sans-serif",
              fontWeight: 400,
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {formatCount(video.views)} views
          </span>
        </div>

        {/* ── Tip Buttons ── */}
        <div className="flex items-center gap-2 mt-1">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={(e) => { e.stopPropagation(); setTipToken("ETH"); setShowTip(true); }}
            className="flex items-center gap-1.5 rounded-2xl"
            style={{
              padding: "8px 14px",
              background: "rgba(98,126,234,0.15)",
              border: "1px solid rgba(98,126,234,0.4)",
              boxShadow: "0 0 16px rgba(98,126,234,0.18)",
              backdropFilter: "blur(12px)",
              fontFamily: "Satoshi, Inter, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            <ETHIcon size={16} />
            <span>Tip ETH</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={(e) => { e.stopPropagation(); setTipToken("USDC"); setShowTip(true); }}
            className="flex items-center gap-1.5 rounded-2xl"
            style={{
              padding: "8px 14px",
              background: "rgba(39,117,202,0.15)",
              border: "1px solid rgba(39,117,202,0.4)",
              boxShadow: "0 0 16px rgba(39,117,202,0.18)",
              backdropFilter: "blur(12px)",
              fontFamily: "Satoshi, Inter, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            <USDCIcon size={16} />
            <span>Tip USDC</span>
          </motion.button>

          {parseFloat(video.tips) > 0 && (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {parseFloat(video.tips).toFixed(3)} Ξ
            </span>
          )}
        </div>
      </div>

      {/* Comments Sheet */}
      <CommentsSheet
        open={showComments}
        onClose={() => setShowComments(false)}
        videoCid={video.cid}
        commentCount={video.comments}
      />

      {/* Tip Modal */}
      <TipModal
        open={showTip}
        onClose={() => setShowTip(false)}
        creatorAddress={video.poster}
        creatorEns={video.posterEns}
        creatorAvatar={video.posterAvatar}
        videoCid={video.cid}
        initialToken={tipToken}
      />
    </div>
  );
}

// ─── Token icon components ────────────────────────────────────────────────

function ETHIcon({ size = 18 }: { size?: number }) {
  return (
    <img
      src="/icons/eth.svg"
      alt="ETH"
      width={size}
      height={size}
      style={{
        objectFit: "contain",
        display: "block",
        filter: "brightness(0) invert(1)",
      }}
    />
  );
}

function USDCIcon({ size = 18 }: { size?: number }) {
  return (
    <img
      src="/icons/usdc.png"
      alt="USDC"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}

function ActionButton({
  icon,
  count,
  onClick,
  label,
}: {
  icon: React.ReactNode;
  count: number | string;
  onClick?: () => void;
  label: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 tap-highlight-none"
      aria-label={label}
    >
      <div className="w-14 h-14 flex items-center justify-center">{icon}</div>
      <span
        className="text-white font-semibold drop-shadow-md"
        style={{ fontSize: 10, letterSpacing: "0.01em" }}
      >
        {typeof count === "number" ? formatCount(count) : count}
      </span>
    </motion.button>
  );
}
