"use client";

import { motion } from "motion/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Bell, Search, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  transparent?: boolean;
  showSearch?: boolean;
  title?: string;
  onHome?: () => void;
}

export function Header({
  transparent = false,
  showSearch = false,
  title,
  onHome,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 safe-top",
        transparent ? "bg-transparent" : "bg-glass border-b border-white/[0.06]"
      )}
    >
      {/* Ambient glow behind logo */}
      {!transparent && !onHome && !title && (
        <div
          className="ev-glow-pulse"
          style={{
            position: "absolute",
            left: 8,
            top: 4,
            width: 70,
            height: 48,
            borderRadius: 999,
            background: "linear-gradient(135deg, #00f5ff 0%, #bf5af2 50%, #ff375f 100%)",
            filter: "blur(22px)",
            opacity: 0.35,
            pointerEvents: "none",
          }}
        />
      )}

      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto relative">
        {/* Logo / Title / Back */}
        <div className="flex items-center gap-2.5">
          {onHome ? (
            <button
              onClick={onHome}
              className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
              <span className="text-sm font-semibold">Home</span>
            </button>
          ) : title ? (
            <span className="font-bold text-white text-lg tracking-tight">{title}</span>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2.5"
            >
              {/* Logo badge */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: "linear-gradient(135deg, #00f5ff 0%, #bf5af2 50%, #ff375f 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(0,245,255,0.25), 0 4px 16px rgba(191,90,242,0.20)",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <span style={{ color: "#06070d", fontWeight: 900, fontSize: 12, letterSpacing: "-0.04em" }}>ev</span>
              </div>
              {/* Wordmark */}
              <div style={{ lineHeight: 1 }}>
                <div
                  className="ev-text-grad"
                  style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em" }}
                >
                  ethvideos
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(244,245,250,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 1 }}>
                  .eth
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <button
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "grid",
                placeItems: "center",
                color: "rgba(244,245,250,0.6)",
              }}
            >
              <Search size={16} />
            </button>
          )}
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "grid",
              placeItems: "center",
              color: "rgba(244,245,250,0.6)",
              position: "relative",
            }}
          >
            <Bell size={16} />
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 7,
                height: 7,
                borderRadius: 999,
                background: "#ff375f",
                boxShadow: "0 0 8px #ff375f",
              }}
            />
          </button>
          <ConnectButton
            showBalance={false}
            chainStatus="none"
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "address",
            }}
          />
        </div>
      </div>
    </header>
  );
}
