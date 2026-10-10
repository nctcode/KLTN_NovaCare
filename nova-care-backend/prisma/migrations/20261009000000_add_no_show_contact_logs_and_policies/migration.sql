-- AlterTable
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "checkInAt" TIMESTAMP(3);
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "noShowAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "hospital_booking_configs" ADD COLUMN IF NOT EXISTS "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "hospital_booking_configs" ADD COLUMN IF NOT EXISTS "minContactAttempts" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "hospital_booking_configs" ADD COLUMN IF NOT EXISTS "minContactIntervalMinutes" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "hospital_booking_configs" ADD COLUMN IF NOT EXISTS "autoNoShowEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "appointment_contact_logs" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "staffId" TEXT,
    "staffName" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'PHONE',
    "outcome" TEXT NOT NULL DEFAULT 'NO_ANSWER',
    "note" TEXT,
    "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_contact_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appointment_contact_logs_appointmentId_idx" ON "appointment_contact_logs"("appointmentId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'appointment_contact_logs_appointmentId_fkey'
    ) THEN
        ALTER TABLE "appointment_contact_logs" ADD CONSTRAINT "appointment_contact_logs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
