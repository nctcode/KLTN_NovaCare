-- Persist the partner onboarding schema and nullable account activation fields.
CREATE TYPE "PartnerRequestStatus" AS ENUM ('PENDING', 'CONTACTED', 'APPROVED', 'REJECTED');
CREATE TYPE "PartnerType" AS ENUM ('HOSPITAL', 'DOCTOR');

ALTER TABLE "users"
ADD COLUMN "activationExpiresAt" TIMESTAMP(3),
ADD COLUMN "activationToken" TEXT;

CREATE TABLE "partner_requests" (
    "id" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL DEFAULT 'HOSPITAL',
    "contactName" TEXT NOT NULL,
    "titleOrRole" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "specialty" TEXT,
    "notes" TEXT,
    "status" "PartnerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdHospitalId" TEXT,
    "createdUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "partner_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_activationToken_key" ON "users"("activationToken");
