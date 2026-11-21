ALTER TABLE "pre_exam_sessions"
  ADD COLUMN IF NOT EXISTS "patientProfileId" TEXT,
  ADD COLUMN IF NOT EXISTS "appointmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'SMARTPHONE_AI',
  ADD COLUMN IF NOT EXISTS "schemaVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "catalogVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "inputRevision" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "pre_exam_sessions_appointmentId_key"
  ON "pre_exam_sessions"("appointmentId");
CREATE INDEX IF NOT EXISTS "pre_exam_sessions_userId_status_idx"
  ON "pre_exam_sessions"("userId", "status");
CREATE INDEX IF NOT EXISTS "pre_exam_sessions_patientProfileId_idx"
  ON "pre_exam_sessions"("patientProfileId");

DO $$ BEGIN
  ALTER TABLE "pre_exam_sessions"
    ADD CONSTRAINT "pre_exam_sessions_patientProfileId_fkey"
    FOREIGN KEY ("patientProfileId") REFERENCES "patient_profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "pre_exam_sessions"
    ADD CONSTRAINT "pre_exam_sessions_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
