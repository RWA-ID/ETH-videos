"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { FeedTab } from "@/types";

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  const tabs: { id: FeedTab; label: string }[] = [
    { id: "for-you", label: "For You" },
    { id: "following", label: "Following" },
  ];

  return (
    <div
      className="flex items-center gap-1 rounded-full p-1"
      style={{
        background: "rgba(6,8,20,0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.4)",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
            activeTab === tab.id ? "text-white" : "text-white/45 hover:text-white/75"
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="feed-tab-indicator"
              className="absolute inset-0 rounded-full"
              style={{
                background: "rgba(0,245,255,0.12)",
                border: "1px solid rgba(0,245,255,0.28)",
                boxShadow: "0 0 12px rgba(0,245,255,0.15)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
