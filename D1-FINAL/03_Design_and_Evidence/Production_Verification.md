# Production verification

Verified on 14 October 2026 against https://medbill-steel.vercel.app.

- Runtime source commit: `de3e418`
- Vercel deployment: `dpl_JD4EnQXRBKWBn3kcnQY5UvmnUsMa`
- Database migration: applied to Supabase PostgreSQL
- Private PDF storage: Cloudflare R2

## Verified results

1. Biller and Admin demo sign-in worked; invalid credentials were refused.
2. Manual patient, insurance and claim entry saved a validated draft in PostgreSQL.
3. PDF upload and extraction populated the same editable claim form.
4. Human review, deterministic validation and CMS-1500-style preview worked for both input paths.
5. Recent claim history loaded from PostgreSQL.
6. Admin-only technical evidence opened correctly.
7. Older document APIs refused unauthenticated access with HTTP 401.
8. Lint and production build passed.
9. All five Playwright tests passed locally and all five passed again on production.

This evidence verifies the D1 claim-intake slice. It does not verify payer submission, eligibility, payments, denials, financial reconciliation or a trained denial-risk model.
