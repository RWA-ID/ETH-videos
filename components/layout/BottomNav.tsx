"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, MessageCircle, Plus, User, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/upload", icon: Plus, label: "Upload", special: true },
  { href: "/messages", icon: MessageCircle, label: "DMs" },
  { href: "/profile", icon: User, label: "Profile" },
];

const GRAD = "linear-gradient(135deg, #00f5ff 0%, #bf5af2 50%, #ff375f 100%)";

interface BottomNavProps {
  onUploadClick?: () => void;
  onProfileClick?: (address: string) => void;
}

export function BottomNav({ onUploadClick, onProfileClick }: BottomNavProps) {
  const pathname = usePathname();
  const { address } = useAccount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div
        style={{
          background: "linear-gradient(180deg, rgba(22,22,38,0.65), rgba(10,10,18,0.75))",
          backdropFilter: "blur(28px) saturate(170%)",
          WebkitBackdropFilter: "blur(28px) saturate(170%)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-around h-20 px-2 max-w-lg mx-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label, special }) => {
            if (special) {
              return (
                <button
                  key={href}
                  onClick={onUploadClick}
                  className="tap-highlight-none flex-1 flex justify-center"
                >
                  <motion.div whileTap={{ scale: 0.9 }} style={{ position: "relative" }}>
                    {/* Glow bloom */}
                    <div
                      className="ev-glow-pulse"
                      style={{
                        position: "absolute",
                        inset: -8,
                        borderRadius: 22,
                        background: GRAD,
                        filter: "blur(14px)",
                        opacity: 0.5,
                        zIndex: -1,
                      }}
                    />
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 16,
                        background: GRAD,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#06070d",
                        boxShadow: "0 8px 24px rgba(0,245,255,0.35), 0 8px 24px rgba(191,90,242,0.30)",
                      }}
                    >
                      <Plus size={22} strokeWidth={2.6} />
                    </div>
                  </motion.div>
                </button>
              );
            }

            const isActive =
              pathname === href ||
              (href === "/profile" &&
                (pathname === "/profile" || pathname.startsWith("/profile/")));

            if (href === "/profile") {
              return (
                <button
                  key={href}
                  onClick={() => address && onProfileClick?.(address)}
                  className="tap-highlight-none flex-1 flex flex-col items-center justify-center gap-1 h-full relative"
                >
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 32,
                        height: 4,
                        borderRadius: 999,
                        background: GRAD,
                        boxShadow: "0 0 12px rgba(0,245,255,0.6), 0 0 18px rgba(191,90,242,0.5)",
                      }}
                    />
                  )}
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      style={
                        isActive
                          ? {
                              background: GRAD,
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              display: "inline-flex",
                              filter: "drop-shadow(0 0 4px rgba(0,245,255,0.5))",
                            }
                          : { color: "rgba(244,245,250,0.38)", display: "inline-flex" }
                      }
                    >
                      <Icon size={22} />
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        color: isActive ? "rgba(244,245,250,0.9)" : "rgba(244,245,250,0.38)",
                      }}
                    >
                      {label}
                    </span>
                  </motion.div>
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className="tap-highlight-none flex-1 flex flex-col items-center justify-center gap-1 h-full relative"
              >
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 32,
                      height: 4,
                      borderRadius: 999,
                      background: GRAD,
                      boxShadow: "0 0 12px rgba(0,245,255,0.6), 0 0 18px rgba(191,90,242,0.5)",
                    }}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    style={
                      isActive
                        ? {
                            background: GRAD,
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            display: "inline-flex",
                            filter: "drop-shadow(0 0 4px rgba(0,245,255,0.5))",
                          }
                        : { color: "rgba(244,245,250,0.38)", display: "inline-flex" }
                    }
                  >
                    <Icon size={22} />
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: isActive ? "rgba(244,245,250,0.9)" : "rgba(244,245,250,0.38)",
                    }}
                  >
                    {label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
