import { authError, requireSession } from "@/lib/auth";
import { createValidatedClaim, listClaims } from "@/lib/claim-repository";
import { validateClaim } from "@/lib/claim-validation";
import type { ClaimFormData } from "@/types/claim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    return Response.json({ claims: await listClaims() });
  } catch (error) {
    return authError(error) || Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const body = await request.json() as ClaimFormData;
    if (!body || !["manual", "pdf"].includes(body.source)) return Response.json({ error: "Choose a valid claim source" }, { status: 400 });
    const validation = validateClaim(body);
    if (validation.errors.length) {
      return Response.json({ error: "Fix the required claim fields before saving", checks: validation.checks }, { status: 422 });
    }
    const claim = await createValidatedClaim(body, user.email);
    return Response.json({ claim }, { status: 201 });
  } catch (error) {
    return authError(error) || Response.json({ error: (error as Error).message || "Could not save claim" }, { status: 500 });
  }
}
