CREATE TABLE "Patient" (
  "id" UUID NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "dateOfBirth" DATE,
  "gender" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Insurance" (
  "id" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "providerName" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "groupNumber" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Insurance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Claim" (
  "id" UUID NOT NULL,
  "claimNumber" TEXT NOT NULL,
  "patientId" UUID NOT NULL,
  "insuranceId" UUID NOT NULL,
  "sourceDocumentId" UUID,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "providerName" TEXT NOT NULL,
  "providerNpi" TEXT,
  "serviceDate" DATE,
  "diagnosisCode" TEXT NOT NULL,
  "procedureCode" TEXT NOT NULL,
  "placeOfService" TEXT,
  "chargeAmount" DECIMAL(12,2) NOT NULL,
  "clinicalNote" TEXT,
  "validationReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdBy" TEXT NOT NULL,
  "validatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Claim_claimNumber_key" ON "Claim"("claimNumber");
CREATE INDEX "Patient_lastName_firstName_idx" ON "Patient"("lastName", "firstName");
CREATE INDEX "Insurance_patientId_idx" ON "Insurance"("patientId");
CREATE INDEX "Insurance_memberId_idx" ON "Insurance"("memberId");
CREATE INDEX "Claim_status_createdAt_idx" ON "Claim"("status", "createdAt");
CREATE INDEX "Claim_patientId_idx" ON "Claim"("patientId");
CREATE INDEX "Claim_sourceDocumentId_idx" ON "Claim"("sourceDocumentId");

ALTER TABLE "Insurance" ADD CONSTRAINT "Insurance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "Insurance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
