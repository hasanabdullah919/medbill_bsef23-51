import re
from decimal import Decimal


def validate_claim(patient, diagnosis_code, procedure_code, amount):
    messages = []
    if not patient.member_id.strip():
        messages.append("Insurance member ID is required before submission.")
    if not re.fullmatch(r"[A-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?", diagnosis_code.upper()):
        messages.append("Diagnosis code must use a recognizable ICD-10 format, for example J06.9.")
    if not re.fullmatch(r"[A-Z0-9]{5}", procedure_code.upper()):
        messages.append("Procedure code must contain exactly five letters or digits.")
    if Decimal(str(amount)) <= 0:
        messages.append("Claim amount must be greater than zero.")
    return messages
