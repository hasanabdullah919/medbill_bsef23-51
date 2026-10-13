# Production verification

Verified on 14 October 2026 (Asia/Karachi).

- Application: https://medbill-steel.vercel.app
- Runtime source commit: `de3e418`
- Vercel production deployment: `dpl_JD4EnQXRBKWBn3kcnQY5UvmnUsMa`
- Hosting: Vercel Hobby with Next.js frontend and Node.js Route Handlers.
- Database: Supabase PostgreSQL through Prisma.
- Files: private Cloudflare R2 bucket accessed only through authenticated backend endpoints.

## Passed against production

1. The public login page loaded without Vercel account access.
2. Biller sign-in opened the scoped D1 workspace.
3. Manual entry created a patient, insurance record and validated claim in PostgreSQL.
4. The saved manual claim produced the CMS-1500-style preview.
5. A synthetic claim PDF uploaded to R2, extracted into editable fields and completed the same validation, persistence and preview flow.
6. Invalid credentials were refused.
7. The Admin role opened the preserved technical evidence workspace.
8. Unauthenticated access to the older document API returned HTTP 401.
9. The Prisma claim-workflow migration was applied to production PostgreSQL.
10. `npm run lint`, `npm run build` and all five local Playwright tests passed.
11. All five Playwright tests passed again against the production URL.
12. The Vercel production build completed and the alias resolved to the new deployment.

## D1 boundary

- The application creates, checks and stores synthetic draft claims; it does not submit them to a payer.
- A validated status means the D1 required-field and format checks passed. It is not insurer acceptance or reimbursement approval.
- The CMS-1500 screen is a printable D1 preview, not a certified clearinghouse transaction.
- Eligibility, code-set lookup, payment posting, denial management, financial reporting and a measured denial-risk model remain later work.
- The public deployment must contain synthetic demonstration data only.

Re-run the live browser suite with `PLAYWRIGHT_BASE_URL=https://medbill-steel.vercel.app npm test`.
