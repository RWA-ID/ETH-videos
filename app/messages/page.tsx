"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { XMTPInbox } from "@/components/messaging/XMTPInbox";
import { BackgroundLights } from "@/components/ui/BackgroundLights";

export default function MessagesPage() {
  const { isConnected } = useAccount();

  return (
    <main className="bg-eth-dark min-h-dvh pb-20">
      <BackgroundLights variant="subtle" />
      <Header title="Messages" />
      <div className="pt-14 h-dvh flex flex-col">
        <XMTPInbox />
      </div>
      <BottomNav />
    </main>
  );
}
