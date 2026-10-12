import { getDocument } from "@/lib/repository";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const document = await getDocument(id);
    if (!document) return Response.json({ error: "Document not found" }, { status: 404 });
    if (!document.result) return Response.json({ error: "Run this PDF before downloading its report" }, { status: 409 });
    const name = document.name.replace(/\.pdf$/i, "").replace(/[^a-z0-9._-]/gi, "_");
    return new Response(document.result, { headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}-routing-report.md"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
