# How AI is used in MedBill D1

## Main supervisor-facing D1 flow

The main claim workflow does not depend on generative AI.

- PDF.js reads embedded PDF text.
- Tesseract.js performs OCR when a scanned page has little readable text.
- Label-based extraction maps text into patient, insurance, provider, date, diagnosis, procedure and charge fields.
- The biller reviews and corrects every extracted value.
- Deterministic rules check required fields and recognizable formats.
- PostgreSQL stores the validated draft claim.

OCR is text recognition, not a trained MedBill denial model. The current D1 does not predict denials, approve claims or submit anything to a payer.

## Honest viva answer

“Our D1 claim workflow uses PDF text extraction, OCR and deterministic validation. The biller reviews every extracted value before saving. We have not trained or evaluated a denial-risk machine-learning model yet; that remains future work.”
