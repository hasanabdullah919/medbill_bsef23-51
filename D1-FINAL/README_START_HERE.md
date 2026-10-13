# MedBill D1 final submission package

Live website: https://medbill-steel.vercel.app/

GitHub: https://github.com/hasanabdullah919/medbill_bsef23-51

Group BSEF23-51: Hasan Abdullah (BSEF23M552) and Irfan Saleem (BSEF23M553).

Supervisor: Mr Umair Babar. Updated 14 October 2026.

## What to submit

`01_Submission/MedBill_D1_Report.pdf` is the printable report. The matching Word file is editable and follows the university Agile D1 section structure.

Use `02_Supervisor_Guide/SUPERVISOR_EXPLANATION.md` to prepare the demonstration. Include the source archive and evidence only when requested by the supervisor or submission portal.

## What this D1 demonstrates

Sign in → choose manual entry or PDF → review patient, insurance and service fields → run explainable validation → save the draft → open a CMS-1500-style preview.

Both input paths use the same structured claim workflow. PostgreSQL stores patients, policies and claims. R2 stores private source PDFs. The Admin role can open the older technical PDF workspace as supporting evidence.

## What is not claimed

This D1 does not submit claims to payers, verify eligibility, post payments, manage denials, reconcile financial reports or present a trained denial-risk model. A validated claim passed the D1 format and presence checks only.

## Folder guide

- `01_Submission`: final report in PDF and Word.
- `02_Supervisor_Guide`: short explanation, demo steps and viva answers.
- `03_Design_and_Evidence`: live D1 screenshot and production test record; older diagrams are retained as technical history.
- `04_D1_Source`: frozen deployed source archive and version details.
- `05_Demo_PDFs`: synthetic files for the PDF input demonstration.
- `06_Reference_Only`: the original proposal and university template.

Use only synthetic data on the public deployment.
