ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "source" "DataSource" NOT NULL DEFAULT 'MANUAL';

ALTER TABLE "diagnoses" ADD COLUMN IF NOT EXISTS "diagnosisType" TEXT;
ALTER TABLE "diagnoses" ADD COLUMN IF NOT EXISTS "isComplication" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "admissionAt" TIMESTAMP(3);
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "admissionSource" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "careLevel" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "conclusion" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "departmentHeadName" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "dietaryRegimen" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "differentialDiagnosis" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "digitalSignature" JSONB;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "dischargeType" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "doctorNotes" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "hospitalDirectorName" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "initialDiagnosis" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "organSystemsExam" JSONB;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "physicalExamination" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "prognosisFar" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "prognosisNear" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "revisitDate" TIMESTAMP(3);
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "specialtyExam" JSONB;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "treatmentDays" INTEGER DEFAULT 1;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "treatmentPlan" TEXT;
ALTER TABLE "medical_encounters" ADD COLUMN IF NOT EXISTS "treatmentResult" TEXT;

ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "currentMedications" TEXT;
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "ethnicity" TEXT DEFAULT 'Kinh';
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "familyMedicalHistory" TEXT;
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "guardianName" TEXT;
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "lifestyleRiskFactors" TEXT;
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "nationality" TEXT DEFAULT 'Việt Nam';
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "occupation" TEXT;
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "security_pin" TEXT;
