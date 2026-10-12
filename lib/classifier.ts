export type RoutingDecision = {
  classification: "accepted" | "needs_review" | "rejected";
  folder: "accepted" | "needs-review" | "rejected";
  errors: string[];
  warnings: string[];
  checks: Array<{ label: string; passed: boolean; detail: string }>;
};

function fieldValue(text: string, labels: string) {
  const match = text.match(new RegExp(`^[ \\t]*(?:${labels})[ \\t]*(?:[:#-][ \\t]*)?(?:\\r?\\n[ \\t]*)?([^\\n\\r]+)`, "im"));
  return match?.[1]?.trim() || "";
}

export function classifyClaimDocument(text: string): RoutingDecision {
  const clean = text.replace(/\s+/g, " ").trim();
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks: RoutingDecision["checks"] = [];

  const addCheck = (label: string, passed: boolean, detail: string, severity: "error" | "warning") => {
    checks.push({ label, passed, detail });
    if (!passed) (severity === "error" ? errors : warnings).push(detail);
  };

  if (!clean) {
    addCheck("Readable document text", false, "No extractable text was found; the PDF may be scanned or damaged.", "error");
  } else {
    addCheck("Readable document text", true, "Text content is readable.", "error");
  }

  const memberValue = fieldValue(text, "member[ \\t]+id|policy[ \\t]+id|subscriber[ \\t]+id|insurance[ \\t]+id|member[ \\t]+number|policy[ \\t]+number");
  const memberId = /[a-z0-9-]*\d[a-z0-9-]*/i.test(memberValue) && !/missing|not supplied|pending|none|unknown/i.test(memberValue);
  addCheck("Insurance/member ID", memberId, memberId ? "Insurance or member ID detected." : "Insurance member or policy ID is missing.", "error");

  const diagnosis = /\b[A-TV-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?\b/i.test(fieldValue(text, "diagnosis[ \\t]+code|diagnosis|icd(?:-10)?(?:[ \\t]+code)?"));
  addCheck("Diagnosis code", diagnosis, diagnosis ? "Recognizable ICD-10-style diagnosis code detected." : "No recognizable ICD-10 diagnosis code was detected.", "error");

  const procedure = /\b(?:[0-9]{5}|[A-Z][0-9]{4})\b/.test(fieldValue(text, "procedure[ \\t]+code|procedure|cpt(?:[ \\t]+code)?|hcpcs(?:[ \\t]+code)?"));
  addCheck("Procedure code", procedure, procedure ? "Five-character procedure code detected." : "No five-character procedure code was detected.", "error");

  const amount = /(?:\$|USD|PKR|amount|charge|total)\s*[:#-]?\s*(?:\$|USD|PKR)?\s*[1-9][0-9,]*(?:\.\d{1,2})?/i.test(clean);
  addCheck("Positive claim amount", amount, amount ? "Positive claim amount detected." : "No positive claim amount was detected.", "error");

  const serviceDate = /(?:service date|date of service|dos)\s*[:#-]?\s*(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i.test(clean);
  addCheck("Service date", serviceDate, serviceDate ? "Service date detected." : "Service date is missing or could not be read.", "warning");

  const providerValue = fieldValue(text, "billing[ \\t]+provider|provider|physician|npi");
  const provider = providerValue.length >= 3 && !/^(missing|not supplied|pending|none|unknown|n\/a)\b/i.test(providerValue);
  addCheck("Provider identity", provider, provider ? "Provider information detected." : "Provider identity is missing or unclear.", "warning");

  if (errors.length) return { classification: "rejected", folder: "rejected", errors, warnings, checks };
  if (warnings.length) return { classification: "needs_review", folder: "needs-review", errors, warnings, checks };
  return { classification: "accepted", folder: "accepted", errors, warnings, checks };
}

export function classifyExtractedDocument(extraction: { text: string; ocrPages: number; averageConfidence: number | null }): RoutingDecision {
  const decision = classifyClaimDocument(extraction.text);
  if (extraction.ocrPages > 0 && (decision.errors.length > 0 || (extraction.averageConfidence !== null && extraction.averageConfidence < 0.9))) {
    decision.classification = "needs_review";
    decision.folder = "needs-review";
    decision.warnings.push("OCR may misread claim codes or values. Confirm the failed checks against the original PDF before accepting or rejecting it.");
  }
  return decision;
}
