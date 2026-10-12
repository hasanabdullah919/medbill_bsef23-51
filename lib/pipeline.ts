import { processPdf } from "@/lib/ai";
import { classifyExtractedDocument } from "@/lib/classifier";
import { extractPdfContent } from "@/lib/pdf";
import { getDocument, updateDocument } from "@/lib/repository";
import { getPdf, movePdf } from "@/lib/storage";

export async function routeDocument(id: string, onStage?: (step: string) => void) {
  const document = await getDocument(id);
  if (!document) throw new Error("Document not found");

  await updateDocument(id, { status: "processing", classification: "pending", error: null });
  let actualKey = document.storageKey;
  try {
    onStage?.("read");
    const bytes = await getPdf(document.storageKey);
    if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("Invalid PDF signature");
    onStage?.("ocr");
    const extraction = await extractPdfContent(bytes);
    const text = extraction.text;

    onStage?.("validate");
    const decision = classifyExtractedDocument(extraction);
    onStage?.("analyze");
    const analysis = await processPdf(text, "extract");
    const destinationFolder = `output/${decision.folder}`;
    const destinationKey = `${destinationFolder}/${id}.pdf`;
    onStage?.("route");
    await movePdf(document.storageKey, destinationKey);
    actualKey = destinationKey;

    const checkLines = decision.checks.map((check) => `- ${check.passed ? "PASS" : "FAIL"} — **${check.label}:** ${check.detail}`).join("\n");
    const report = `## Routing decision: ${decision.classification.replace("_", " ").toUpperCase()}\n\n**Moved to:** \`${destinationFolder}/\`\n\n### Text extraction\n- ${extraction.pages} pages; ${extraction.ocrPages} processed with Node.js OCR\n- Source: ${extraction.source}; AI receives text only\n${extraction.averageConfidence === null ? "" : `- OCR confidence: ${Math.round(extraction.averageConfidence * 100)}%\n`}\n### Validation checks\n${checkLines}\n\n### Extracted document details\n${analysis.content}`;

    return updateDocument(id, {
      status: "completed",
      task: "route",
      result: report,
      provider: analysis.provider,
      error: null,
      storageKey: destinationKey,
      classification: decision.classification,
      destinationFolder,
      validationReasons: [...decision.errors, ...decision.warnings],
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    let message = (error as Error).message || "Routing failed";
    const failedKey = `output/failed/${id}.pdf`;
    try { await movePdf(actualKey, failedKey); actualKey = failedKey; }
    catch (moveError) { message += `; failed-folder move: ${(moveError as Error).message}`; }
    await updateDocument(id, {
      status: "failed", classification: "failed", destinationFolder: "output/failed",
      storageKey: actualKey,
      validationReasons: [message], error: message, processedAt: new Date().toISOString(),
    }).catch(() => undefined);
    throw error;
  }
}
