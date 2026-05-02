"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useAccount, useDisconnect } from "wagmi";
import {
  Settings,
  ExternalLink,
  Grid3x3,
  Copy,
  CheckCheck,
  X,
  LogOut,
  Palette,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { ENSAvatar } from "@/components/ui/ENSAvatar";
import { DMButton } from "@/components/messaging/DMButton";
import { VideoCard } from "@/components/feed/VideoCard";
import { useENSName } from "@/hooks/useENS";
import { useEFPStats } from "@/hooks/useEFP";
import { formatCount, truncateAddress, getAddressColor } from "@/lib/utils";
import { getLivepeerThumbnail } from "@/lib/livepeer";
import type { VideoMetadata } from "@/types";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

const POSTER_QUERY = `
  query GetPosterVideos($poster: Bytes!, $first: Int!) {
    videos(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { removed: false, poster: $poster }
    ) {
      id
      poster
      ipfsCid
      playbackId
      caption
      timestamp
      likes
    }
  }
`;

async function fetchProfileVideos(address: string): Promise<VideoMetadata[]> {
  if (!SUBGRAPH_URL) return [];
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: POSTER_QUERY,
      variables: { poster: address.toLowerCase(), first: 50 },
    }),
  });
  const json = await res.json();
  const videos = json.data?.videos ?? [];
  return videos.map((v: { id: string; poster: string; ipfsCid: string; playbackId: string; caption: string; timestamp: string; likes: string }) => ({
    cid: v.ipfsCid,
    playbackId: v.playbackId,
    thumbnailUrl: v.playbackId ? getLivepeerThumbnail(v.playbackId) : "",
    caption: v.caption,
    hashtags: [],
    duration: 0,
    poster: v.poster,
    timestamp: parseInt(v.timestamp),
    likes: parseInt(v.likes),
    comments: 0,
    tips: "0",
    views: 0,
  }));
}

interface ProfilePageProps {
  address: string;
  onProfileClick?: (address: string) => void;
}

export function ProfilePage({ address, onProfileClick }: ProfilePageProps) {
  const { address: connectedAddress } = useAccount();
  const { name: ensName, avatar: ensAvatar } = useENSName(address);
  const { stats } = useEFPStats(address);
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { disconnect } = useDisconnect();
  const [showSettings, setShowSettings] = useState(false);
  const isOwn = connectedAddress?.toLowerCase() === address.toLowerCase();
  const accentColor = getAddressColor(address);

  // Intersection observer — track active video
  const videoListRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchProfileVideos(address)
      .then((data) => setVideos(data))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [address]);

  // Re-attach observer when videos change
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!videoListRef.current || videos.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(
              (entry.target as HTMLElement).dataset.videoIndex || "0"
            );
            setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.5 }
    );

    const items = videoListRef.current.querySelectorAll("[data-video-index]");
    items.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [videos]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-dvh bg-eth-dark pb-20">
      {/* Banner — blurred ambient mesh */}
      <div className="h-48 relative overflow-hidden">
        <div
          style={{
            position: "absolute",
            inset: -20,
            background: `
              radial-gradient(60% 60% at 30% 40%, ${accentColor}55, transparent 60%),
              radial-gradient(60% 60% at 75% 60%, rgba(191,90,242,0.5), transparent 60%),
              radial-gradient(50% 50% at 50% 100%, rgba(255,55,95,0.35), transparent 60%)
            `,
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 30%, rgba(6,7,13,0.88) 100%)",
          }}
        />
        {isOwn && (
          <button
            onClick={() => setShowSettings(true)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10"
          >
            <Settings size={16} />
          </button>
        )}
      </div>

      {/* Profile info */}
      <div className="px-5 -mt-12 relative z-10">
        <div className="flex items-end justify-between mb-5">
          {/* Gradient ring avatar */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              padding: 3,
              background: "linear-gradient(135deg, #00f5ff 0%, #bf5af2 50%, #ff375f 100%)",
              boxShadow: "0 0 0 3px #06070d, 0 8px 32px rgba(0,245,255,0.30), 0 8px 32px rgba(191,90,242,0.25)",
              flexShrink: 0,
            }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#06070d" }}>
              <ENSAvatar
                address={address}
                ensName={ensName || undefined}
                avatarUrl={ensAvatar || undefined}
                size="xl"
                className="!w-full !h-full"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-2">
            {!isOwn && (
              <>
                <a
                  href={`https://efp.app/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                  style={{
                    background: "rgba(0,245,255,0.08)",
                    border: "1px solid rgba(0,245,255,0.38)",
                    color: "#00f5ff",
                    boxShadow: "0 0 20px rgba(0,245,255,0.2), inset 0 1px 0 rgba(0,245,255,0.08)",
                  }}
                >
                  <img src="/icons/efp.svg" alt="" style={{ height: 16, width: "auto" }} />
                  Follow
                </a>
                <DMButton peerAddress={address} variant="icon" />
              </>
            )}
            <a
              href={`https://efp.app/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Name + address */}
        <div className="mb-5">
          {ensName ? (
            <h1 className="text-xl font-black text-white mb-1 tracking-tight">{ensName}</h1>
          ) : (
            <h1 className="text-lg font-bold text-white mb-1 font-mono">
              {truncateAddress(address)}
            </h1>
          )}
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 text-xs hover:text-white transition-colors"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            <span className="font-mono">{truncateAddress(address, 6)}</span>
            {copied ? (
              <CheckCheck size={11} className="text-neon-green" />
            ) : (
              <Copy size={11} />
            )}
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
          <StatCard value={videos.length} label="Videos" />
          <a href={`https://efp.app/${address}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <StatCard value={stats.following} label="Following" />
          </a>
          <a href={`https://efp.app/${address}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <StatCard value={stats.followers} label="Followers" accent />
          </a>
        </div>

        {/* EFP badge */}
        <a
          href={`https://efp.app/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl transition-all"
          style={{
            background: "rgba(0,245,255,0.05)",
            border: "1px solid rgba(0,245,255,0.15)",
            boxShadow: "0 0 24px rgba(0,245,255,0.06)",
            textDecoration: "none",
          }}
        >
          <img src="/icons/efp.svg" alt="EFP" style={{ height: 28, width: "auto", flexShrink: 0 }} />
          <div>
            <p style={{ color: "white", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
              Ethereum Follow Protocol
            </p>
            <p style={{ color: "rgba(0,245,255,0.7)", fontSize: 11, marginTop: 2 }}>
              View full social graph →
            </p>
          </div>
        </a>
      </div>

      {/* ── Settings modal ── */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 30, stiffness: 320 }}
                className="pointer-events-auto bg-eth-card border border-eth-border rounded-3xl overflow-hidden"
                style={{ width: "calc(100% - 32px)", maxWidth: 400 }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-eth-border">
                  <div className="flex items-center gap-2">
                    <Settings size={16} className="text-neon-cyan" />
                    <span className="text-white font-bold text-sm">Profile Settings</span>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-7 h-7 rounded-full bg-eth-surface flex items-center justify-center text-muted-foreground hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="p-3 space-y-1">
                  <button
                    onClick={() => { navigator.clipboard.writeText(address); setShowSettings(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-eth-surface transition-colors text-left"
                  >
                    <Copy size={16} className="text-muted-foreground" />
                    <span className="text-white text-sm">Copy wallet address</span>
                  </button>
                  <button
                    onClick={() => { window.open(`https://efp.app/${address}`, "_blank"); setShowSettings(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-eth-surface transition-colors text-left"
                  >
                    <Palette size={16} className="text-muted-foreground" />
                    <div>
                      <span className="text-white text-sm">Edit ENS profile & avatar</span>
                      <p className="text-muted-foreground text-xs mt-0.5">Set avatar on app.ens.domains — updates here automatically</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { disconnect(); setShowSettings(false); localStorage.removeItem("ethvideos-onboarded"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neon-pink/10 transition-colors text-left"
                  >
                    <LogOut size={16} className="text-neon-pink" />
                    <span className="text-neon-pink text-sm font-medium">Disconnect wallet</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Video list (feed-style) ── */}
      <div className="px-0">
        <div className="flex items-center gap-2 px-4 mb-3">
          <Grid3x3 size={15} className="text-muted-foreground" />
          <span className="text-white text-sm font-semibold tracking-tight">Videos</span>
          <span className="text-xs font-medium ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>
            {videos.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16 px-8">
            <div className="text-4xl mb-4">🎬</div>
            <p className="text-white font-bold mb-1">No videos yet</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Post a video to see it here
            </p>
          </div>
        ) : (
          <motion.div
            ref={videoListRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {videos.map((video, i) => (
              <div
                key={video.cid}
                data-video-index={i}
                className="mb-3 max-w-[520px] mx-auto"
              >
                <VideoCard
                  video={video}
                  isActive={activeIndex === i}
                  onProfileClick={onProfileClick}
                />
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div
      className="ev-glass-soft"
      style={{
        borderRadius: 14,
        padding: "10px 8px",
        textAlign: "center",
        minWidth: 72,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {accent && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,245,255,0.10), rgba(191,90,242,0.10))" }} />
      )}
      <p
        style={{
          fontWeight: 900,
          fontSize: 18,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          position: "relative",
          ...(accent
            ? {
                background: "linear-gradient(135deg, #00f5ff 0%, #bf5af2 50%, #ff375f 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }
            : { color: "white" }),
        }}
      >
        {formatCount(value)}
      </p>
      <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, marginTop: 3, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </p>
    </div>
  );
}
