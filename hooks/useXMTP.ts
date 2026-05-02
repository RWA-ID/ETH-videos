"use client";

import { useState, useCallback, useRef } from "react";
import { useWalletClient } from "wagmi";
import { hexToBytes, keccak256 } from "viem";

type XMTPClient = import("@xmtp/browser-sdk").Client;

export interface XMTPMessage {
  id: string;
  senderInboxId: string;
  content: string;
  sentAt: Date;
}

export interface XMTPConversation {
  id: string;
  peerAddress: string;   // wallet address of the DM peer
  peerInboxId: string;
  messages: XMTPMessage[];
}

type XMTPStatus = "idle" | "initializing" | "ready" | "error";

export function useXMTP() {
  const { data: walletClient } = useWalletClient();
  const clientRef = useRef<XMTPClient | null>(null);
  const [status, setStatus] = useState<XMTPStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);

  const initialize = useCallback(async () => {
    if (!walletClient || clientRef.current) return;
    setStatus("initializing");
    setError(null);

    try {
      const { Client } = await import("@xmtp/browser-sdk");

      // v3 Signer — walletType required, signMessage must return Uint8Array
      const signer = {
        walletType: "EOA" as const,
        getAddress: async () => walletClient.account.address,
        signMessage: async (message: string): Promise<Uint8Array> => {
          const sig = await walletClient.signMessage({ message });
          return hexToBytes(sig);
        },
      };

      // Deterministic 32-byte encryption key derived from wallet signature
      const keyHex = await walletClient.signMessage({
        message: "ethvideos.eth XMTP encryption key v1",
      });
      const encryptionKey = hexToBytes(keccak256(keyHex));

      const client = await Client.create(signer, encryptionKey, {
        env: "production",
      });

      clientRef.current = client;
      setStatus("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "XMTP init failed";
      setError(msg);
      setStatus("error");
    }
  }, [walletClient]);

  const loadConversations = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    try {
      await client.conversations.sync();
      const convos = await client.conversations.list();

      const enriched = await Promise.all(
        convos.slice(0, 20).map(async (convo) => {
          const messages = await convo.messages({ limit: 50 } as Parameters<typeof convo.messages>[0]);
          const peerInboxId = await convo.dmPeerInboxId();

          // Resolve inbox ID → wallet address
          let peerAddress = peerInboxId;
          try {
            const state = await client.getLatestInboxState(peerInboxId);
            const addrs = (state as { accountAddresses?: string[] }).accountAddresses;
            if (addrs && addrs.length > 0) peerAddress = addrs[0];
          } catch { /* use inboxId as fallback */ }

          return {
            id: convo.id,
            peerAddress,
            peerInboxId,
            messages: messages.map((m) => ({
              id: m.id,
              senderInboxId: m.senderInboxId,
              content: typeof m.content === "string" ? m.content : "",
              sentAt: new Date(Number(m.sentAtNs / 1000000n)),
            })),
          };
        })
      );
      setConversations(enriched);
    } catch (err) {
      console.error("Load conversations error:", err);
    }
  }, []);

  const sendMessage = useCallback(
    async (peerAddress: string, content: string): Promise<boolean> => {
      const client = clientRef.current;
      if (!client || !content.trim()) return false;

      try {
        // Check if peer is on XMTP v3
        const canMsg = await Client.canMessage([peerAddress], { env: "production" } as Parameters<typeof Client.canMessage>[1]);
        if (!canMsg.get(peerAddress)) {
          setError(`${peerAddress} hasn't enabled XMTP yet`);
          return false;
        }

        const conversation = await client.conversations.newDm(peerAddress);
        await conversation.send(content);

        const newMsg: XMTPMessage = {
          id: Date.now().toString(),
          senderInboxId: client.inboxId ?? "",
          content,
          sentAt: new Date(),
        };

        setConversations((prev) => {
          const existing = prev.find((c) => c.peerAddress === peerAddress);
          if (existing) {
            return prev.map((c) =>
              c.peerAddress === peerAddress ? { ...c, messages: [...c.messages, newMsg] } : c
            );
          }
          return [...prev, { id: conversation.id, peerAddress, peerInboxId: "", messages: [newMsg] }];
        });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed");
        return false;
      }
    },
    []
  );

  const checkCanMessage = useCallback(async (address: string): Promise<boolean> => {
    try {
      const { Client } = await import("@xmtp/browser-sdk");
      const result = await Client.canMessage([address], { env: "production" } as Parameters<typeof Client.canMessage>[1]);
      return result.get(address) ?? false;
    } catch {
      return false;
    }
  }, []);

  const streamMessages = useCallback(
    async (peerAddress: string, onMessage: (msg: XMTPMessage) => void): Promise<() => void> => {
      const client = clientRef.current;
      if (!client) return () => {};

      const conversation = await client.conversations.newDm(peerAddress);
      const stream = await conversation.streamMessages();

      (async () => {
        for await (const message of stream) {
          onMessage({
            id: message.id,
            senderInboxId: message.senderInboxId,
            content: typeof message.content === "string" ? message.content : "",
            sentAt: new Date(Number(message.sentAtNs / 1000000n)),
          });
        }
      })();

      return () => stream.return?.(undefined);
    },
    []
  );

  return {
    initialize,
    loadConversations,
    sendMessage,
    checkCanMessage,
    streamMessages,
    status,
    error,
    conversations,
    isReady: status === "ready",
    inboxId: clientRef.current?.inboxId,
  };
}
