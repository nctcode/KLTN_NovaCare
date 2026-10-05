ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DOCTOR';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONSULTATION_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONSULTATION_STATUS';

CREATE TYPE "ConsultationStatus" AS ENUM ('SCHEDULED', 'WAITING', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "ConsultationRequestMode" AS ENUM ('SCHEDULED', 'ON_DEMAND');
CREATE TYPE "ConsultationChannel" AS ENUM ('CHAT', 'VIDEO');
CREATE TYPE "ConsultationSenderType" AS ENUM ('PATIENT', 'DOCTOR', 'SYSTEM');
CREATE TYPE "ConsultationMessageType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'SYSTEM');
CREATE TYPE "ConsultationAttachmentStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'DELETED');

ALTER TABLE "doctors" ADD COLUMN "userId" TEXT;
CREATE UNIQUE INDEX "doctors_userId_key" ON "doctors"("userId");
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "consultation_sessions" (
    "id" TEXT NOT NULL,
    "patientProfileId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "doctorWorkplaceId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestMode" "ConsultationRequestMode" NOT NULL DEFAULT 'SCHEDULED',
    "channel" "ConsultationChannel" NOT NULL DEFAULT 'CHAT',
    "status" "ConsultationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledStartAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3),
    "chatOpenAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "followUpUntil" TIMESTAMP(3),
    "videoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "consultation_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consultation_messages" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "senderType" "ConsultationSenderType" NOT NULL,
    "messageType" "ConsultationMessageType" NOT NULL DEFAULT 'TEXT',
    "clientMessageId" TEXT NOT NULL,
    "text" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "consultation_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consultation_attachments" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "messageId" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "status" "ConsultationAttachmentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "ConsultationMessageType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "consultation_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "consultation_sessions_appointmentId_key" ON "consultation_sessions"("appointmentId");
CREATE UNIQUE INDEX "consultation_sessions_idempotencyKey_key" ON "consultation_sessions"("idempotencyKey");
CREATE INDEX "consultation_sessions_createdByUserId_updatedAt_idx" ON "consultation_sessions"("createdByUserId", "updatedAt");
CREATE INDEX "consultation_sessions_doctorId_status_scheduledStartAt_idx" ON "consultation_sessions"("doctorId", "status", "scheduledStartAt");
CREATE INDEX "consultation_sessions_patientProfileId_updatedAt_idx" ON "consultation_sessions"("patientProfileId", "updatedAt");
CREATE UNIQUE INDEX "consultation_messages_senderUserId_clientMessageId_key" ON "consultation_messages"("senderUserId", "clientMessageId");
CREATE INDEX "consultation_messages_consultationId_createdAt_idx" ON "consultation_messages"("consultationId", "createdAt");
CREATE INDEX "consultation_attachments_consultationId_createdAt_idx" ON "consultation_attachments"("consultationId", "createdAt");

ALTER TABLE "consultation_sessions" ADD CONSTRAINT "consultation_sessions_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultation_sessions" ADD CONSTRAINT "consultation_sessions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultation_sessions" ADD CONSTRAINT "consultation_sessions_doctorWorkplaceId_fkey" FOREIGN KEY ("doctorWorkplaceId") REFERENCES "doctor_workplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultation_sessions" ADD CONSTRAINT "consultation_sessions_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultation_sessions" ADD CONSTRAINT "consultation_sessions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "consultation_sessions" ADD CONSTRAINT "consultation_sessions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultation_messages" ADD CONSTRAINT "consultation_messages_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultation_messages" ADD CONSTRAINT "consultation_messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "consultation_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
