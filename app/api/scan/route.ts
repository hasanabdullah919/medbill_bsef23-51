import { authError, requireSession } from "@/lib/auth";
import { routeDocument } from "@/lib/pipeline";
import { listDocuments } from "@/lib/repository";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    await requireSession();
  } catch (error) {
    return authError(error) || Response.json({ error: (error as Error).message }, { status: 500 });
  }
  const documents = await listDocuments();
  const allQueued = documents.filter((document) =>
    document.status === "uploaded" || !document.classification || document.classification === "pending",
  );
  let requestedIds: string[] | null = null;
  try {
    const body = await request.json();
    if (body?.ids !== undefined) {
      if (!Array.isArray(body.ids) || body.ids.some((id: unknown) => typeof id !== "string")) {
        return Response.json({ error: "ids must be an array of document IDs" }, { status: 400 });
      }
      const normalizedIds = [...new Set(body.ids as string[])];
      if (!normalizedIds.length) return Response.json({ error: "Select at least one input file" }, { status: 400 });
      requestedIds = normalizedIds;
    }
  } catch {
    // An empty request body means scan the complete input folder.
  }
  const requestedSet = requestedIds ? new Set(requestedIds) : null;
  const queued = requestedSet ? allQueued.filter((document) => requestedSet.has(document.id)) : allQueued;
  if (requestedSet && queued.length !== requestedSet.size) {
    return Response.json({ error: "One or more selected files are no longer waiting in input/" }, { status: 409 });
  }
  if (process.env.VERCEL && queued.length > 1) {
    return Response.json({ error: "Process one file per request on Vercel. The dashboard automatically runs selected files as a batch." }, { status: 400 });
  }
  async function run(emit?: (event: unknown) => void) {
    const processed = [];
    const failures = [];
    for (const [index, document] of queued.entries()) {
      try {
        processed.push(await routeDocument(document.id, (step) => emit?.({ type: "progress", step, file: document.name, current: index + 1, total: queued.length })));
        emit?.({ type: "file-complete", file: document.name, current: index + 1, total: queued.length });
      } catch (error) { failures.push({ id: document.id, error: (error as Error).message }); }
    }
    return { processed, failures, total: queued.length };
  }
  if (request.headers.get("accept") === "application/x-ndjson") {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        try { emit({ type: "done", ...await run(emit) }); }
        catch (error) { emit({ type: "error", error: (error as Error).message }); }
        finally { controller.close(); }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" } });
  }
  return Response.json(await run());
}
