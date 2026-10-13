import type { ClaimFormData } from "@/types/claim";

function field(text: string, labels: string) {
  return text.match(new RegExp(`^[ \\t]*(?:${labels})[ \\t]*(?:[:#-][ \\t]*)?(?:\\r?\\n[ \\t]*)?([^\\n\\r]+)`, "im"))?.[1]?.trim() || "";
}

function isoDate(value: string) {
  const match = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!match) return "";
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

function splitName(value: string) {
  const parts = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  return { patientFirstName: parts.shift() || "", patientLastName: parts.join(" ") };
}

export function extractClaimFields(text: string): Partial<ClaimFormData> {
  const patient = splitName(field(text, "patient(?:[ \\t]+name)?"));
  const providerRaw = field(text, "billing[ \\t]+provider|provider|physician");
  const npi = providerRaw.match(/\b(?:NPI\s*)?(\d{10})\b/i)?.[1] || field(text, "npi").match(/\d{10}/)?.[0] || "";
  const providerName = providerRaw.replace(/\bNPI\s*\d{10}\s*[-–:]?\s*/i, "").trim();
  const amountRaw = field(text, "total[ \\t]+amount|charge[ \\t]+amount|amount|charge|total");
  const amount = amountRaw.replace(/,/g, "").match(/\d+(?:\.\d{1,2})?/)?.[0] || "";
  const headingInsurer = text.match(/^([^\n|]{2,50})\s*\|/m)?.[1]?.trim() || "";

  return {
    ...patient,
    dateOfBirth: isoDate(field(text, "date[ \\t]+of[ \\t]+birth|dob")),
    insuranceProvider: field(text, "insurance[ \\t]+provider|payer|insurer") || headingInsurer,
    memberId: field(text, "member[ \\t]+id|policy[ \\t]+id|subscriber[ \\t]+id|insurance[ \\t]+id"),
    groupNumber: field(text, "group[ \\t]+number|group[ \\t]+id"),
    providerName,
    providerNpi: npi,
    serviceDate: isoDate(field(text, "service[ \\t]+date|date[ \\t]+of[ \\t]+service|dos")),
    diagnosisCode: field(text, "diagnosis[ \\t]+code|diagnosis|icd(?:-10)?(?:[ \\t]+code)?").split(/\s/)[0] || "",
    procedureCode: field(text, "procedure[ \\t]+code|procedure|cpt(?:[ \\t]+code)?|hcpcs(?:[ \\t]+code)?").split(/\s/)[0] || "",
    placeOfService: field(text, "place[ \\t]+of[ \\t]+service|pos").match(/\d{2}/)?.[0] || "",
    chargeAmount: amount,
    clinicalNote: "Imported from claim PDF. Confirm every extracted value against the original document.",
  };
}
