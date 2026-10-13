# Explaining MedBill D1 to your supervisor

## One minute explanation

“MedBill is our medical billing project. For this D1 increment, we have implemented the document-verification workflow. A reviewer uploads a PDF or selects an existing file, runs the complete flow or controls each stage in debug mode, and sees where the original document ends up. The backend extracts existing text or performs OCR, checks claim fields, sends only text to AI, and routes the PDF into Accepted, Needs review, Rejected or Failed. We can inspect the report and download the original document. PostgreSQL stores metadata, while R2 stores PDFs and backups. The wider patient-to-payment billing modules remain future work, and we want to confirm that this increment is suitable for D1.”

## Five minute demonstration

1. Open https://medbill-steel.vercel.app/. Explain that this is a public synthetic-data demo with no login.
2. Show the file picker inside Input. Select a custom batch; explain that unselected files stay untouched. Use the supplied `05_Demo_PDFs` files if you need to upload an example.
3. Choose Complete flow and click the large Run button. Point to Read PDF, Get text, Validate fields, AI extraction and Move to output as progress changes.
4. Inspect a result. Explain its actual folder and reason, expand the report, open the PDF and download the Markdown report.
5. Select a pending PDF and choose Debug step-by-step. Run Read PDF and Get text, inspect the returned data, then continue through validation, AI and routing.
6. Explain Workspace tools. Backup preserves a snapshot. Reset first backs up the run, clears output and returns all PDFs to input. It affects the shared live workspace, so do not invoke it casually during someone else's run.

For a repeatable demonstration, prepare a backup and reset before the meeting only if you intend to restore the shared workspace. The source archive is the frozen D1 version; the live website can change later.

## Explain the architecture simply

- Next.js provides the interface and backend API in one application hosted on Vercel.
- Prisma is the ORM that reads and writes PostgreSQL records. Supabase supplies PostgreSQL only.
- R2 stores original PDF files in input, output categories and timestamped backups.
- PDF text extraction and Tesseract OCR run in Node.js. OCR does not call Gemini or Ollama.
- Gemini receives extracted text for structured explanation; Ollama Cloud is the fallback. Deterministic rules, not an AI guess, control the normal routing decision.

## Questions you may get

**Is Accepted an approved insurance claim?** No. It means this prototype's technical checks passed. We do not contact insurers or validate reimbursement eligibility.

**What do the rules check?** Readable text, member/policy ID, diagnosis-code format, procedure-code format, a positive amount, service date and provider information. They are presence/format checks, not authoritative clinical or code-set validation.

**What happens if OCR is uncertain?** Low-confidence OCR or failed OCR-derived checks require human review. Reported confidence is an engine estimate, not an accuracy score.

**Did you train your own AI model?** No. Cloud text extraction works; a trained denial-risk model with a dataset, baseline and held-out evaluation remains planned.

**How do you know it works?** We tested the real Vercel endpoints, PostgreSQL and R2. Production tests covered upload, selection, routing, downloads, all debug stages and backup/reset. Forced OCR used zero AI calls. Physical R2 objects matched dashboard categories.

**Why is there no login?** This increment was requested as a login-free demo. Authentication, roles and audit controls are required before using private patient data.

**Is the whole original proposal complete?** No. Patients, charges, CMS-1500 creation, payment/denial posting and financial reports still need implementation. Show the report's scope/backlog rather than presenting them as done.

## Ask for feedback

“Does this PDF-verification slice meet your D1 expectation? Can we confirm the Next.js/PostgreSQL stack and agree on the next billing module and the evaluated AI objective?”
