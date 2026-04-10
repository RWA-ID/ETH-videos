export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import type { Comment } from "@/types";

// In-memory store for development.
// Production: replace with Postgres/Redis or TheGraph indexing IPFS comment CIDs.
const commentStore = new Map<string, Comment[]>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoCid = searchParams.get("videoCid");

  if (!videoCid) {
    return NextResponse.json({ error: "Missing videoCid" }, { status: 400 });
  }

  const comments = commentStore.get(videoCid) || [];
  return NextResponse.json(comments);
}

export async function POST(request: NextRequest) {
  try {
    const { videoCid, commentCid, comment } = await request.json();

    if (!videoCid || !comment) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = commentStore.get(videoCid) || [];
    const newComment: Comment = {
      ...comment,
      id: commentCid || Date.now().toString(),
      txHash: commentCid,
    };

    commentStore.set(videoCid, [newComment, ...existing]);

    return NextResponse.json({ success: true, comment: newComment });
  } catch {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
