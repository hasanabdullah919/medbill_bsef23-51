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

## Admin technical evidence workspace

Generative AI is used only in the preserved Admin-only technical PDF workspace. After the server extracts text locally, it sends that text to Gemini for a structured document summary or entity extraction. The original PDF image is not sent to Gemini. If Gemini fails, Ollama Cloud is configured as a fallback; a deterministic local text processor is the final fallback.

The AI-generated explanation does not control claim validation or document routing. Deterministic checks make those decisions, and the application records which provider produced the explanation.

## Honest viva answer

“Our D1 uses OCR and deterministic extraction in the main claim workflow. We also integrated Gemini, with Ollama Cloud as a fallback, in an Admin-only technical workspace to analyze extracted text. We have not trained or evaluated a denial-risk machine-learning model yet; that remains future work.”
