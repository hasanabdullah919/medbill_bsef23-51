import { runDebugStep, startDebugSession } from "@/lib/debug-pipeline";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "start") {
      if (!Array.isArray(body.ids) || !body.ids.length) return Response.json({ error: "Select at least one input file." }, { status: 400 });
      return Response.json(await startDebugSession(body.ids.map(String)));
    }
    if (!body.sessionId || !["read", "ocr", "validate", "analyze", "route"].includes(body.step)) return Response.json({ error: "Invalid debug step." }, { status: 400 });
    return Response.json(await runDebugStep(String(body.sessionId), body.step, body.forceOcr === true));
  } catch (error) {
    return Response.json({ error: (error as Error).message || "Debug step failed." }, { status: 500 });
  }
}
