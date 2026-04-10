export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    const response = await fetch("https://livepeer.studio/api/asset/request-upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name || "Untitled Video",
        staticMp4: true,
        playbackPolicy: { type: "public" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Livepeer API error: ${err}`);
    }

    const data = await response.json();

    return NextResponse.json({
      url: data.url,
      assetId: data.asset.id,
      tusEndpoint: data.tusEndpoint,
    });
  } catch (error) {
    console.error("Livepeer upload route error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
