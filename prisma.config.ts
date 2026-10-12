import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import path from "node:path";

config({ path: ".env.local" });
const source = process.env.DIRECT_URL || process.env.DATABASE_URL;
const connection = source ? new URL(source) : null;
connection?.searchParams.set("sslmode", "verify-full");
connection?.searchParams.set("sslrootcert", path.join(process.cwd(), "certs/supabase-ca.crt"));
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: connection?.toString() || "" },
});
