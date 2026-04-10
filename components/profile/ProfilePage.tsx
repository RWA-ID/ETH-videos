"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { useAccount } from "wagmi";
import {
  Settings,
  ExternalLink,
  Grid3x3,
  Copy,
  CheckCheck,
} from "lucide-react";
import { ENSAvatar } from "@/components/ui/ENSAvatar";
import { DMButton } from "@/components/messaging/DMButton";
import { useENSName } from "@/hooks/useENS";
import { useEFPStats } from "@/hooks/useEFP";
import { formatCount, truncateAddress, getAddressColor } from "@/lib/utils";
import type { VideoMetadata } from "@/types";

interface ProfilePageProps {
  address: string;
}

function MiniVideoCard({ video }: { video: VideoMetadata }) {
  return (
    <div
      className="aspect-[9/16] relative rounded-xl overflow-hidden bg-eth-surface group cursor-pointer"
      style={{
        boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
    >
      {video.thumbnailUrl ? (
        <Image
          src={video.thumbnailUrl}
          alt={video.caption}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="120px"
        />
      ) : (
        <div className="w-full h-full bg-eth-card" />
      )}
      {/* Overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "rgba(0,0,0,0.25)" }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-2"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-1 text-white">
          <span className="text-[10px]" style={{ color: "#ff375f" }}>♥</span>
          <span className="text-[10px] font-semibold">{formatCount(video.likes)}</span>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage({ address }: ProfilePageProps) {
  const { address: connectedAddress } = useAccount();
  const { name: ensName, avatar: ensAvatar } = useENSName(address);
  const { stats } = useEFPStats(address);
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isOwn = connectedAddress?.toLowerCase() === address.toLowerCase();
  const accentColor = getAddressColor(address);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/videos?poster=${address}&limit=50`)
      .then((r) => r.json())
      .then((data: VideoMetadata[]) => {
        setVideos(Array.isArray(data) ? data : []);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [address]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-dvh bg-eth-dark pb-20">
      {/* Banner */}
      <div
        className="h-44 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accentColor}22 0%, #0a0a0f 55%, ${accentColor}0d 100%)`,
        }}
      >
        {/* Mesh radial glows */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 18% 55%, ${accentColor}38 0%, transparent 52%),
              radial-gradient(ellipse at 78% 25%, rgba(191,90,242,0.18) 0%, transparent 48%),
              radial-gradient(ellipse at 55% 80%, rgba(0,245,255,0.10) 0%, transparent 40%)
            `,
          }}
        />
        {/* Subtle horizontal scan lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(transparent 50%, rgba(255,255,255,0.8) 50%)",
            backgroundSize: "100% 3px",
          }}
        />
        {/* Bottom fade into page bg */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20"
          style={{
            background: "linear-gradient(to top, #0a0a0f, transparent)",
          }}
        />
        {isOwn && (
          <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <Settings size={15} />
          </button>
        )}
      </div>

      {/* Profile info */}
      <div className="px-5 -mt-12 relative z-10">
        <div className="flex items-end justify-between mb-5">
          {/* Avatar with accent glow */}
          <div
            style={{
              borderRadius: "50%",
              boxShadow: `0 0 0 3px ${accentColor}55, 0 0 24px ${accentColor}30, 0 0 48px ${accentColor}12`,
              display: "inline-block",
              flexShrink: 0,
            }}
          >
            <ENSAvatar
              address={address}
              ensName={ensName || undefined}
              avatarUrl={ensAvatar || undefined}
              size="xl"
              showRing
              className="border-4 border-eth-dark"
            />
          </div>

          {/* Action buttons */}
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
                    boxShadow:
                      "0 0 20px rgba(0,245,255,0.2), inset 0 1px 0 rgba(0,245,255,0.08)",
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

        {/* Stats row — glassy pill cards */}
        <div className="flex gap-3 mb-5">
          <StatCard value={videos.length} label="Videos" />
          <a
            href={`https://efp.app/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <StatCard value={stats.following} label="Following" />
          </a>
          <a
            href={`https://efp.app/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <StatCard value={stats.followers} label="Followers" />
          </a>
        </div>

        {/* EFP — prominent social graph badge */}
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

      {/* Video grid */}
      <div className="px-1">
        <div className="flex items-center gap-2 px-4 mb-3">
          <Grid3x3 size={15} className="text-muted-foreground" />
          <span className="text-white text-sm font-semibold tracking-tight">Videos</span>
          <span
            className="text-xs font-medium ml-auto"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            {videos.length}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] skeleton rounded-xl" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ color: "rgba(255,255,255,0.3)" }}>No videos yet</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-1"
          >
            {videos.map((video, i) => (
              <motion.div
                key={video.cid}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, ease: "easeOut" }}
              >
                <MiniVideoCard video={video} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: "10px 18px",
        textAlign: "center",
        minWidth: 72,
      }}
    >
      <p
        style={{
          color: "white",
          fontWeight: 900,
          fontSize: 18,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {formatCount(value)}
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.38)",
          fontSize: 11,
          marginTop: 4,
          fontWeight: 500,
        }}
      >
        {label}
      </p>
    </div>
  );
}
