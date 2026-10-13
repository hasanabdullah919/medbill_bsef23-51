import { redirect } from "next/navigation";
import { DocumentWorkspace } from "@/components/document-workspace";
import { getSession } from "@/lib/auth";
import { deploymentMode } from "@/lib/env";
import { listDocuments } from "@/lib/repository";
import type { DocumentRecord } from "@/types/document";

export const dynamic = "force-dynamic";

export default async function TechnicalWorkspace() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  let documents: DocumentRecord[] = [];
  let loadError = "";
  try { documents = await listDocuments(); } catch (error) { loadError = (error as Error).message; }
  return <DocumentWorkspace initialDocuments={documents} services={deploymentMode()} loadError={loadError} />;
}
