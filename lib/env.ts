export const config = {
  maxPdfBytes: Number(process.env.MAX_PDF_SIZE_MB || 15) * 1024 * 1024,
  allowLocalFallback: process.env.ALLOW_LOCAL_FALLBACK !== "false",
  hasSupabase: Boolean(process.env.DATABASE_URL),
  hasR2: Boolean(
    process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET,
  ),
};

export function deploymentMode() {
  return {
    database: config.hasSupabase ? "Supabase Postgres · Prisma" : "Postgres not configured",
    storage: config.hasR2 ? "Cloudflare R2" : "R2 not configured",
    ai: process.env.GEMINI_API_KEY
      ? "Gemini"
      : process.env.OLLAMA_API_KEY
        ? "Ollama Cloud"
        : "Local structured analysis",
  };
}
