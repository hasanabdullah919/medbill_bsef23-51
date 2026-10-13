# MedBill D1

MedBill D1 is the first-deliverable claim intake and validation prototype. It demonstrates the proposal's core path without presenting the future full product as complete:

`Sign in → choose PDF or manual entry → review/edit claim → deterministic validation → save → CMS-1500-style preview`

Live application: [medbill-steel.vercel.app](https://medbill-steel.vercel.app). See [production verification](docs/production-verification.md) for deployed checks.

## D1 scope

- Demo biller and admin sign-in with an eight-hour signed session.
- Manual entry for patient, insurance and claim details.
- PDF upload, embedded-text/OCR extraction and mandatory human review.
- Required-field, code-format, date and amount validation with clear pass/fail results.
- PostgreSQL persistence for patients, insurance records, claims and source documents.
- CMS-1500-style printable claim preview.
- Recent-claim history and an admin-only technical evidence workspace at `/technical`.
- Explicit labels for later work such as payer submission, ERA/EOB, payment posting and analytics.

PDF extraction is an input convenience inside the proposed claim workflow. It does not auto-submit a claim and does not replace the user's review.

## Demo accounts

- Biller: `biller@medbill.demo`
- Admin: `admin@medbill.demo`
- Password: `D1Demo2026!` unless `DEMO_LOGIN_PASSWORD` is configured.

Use synthetic demonstration data only. Do not upload real patient information to the public demo.

## Architecture

The application uses Next.js App Router and React. Backend endpoints are Next.js Route Handlers running on Node.js. Prisma connects to Supabase PostgreSQL, and PDFs live in a private Cloudflare R2 bucket.

OCR runs in Node.js with PDF.js/pdf-parse and Tesseract.js. Text-based PDFs skip OCR. The D1 claim validator is deterministic; the older Gemini/Ollama document-routing experiment is retained only in the admin technical workspace.

## Run locally

```bash
cp .env.example .env.local
# Fill the PostgreSQL, R2 and session values.
npm ci
npm run db:migrate
npm run dev
```

Use Node 24 and open [http://localhost:3000](http://localhost:3000). Supabase's transaction pooler is the runtime `DATABASE_URL`; its session pooler is `DIRECT_URL` for migrations.

## Deploy to Vercel

Import the repository at its root, select Next.js and Node 24, copy the server-side values from `.env.example` into Vercel, apply Prisma migrations, and deploy. Set a long random `SESSION_SECRET` in production.

Uploads are capped at 4 MB to fit Vercel's function request limit. R2 stores private source PDFs and technical-workspace outputs. All claim and document APIs except `/api/health` require a valid session.

## Verify

```bash
npm run lint
npm run build
npm test
```

The browser suite covers authentication, manual claim validation and persistence, PDF extraction into the same editable workflow, CMS preview generation, invalid login and admin-only access.

`GET /api/health` checks PostgreSQL and R2 connectivity. Authenticated claim endpoints cover claim listing/creation and PDF extraction. The older document routing endpoints remain available only for signed-in technical evaluation.

## Repository contents

- `app/`, `components/`: pages, D1 workflow UI and server endpoints.
- `lib/`, `types/`: authentication, extraction, validation, repositories, storage and technical pipeline.
- `prisma/`: PostgreSQL schema and versioned migrations.
- `tests/`: browser acceptance tests with synthetic fixtures.
- `D1-FINAL/`: supporting submission material and synthetic demonstration files.

Environment files, secrets, generated Prisma code, dependencies and build artifacts are excluded from Git.
