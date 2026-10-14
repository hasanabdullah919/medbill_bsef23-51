# Explaining MedBill D1 to your supervisor

## One minute explanation

“MedBill is our medical billing project. For D1, we implemented the first complete claim-intake slice. A biller signs in, chooses manual entry or a synthetic claim PDF, reviews the patient, insurance and service fields, runs clear validation checks, saves the draft in PostgreSQL and opens a CMS-1500-style preview. PDF extraction is only an input shortcut; the biller must review every value. This D1 does not submit a claim to an insurer or include payments, denials or financial reporting.”

## Five minute demonstration

1. Open https://medbill-steel.vercel.app and sign in as Biller with `biller@medbill.demo` and `D1Demo2026!`.
2. Choose Enter manually, select Use demo data, add the service line and open the review screen.
3. Click Validate and save draft. Explain that every check is visible and that validated means the D1 format checks passed.
4. Generate the CMS-1500-style preview and show Print or Save PDF.
5. Start another claim, upload `05_Demo_PDFs/BlueCross_Dermatology_Claim_1048.pdf`, review the extracted fields and complete the same validation and preview flow.

## Explain the architecture simply

- Next.js provides the interface and backend API on Vercel.
- Signed sessions enforce Biller and Admin access.
- Prisma stores Patient, Insurance, Claim and Document records in Supabase PostgreSQL.
- R2 privately stores uploaded source PDFs.
- PDF.js reads text PDFs and Tesseract.js handles scanned pages.
- Both manual and PDF paths produce the same editable claim, validation result and preview.

## Questions you may get

**Is this the complete MedBill product?** No. It is the D1 vertical slice from claim input to a stored, printable draft.

**Does validated mean the insurer accepted the claim?** No. It means the required D1 presence and format checks passed.

**Is the CMS-1500 preview submitted anywhere?** No. It is a printable preview for D1. Payer submission and acknowledgements remain future work.

**Why allow PDF input?** Claim data may arrive in documents. Extraction reduces retyping, but the biller reviews and corrects every value before validation.

**Did you train an AI model?** No. A measured denial-risk model with an approved dataset and held-out evaluation remains planned.

**How do you know it works?** The database migration, lint and production build passed. Five browser tests passed locally and the same five passed against the live Vercel application.

## Ask for feedback

“Does this D1 claim-intake, validation and preview slice meet the expected first deliverable? Which official claim export or submission requirement should we implement next?”
