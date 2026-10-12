import { randomUUID } from "node:crypto";
import { processPdf } from "@/lib/ai";
import { classifyExtractedDocument, type RoutingDecision } from "@/lib/classifier";
import { extractPdfContent, type PdfContent } from "@/lib/pdf";
import { getDocument, updateDocument } from "@/lib/repository";
import { getPdf, movePdf } from "@/lib/storage";
import type { DocumentRecord } from "@/types/document";
import { getPrisma } from "@/lib/prisma";

type DebugAnalysis = { content: string; provider: string; fallbackReason?: string };
type DebugItem = { id: string; name: string; text?: string; extraction?: PdfContent; decision?: RoutingDecision; analysis?: DebugAnalysis };
type DebugSession = { id: string; items: DebugItem[]; completedSteps: string[] };

async function saveSession(session: DebugSession) {
  const data = JSON.parse(JSON.stringify(session));
  await getPrisma().debugSession.upsert({ where: { id: session.id },
    create: { id: session.id, data, expiresAt: new Date(Date.now() + 3_600_000) }, update: { data } });
}

export async function startDebugSession(ids: string[]) {
  const items: DebugItem[] = [];
  for (const id of ids) {
    const document = await getDocument(id);
    if (!document || (document.classification && document.classification !== "pending")) throw new Error("Every debug file must still be in input/.");
    items.push({ id, name: document.name });
  }
  const session: DebugSession = { id: randomUUID(), items, completedSteps: [] };
  await saveSession(session);
  return { sessionId: session.id, files: items.map(({ id, name }) => ({ id, name })) };
}

async function sessionFor(id: string) {
  const row = await getPrisma().debugSession.findUnique({ where: { id } });
  if (!row || row.expiresAt < new Date()) throw new Error("Debug session expired. Start a new debug run.");
  return row.data as unknown as DebugSession;
}

function requireStep(session: DebugSession, step: string) {
  if (!session.completedSteps.includes(step)) throw new Error(`Run the ${step} step first.`);
}

export async function runDebugStep(sessionId: string, step: "read" | "ocr" | "validate" | "analyze" | "route", forceOcr = false) {
  const session = await sessionFor(sessionId);
  if (step === "read") {
    const details = [];
    for (const item of session.items) {
      const document = await getDocument(item.id);
      if (!document) throw new Error(`${item.name} is no longer available.`);
      const bytes = await getPdf(document.storageKey);
      if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error(`${item.name} has an invalid PDF signature.`);
      details.push({ name: item.name, bytes: bytes.length, validPdfSignature: true });
    }
    session.completedSteps = ["read"];
    await saveSession(session);
    return { step, title: "PDF read complete", details };
  }
  if (step === "ocr") {
    requireStep(session, "read");
    const details = [];
    for (const item of session.items) {
      const document = await getDocument(item.id);
      if (!document) throw new Error(`${item.name} is no longer available.`);
      item.extraction = await extractPdfContent(await getPdf(document.storageKey), forceOcr);
      item.text = item.extraction.text;
      details.push({ name: item.name, ...item.extraction, aiInput: "Extracted text only", apiCalls: 0 });
    }
    session.completedSteps = ["read", "ocr"];
    await saveSession(session);
    return { step, title: "Local text extraction complete", details };
  }
  if (step === "validate") {
    requireStep(session, "ocr");
    const details = session.items.map((item) => {
      if (!item.extraction) throw new Error("Run text extraction first.");
      item.decision = classifyExtractedDocument(item.extraction);
      return { name: item.name, classification: item.decision.classification, checks: item.decision.checks };
    });
    session.completedSteps = ["read", "ocr", "validate"];
    await saveSession(session);
    return { step, title: "Validation complete", details };
  }
  if (step === "analyze") {
    requireStep(session, "validate");
    const details = [];
    for (const item of session.items) {
      const document = await getDocument(item.id);
      if (!document) throw new Error(`${item.name} is no longer available.`);
      item.analysis = await processPdf(item.text || "", "extract");
      details.push({ name: item.name, provider: item.analysis.provider, fallbackReason: item.analysis.fallbackReason, aiInput: "Extracted text only", preview: item.analysis.content.slice(0, 320) });
    }
    session.completedSteps = ["read", "ocr", "validate", "analyze"];
    await saveSession(session);
    return { step, title: "AI extraction complete", details };
  }

  requireStep(session, "analyze");
  const routed: DocumentRecord[] = [];
  const details = [];
  for (const item of session.items) {
    const document = await getDocument(item.id);
    if (!document || !item.decision || !item.analysis) throw new Error(`${item.name} is missing debug data.`);
    try {
      const destinationFolder = `output/${item.decision.folder}`;
      const destinationKey = `${destinationFolder}/${item.id}.pdf`;
      await movePdf(document.storageKey, destinationKey);
      const checkLines = item.decision.checks.map((check) => `- ${check.passed ? "PASS" : "FAIL"} — **${check.label}:** ${check.detail}`).join("\n");
      const report = `## Routing decision: ${item.decision.classification.replace("_", " ").toUpperCase()}\n\n**Moved to:** \`${destinationFolder}/\`\n\n### Local text extraction\nSource: ${item.extraction?.source}; ${item.extraction?.ocrPages} OCR pages. AI receives extracted text only.\n\n### Validation checks\n${checkLines}\n\n### Extracted document details\n${item.analysis.content}`;
      const updated = await updateDocument(item.id, { status: "completed", task: "route", result: report, provider: item.analysis.provider, error: null, storageKey: destinationKey, classification: item.decision.classification, destinationFolder, validationReasons: [...item.decision.errors, ...item.decision.warnings], processedAt: new Date().toISOString() });
      routed.push(updated);
      details.push({ name: item.name, destination: `${destinationFolder}/`, classification: item.decision.classification });
    } catch (error) {
      const message = (error as Error).message || "Routing failed";
      const updated = await updateDocument(item.id, { status: "failed", classification: "failed", destinationFolder: "output/failed", validationReasons: [message], error: message, processedAt: new Date().toISOString() });
      routed.push(updated);
      details.push({ name: item.name, destination: "output/failed/", classification: "failed", error: message });
    }
  }
  session.completedSteps = ["read", "ocr", "validate", "analyze", "route"];
  await getPrisma().debugSession.delete({ where: { id: session.id } });
  return { step, title: "Routing complete", details, documents: routed };
}
