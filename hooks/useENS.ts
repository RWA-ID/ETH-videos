"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_MAINNET ||
      "https://eth-mainnet.g.alchemy.com/v2/demo"
  ),
});

interface ENSData {
  name: string | null;
  avatar: string | null;
  loading: boolean;
  error: string | null;
}

export function useENSName(address?: string): ENSData {
  const [data, setData] = useState<ENSData>({
    name: null,
    avatar: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!address) return;
    setData((d) => ({ ...d, loading: true, error: null }));

    (async () => {
      try {
        const name = await ensClient.getEnsName({ address: address as `0x${string}` });

        let avatar: string | null = null;
        if (name) {
          const rawAvatar = await ensClient.getEnsAvatar({
            name: normalize(name),
          });
          avatar = rawAvatar ?? null;
        }

        setData({ name, avatar, loading: false, error: null });
      } catch (err) {
        setData({
          name: null,
          avatar: null,
          loading: false,
          error: err instanceof Error ? err.message : "ENS lookup failed",
        });
      }
    })();
  }, [address]);

  return data;
}

export async function resolveENSName(address: string): Promise<{
  name: string | null;
  avatar: string | null;
}> {
  try {
    const name = await ensClient.getEnsName({
      address: address as `0x${string}`,
    });

    let avatar: string | null = null;
    if (name) {
      const rawAvatar = await ensClient.getEnsAvatar({ name: normalize(name) });
      avatar = rawAvatar ?? null;
    }

    return { name, avatar };
  } catch {
    return { name: null, avatar: null };
  }
}

export async function resolveENSAddress(
  nameOrAddress: string
): Promise<string | null> {
  if (nameOrAddress.startsWith("0x")) return nameOrAddress;

  try {
    const address = await ensClient.getEnsAddress({
      name: normalize(nameOrAddress),
    });
    return address;
  } catch {
    return null;
  }
}

// Cache for ENS lookups to avoid repeated calls
const ensCache = new Map<string, { name: string | null; avatar: string | null; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function cachedENSLookup(address: string): Promise<{
  name: string | null;
  avatar: string | null;
}> {
  const cached = ensCache.get(address.toLowerCase());
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { name: cached.name, avatar: cached.avatar };
  }

  const result = await resolveENSName(address);
  ensCache.set(address.toLowerCase(), { ...result, ts: Date.now() });
  return result;
}
