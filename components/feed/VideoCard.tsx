"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageCircle, Share2, Zap, Eye, Send } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { ENSAvatar } from "@/components/ui/ENSAvatar";
import { TipModal } from "@/components/tips/TipModal";
import { CommentsSheet } from "@/components/video/CommentsSheet";
import {
  formatCount,
  formatRelativeTime,
  formatDisplayName,
  cn,
} from "@/lib/utils";
import { CONTRACTS, REACTIONS_ABI } from "@/lib/contracts";
import type { VideoMetadata } from "@/types";

const GRAD = "linear-gradient(135deg, #00f5ff 0%, #bf5af2 50%, #ff375f 100%)";

const railBtnStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center",
  background: "rgba(6,7,13,0.4)", border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
};
const railLabelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)",
};

interface VideoCardProps {
  video: VideoMetadata;
  isActive: boolean;
  onComment?: () => void;
  onProfileClick?: (address: string) => void;
}

export function VideoCard({ video, isActive, onProfileClick }: VideoCardProps) {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [showTip, setShowTip] = useState(false);
  const [tipToken, setTipToken] = useState<"ETH" | "USDC">("ETH");
  const [showComments, setShowComments] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);

  const handleLike = useCallback(async () => {
    if (!address) { openConnectModal?.(); return; }
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
  }, [address, liked, video.cid, writeContractAsync, openConnectModal]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/video/${video.cid}`;
    navigator.share?.({ url, title: video.caption }) ??
      navigator.clipboard.writeText(url);
  }, [video.cid, video.caption]);

  const displayName = formatDisplayName(video.poster, video.posterEns);

  return (
    <div
      className="ev-fade-up"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "9 / 16",
        borderRadius: 22,
        overflow: "hidden",
        background: "#06070d",
        boxShadow: isActive
          ? "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1), 0 12px 40px rgba(0,245,255,0.14), 0 12px 40px rgba(191,90,242,0.12)"
          : "0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)",
        transform: isActive ? "translateY(-2px)" : "none",
        transition: "transform 0.3s, box-shadow 0.3s",
      }}
    >
      {/* Video */}
      <VideoPlayer
        playbackId={video.playbackId}
        thumbnailUrl={video.thumbnailUrl}
        isActive={isActive}
        className="absolute inset-0 w-full h-full"
      />

      {/* Gradient legibility overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 25%, transparent 45%, transparent 60%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Top-right floating badges */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        <div
          className="ev-glass-soft"
          style={{
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: "rgba(244,245,250,0.9)",
          }}
        >
          <Eye size={12} />
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatCount(video.views || 0)}
          </span>
        </div>
        <div
          style={{
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(6,7,13,0.6)",
            border: "1px solid rgba(0,245,255,0.35)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            color: "#fff",
            boxShadow: "0 0 20px rgba(0,245,255,0.2)",
          }}
        >
          <Zap size={11} fill="#00f5ff" color="#00f5ff" />
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {video.tips !== "0" ? `${video.tips}Ξ` : "Tip"}
          </span>
        </div>
      </div>

      {/* Right action rail */}
      <div
        style={{
          position: "absolute",
          right: 10,
          bottom: 100,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          alignItems: "center",
        }}
      >
        {/* Like */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleLike}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none" }}
        >
          <span style={{ ...railBtnStyle, filter: liked ? "drop-shadow(0 0 8px rgba(255,55,95,0.8))" : undefined }}>
            <motion.div animate={likeAnimation ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.4 }}>
              <Heart
                size={22}
                className={cn(liked ? "fill-neon-pink text-neon-pink" : "text-white")}
              />
            </motion.div>
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            {formatCount(likeCount)}
          </span>
        </motion.button>

        {/* Comment */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setShowComments(true)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none" }}
        >
          <span style={railBtnStyle}>
            <MessageCircle size={22} color="#fff" />
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            {formatCount(video.comments)}
          </span>
        </motion.button>

        {/* Share */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleShare}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none" }}
        >
          <span style={railBtnStyle}>
            <Share2 size={22} color="#fff" />
          </span>
          <span style={railLabelStyle}>Share</span>
        </motion.button>

        {/* Tip */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { if (!address) { openConnectModal?.(); return; } setTipToken("ETH"); setShowTip(true); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none",
            filter: "drop-shadow(0 0 6px rgba(0,245,255,0.4))" }}
        >
          <span style={{ ...railBtnStyle, border: "1px solid rgba(0,245,255,0.35)", boxShadow: "0 0 20px rgba(0,245,255,0.2)" }}>
            <Zap size={22} color="#00f5ff" fill="#00f5ff" />
          </span>
          <span style={{ ...railLabelStyle, color: "#00f5ff" }}>Tip</span>
        </motion.button>

        {/* Spinning ENS avatar disc */}
        <button
          onClick={() => onProfileClick?.(video.poster)}
          style={{ position: "relative", marginTop: 4 }}
        >
          <div
            className="ev-spin-slow"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: GRAD,
              padding: 2,
            }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#06070d", padding: 2 }}>
              <ENSAvatar
                address={video.poster}
                ensName={video.posterEns}
                avatarUrl={video.posterAvatar}
                size="sm"
              />
            </div>
          </div>
        </button>
      </div>

      {/* Bottom overlay: name + caption + hashtags + progress */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 70,
          padding: "0 16px 20px",
        }}
      >
        {/* Creator row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={() => onProfileClick?.(video.poster)} style={{ flexShrink: 0 }}>
            <ENSAvatar
              address={video.poster}
              ensName={video.posterEns}
              avatarUrl={video.posterAvatar}
              size="sm"
              showRing
            />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <button
              onClick={() => onProfileClick?.(video.poster)}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                @{displayName}
              </span>
            </button>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>
              {formatRelativeTime(video.timestamp)}
            </div>
          </div>
          <button
            onClick={() => onProfileClick?.(video.poster)}
            style={{
              height: 28, padding: "0 14px", borderRadius: 999, fontSize: 11, fontWeight: 800,
              background: "rgba(255,255,255,0.95)", color: "#06070d", border: "none", flexShrink: 0,
            }}
          >
            Follow
          </button>
        </div>

        {/* Caption */}
        {video.caption && (
          <p style={{ fontSize: 13, color: "#fff", lineHeight: 1.4, margin: 0, fontWeight: 500, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
            {video.caption}
          </p>
        )}

        {/* Hashtags */}
        {video.hashtags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {video.hashtags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  background: GRAD,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ marginTop: 12, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: "38%",
              background: GRAD,
              borderRadius: 999,
              boxShadow: "0 0 10px rgba(0,245,255,0.6)",
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <CommentsSheet
        open={showComments}
        onClose={() => setShowComments(false)}
        videoCid={video.cid}
        commentCount={video.comments}
      />
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

function ETHIcon({ size = 14 }: { size?: number }) {
  return (
    <img src="/icons/eth.svg" alt="ETH" width={size} height={size}
      style={{ objectFit: "contain", display: "block", filter: "brightness(0) invert(1)" }} />
  );
}

function USDCIcon({ size = 14 }: { size?: number }) {
  return (
    <img src="/icons/usdc.png" alt="USDC" width={size} height={size}
      style={{ objectFit: "contain", display: "block" }} />
  );
}
