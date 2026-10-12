import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { getPrisma } from "../lib/prisma";
import type { DocumentRecord } from "../types/document";

config({ path: ".env.local" });
async function main() {
const filename = process.argv[2];
if (!filename) throw new Error("Pass the path to the existing documents.json metadata file.");
const records = JSON.parse(await readFile(filename, "utf8")) as DocumentRecord[];
const prisma = getPrisma();
try {
  for (const record of records) {
    await prisma.document.upsert({ where: { id: record.id }, update: {}, create: { ...record,
      createdAt: new Date(record.createdAt), updatedAt: new Date(record.updatedAt), processedAt: record.processedAt ? new Date(record.processedAt) : null } });
  }
  console.log(`Imported ${records.length} document records into Supabase Postgres through Prisma.`);
} finally { await prisma.$disconnect(); }
}
main().catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
