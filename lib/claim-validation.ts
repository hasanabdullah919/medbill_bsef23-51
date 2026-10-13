import type { ClaimFormData, ClaimValidationCheck } from "@/types/claim";

export function validateClaim(value: ClaimFormData) {
  const checks: ClaimValidationCheck[] = [];
  const add = (key: string, label: string, passed: boolean, detail: string, severity: "error" | "warning" = "error") => {
    checks.push({ key, label, passed, detail, severity });
  };

  add("patient", "Patient name", Boolean(value.patientFirstName.trim() && value.patientLastName.trim()), "Patient first and last name are required.");
  add("dob", "Date of birth", Boolean(value.dateOfBirth), "Patient date of birth is required.");
  add("insurance", "Insurance provider", Boolean(value.insuranceProvider.trim()), "Insurance provider is required.");
  add("member", "Member ID", /[a-z0-9]*\d[a-z0-9-]*/i.test(value.memberId.trim()), "A valid insurance member or policy ID is required.");
  add("diagnosis", "ICD-10 diagnosis", /^[A-TV-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?$/i.test(value.diagnosisCode.trim()), "Enter a recognizable ICD-10 code, for example M54.50.");
  add("procedure", "CPT or HCPCS procedure", /^(?:[0-9]{5}|[A-Z][0-9]{4})$/i.test(value.procedureCode.trim()), "Enter a five-character CPT or HCPCS code.");
  add("amount", "Positive charge amount", Number(value.chargeAmount) > 0, "Charge amount must be greater than zero.");
  add("serviceDate", "Service date", Boolean(value.serviceDate), "Service date is required.");
  add("provider", "Billing provider", value.providerName.trim().length >= 3, "Billing provider name is required.");
  add("npi", "Provider NPI", !value.providerNpi || /^\d{10}$/.test(value.providerNpi.trim()), "Provider NPI should contain 10 digits.", "warning");
  add("place", "Place of service", !value.placeOfService || /^\d{2}$/.test(value.placeOfService.trim()), "Place of service should contain two digits.", "warning");

  const failed = checks.filter((check) => !check.passed);
  const errors = failed.filter((check) => check.severity === "error");
  return {
    checks,
    errors,
    warnings: failed.filter((check) => check.severity === "warning"),
    status: errors.length ? "needs_review" as const : "validated" as const,
  };
}
