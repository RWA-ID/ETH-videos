"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  X,
  Send,
  ArrowLeft,
  Loader2,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useAccount } from "wagmi";
import { ENSAvatar } from "@/components/ui/ENSAvatar";
import { useXMTP, type XMTPConversation, type XMTPMessage } from "@/hooks/useXMTP";
import { useENSName } from "@/hooks/useENS";
import {
  formatRelativeTime,
  truncateAddress,
  formatDisplayName,
  cn,
} from "@/lib/utils";

interface XMTPInboxProps {
  defaultPeerAddress?: string; // pre-open a conversation (e.g., from profile)
}

export function XMTPInbox({ defaultPeerAddress }: XMTPInboxProps) {
  const { address } = useAccount();
  const {
    initialize,
    loadConversations,
    sendMessage,
    checkCanMessage,
    streamMessages,
    status,
    error,
    conversations,
    isReady,
  } = useXMTP();

  const [open, setOpen] = useState(false);
  const [activeConvo, setActiveConvo] = useState<string | null>(
    defaultPeerAddress || null
  );
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [newConvoAddress, setNewConvoAddress] = useState("");
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [canMessageStatus, setCanMessageStatus] = useState<Record<string, boolean>>({});
  const [streamMessages_state, setStreamedMessages] = useState<XMTPMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamMessages_state, activeConvo]);

  // Initialize XMTP when inbox opens
  useEffect(() => {
    if (open && address && !isReady && status === "idle") {
      initialize();
    }
  }, [open, address, isReady, status, initialize]);

  // Load conversations when ready
  useEffect(() => {
    if (isReady) {
      loadConversations();
    }
  }, [isReady, loadConversations]);

  // Open default peer if provided
  useEffect(() => {
    if (defaultPeerAddress && isReady) {
      setActiveConvo(defaultPeerAddress);
      setOpen(true);
    }
  }, [defaultPeerAddress, isReady]);

  // Stream messages for active conversation
  useEffect(() => {
    if (!activeConvo || !isReady) return;
    let cleanup: (() => void) | undefined;

    streamMessages(activeConvo, (msg) => {
      setStreamedMessages((prev) => [...prev, msg]);
    }).then((fn) => {
      cleanup = fn;
    });

    return () => cleanup?.();
  }, [activeConvo, isReady, streamMessages]);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !activeConvo || sending) return;
    setSending(true);
    const success = await sendMessage(activeConvo, newMessage.trim());
    if (success) setNewMessage("");
    setSending(false);
  }, [newMessage, activeConvo, sending, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleNewConvo = useCallback(async () => {
    if (!newConvoAddress) return;
    const can = await checkCanMessage(newConvoAddress);
    setCanMessageStatus((p) => ({ ...p, [newConvoAddress]: can }));
    if (can) {
      setActiveConvo(newConvoAddress);
      setShowNewConvo(false);
      setNewConvoAddress("");
    }
  }, [newConvoAddress, checkCanMessage]);

  const activeConvoData = conversations.find((c) => c.peerAddress === activeConvo);
  const allMessages = [
    ...(activeConvoData?.messages || []),
    ...streamMessages_state.filter(
      (m) => !activeConvoData?.messages.find((am) => am.id === m.id)
    ),
  ].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());

  return (
    <>
      {/* Floating message button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-eth-card border border-eth-border flex items-center justify-center shadow-card-glow"
      >
        <MessageCircle size={20} className="text-neon-cyan" />
        {conversations.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-pink flex items-center justify-center text-[9px] font-bold text-white">
            {conversations.length > 9 ? "9+" : conversations.length}
          </span>
        )}
      </motion.button>

      {/* Inbox drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !activeConvo && setOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-eth-card border-l border-eth-border z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-eth-border">
                {activeConvo ? (
                  <button
                    onClick={() => {
                      setActiveConvo(null);
                      setStreamedMessages([]);
                    }}
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                    <MessageCircle size={14} className="text-eth-dark" />
                  </div>
                )}

                <div className="flex-1">
                  {activeConvo ? (
                    <PeerHeader address={activeConvo} />
                  ) : (
                    <div>
                      <p className="text-white font-bold text-sm">Messages</p>
                      <p className="text-muted-foreground text-xs">
                        Powered by XMTP
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              {!isReady && status !== "error" ? (
                /* Initializing */
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
                  {status === "idle" ? (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center mb-2">
                        <MessageCircle size={24} className="text-neon-cyan" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-white font-bold mb-1">
                          Enable XMTP Messaging
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Sign a message to enable end-to-end encrypted DMs with
                          any Ethereum address.
                        </p>
                      </div>
                      <button
                        onClick={initialize}
                        className="w-full h-12 rounded-xl font-semibold text-eth-dark flex items-center justify-center gap-2"
                        style={{
                          background: "linear-gradient(135deg, #00f5ff, #bf5af2)",
                        }}
                      >
                        <Zap size={16} />
                        Enable Messaging
                      </button>
                    </>
                  ) : (
                    <>
                      <Loader2
                        size={32}
                        className="text-neon-cyan animate-spin"
                      />
                      <p className="text-muted-foreground text-sm">
                        Initializing XMTP...
                      </p>
                    </>
                  )}
                </div>
              ) : status === "error" ? (
                <div className="flex-1 flex items-center justify-center px-6">
                  <div className="text-center">
                    <AlertCircle
                      size={32}
                      className="text-neon-pink mx-auto mb-3"
                    />
                    <p className="text-white font-bold mb-1">Failed to connect</p>
                    <p className="text-muted-foreground text-sm mb-4">{error}</p>
                    <button
                      onClick={initialize}
                      className="text-neon-cyan text-sm"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : activeConvo ? (
                /* Active conversation */
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {allMessages.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground text-sm">
                        No messages yet. Say gm! 👋
                      </div>
                    ) : (
                      allMessages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          isOwn={msg.senderAddress === address}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="px-3 py-3 border-t border-eth-border">
                    <div className="flex gap-2 items-end">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 bg-eth-surface border border-eth-border rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-muted-foreground/60 resize-none outline-none focus:border-neon-cyan/50 transition-colors max-h-28 overflow-y-auto"
                        style={{ minHeight: "42px" }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                          newMessage.trim() && !sending
                            ? "text-eth-dark"
                            : "bg-eth-surface border border-eth-border text-muted-foreground"
                        )}
                        style={
                          newMessage.trim() && !sending
                            ? { background: "linear-gradient(135deg, #00f5ff, #bf5af2)" }
                            : {}
                        }
                      >
                        {sending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                    <p className="text-muted-foreground text-[10px] text-center mt-2">
                      End-to-end encrypted · Powered by XMTP
                    </p>
                  </div>
                </>
              ) : (
                /* Conversation list */
                <>
                  {/* New conversation */}
                  <div className="px-4 py-3 border-b border-eth-border">
                    {showNewConvo ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="0x... or ENS name"
                          value={newConvoAddress}
                          onChange={(e) => setNewConvoAddress(e.target.value)}
                          className="flex-1 h-9 bg-eth-surface border border-eth-border rounded-lg px-3 text-white text-sm placeholder:text-muted-foreground/60 outline-none focus:border-neon-cyan/50 font-mono"
                          autoFocus
                        />
                        <button
                          onClick={handleNewConvo}
                          className="h-9 px-3 rounded-lg text-eth-dark text-sm font-semibold"
                          style={{
                            background: "linear-gradient(135deg, #00f5ff, #bf5af2)",
                          }}
                        >
                          Start
                        </button>
                        <button
                          onClick={() => setShowNewConvo(false)}
                          className="h-9 w-9 rounded-lg bg-eth-surface border border-eth-border flex items-center justify-center text-muted-foreground"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewConvo(true)}
                        className="w-full h-9 rounded-lg border border-dashed border-eth-border text-muted-foreground text-sm hover:border-neon-cyan/40 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={14} />
                        New message
                      </button>
                    )}
                    {canMessageStatus[newConvoAddress] === false && (
                      <p className="text-neon-pink text-xs mt-2 text-center">
                        This address hasn't enabled XMTP yet
                      </p>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="text-center py-16 px-6">
                        <MessageCircle
                          size={32}
                          className="text-muted-foreground mx-auto mb-3"
                        />
                        <p className="text-white font-bold mb-1">No messages yet</p>
                        <p className="text-muted-foreground text-sm">
                          DM any Ethereum address or ENS name
                        </p>
                      </div>
                    ) : (
                      conversations.map((convo) => (
                        <ConversationRow
                          key={convo.id}
                          convo={convo}
                          currentAddress={address}
                          onClick={() => setActiveConvo(convo.peerAddress)}
                        />
                      ))
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-eth-border">
                    <p className="text-muted-foreground text-[10px] text-center">
                      🔒 All messages are end-to-end encrypted via XMTP
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function PeerHeader({ address }: { address: string }) {
  const { name: ensName, avatar } = useENSName(address);
  return (
    <div className="flex items-center gap-2">
      <ENSAvatar
        address={address}
        ensName={ensName || undefined}
        avatarUrl={avatar || undefined}
        size="sm"
        showRing
      />
      <div>
        <p className="text-white font-bold text-sm">
          {formatDisplayName(address, ensName || undefined)}
        </p>
        <p className="text-muted-foreground text-[10px] font-mono">
          {truncateAddress(address)}
        </p>
      </div>
    </div>
  );
}

function ConversationRow({
  convo,
  currentAddress,
  onClick,
}: {
  convo: XMTPConversation;
  currentAddress?: string;
  onClick: () => void;
}) {
  const { name: ensName, avatar } = useENSName(convo.peerAddress);
  const lastMsg = convo.messages[convo.messages.length - 1];

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-eth-surface/50 transition-colors text-left"
    >
      <ENSAvatar
        address={convo.peerAddress}
        ensName={ensName || undefined}
        avatarUrl={avatar || undefined}
        size="md"
        showRing
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-white font-semibold text-sm truncate">
            {formatDisplayName(convo.peerAddress, ensName || undefined)}
          </p>
          {lastMsg && (
            <span className="text-muted-foreground text-[10px] flex-shrink-0 ml-2">
              {formatRelativeTime(Math.floor(lastMsg.sentAt.getTime() / 1000))}
            </span>
          )}
        </div>
        {lastMsg && (
          <p className="text-muted-foreground text-xs truncate">
            {lastMsg.senderAddress === currentAddress ? "You: " : ""}
            {lastMsg.content}
          </p>
        )}
      </div>
    </button>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: XMTPMessage;
  isOwn: boolean;
}) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5",
          isOwn
            ? "rounded-br-sm text-eth-dark"
            : "rounded-bl-sm bg-eth-surface border border-eth-border text-white"
        )}
        style={
          isOwn
            ? { background: "linear-gradient(135deg, #00f5ff, #bf5af2)" }
            : {}
        }
      >
        <p className="text-sm leading-relaxed break-words">{message.content}</p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isOwn ? "text-black/50" : "text-muted-foreground"
          )}
        >
          {message.sentAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
