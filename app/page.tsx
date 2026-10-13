import { redirect } from "next/navigation";
import { ClaimWorkspace } from "@/components/claim-workspace";
import { getSession } from "@/lib/auth";
import { listClaims } from "@/lib/claim-repository";
import { deploymentMode } from "@/lib/env";
import type { ClaimRecord } from "@/types/claim";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSession();
  if (!user) redirect("/login");
  let claims: ClaimRecord[] = [];
  let loadError = "";
  try { claims = await listClaims(); } catch (error) { loadError = (error as Error).message; }
  return <ClaimWorkspace user={user} initialClaims={claims} services={deploymentMode()} loadError={loadError} />;
}
