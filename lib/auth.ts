import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { SessionUser, UserRole } from "@/types/claim";

export const sessionCookieName = "medbill_d1_session";
const sessionLifetimeSeconds = 8 * 60 * 60;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV !== "production") return "local-medbill-d1-session-secret-change-me";
  throw new Error("SESSION_SECRET is not configured");
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + sessionLifetimeSeconds * 1000 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifySessionToken(token?: string | null): SessionUser | null {
  if (!token) return null;
  try {
    const [payload, suppliedSignature] = token.split(".");
    if (!payload || !suppliedSignature) return null;
    const expected = Buffer.from(signature(payload));
    const supplied = Buffer.from(suppliedSignature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    if (!['admin', 'biller'].includes(decoded.role)) return null;
    return { email: decoded.email, name: decoded.name, role: decoded.role };
  } catch { return null; }
}

export async function getSession() {
  return verifySessionToken((await cookies()).get(sessionCookieName)?.value);
}

export function demoAccount(role: UserRole) {
  return role === "admin"
    ? { email: "admin@medbill.demo", name: "Demo Admin", role: "admin" as const }
    : { email: "biller@medbill.demo", name: "Demo Biller", role: "biller" as const };
}

export function validDemoPassword(value: string) {
  return value === (process.env.DEMO_LOGIN_PASSWORD || "D1Demo2026!");
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export function authError(error: unknown) {
  if ((error as Error).message === "UNAUTHORIZED") {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }
  return null;
}
