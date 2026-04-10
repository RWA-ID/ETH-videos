import type { NextConfig } from "next";

// Set NEXT_STATIC_EXPORT=1 to build a static site for IPFS deployment.
// API routes won't be included — client calls Pinata/Livepeer/XMTP directly.
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export", trailingSlash: true } : {}),
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "*.ipfs.nftstorage.link" },
      { protocol: "https", hostname: "cloudflare-ipfs.com" },
      { protocol: "https", hostname: "metadata.ens.domains" },
      { protocol: "https", hostname: "euc.li" },
      { protocol: "https", hostname: "*.livepeer.studio" },
      { protocol: "https", hostname: "livepeercdn.studio" },
      { protocol: "https", hostname: "avatar.vercel.sh" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // siwe v2 optionally imports ethers — stub it out since we use viem
    config.resolve.alias = {
      ...config.resolve.alias,
      ethers: require.resolve("./lib/ethers-stub.js"),
    };
    // XMTP uses Node.js crypto — polyfill for browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      buffer: false,
    };
    return config;
  },
};

export default nextConfig;
