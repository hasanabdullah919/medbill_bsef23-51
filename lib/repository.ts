import { getPrisma } from "@/lib/prisma";
import type { DocumentRecord } from "@/types/document";
import type { Document } from "@/generated/prisma/client";

function record(row: Document): DocumentRecord {
  return { ...row, status: row.status as DocumentRecord["status"], classification: row.classification as DocumentRecord["classification"],
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), processedAt: row.processedAt?.toISOString() || null };
}
export async function listDocuments() {
  return (await getPrisma().document.findMany({ orderBy: { createdAt: "desc" } })).map(record);
}
export async function getDocument(id: string) {
  const row = await getPrisma().document.findUnique({ where: { id } });
  return row ? record(row) : null;
}
export async function createDocument(value: DocumentRecord) {
  const row = await getPrisma().document.create({ data: { ...value,
    createdAt: new Date(value.createdAt), updatedAt: new Date(value.updatedAt), processedAt: value.processedAt ? new Date(value.processedAt) : null } });
  return record(row);
}
export async function updateDocument(id: string, patch: Partial<DocumentRecord>) {
  const { id: _id, createdAt: _created, updatedAt: _updated, processedAt, ...data } = patch;
  void _id; void _created; void _updated;
  const row = await getPrisma().document.update({ where: { id }, data: { ...data,
    ...(processedAt !== undefined ? { processedAt: processedAt ? new Date(processedAt) : null } : {}) } });
  return record(row);
}
