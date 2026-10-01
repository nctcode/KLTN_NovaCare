-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ScheduleExceptionType" AS ENUM ('DAY_OFF', 'BLOCK_TIME');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScheduleSource" AS ENUM ('INTERNAL', 'HIS_API');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'FULL', 'BLOCKED', 'CONFLICTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BookingType" AS ENUM ('ALL', 'HOSPITAL', 'ON_DEMAND', 'ONLINE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "doctor_schedules_doctorWorkplaceId_dayOfWeek_key";

-- AlterTable
ALTER TABLE "appointment_slots" ADD COLUMN IF NOT EXISTS "date" DATE,
ADD COLUMN IF NOT EXISTS "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "doctor_schedules" ADD COLUMN IF NOT EXISTS "bookingType" "BookingType" NOT NULL DEFAULT 'ALL',
ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "effectiveFrom" DATE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "effectiveTo" DATE,
ADD COLUMN IF NOT EXISTS "slotDuration" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "appointment_slot_bookings" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_slot_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "hospital_booking_configs" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL DEFAULT 'ALL',
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
    "allowSaturday" BOOLEAN NOT NULL DEFAULT true,
    "allowSunday" BOOLEAN NOT NULL DEFAULT true,
    "minAdvanceMinutes" INTEGER NOT NULL DEFAULT 60,
    "defaultSlotDuration" INTEGER NOT NULL DEFAULT 30,
    "scheduleSource" "ScheduleSource" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_booking_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "schedule_exceptions" (
    "id" TEXT NOT NULL,
    "doctorWorkplaceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "exceptionType" "ScheduleExceptionType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "doctor_schedule_services" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "medicalServiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_schedule_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appointment_slot_bookings_slotId_idx" ON "appointment_slot_bookings"("slotId");
CREATE UNIQUE INDEX IF NOT EXISTS "appointment_slot_bookings_appointmentId_slotId_key" ON "appointment_slot_bookings"("appointmentId", "slotId");

CREATE INDEX IF NOT EXISTS "hospital_booking_configs_hospitalId_idx" ON "hospital_booking_configs"("hospitalId");
CREATE UNIQUE INDEX IF NOT EXISTS "hospital_booking_configs_hospitalId_bookingType_key" ON "hospital_booking_configs"("hospitalId", "bookingType");

CREATE INDEX IF NOT EXISTS "schedule_exceptions_doctorWorkplaceId_date_idx" ON "schedule_exceptions"("doctorWorkplaceId", "date");

CREATE INDEX IF NOT EXISTS "doctor_schedule_services_medicalServiceId_idx" ON "doctor_schedule_services"("medicalServiceId");
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_schedule_services_scheduleId_medicalServiceId_key" ON "doctor_schedule_services"("scheduleId", "medicalServiceId");

CREATE INDEX IF NOT EXISTS "appointment_slots_doctorWorkplaceId_status_idx" ON "appointment_slots"("doctorWorkplaceId", "status");
CREATE INDEX IF NOT EXISTS "doctor_schedules_doctorWorkplaceId_dayOfWeek_idx" ON "doctor_schedules"("doctorWorkplaceId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "appointment_slot_bookings" DROP CONSTRAINT IF EXISTS "appointment_slot_bookings_appointmentId_fkey";
ALTER TABLE "appointment_slot_bookings" ADD CONSTRAINT "appointment_slot_bookings_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_slot_bookings" DROP CONSTRAINT IF EXISTS "appointment_slot_bookings_slotId_fkey";
ALTER TABLE "appointment_slot_bookings" ADD CONSTRAINT "appointment_slot_bookings_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "appointment_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hospital_booking_configs" DROP CONSTRAINT IF EXISTS "hospital_booking_configs_hospitalId_fkey";
ALTER TABLE "hospital_booking_configs" ADD CONSTRAINT "hospital_booking_configs_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "schedule_exceptions" DROP CONSTRAINT IF EXISTS "schedule_exceptions_doctorWorkplaceId_fkey";
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_doctorWorkplaceId_fkey" FOREIGN KEY ("doctorWorkplaceId") REFERENCES "doctor_workplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_schedule_services" DROP CONSTRAINT IF EXISTS "doctor_schedule_services_scheduleId_fkey";
ALTER TABLE "doctor_schedule_services" ADD CONSTRAINT "doctor_schedule_services_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "doctor_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_schedule_services" DROP CONSTRAINT IF EXISTS "doctor_schedule_services_medicalServiceId_fkey";
ALTER TABLE "doctor_schedule_services" ADD CONSTRAINT "doctor_schedule_services_medicalServiceId_fkey" FOREIGN KEY ("medicalServiceId") REFERENCES "medical_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill data safely
UPDATE "appointment_slots" SET "date" = DATE("startTime") WHERE "date" IS NULL;

UPDATE "appointment_slots"
SET "status" = CASE
  WHEN "bookedCount" >= "capacity" THEN 'FULL'::"SlotStatus"
  WHEN "isActive" = false OR "isAvailable" = false THEN 'BLOCKED'::"SlotStatus"
  ELSE 'AVAILABLE'::"SlotStatus"
END
WHERE "status" = 'AVAILABLE';

INSERT INTO "appointment_slot_bookings" ("id", "appointmentId", "slotId", "createdAt")
SELECT gen_random_uuid()::text, a.id, a."slotId", a."createdAt"
FROM appointments a
WHERE a."slotId" IS NOT NULL
ON CONFLICT ("appointmentId", "slotId") DO NOTHING;

INSERT INTO "hospital_booking_configs" ("id", "hospitalId", "bookingType", "maxAdvanceDays", "allowSaturday", "allowSunday", "minAdvanceMinutes", "defaultSlotDuration", "scheduleSource", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, h.id, 'ALL'::"BookingType", 30, true, true, 60, 30, 'INTERNAL'::"ScheduleSource", NOW(), NOW()
FROM hospitals h
ON CONFLICT ("hospitalId", "bookingType") DO NOTHING;
