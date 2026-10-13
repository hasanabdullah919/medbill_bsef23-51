# Synthetic PDF demonstration cases

These are the eight distinct PDF fixtures from the verified workspace. Use normal embedded-text extraction to demonstrate the expected outcomes below. OCR mistakes can deliberately downgrade a case to Needs review; the reviewer must check the original.

| File | Scenario | Expected normal result |
|---|---|---|
| BlueCross_Dermatology_Claim_1048.pdf | Complete claim fields | Accepted |
| Aetna_Physical_Therapy_Claim_2091.pdf | Different complete physical-therapy claim | Accepted |
| UnitedHealth_Lab_Claim_Missing_Provider.pdf | Missing provider identity | Needs review |
| Cigna_Radiology_Claim_Missing_Service_Date.pdf | Missing service date | Needs review |
| Claim_Missing_Member_ID.pdf | Missing insurance/member identifier | Rejected |
| Claim_Invalid_Diagnosis_And_Procedure.pdf | Invalid code formats | Rejected |
| Zero_Value_Pharmacy_Claim.pdf | Non-positive amount | Rejected |
| Encrypted_Provider_Statement.pdf | Protected PDF without its password | Failed |

The protected file is intentionally unreadable without a password. Demonstrate its failure routing rather than trying to bypass its protection. These outcomes describe application rules, not real insurer decisions. No real patient information is included.
