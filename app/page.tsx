"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { SplashScreen } from "@/components/onboarding/SplashScreen";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { UploadModal } from "@/components/video/UploadModal";
import { XMTPInbox } from "@/components/messaging/XMTPInbox";
import { useFeed } from "@/hooks/useFeed";
import { useEFPFollowing } from "@/hooks/useEFP";
import type { FeedTab } from "@/types";

type AppState = "splash" | "onboarding" | "app";

export default function HomePage() {
  const { isConnected, address } = useAccount();
  const [appState, setAppState] = useState<AppState>("splash");
  const [tab, setTab] = useState<FeedTab>("for-you");
  const [showUpload, setShowUpload] = useState(false);

  const { following } = useEFPFollowing(address);
  const { videos, loading, refreshing, hasMore, loadInitial, loadMore, refresh } =
    useFeed(tab, following);

  // Restore session
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasOnboarded = localStorage.getItem("ethvideos-onboarded");
    if (isConnected && hasOnboarded === "true") {
      setAppState("app");
    }
  }, [isConnected]);

  const handleConnected = useCallback(() => {
    setAppState("onboarding");
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("ethvideos-onboarded", "true");
    setAppState("app");
    loadInitial();
  }, [loadInitial]);

  const handleTabChange = useCallback(
    (newTab: FeedTab) => {
      setTab(newTab);
      loadInitial();
    },
    [loadInitial]
  );

  // Load initial feed
  useEffect(() => {
    if (appState === "app") {
      loadInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  if (appState === "splash" || !isConnected) {
    return <SplashScreen onConnected={handleConnected} />;
  }

  if (appState === "onboarding") {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-eth-dark">
      {/* Transparent header (overlaid on feed) */}
      <Header transparent />

      {/* Main feed */}
      <FeedContainer
        videos={videos}
        loading={loading}
        refreshing={refreshing}
        hasMore={hasMore}
        tab={tab}
        onTabChange={handleTabChange}
        onLoadMore={loadMore}
        onRefresh={refresh}
      />

      {/* Bottom navigation */}
      <BottomNav onUploadClick={() => setShowUpload(true)} />

      {/* XMTP Inbox (floating) */}
      <XMTPInbox />

      {/* Upload modal */}
      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => {
          setShowUpload(false);
          refresh();
        }}
      />
    </main>
  );
}
