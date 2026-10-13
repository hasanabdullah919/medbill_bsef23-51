import { cookies } from "next/headers";
import { sessionCookieName } from "@/lib/auth";

export async function POST() {
  (await cookies()).set(sessionCookieName, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}
