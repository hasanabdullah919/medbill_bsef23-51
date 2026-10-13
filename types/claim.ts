export type UserRole = "admin" | "biller";

export type SessionUser = {
  email: string;
  name: string;
  role: UserRole;
};

export type ClaimSource = "manual" | "pdf";

export type ClaimFormData = {
  source: ClaimSource;
  sourceDocumentId?: string | null;
  patientFirstName: string;
  patientLastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  insuranceProvider: string;
  memberId: string;
  groupNumber: string;
  providerName: string;
  providerNpi: string;
  serviceDate: string;
  diagnosisCode: string;
  procedureCode: string;
  placeOfService: string;
  chargeAmount: string;
  clinicalNote: string;
};

export type ClaimValidationCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
  severity: "error" | "warning";
};

export type ClaimRecord = ClaimFormData & {
  id: string;
  claimNumber: string;
  status: "validated" | "needs_review";
  validationReasons: string[];
  checks: ClaimValidationCheck[];
  createdBy: string;
  validatedAt: string | null;
  createdAt: string;
};

export type ExtractedClaim = Partial<ClaimFormData> & {
  source: "pdf";
  sourceDocumentId: string;
  fileName: string;
  extraction: {
    source: "embedded" | "ocr" | "mixed";
    pages: number;
    ocrPages: number;
    averageConfidence: number | null;
  };
};
