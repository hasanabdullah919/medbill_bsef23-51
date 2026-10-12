import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "@/lib/env";
import type { DocumentRecord } from "@/types/document";

let client: S3Client | undefined;
export function r2Client() {
  if (!config.hasR2) throw new Error("Cloudflare R2 credentials are not configured.");
  return client ??= new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" });
}
function bucket() { return process.env.R2_BUCKET!; }
export async function checkStorage() {
  await r2Client().send(new HeadBucketCommand({ Bucket: bucket() }));
}
export async function putPdf(key: string, bytes: Buffer) {
  await r2Client().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: bytes, ContentType: "application/pdf", IfNoneMatch: "*" }));
}
export async function getPdf(key: string) {
  const response = await r2Client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  if (!response.Body) throw new Error("PDF object has no content.");
  return Buffer.from(await response.Body.transformToByteArray());
}
export async function movePdf(source: string, destination: string) {
  if (source === destination) return;
  await r2Client().send(new CopyObjectCommand({ Bucket: bucket(), CopySource: `${bucket()}/${source.split("/").map(encodeURIComponent).join("/")}`, Key: destination }));
  await r2Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: source }));
}
export async function createStorageBackup(documents: DocumentRecord[]) {
  const prefix = `backups/${new Date().toISOString().replace(/[:.]/g, "-")}`;
  for (const document of documents) {
    await r2Client().send(new CopyObjectCommand({ Bucket: bucket(), CopySource: `${bucket()}/${document.storageKey.split("/").map(encodeURIComponent).join("/")}`, Key: `${prefix}/${document.storageKey}` }));
  }
  await r2Client().send(new PutObjectCommand({ Bucket: bucket(), Key: `${prefix}/manifest.json`,
    Body: JSON.stringify({ createdAt: new Date().toISOString(), count: documents.length, documents }, null, 2), ContentType: "application/json" }));
  return { prefix: `${prefix}/`, count: documents.length };
}
export async function deleteStoredObject(key: string) {
  await r2Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
