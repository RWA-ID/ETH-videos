"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { parseEther, parseUnits, type Address } from "viem";
import { X, Loader2, CheckCircle2, ExternalLink, Zap } from "lucide-react";
import { ENSAvatar } from "@/components/ui/ENSAvatar";
import { useTip } from "@/hooks/useTip";
import { formatDisplayName, cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import canvasConfetti from "canvas-confetti";
import { sendXMTPNotification } from "@/hooks/useXMTPNotifications";

interface TipModalProps {
  open: boolean;
  onClose: () => void;
  creatorAddress: string;
  creatorEns?: string;
  creatorAvatar?: string;
  videoCid: string;
  initialToken?: "ETH" | "USDC";
}

type TipToken = "ETH" | "USDC";
type TipChain = "ethereum" | "base";

interface TipPreset {
  label: string;
  amount: string;
  displayAmount: string;
  token: TipToken;
  chain: TipChain;
  popular?: boolean;
}

const PRESETS: TipPreset[] = [
  { label: "0.001 ETH", amount: "0.001", displayAmount: "0.001 ETH", token: "ETH", chain: "ethereum" },
  { label: "$1 USDC", amount: "1", displayAmount: "$1", token: "USDC", chain: "base", popular: true },
  { label: "$5 USDC", amount: "5", displayAmount: "$5", token: "USDC", chain: "base", popular: true },
  { label: "$10 USDC", amount: "10", displayAmount: "$10", token: "USDC", chain: "ethereum" },
  { label: "0.01 ETH", amount: "0.01", displayAmount: "0.01 ETH", token: "ETH", chain: "ethereum" },
];

function launchConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };

  function fire(particleRatio: number, opts: canvasConfetti.Options) {
    canvasConfetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ["#00f5ff", "#bf5af2"] });
  fire(0.2, { spread: 60, colors: ["#ff375f", "#ff9f0a"] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#00f5ff", "#30d158"] });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45, colors: ["#bf5af2", "#00f5ff"] });
}

export function TipModal({
  open,
  onClose,
  creatorAddress,
  creatorEns,
  creatorAvatar,
  videoCid,
  initialToken = "USDC",
}: TipModalProps) {
  const { address } = useAccount();
  const { tip, status, txHash, error, reset } = useTip();
  const [selected, setSelected] = useState<TipPreset>(
    () => PRESETS.find((p) => p.token === initialToken) ?? PRESETS[1]
  );
  const [custom, setCustom] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (status === "success") {
      launchConfetti();
      // Send XMTP notification to creator
      const amount = isCustom ? custom : selected.displayAmount;
      sendXMTPNotification(creatorAddress, {
        type: "tip",
        from: "someone", // replace with tipper ENS/address if available
        amount,
        token: selected.token,
        videoCid,
      }).catch(() => {}); // fire and forget
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) {
      reset();
      setIsCustom(false);
      setCustom("");
    } else {
      setSelected(PRESETS.find((p) => p.token === initialToken) ?? PRESETS[1]);
    }
  }, [open, reset, initialToken]);

  const handleTip = useCallback(async () => {
    const amount = isCustom ? custom : selected.amount;
    if (!amount || parseFloat(amount) <= 0) return;

    await tip({
      creator: creatorAddress as Address,
      videoCid,
      token: selected.token,
      chain: selected.chain,
      amount,
    });
  }, [isCustom, custom, selected, tip, creatorAddress, videoCid]);

  const displayName = formatDisplayName(creatorAddress, creatorEns);

  const isLoading =
    status === "approving" ||
    status === "switching-chain" ||
    status === "pending";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none"
          >
            <div className="bg-eth-card border border-eth-border rounded-3xl overflow-hidden w-full max-w-sm pointer-events-auto shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-eth-border">
                <span className="text-base font-black text-white">Send a Tip</span>
                <button onClick={onClose} className="w-7 h-7 rounded-full bg-eth-surface flex items-center justify-center text-muted-foreground hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>

              {/* Success state */}
              {status === "success" ? (
                <div className="px-6 py-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <CheckCircle2
                      size={56}
                      className="text-neon-green mx-auto mb-4 drop-shadow-[0_0_20px_rgba(48,209,88,0.8)]"
                    />
                  </motion.div>
                  <h3 className="text-xl font-black text-white mb-2">Tip sent!</h3>
                  <p className="text-white/60 text-sm mb-6">
                    {isCustom ? custom : selected.displayAmount} sent to{" "}
                    <span className="text-neon-cyan">@{displayName}</span>
                  </p>
                  {txHash && (
                    <a
                      href={`https://etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-neon-cyan text-xs mb-6 hover:underline"
                    >
                      View on Etherscan <ExternalLink size={10} />
                    </a>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full h-12 rounded-xl bg-eth-surface border border-eth-border text-white font-semibold"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="px-6 pb-8">
                  {/* Header */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <ENSAvatar
                        address={creatorAddress}
                        ensName={creatorEns}
                        avatarUrl={creatorAvatar}
                        size="md"
                        showRing
                      />
                      <div>
                        <p className="text-white font-bold text-sm">@{displayName}</p>
                        <p className="text-muted-foreground text-xs">Send a tip</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-full bg-eth-surface flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Not connected */}
                  {!address ? (
                    <div className="py-6 flex flex-col items-center gap-4">
                      <p className="text-muted-foreground text-sm">
                        Connect your wallet to tip
                      </p>
                      <ConnectButton showBalance={false} chainStatus="none" />
                    </div>
                  ) : (
                    <>
                      {/* Preset grid */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {PRESETS.map((preset) => (
                          <button
                            key={`${preset.token}-${preset.amount}`}
                            onClick={() => {
                              setSelected(preset);
                              setIsCustom(false);
                            }}
                            className={cn(
                              "relative h-16 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                              selected.label === preset.label && !isCustom
                                ? "border-neon-cyan bg-neon-cyan/10 text-white"
                                : "border-eth-border bg-eth-surface text-muted-foreground hover:border-eth-border/60 hover:text-white"
                            )}
                          >
                            {preset.popular && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-neon-purple text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                            <span className="font-bold text-sm">{preset.displayAmount}</span>
                            <span className="text-[10px] opacity-60">
                              {preset.token} · {preset.chain === "base" ? "Base" : "ETH"}
                            </span>
                          </button>
                        ))}

                        {/* Custom */}
                        <button
                          onClick={() => setIsCustom(true)}
                          className={cn(
                            "h-16 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                            isCustom
                              ? "border-neon-cyan bg-neon-cyan/10 text-white"
                              : "border-eth-border bg-eth-surface text-muted-foreground"
                          )}
                        >
                          <span className="font-bold text-sm">Custom</span>
                          <span className="text-[10px] opacity-60">any amount</span>
                        </button>
                      </div>

                      {/* Custom amount input */}
                      <AnimatePresence>
                        {isCustom && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-4"
                          >
                            <div className="bg-eth-surface border border-eth-border rounded-xl p-3">
                              <div className="flex gap-2 mb-2">
                                {(["ETH", "USDC"] as const).map((t) => (
                                  <button
                                    key={t}
                                    onClick={() =>
                                      setSelected((s) => ({
                                        ...s,
                                        token: t,
                                        chain: t === "USDC" ? "base" : "ethereum",
                                      }))
                                    }
                                    className={cn(
                                      "flex-1 h-8 rounded-lg text-xs font-semibold border transition-all",
                                      selected.token === t
                                        ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                                        : "border-eth-border text-muted-foreground"
                                    )}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="number"
                                placeholder={selected.token === "ETH" ? "0.001" : "1.00"}
                                value={custom}
                                onChange={(e) => setCustom(e.target.value)}
                                className="w-full bg-transparent text-white text-xl font-bold outline-none placeholder:text-muted-foreground/40"
                                autoFocus
                              />
                              <p className="text-muted-foreground text-xs mt-1">
                                {selected.token} on {selected.chain === "base" ? "Base" : "Ethereum"}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Error */}
                      {error && (
                        <p className="text-neon-pink text-xs mb-3 text-center">{error}</p>
                      )}

                      {/* Status text */}
                      {isLoading && (
                        <p className="text-muted-foreground text-xs text-center mb-3">
                          {status === "switching-chain" && "Switching network..."}
                          {status === "approving" && "Approve USDC spending..."}
                          {status === "pending" && "Confirm in wallet..."}
                        </p>
                      )}

                      {/* Send button */}
                      <button
                        onClick={handleTip}
                        disabled={isLoading}
                        className={cn(
                          "w-full h-14 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2",
                          isLoading
                            ? "bg-eth-surface border border-eth-border text-muted-foreground"
                            : "text-eth-dark"
                        )}
                        style={
                          !isLoading
                            ? { background: "linear-gradient(135deg, #00f5ff, #bf5af2)" }
                            : {}
                        }
                      >
                        {isLoading ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <>
                            <Zap size={18} />
                            Send{" "}
                            {isCustom
                              ? custom || "..."
                              : selected.displayAmount}{" "}
                            tip
                          </>
                        )}
                      </button>

                      <p className="text-white/30 text-[10px] text-center mt-3">
                        5% platform fee · Tips go directly to creator
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
