CREATE TABLE "hospital_integration_configs" (
  "hospital_id" TEXT NOT NULL,
  "endpoint_url" TEXT NOT NULL,
  "auth_type" TEXT NOT NULL DEFAULT 'none',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hospital_integration_configs_pkey" PRIMARY KEY ("hospital_id")
);

ALTER TABLE "hospital_integration_configs"
ADD CONSTRAINT "hospital_integration_configs_hospital_id_fkey"
FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
