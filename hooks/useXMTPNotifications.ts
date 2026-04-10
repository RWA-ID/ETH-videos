"use client";

import { useEffect, useCallback, useRef } from "react";
import { useWalletClient } from "wagmi";

// XMTP notification types sent to users
export type NotificationPayload =
  | { type: "tip"; from: string; amount: string; token: string; videoCid: string }
  | { type: "follow"; from: string }
  | { type: "comment"; from: string; content: string; videoCid: string }
  | { type: "like"; from: string; videoCid: string };

// The ethvideos.eth notification bot address (set this to your own address/bot)
const NOTIFICATION_BOT_ADDRESS =
  process.env.NEXT_PUBLIC_NOTIFICATION_BOT_ADDRESS || "";

/**
 * Send an XMTP notification to a user from the platform bot.
 * Call this from API routes (server-side) or after on-chain events.
 */
export async function sendXMTPNotification(
  recipientAddress: string,
  payload: NotificationPayload
): Promise<void> {
  const message = formatNotificationMessage(payload);

  try {
    const res = await fetch("/api/notifications/xmtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: recipientAddress, message }),
    });

    if (!res.ok) {
      console.warn("XMTP notification failed:", await res.text());
    }
  } catch (err) {
    console.warn("XMTP notification error:", err);
  }
}

function formatNotificationMessage(payload: NotificationPayload): string {
  switch (payload.type) {
    case "tip":
      return `💰 You received a ${payload.amount} ${payload.token} tip from ${payload.from} on your video!\n\nethvideos.eth`;
    case "follow":
      return `👤 ${payload.from} started following you on ethvideos.eth`;
    case "comment":
      return `💬 ${payload.from} commented on your video:\n"${payload.content}"\n\nethvideos.eth`;
    case "like":
      return `❤️ ${payload.from} liked your video on ethvideos.eth`;
    default:
      return "You have a new notification on ethvideos.eth";
  }
}

/**
 * Hook: stream incoming XMTP notifications for the connected user.
 * Shows a toast/banner when a tip, follow, or comment arrives.
 */
export function useXMTPNotifications(onNotification?: (msg: string) => void) {
  const { data: walletClient } = useWalletClient();
  const clientRef = useRef<import("@xmtp/browser-sdk").Client | null>(null);
  const streamRef = useRef<AsyncIterable<unknown> | null>(null);

  const startStream = useCallback(async () => {
    if (!walletClient || clientRef.current) return;

    try {
      const { Client } = await import("@xmtp/browser-sdk");

      const signer = {
        getAddress: async () => walletClient.account.address,
        signMessage: async (msg: string) =>
          walletClient.signMessage({ message: msg }),
      };

      const client = await Client.create(signer, { env: "production" });
      clientRef.current = client;

      // Stream all new messages
      const stream = await client.conversations.streamAllMessages();
      streamRef.current = stream;

      for await (const message of stream as AsyncIterable<{
        senderAddress: string;
        content: unknown;
      }>) {
        // Only surface messages from the notification bot
        if (
          NOTIFICATION_BOT_ADDRESS &&
          message.senderAddress.toLowerCase() !==
            NOTIFICATION_BOT_ADDRESS.toLowerCase()
        ) {
          continue;
        }

        if (typeof message.content === "string") {
          onNotification?.(message.content);
        }
      }
    } catch (err) {
      console.warn("XMTP notification stream error:", err);
    }
  }, [walletClient, onNotification]);

  useEffect(() => {
    startStream();
    return () => {
      // Streams close when component unmounts
      clientRef.current = null;
    };
  }, [startStream]);
}
