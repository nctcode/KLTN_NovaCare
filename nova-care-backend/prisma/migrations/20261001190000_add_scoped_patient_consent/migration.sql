DO $$ BEGIN
  CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'REVOKED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "patient_consents" (
  "id" TEXT NOT NULL,
  "patientProfileId" TEXT NOT NULL,
  "sourceHospitalId" TEXT NOT NULL,
  "targetHospitalId" TEXT NOT NULL,
  "status" "ConsentStatus" NOT NULL DEFAULT 'GRANTED',
  "grantedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "patient_consents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "patient_consents"
  ADD COLUMN IF NOT EXISTS "scope" JSONB,
  ADD COLUMN IF NOT EXISTS "purpose" TEXT NOT NULL DEFAULT 'TREATMENT',
  ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "policyVersion" TEXT NOT NULL DEFAULT 'novacare-consent-v1';

CREATE UNIQUE INDEX IF NOT EXISTS "patient_consents_patientProfileId_sourceHospitalId_targetHospitalId_key"
  ON "patient_consents"("patientProfileId", "sourceHospitalId", "targetHospitalId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patient_consents_patientProfileId_fkey') THEN
    ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_patientProfileId_fkey"
      FOREIGN KEY ("patientProfileId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patient_consents_sourceHospitalId_fkey') THEN
    ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_sourceHospitalId_fkey"
      FOREIGN KEY ("sourceHospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patient_consents_targetHospitalId_fkey') THEN
    ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_targetHospitalId_fkey"
      FOREIGN KEY ("targetHospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
