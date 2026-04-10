"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { MessageCircle, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { XMTPInbox } from "./XMTPInbox";
import { cn } from "@/lib/utils";

interface DMButtonProps {
  peerAddress: string;
  variant?: "icon" | "pill" | "full";
  className?: string;
}

export function DMButton({
  peerAddress,
  variant = "icon",
  className,
}: DMButtonProps) {
  const { address, isConnected } = useAccount();
  const [open, setOpen] = useState(false);

  // Don't show DM button for own profile
  if (!isConnected || address?.toLowerCase() === peerAddress.toLowerCase()) {
    return null;
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center gap-1.5 transition-all",
          variant === "icon" &&
            "w-9 h-9 rounded-xl border border-eth-border bg-eth-surface text-muted-foreground hover:text-white hover:border-neon-cyan/40",
          variant === "pill" &&
            "h-9 px-4 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/10",
          variant === "full" &&
            "w-full h-12 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan text-sm font-semibold hover:bg-neon-cyan/10",
          className
        )}
      >
        <MessageCircle size={variant === "icon" ? 16 : 15} />
        {variant !== "icon" && <span>Message</span>}
      </motion.button>

      {open && (
        <XMTPInbox
          defaultPeerAddress={peerAddress}
        />
      )}
    </>
  );
}
