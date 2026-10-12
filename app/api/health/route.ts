import { deploymentMode } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { checkStorage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const checks = await Promise.allSettled([Promise.resolve().then(() => getPrisma().$queryRaw`SELECT 1`), checkStorage()]);
  const database = checks[0].status === "fulfilled";
  const storage = checks[1].status === "fulfilled";
  return Response.json({ ok: database && storage, services: deploymentMode(), checks: { database, storage }, timestamp: new Date().toISOString() }, { status: database && storage ? 200 : 503 });
}
