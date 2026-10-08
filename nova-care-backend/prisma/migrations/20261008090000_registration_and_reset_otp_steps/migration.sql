ALTER TABLE "password_reset_challenges"
  ADD COLUMN "verificationTokenHash" TEXT,
  ADD COLUMN "verificationExpiresAt" TIMESTAMP(3);

CREATE TABLE "registration_otp_challenges" (
  "phone" TEXT PRIMARY KEY,
  "otpHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "sendCount" INTEGER NOT NULL DEFAULT 0,
  "verificationTokenHash" TEXT,
  "verificationExpiresAt" TIMESTAMP(3)
);
