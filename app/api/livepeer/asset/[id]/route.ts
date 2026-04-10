export const dynamic = "force-static";
export function generateStaticParams() { return []; }
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const response = await fetch(`https://livepeer.studio/api/asset/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    const asset = await response.json();

    return NextResponse.json({
      id: asset.id,
      playbackId: asset.playbackId,
      status: asset.status,
      videoSpec: asset.videoSpec,
      createdAt: asset.createdAt,
    });
  } catch (error) {
    console.error("Livepeer asset route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
}
