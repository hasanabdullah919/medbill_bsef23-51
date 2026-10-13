import { cookies } from "next/headers";
import { createSessionToken, demoAccount, sessionCookieName, validDemoPassword } from "@/lib/auth";
import type { UserRole } from "@/types/claim";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role: UserRole = body.role === "admin" ? "admin" : "biller";
    const account = demoAccount(role);
    if (String(body.email || "").toLowerCase() !== account.email || !validDemoPassword(String(body.password || ""))) {
      return Response.json({ error: "Use the demo account shown on the sign-in page" }, { status: 401 });
    }
    (await cookies()).set(sessionCookieName, createSessionToken(account), {
      httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 60 * 60,
    });
    return Response.json({ user: account });
  } catch (error) {
    return Response.json({ error: (error as Error).message || "Could not sign in" }, { status: 500 });
  }
}
