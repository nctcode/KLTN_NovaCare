CREATE TABLE "after_hours_specialty_configs" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "after_hours_specialty_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "after_hours_specialty_configs_hospitalId_specialtyId_key"
ON "after_hours_specialty_configs"("hospitalId", "specialtyId");

CREATE INDEX "after_hours_specialty_configs_hospitalId_isActive_idx"
ON "after_hours_specialty_configs"("hospitalId", "isActive");

ALTER TABLE "after_hours_specialty_configs"
ADD CONSTRAINT "after_hours_specialty_configs_hospitalId_fkey"
FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "after_hours_specialty_configs"
ADD CONSTRAINT "after_hours_specialty_configs_specialtyId_fkey"
FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
