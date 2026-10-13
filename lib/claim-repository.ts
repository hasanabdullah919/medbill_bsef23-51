import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { validateClaim } from "@/lib/claim-validation";
import type { ClaimFormData, ClaimRecord } from "@/types/claim";
import type { Claim, Insurance, Patient } from "@/generated/prisma/client";

function dateValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function claimRecord(row: Claim & { patient: Patient; insurance: Insurance }): ClaimRecord {
  const form: ClaimFormData = {
    source: row.source as ClaimFormData["source"],
    sourceDocumentId: row.sourceDocumentId,
    patientFirstName: row.patient.firstName,
    patientLastName: row.patient.lastName,
    dateOfBirth: dateValue(row.patient.dateOfBirth),
    gender: row.patient.gender || "",
    address: row.patient.address || "",
    insuranceProvider: row.insurance.providerName,
    memberId: row.insurance.memberId,
    groupNumber: row.insurance.groupNumber || "",
    providerName: row.providerName,
    providerNpi: row.providerNpi || "",
    serviceDate: dateValue(row.serviceDate),
    diagnosisCode: row.diagnosisCode,
    procedureCode: row.procedureCode,
    placeOfService: row.placeOfService || "",
    chargeAmount: row.chargeAmount.toString(),
    clinicalNote: row.clinicalNote || "",
  };
  return {
    ...form,
    id: row.id,
    claimNumber: row.claimNumber,
    status: row.status as ClaimRecord["status"],
    validationReasons: row.validationReasons,
    checks: validateClaim(form).checks,
    createdBy: row.createdBy,
    validatedAt: row.validatedAt?.toISOString() || null,
    createdAt: row.createdAt.toISOString(),
  };
}

const include = { patient: true, insurance: true } as const;

export async function listClaims() {
  const rows = await getPrisma().claim.findMany({ include, orderBy: { createdAt: "desc" }, take: 25 });
  return rows.map(claimRecord);
}

export async function createValidatedClaim(value: ClaimFormData, createdBy: string) {
  const validation = validateClaim(value);
  const reasons = [...validation.errors, ...validation.warnings].map((item) => item.detail);
  const claimNumber = `D1-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
  const row = await getPrisma().$transaction(async (tx) => {
    const patient = await tx.patient.create({ data: {
      firstName: value.patientFirstName.trim(), lastName: value.patientLastName.trim(),
      dateOfBirth: value.dateOfBirth ? new Date(`${value.dateOfBirth}T00:00:00.000Z`) : null,
      gender: value.gender.trim() || null, address: value.address.trim() || null,
    } });
    const insurance = await tx.insurance.create({ data: {
      patientId: patient.id, providerName: value.insuranceProvider.trim(), memberId: value.memberId.trim(), groupNumber: value.groupNumber.trim() || null,
    } });
    return tx.claim.create({ data: {
      claimNumber, patientId: patient.id, insuranceId: insurance.id,
      sourceDocumentId: value.sourceDocumentId || null, source: value.source,
      status: validation.status, providerName: value.providerName.trim(), providerNpi: value.providerNpi.trim() || null,
      serviceDate: value.serviceDate ? new Date(`${value.serviceDate}T00:00:00.000Z`) : null,
      diagnosisCode: value.diagnosisCode.trim().toUpperCase(), procedureCode: value.procedureCode.trim().toUpperCase(),
      placeOfService: value.placeOfService.trim() || null, chargeAmount: value.chargeAmount || "0",
      clinicalNote: value.clinicalNote.trim() || null, validationReasons: reasons, createdBy,
      validatedAt: new Date(),
    }, include });
  });
  return claimRecord(row);
}
