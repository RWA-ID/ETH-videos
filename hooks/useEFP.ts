"use client";

import { useState, useEffect, useCallback } from "react";
import type { EFPStats } from "@/types";

// EFP (Ethereum Follow Protocol) API
const EFP_API = "https://api.efp.app/v1";

export function useEFPStats(address?: string) {
  const [stats, setStats] = useState<EFPStats>({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);

    fetch(`${EFP_API}/users/${address}/stats`)
      .then((r) => r.json())
      .then((data) => {
        setStats({
          followers: data.followers_count ?? 0,
          following: data.following_count ?? 0,
        });
      })
      .catch(() => setStats({ followers: 0, following: 0 }))
      .finally(() => setLoading(false));
  }, [address]);

  return { stats, loading };
}

export function useIsFollowing(
  follower?: string,
  following?: string
): { isFollowing: boolean; loading: boolean } {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!follower || !following) return;
    setLoading(true);

    fetch(`${EFP_API}/users/${follower}/following/${following}`)
      .then((r) => r.json())
      .then((data) => setIsFollowing(data.is_following ?? false))
      .catch(() => setIsFollowing(false))
      .finally(() => setLoading(false));
  }, [follower, following]);

  return { isFollowing, loading };
}

export function useEFPFollowing(address?: string) {
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (!address || !hasMore || loading) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${EFP_API}/users/${address}/following?offset=${page * 50}&limit=50`
      );
      const data = await res.json();
      const addrs: string[] = (data.following ?? []).map(
        (f: { data: string }) => f.data
      );
      setFollowing((prev) => [...prev, ...addrs]);
      setHasMore(addrs.length === 50);
      setPage((p) => p + 1);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [address, hasMore, loading, page]);

  useEffect(() => {
    if (address) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return { following, loading, hasMore, loadMore };
}
