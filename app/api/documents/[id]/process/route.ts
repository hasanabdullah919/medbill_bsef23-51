import { routeDocument } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return Response.json({ document: await routeDocument(id) });
  } catch (error) {
    const message = (error as Error).message || "Document routing failed";
    return Response.json({ error: message }, { status: message === "Document not found" ? 404 : 500 });
  }
}
