"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAccount, useDisconnect } from "wagmi";
import { useSIWE } from "@/hooks/useSIWE";
import { useENSName } from "@/hooks/useENS";
import { ENSAvatar } from "@/components/ui/ENSAvatar";
import { TypewriterOnce } from "@/components/ui/TypewriterEffect";
import {
  CheckCircle2,
  Loader2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Play,
} from "lucide-react";
import { cn, truncateAddress } from "@/lib/utils";

interface OnboardingFlowProps {
  onComplete: () => void;
}

type Step = "sign" | "ens-check" | "welcome";

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { signIn, status: siweStatus, error: siweError } = useSIWE();
  const { name: ensName, avatar: ensAvatar, loading: ensLoading } = useENSName(address);
  const [step, setStep] = useState<Step>("sign");
  const [hasSignedIn, setHasSignedIn] = useState(false);

  const handleSign = useCallback(async () => {
    const success = await signIn();
    if (success) {
      setHasSignedIn(true);
      setStep("ens-check");
    }
  }, [signIn]);

  useEffect(() => {
    if (step === "ens-check" && !ensLoading) {
      // Give a brief moment to show ENS check
      const t = setTimeout(() => setStep("welcome"), 1500);
      return () => clearTimeout(t);
    }
  }, [step, ensLoading]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: "#03050e" }}>
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(56,189,248,0.06) 50%, transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-sm px-5 relative z-10">
        <AnimatePresence mode="wait">
          {/* Step 1: Sign message — redesigned */}
          {step === "sign" && (
            <motion.div
              key="sign"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Card */}
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  background: "rgba(12,16,28,0.9)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.08)",
                }}
              >
                {/* Card top accent line */}
                <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #a855f7, #38bdf8, transparent)" }} />

                <div className="px-7 pt-7 pb-8">
                  {/* EV logo */}
                  <div className="flex items-center gap-2.5 mb-8">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #a855f7, #38bdf8)" }}
                    >
                      <Play size={14} fill="#03050e" style={{ color: "#03050e" }} className="ml-0.5" />
                    </div>
                    <span className="text-sm font-bold text-white/50">ethvideos<span style={{ color: "#a855f7" }}>.eth</span></span>
                  </div>

                  {/* Headline */}
                  <h1
                    className="font-black text-white mb-1"
                    style={{ fontSize: 28, letterSpacing: "-0.03em", lineHeight: 1.1 }}
                  >
                    VERIFY YOUR<br />
                    <span style={{
                      background: "linear-gradient(135deg, #a855f7, #38bdf8)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}>
                      IDENTITY
                    </span>
                  </h1>
                  <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.38)", letterSpacing: "-0.01em", lineHeight: 1.55 }}>
                    Sign a message with your wallet.<br />No gas. No transaction. Just a signature.
                  </p>

                  {/* Address pill */}
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-7"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {truncateAddress(address || "")}
                    </span>
                  </div>

                  {/* Error */}
                  {siweError && (
                    <div
                      className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-left"
                      style={{ background: "rgba(255,55,95,0.08)", border: "1px solid rgba(255,55,95,0.25)" }}
                    >
                      <AlertCircle size={13} className="text-neon-pink flex-shrink-0" />
                      <span className="text-xs" style={{ color: "#ff375f" }}>{siweError}</span>
                    </div>
                  )}

                  {/* Sign button */}
                  <button
                    onClick={handleSign}
                    disabled={siweStatus === "signing" || siweStatus === "verifying"}
                    className="w-full relative overflow-hidden rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200"
                    style={{
                      height: 52,
                      background: siweStatus === "signing" || siweStatus === "verifying"
                        ? "rgba(255,255,255,0.05)"
                        : "linear-gradient(135deg, #a855f7 0%, #38bdf8 100%)",
                      color: siweStatus === "signing" || siweStatus === "verifying"
                        ? "rgba(255,255,255,0.35)"
                        : "#03050e",
                      border: siweStatus === "signing" || siweStatus === "verifying"
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "none",
                      boxShadow: siweStatus === "signing" || siweStatus === "verifying"
                        ? "none"
                        : "0 0 24px rgba(168,85,247,0.35), 0 0 48px rgba(168,85,247,0.15)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {siweStatus === "signing" ? (
                      <><Loader2 size={15} className="animate-spin" /> Check your wallet…</>
                    ) : siweStatus === "verifying" ? (
                      <><Loader2 size={15} className="animate-spin" /> Verifying…</>
                    ) : (
                      <>Sign in with Ethereum <ArrowRight size={15} /></>
                    )}
                    {/* shimmer on idle */}
                    {siweStatus === "idle" && (
                      <motion.div
                        animate={{ x: ["-120%", "220%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                        className="absolute inset-0 w-1/2 skew-x-12 pointer-events-none"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
                      />
                    )}
                  </button>

                  {/* Disconnect link */}
                  <button
                    onClick={() => disconnect()}
                    className="w-full mt-4 text-center text-xs transition-colors"
                    style={{ color: "rgba(255,255,255,0.22)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                  >
                    Use a different wallet
                  </button>

                  {/* EIP-4361 badge */}
                  <div className="flex items-center justify-center gap-1.5 mt-6 pt-5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="w-3 h-3 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.08)" }}>
                      <span style={{ fontSize: 7, color: "rgba(255,255,255,0.4)" }}>🔒</span>
                    </div>
                    <span className="text-[10px] tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>
                      Sign-In with Ethereum · EIP-4361
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: ENS check */}
          {step === "ens-check" && (
            <motion.div
              key="ens-check"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center"
            >
              <CheckCircle2
                size={48}
                className="text-neon-green mx-auto mb-6 drop-shadow-[0_0_12px_rgba(48,209,88,0.8)]"
              />

              <h2 className="text-xl font-black text-white mb-6">
                Looking up your ENS name...
              </h2>

              <div className="bg-eth-card border border-eth-border rounded-2xl p-6 mb-6">
                <ENSAvatar
                  address={address}
                  ensName={ensName || undefined}
                  avatarUrl={ensAvatar || undefined}
                  size="xl"
                  showRing
                  className="mx-auto mb-4"
                />

                {ensLoading ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-sm">Resolving ENS...</span>
                  </div>
                ) : ensName ? (
                  <div>
                    <p className="font-bold text-white text-lg">{ensName}</p>
                    <p className="text-neon-cyan text-xs mt-1">
                      Your ENS name will be your username ✓
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground text-sm mb-3">
                      No ENS primary name found
                    </p>
                    <a
                      href="https://app.ens.domains"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-neon-cyan text-xs hover:underline"
                    >
                      Get a .eth name <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Welcome */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-6xl mb-6"
              >
                🎬
              </motion.div>

              <h1 className="text-2xl font-black text-white mb-2">
                Welcome
                {ensName ? (
                  <span
                    className="block"
                    style={{
                      background: "linear-gradient(135deg, #00f5ff, #bf5af2)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {ensName}
                  </span>
                ) : (
                  <span className="text-neon-cyan"> gm fren</span>
                )}
              </h1>

              <div className="bg-eth-card border border-eth-border rounded-2xl p-5 mb-8 text-left space-y-3">
                {[
                  "Your .eth name IS your username. Forever.",
                  "Videos live on IPFS — no one can delete them.",
                  "Tip creators directly. No middlemen.",
                  "Follow anyone using Ethereum Follow Protocol.",
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-start gap-2.5"
                  >
                    <Sparkles size={14} className="text-neon-cyan mt-0.5 flex-shrink-0" />
                    <span className="text-white/70 text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={onComplete}
                className="w-full h-14 rounded-2xl font-bold text-base text-eth-dark relative overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, #00f5ff, #bf5af2)",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Enter the Feed
                  <ArrowRight size={18} />
                </span>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
