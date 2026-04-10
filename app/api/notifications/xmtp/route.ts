export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side XMTP notification sender.
 * Uses the platform bot private key to send notifications to users.
 *
 * Requires: XMTP_BOT_PRIVATE_KEY in env (the notification bot's private key)
 */
export async function POST(request: NextRequest) {
  const BOT_KEY = process.env.XMTP_BOT_PRIVATE_KEY;

  if (!BOT_KEY) {
    // Silently skip if no bot configured
    return NextResponse.json({ skipped: true });
  }

  try {
    const { to, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json({ error: "Missing to or message" }, { status: 400 });
    }

    // Dynamically import XMTP (server-side Node environment)
    const { Client } = await import("@xmtp/browser-sdk");

    // Create a simple signer from the bot private key
    const { createWalletClient, http } = await import("viem");
    const { privateKeyToAccount } = await import("viem/accounts");
    const { mainnet } = await import("viem/chains");

    const account = privateKeyToAccount(BOT_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: mainnet,
      transport: http(),
    });

    const signer = {
      walletType: "EOA" as const,
      getAddress: async () => account.address,
      signMessage: async (msg: string) => {
        const hex = await walletClient.signMessage({ message: msg });
        const bytes = hex.slice(2).match(/.{1,2}/g)!.map((b) => parseInt(b, 16));
        return new Uint8Array(bytes);
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = await (Client.create as any)(signer, { env: "production" });

    // Check recipient is on XMTP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canMessage = await (Client.canMessage as any)([to], { env: "production" });
    if (!canMessage[to]) {
      return NextResponse.json({ skipped: true, reason: "recipient not on XMTP" });
    }

    const conversation = await client.conversations.newConversation(to);
    await conversation.send(message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("XMTP notification route error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
