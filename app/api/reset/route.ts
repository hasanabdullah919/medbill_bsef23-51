import { authError, requireSession } from "@/lib/auth";
import { listDocuments, updateDocument } from "@/lib/repository";
import { createStorageBackup, movePdf } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json();
    if (body?.confirmation !== "RESET") {
      return Response.json({ error: "Type RESET to confirm the workspace reset" }, { status: 400 });
    }
    const documents = await listDocuments();
    const backup = await createStorageBackup(documents);
    const resetDocuments = [];
    for (const document of documents) {
      const inputKey = `input/${document.id}.pdf`;
      await movePdf(document.storageKey, inputKey);
      resetDocuments.push(await updateDocument(document.id, {
        storageKey: inputKey,
        status: "uploaded",
        task: null,
        result: null,
        provider: null,
        error: null,
        classification: "pending",
        destinationFolder: null,
        validationReasons: [],
        processedAt: null,
      }));
    }
    return Response.json({ backup, reset: resetDocuments.length, documents: resetDocuments });
  } catch (error) {
    return authError(error) || Response.json({ error: (error as Error).message || "Reset failed" }, { status: 500 });
  }
}
