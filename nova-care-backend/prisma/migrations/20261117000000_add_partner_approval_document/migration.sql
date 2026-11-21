ALTER TABLE "partner_requests"
  ADD COLUMN IF NOT EXISTS "approvalDocumentName" TEXT,
  ADD COLUMN IF NOT EXISTS "approvalDocumentMimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "approvalDocumentData" TEXT;
