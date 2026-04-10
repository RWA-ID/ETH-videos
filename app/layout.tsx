import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ethvideos.eth — Decentralized Short Video for Ethereum",
  description:
    "The crypto-native TikTok. Short-form vertical video with true ownership, ENS identity, IPFS storage, and on-chain tips. Your .eth is your username forever.",
  metadataBase: new URL("https://app.ethvideos.eth.limo"),
  keywords: [
    "ethereum",
    "web3",
    "video",
    "decentralized",
    "ENS",
    "IPFS",
    "Livepeer",
    "social",
    "crypto",
    "NFT",
  ],
  authors: [{ name: "ethvideos.eth" }],
  themeColor: "#0a0a0f",
  manifest: "/manifest.json",
  openGraph: {
    title: "ethvideos.eth",
    description: "Short-form video for Ethereum natives. Own your content.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ethvideos.eth",
    description: "Short-form video for Ethereum natives. Own your content.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-eth-dark overflow-hidden`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
