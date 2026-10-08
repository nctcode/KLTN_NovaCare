ALTER TABLE "users" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
UPDATE "users" SET "otpCode" = NULL, "otpExpiresAt" = NULL;
CREATE TABLE "password_reset_challenges" (
  "userId" TEXT PRIMARY KEY,
  "otpHash" TEXT,
  "destination" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "sendCount" INTEGER NOT NULL DEFAULT 0
);
