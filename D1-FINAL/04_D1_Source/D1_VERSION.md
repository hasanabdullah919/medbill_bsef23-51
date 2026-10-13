# Frozen MedBill D1 source

Version: MedBill D1 Next.js snapshot, 13 October 2026.

Repository source snapshot: `3961a53` from https://github.com/hasanabdullah919/medbill_bsef23-51

Production runtime commit: `f36bdcc`. The later commit adds verification documentation only.

`MedBill_D1_Source.zip` contains the active Next.js frontend/backend, Prisma schema and migrations, OCR/AI/R2 services, configuration examples, tests and setup documentation. It excludes the historical Django D1 folder, Git history, credentials, dependencies and generated build output.

## Run the frozen version

Extract the archive, use Node 24, run `npm ci`, copy `.env.example` to `.env.local`, and fill your own PostgreSQL/R2/AI environment variables. Run `npm run db:migrate` and `npm run dev`. See the included README for deployment and tests. The source is complete, but services require your own credentials; no secrets are included in this package.

Live access does not require installing the source: https://medbill-steel.vercel.app/

Source ZIP integrity is recorded in the package checksum file after final packaging. This package is a reproducible snapshot, not a newly published GitHub tag or a second deployment.
