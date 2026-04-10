export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { parseSiweMessage } from "viem/siwe";
import { recoverMessageAddress } from "viem";

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();

    const nonce = request.cookies.get("siwe-nonce")?.value;
    if (!nonce) {
      return NextResponse.json({ error: "Missing nonce" }, { status: 400 });
    }

    const parsedMessage = parseSiweMessage(message);

    // Validate nonce
    if (parsedMessage.nonce !== nonce) {
      return NextResponse.json({ error: "Invalid nonce" }, { status: 401 });
    }

    // Validate expiry
    if (parsedMessage.expirationTime && new Date(parsedMessage.expirationTime) < new Date()) {
      return NextResponse.json({ error: "Message expired" }, { status: 401 });
    }

    // Recover signer locally — no RPC call needed for EOA wallets
    const recovered = await recoverMessageAddress({ message, signature });

    if (recovered.toLowerCase() !== parsedMessage.address?.toLowerCase()) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      address: parsedMessage.address,
    });

    response.cookies.set(
      "siwe-session",
      JSON.stringify({
        address: parsedMessage.address,
        chainId: parsedMessage.chainId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60,
        path: "/",
      }
    );

    response.cookies.delete("siwe-nonce");
    return response;
  } catch (error) {
    console.error("SIWE verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
