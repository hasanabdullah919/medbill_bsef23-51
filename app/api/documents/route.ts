import { randomUUID } from "node:crypto";
import { authError, requireSession } from "@/lib/auth";
import { config } from "@/lib/env";
import { createDocument, listDocuments } from "@/lib/repository";
import { putPdf, deleteStoredObject } from "@/lib/storage";
import type { DocumentRecord } from "@/types/document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    return Response.json({ documents: await listDocuments() });
  } catch (error) {
    return authError(error) || Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Choose a PDF file" }, { status: 400 });
    if (file.size === 0) return Response.json({ error: "The selected PDF is empty" }, { status: 400 });
    if (file.size > config.maxPdfBytes) {
      return Response.json({ error: `PDF exceeds the ${Math.round(config.maxPdfBytes / 1024 / 1024)} MB limit` }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return Response.json({ error: "Only valid PDF files are accepted" }, { status: 415 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const storageKey = `input/${id}.pdf`;
    const safeName = file.name.replace(/[\r\n]/g, " ").slice(0, 180) || "document.pdf";
    const record: DocumentRecord = {
      id,
      name: safeName,
      storageKey,
      size: bytes.length,
      mimeType: "application/pdf",
      status: "uploaded",
      task: null,
      result: null,
      provider: null,
      error: null,
      classification: "pending",
      destinationFolder: null,
      validationReasons: [],
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await putPdf(storageKey, bytes);
    try { await createDocument(record); }
    catch (error) { await deleteStoredObject(storageKey).catch(() => undefined); throw error; }
    return Response.json({ document: record }, { status: 201 });
  } catch (error) {
    return authError(error) || Response.json({ error: (error as Error).message || "Upload failed" }, { status: 500 });
  }
}
