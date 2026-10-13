import { randomUUID } from "node:crypto";
import { authError, requireSession } from "@/lib/auth";
import { extractClaimFields } from "@/lib/claim-extraction";
import { config } from "@/lib/env";
import { extractPdfContent } from "@/lib/pdf";
import { createDocument } from "@/lib/repository";
import { deleteStoredObject, putPdf } from "@/lib/storage";
import type { DocumentRecord } from "@/types/document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSession();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Choose a claim PDF" }, { status: 400 });
    if (!file.size) return Response.json({ error: "The selected PDF is empty" }, { status: 400 });
    if (file.size > config.maxPdfBytes) return Response.json({ error: `PDF exceeds the ${Math.round(config.maxPdfBytes / 1024 / 1024)} MB limit` }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") return Response.json({ error: "Only valid PDF files are accepted" }, { status: 415 });

    const id = randomUUID();
    const now = new Date().toISOString();
    const storageKey = `input/${id}.pdf`;
    const safeName = file.name.replace(/[\r\n]/g, " ").slice(0, 180) || "claim.pdf";
    const extraction = await extractPdfContent(bytes);
    const record: DocumentRecord = {
      id, name: safeName, storageKey, size: bytes.length, mimeType: "application/pdf", status: "completed", task: "extract-claim",
      result: null, provider: extraction.source === "embedded" ? "Embedded PDF text" : "Node.js OCR", error: null,
      classification: "needs_review", destinationFolder: null, validationReasons: ["Review extracted fields before validating the claim."],
      processedAt: now, createdAt: now, updatedAt: now,
    };
    await putPdf(storageKey, bytes);
    try { await createDocument(record); }
    catch (error) { await deleteStoredObject(storageKey).catch(() => undefined); throw error; }

    return Response.json({
      claim: {
        ...extractClaimFields(extraction.text), source: "pdf", sourceDocumentId: id, fileName: safeName,
        extraction: { source: extraction.source, pages: extraction.pages, ocrPages: extraction.ocrPages, averageConfidence: extraction.averageConfidence },
      },
    });
  } catch (error) {
    return authError(error) || Response.json({ error: (error as Error).message || "Could not extract claim PDF" }, { status: 500 });
  }
}
