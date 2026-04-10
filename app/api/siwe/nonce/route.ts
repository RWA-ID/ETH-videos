export const dynamic = "force-static";
import { NextResponse } from "next/server";
import { generateSiweNonce } from "viem/siwe";

export async function GET() {
  const nonce = generateSiweNonce();
  const response = NextResponse.json({ nonce });

  response.cookies.set("siwe-nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300,
    path: "/",
  });

  return response;
}
