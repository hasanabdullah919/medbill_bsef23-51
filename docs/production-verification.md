# Production verification

Verified on 13 October 2026 (Asia/Karachi).

- Application: https://medbill-steel.vercel.app
- Runtime source commit: `f36bdcc`
- Vercel production deployment: `dpl_EScs8o7WYuHWQRgSo3JghSJRHqQx`
- Hosting: Vercel Hobby; Next.js frontend and Node.js Route Handlers in one project.
- Database: free Supabase PostgreSQL through Prisma; no other Supabase services.
- Files: private `medbill-documents` R2 bucket, accessed through backend endpoints.

## Passed against production

1. Health endpoint returned HTTP 200 with real PostgreSQL and R2 checks passing.
2. Existing document records persisted and appeared on the dashboard.
3. Invalid PDF upload, empty selection and invalid reset confirmation were refused.
4. A synthetic PDF uploaded to R2 input, completed the selected-file flow using Gemini, and moved to output.
5. Downloaded PDF matched the uploaded bytes exactly; the server-backed Markdown report matched the persisted report.
6. Unselected PDFs retained their storage keys.
7. All five durable debug checkpoints worked across separate HTTP requests.
8. R2 backup creation succeeded.
9. Forced OCR ran on Vercel using bundled Tesseract language data and PDF fonts: one page, 94% reported OCR confidence, zero AI API calls. Confidence is an engine estimate, not a guarantee of correctness.
10. Reset backed up 11 PDFs, returned every PDF to input and cleared output/report metadata. Direct R2 listing confirmed 11 backup PDFs and zero output PDFs.
11. Three temporary smoke-test uploads were byte-verified and removed from active storage/metadata; backup copies and the original eight demo PDFs were preserved.
12. Browser Select all/Clear/custom selection worked; a two-file debug batch completed every stage and routed both files to Accepted.
13. Browser complete-flow batch routed one PDF to Needs review, one to Rejected, and a protected PDF to Failed. Three unselected PDFs stayed in input.
14. Browser Inspect opened details and the report download produced a real downloaded file.
15. All eight distinct demo PDFs remained downloadable. Direct R2 folder counts matched PostgreSQL: input 3, accepted 2, needs-review 1, rejected 1, failed 1.
16. Gemini handled production extraction; the Ollama Cloud key separately returned HTTP 200 for a minimal text request.
17. TypeScript production build and lint passed. Production dependency audit reported zero vulnerabilities; development-tool dependencies still have five high advisories.

## Constraints

- Public login-free demo: never upload private medical/patient data.
- 4 MB upload cap and 50-page extraction cap; selected batches use one server request per PDF.
- OCR runs inside Node.js without Python or remote vision requests. AI receives extracted text only and still consumes provider quota.
- Deterministic checks route documents; they are not insurer adjudication, diagnosis, or medical advice.
- Deployment is through Vercel CLI. GitHub automatic deployment integration has not been enabled.

Re-run API checks with `TEST_BASE_URL=https://medbill-steel.vercel.app node tests/production-smoke.mjs`. This creates a synthetic test upload and a backup, and routes a pending file. The browser test suite additionally resets its target workspace; use it only where reset is intended.
