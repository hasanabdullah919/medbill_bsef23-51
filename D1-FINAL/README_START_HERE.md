# MedBill D1 final submission package

Live website: https://medbill-steel.vercel.app/

GitHub: https://github.com/hasanabdullah919/medbill_bsef23-51

Group BSEF23-51: Hasan Abdullah (BSEF23M552) and Irfan Saleem (BSEF23M553).
Supervisor: Mr Umair Babar. Prepared 13 October 2026.

## What to submit

`01_Submission/MedBill_D1_Report.pdf` is the printable D1 report. The matching `.docx` is editable. It follows the university Agile template's ten sections and describes the current Next.js application, not the older Django prototype.

Include the source archive and supporting evidence if your supervisor or submission portal asks for them. Check the portal's naming, signatures and upload rules before submitting; these local materials do not establish university approval.

If you edit the Word report, update its table of contents and recheck pagination before exporting. The current report has one cover plus nine numbered pages; its footer total is fixed for this frozen version.

## What each folder contains

- `01_Submission`: final report in PDF and Word.
- `02_Supervisor_Guide`: short project explanation, five-minute demo and viva answers.
- `03_Design_and_Evidence`: architecture, actual data model, current screenshot and production test record.
- `04_D1_Source`: frozen Next.js source archive and reproducibility notes.
- `05_Demo_PDFs`: eight differently named synthetic documents with different claim scenarios.
- `06_Reference_Only`: original proposal and university template. Do not submit these as completed D1 reports.

## What this D1 version demonstrates

Upload/select PDF → read/extract or OCR → check fields → text-only AI extraction → move original into an output category → inspect/download. Both complete runs and controlled debug stages work. PostgreSQL persists metadata/debug state; R2 holds PDFs and backups. Reset creates a backup, restores all PDFs to input and clears output.

This is a frozen document-processing increment of the broader medical-billing proposal. Patient CRUD, accountable Admin/Biller login, CMS-1500 creation, payment posting, financial reports and a trained denial-risk model are not implemented in this version. Confirm the narrowed D1 scope and changed technology stack with your supervisor.

## Important limits

The public website is login-free and must contain only synthetic demo data. Do not upload private patient records. OCR itself consumes no AI API calls; text analysis consumes provider quota. Accepted means technical checks passed, not insurer acceptance. Current upload/extraction limits are 4 MB and 50 pages.

Read `02_Supervisor_Guide/SUPERVISOR_EXPLANATION.md` first to prepare your explanation.
