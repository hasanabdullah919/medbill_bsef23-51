import { listDocuments } from "@/lib/repository";
import { createStorageBackup } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  try {
    const documents = await listDocuments();
    return Response.json({ backup: await createStorageBackup(documents) });
  } catch (error) {
    return Response.json({ error: (error as Error).message || "Backup failed" }, { status: 500 });
  }
}
