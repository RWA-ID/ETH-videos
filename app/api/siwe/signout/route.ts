export const dynamic = "force-static";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("siwe-session");
  return response;
}
