ALTER TABLE "audit_logs" ADD COLUMN "success" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "audit_logs" ADD COLUMN "description" TEXT;
