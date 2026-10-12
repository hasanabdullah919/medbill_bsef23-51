import { PDFParse } from "pdf-parse";
import { createWorker, OEM } from "tesseract.js";
import path from "node:path";
export type PdfContent = { text: string; source: "embedded" | "ocr" | "mixed"; pages: number; ocrPages: number; averageConfidence: number | null };
export async function extractPdfContent(bytes: Buffer, forceOcr = false): Promise<PdfContent> {
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  try {
    const document = await parser.getText();
    if (document.total > Number(process.env.OCR_MAX_PAGES || 50)) throw new Error("PDF exceeds the 50-page limit. Split it into smaller files.");
    const pages: string[] = [];
    const confidences: number[] = [];
    let ocrPages = 0;
    for (const page of document.pages) {
      let text = page.text.replace(/\u0000/g, "").trim();
      if (forceOcr || text.replace(/[^a-z0-9]/gi, "").length < 40) {
        worker ??= await createWorker("eng", OEM.LSTM_ONLY, {
          langPath: path.join(process.cwd(), "node_modules/@tesseract.js-data/eng/4.0.0_best_int"),
          workerPath: path.join(process.cwd(), "node_modules/tesseract.js/src/worker-script/node/index.js"),
          cacheMethod: "none", gzip: true,
        });
        const screenshot = await parser.getScreenshot({ partial: [page.num], desiredWidth: 2400, imageBuffer: true, imageDataUrl: false });
        const { data } = await worker.recognize(Buffer.from(screenshot.pages[0].data));
        text = data.text.trim();
        confidences.push(data.confidence / 100);
        ocrPages++;
      }
      if (text) pages.push(`[Page ${page.num}]\n${text}`);
    }
    if (!pages.length) throw new Error("No readable text was found after OCR. Check PDF image quality.");
    return { text: pages.join("\n\n"), pages: document.total, ocrPages,
      source: !ocrPages ? "embedded" : ocrPages === document.total ? "ocr" : "mixed",
      averageConfidence: confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null };
  } finally { await worker?.terminate(); await parser.destroy(); }
}
