CREATE TABLE "Document" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
  "status" TEXT NOT NULL DEFAULT 'uploaded',
  "task" TEXT,
  "result" TEXT,
  "provider" TEXT,
  "error" TEXT,
  "classification" TEXT NOT NULL DEFAULT 'pending',
  "destinationFolder" TEXT,
  "validationReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");
CREATE INDEX "Document_classification_createdAt_idx" ON "Document"("classification", "createdAt");
CREATE TABLE "DebugSession" (
  "id" UUID NOT NULL,
  "data" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DebugSession_pkey" PRIMARY KEY ("id")
);
