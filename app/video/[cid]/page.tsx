export const dynamic = "force-static";
export async function generateStaticParams() { return []; }

import { VideoPageClient } from "./VideoPageClient";

interface VideoPageProps {
  params: Promise<{ cid: string }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { cid } = await params;
  return <VideoPageClient cid={cid} />;
}
