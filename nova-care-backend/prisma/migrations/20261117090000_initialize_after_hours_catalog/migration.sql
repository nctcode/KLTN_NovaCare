-- Existing hospitals already have active specialties and schedules. Enable those
-- specialties for the newly introduced after-hours catalog so mobile clients do
-- not receive an empty feature immediately after deployment. Administrators can
-- still disable individual specialties from the after-hours management screen.
INSERT INTO "after_hours_specialty_configs" (
  "id", "hospitalId", "specialtyId", "isActive", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, hs."hospitalId", hs."specialtyId", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "hospital_specialties" hs
WHERE hs."isActive" = true
ON CONFLICT ("hospitalId", "specialtyId") DO NOTHING;

INSERT INTO "medical_services" (
  "id", "hospitalId", "specialtyId", "name", "description", "price", "duration", "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  cfg."hospitalId",
  cfg."specialtyId",
  'Khám dịch vụ ngoài giờ',
  'Dịch vụ khám ngoài giờ áp dụng thứ bảy và chủ nhật.',
  270000,
  60,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "after_hours_specialty_configs" cfg
WHERE cfg."isActive" = true
  AND NOT EXISTS (
    SELECT 1 FROM "medical_services" ms
    WHERE ms."hospitalId" = cfg."hospitalId"
      AND ms."specialtyId" = cfg."specialtyId"
      AND ms."name" = 'Khám dịch vụ ngoài giờ'
  );
