import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";

const cache = globalThis as typeof globalThis & { __medbillPrisma?: PrismaClient };
export function getPrisma() {
  if (!process.env.DATABASE_URL) throw new Error("Supabase Postgres DATABASE_URL is not configured.");
  if (!cache.__medbillPrisma) {
    const connection = new URL(process.env.DATABASE_URL);
    connection.searchParams.delete("sslmode");
    cache.__medbillPrisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: connection.toString(), max: 3, connectionTimeoutMillis: 15_000,
        ssl: { ca: readFileSync(path.join(process.cwd(), "certs/supabase-ca.crt"), "utf8"), rejectUnauthorized: true } }),
    });
  }
  return cache.__medbillPrisma;
}
