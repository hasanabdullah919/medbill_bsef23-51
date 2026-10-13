# Frozen MedBill D1 source

Version: MedBill D1 claim workflow, 14 October 2026.

Repository: https://github.com/hasanabdullah919/medbill_bsef23-51

Production runtime commit: `de3e418`

Production deployment: `dpl_JD4EnQXRBKWBn3kcnQY5UvmnUsMa`

`MedBill_D1_Source.zip` contains the deployed Next.js source, Prisma schema and migrations, authentication, manual and PDF claim workflows, validation, CMS-1500-style preview, tests and setup documentation. It excludes Git history, credentials, dependencies, generated build output and the submission package itself.

## Run the frozen version

Extract the archive, use Node 24, run `npm ci`, copy `.env.example` to `.env.local`, fill the PostgreSQL, R2 and session values, run `npm run db:migrate`, then run `npm run dev`.

The live version is available at https://medbill-steel.vercel.app. Use synthetic data only.
