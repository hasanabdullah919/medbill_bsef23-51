import { DocumentWorkspace } from "@/components/document-workspace";
import { deploymentMode } from "@/lib/env";
import { listDocuments } from "@/lib/repository";
import type { DocumentRecord } from "@/types/document";

export const dynamic = "force-dynamic";

export default async function Home() {
  let documents: DocumentRecord[] = [];
  let loadError = "";
  try { documents = await listDocuments(); } catch (error) { loadError = (error as Error).message; }

  return <DocumentWorkspace initialDocuments={documents} services={deploymentMode()} loadError={loadError} />;
}
