"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useSwitchChain, useReadContract } from "wagmi";
import { parseEther, parseUnits, type Address } from "viem";
import { mainnet, base } from "wagmi/chains";
import {
  CONTRACTS,
  TIP_CONTRACT_ABI,
  ERC20_ABI,
} from "@/lib/contracts";

type TipToken = "ETH" | "USDC";
type TipChain = "ethereum" | "base";
type TipStatus =
  | "idle"
  | "approving"
  | "switching-chain"
  | "pending"
  | "success"
  | "error";

interface UseTipResult {
  tip: (params: {
    creator: Address;
    videoCid: string;
    token: TipToken;
    chain: TipChain;
    amount: string; // in human-readable (e.g. "0.001" for ETH or "5" for USDC)
  }) => Promise<string | null>; // returns txHash or null
  status: TipStatus;
  txHash: string | null;
  error: string | null;
  reset: () => void;
}

export function useTip(): UseTipResult {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<TipStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }, []);

  const tip = useCallback(
    async ({
      creator,
      videoCid,
      token,
      chain,
      amount,
    }: {
      creator: Address;
      videoCid: string;
      token: TipToken;
      chain: TipChain;
      amount: string;
    }): Promise<string | null> => {
      setStatus("idle");
      setError(null);
      setTxHash(null);

      try {
        const targetChainId = chain === "ethereum" ? mainnet.id : base.id;

        // Switch chain if needed
        if (chainId !== targetChainId) {
          setStatus("switching-chain");
          await switchChainAsync({ chainId: targetChainId });
        }

        const contracts =
          chain === "ethereum" ? CONTRACTS.mainnet : CONTRACTS.base;

        if (token === "ETH") {
          setStatus("pending");
          const hash = await writeContractAsync({
            address: contracts.tipContract as Address,
            abi: TIP_CONTRACT_ABI,
            functionName: "tipETH",
            args: [creator, videoCid],
            value: parseEther(amount),
          });
          setTxHash(hash);
          setStatus("success");
          return hash;
        } else {
          // USDC tip — needs approval first
          const usdcAmount = parseUnits(amount, 6);

          // Check allowance
          setStatus("approving");
          const approveHash = await writeContractAsync({
            address: contracts.usdcToken as Address,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [contracts.tipContract as Address, usdcAmount],
          });

          // Wait a moment for approval to be indexed (simplified)
          await new Promise((r) => setTimeout(r, 2000));

          setStatus("pending");
          const hash = await writeContractAsync({
            address: contracts.tipContract as Address,
            abi: TIP_CONTRACT_ABI,
            functionName: "tipUSDC",
            args: [creator, usdcAmount, videoCid],
          });

          setTxHash(hash);
          setStatus("success");
          return hash;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setError(msg);
        setStatus("error");
        return null;
      }
    },
    [chainId, switchChainAsync, writeContractAsync]
  );

  return { tip, status, txHash, error, reset };
}
