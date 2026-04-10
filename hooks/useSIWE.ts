"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { createSiweMessage, parseSiweMessage, generateSiweNonce } from "viem/siwe";

type SIWEStatus = "idle" | "signing" | "verifying" | "authenticated" | "error";

export function useSIWE() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<SIWEStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!address || !chainId) return false;

    setStatus("signing");
    setError(null);

    try {
      // Get nonce from server
      const nonceRes = await fetch("/api/siwe/nonce");
      const { nonce } = await nonceRes.json();

      // Build SIWE message using viem
      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to ethvideos.eth — the decentralized video platform.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const signature = await signMessageAsync({ message });

      setStatus("verifying");

      const verifyRes = await fetch("/api/siwe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });

      if (!verifyRes.ok) throw new Error("Signature verification failed");

      setStatus("authenticated");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      setError(msg);
      setStatus("error");
      return false;
    }
  }, [address, chainId, signMessageAsync]);

  const signOut = useCallback(async () => {
    await fetch("/api/siwe/signout", { method: "POST" });
    setStatus("idle");
  }, []);

  return {
    signIn,
    signOut,
    status,
    error,
    isAuthenticated: status === "authenticated",
    isSigning: status === "signing" || status === "verifying",
  };
}
