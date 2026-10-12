# MedBill

One Next.js application for the PDF input → extraction/OCR → validation → AI → output workflow.

The frontend uses the App Router and React. All backend endpoints are Next.js Route Handlers running on Node.js. Prisma connects directly to Supabase PostgreSQL; the application uses no Supabase Auth, Storage, client SDK, Data API, Edge Functions or Realtime. PDFs and timestamped backups live in a private Cloudflare R2 bucket.

OCR runs inside Node.js using PDF.js/pdf-parse and Tesseract.js with bundled English language data. Text-based pages skip OCR. Gemini is primary, Ollama Cloud is the fallback, and both receive extracted text only. Deterministic claim checks decide the output folder.

## Run

```bash
cp .env.example .env.local
# Fill the server-side PostgreSQL, R2 and optional AI values.
npm ci
npm run db:migrate
npm run dev
```

Use Node 24. The app opens at http://localhost:3000. Supabase's transaction pooler is the runtime `DATABASE_URL`; its session pooler is `DIRECT_URL` for migrations. No local-file database or fake cloud-storage fallback is used.

## Deploy to Vercel

Import this repository with the root directory left at the repository root. Choose Next.js and Node 24, copy `.env.example` values into Vercel's server-side environment settings, run Prisma migrations before first use, and deploy. No separate frontend/backend services or Python runtime are required.

Uploads are capped at 4 MB to fit Vercel's function request limit. Selected batches run one file per server request to avoid a single long batch exceeding Vercel's function duration. Debug session data is persisted in PostgreSQL so steps can run across different serverless instances. R2 holds `input/`, `output/accepted/`, `output/needs-review/`, `output/rejected/`, `output/failed/` and `backups/<timestamp>/`.

## Verify

```bash
npm run lint
npm run build
TEST_BASE_URL=https://your-production-domain.vercel.app node tests/production-smoke.mjs
PLAYWRIGHT_BASE_URL=https://your-production-domain.vercel.app npm test
```

The API smoke suite verifies the deployed database/storage, upload guards, a selected-file run, exact PDF downloads, unchanged unselected files, all durable debug checkpoints and backups without resetting the workspace. The browser end-to-end suite additionally tests workspace reset. Reset backs up the existing run, restores every PDF to input and clears output. Run the browser suite only against a workspace you intend to reset.

`GET /api/health` checks actual PostgreSQL and R2 connectivity. `GET /api/documents` reads persisted metadata. Other endpoints cover upload, selected-batch scan, debug steps, backup, reset and private PDF access.

## Repository contents

- `app/`, `components/`: Next.js pages and server endpoints.
- `lib/`, `types/`: Prisma repository, R2 storage, OCR, AI and workflow logic.
- `prisma/`: PostgreSQL schema and versioned migrations.
- `tests/`: browser acceptance tests with synthetic fixtures.
- `D1-FINAL/`: historical D1 documents and evidence; the earlier Vite/Django prototype remains recoverable in Git history at commit `0991162`.

Environment files, API keys, generated Prisma code, dependencies and build artifacts are excluded from Git. The application is login-free as requested.
