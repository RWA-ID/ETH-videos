export async function generateStaticParams() { return []; }

import { ProfileRouteClient } from "./ProfileRouteClient";

interface ProfileRouteProps {
  params: Promise<{ address: string }>;
}

export default async function ProfileRoute({ params }: ProfileRouteProps) {
  const { address } = await params;
  return <ProfileRouteClient address={address} />;
}
