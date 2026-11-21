-- Create persistent clinic rooms for every active hospital specialty that has
-- bookable services. These are real clinic_rooms records, not mobile aliases.
INSERT INTO "clinic_rooms" ("id", "hospitalId", "specialtyId", "code", "name", "isActive")
SELECT
  gen_random_uuid()::text,
  hs."hospitalId",
  hs."specialtyId",
  'PK-' || upper(substr(md5(hs."specialtyId"), 1, 6)),
  'Phòng khám ' || s."name",
  true
FROM "hospital_specialties" hs
JOIN "specialties" s ON s."id" = hs."specialtyId"
WHERE hs."isActive" = true
  AND s."isActive" = true
  AND EXISTS (
    SELECT 1 FROM "medical_services" ms
    WHERE ms."hospitalId" = hs."hospitalId"
      AND ms."specialtyId" = hs."specialtyId"
      AND ms."isActive" = true
  )
  AND NOT EXISTS (
    SELECT 1 FROM "clinic_rooms" cr
    WHERE cr."hospitalId" = hs."hospitalId"
      AND cr."specialtyId" = hs."specialtyId"
      AND cr."isActive" = true
  )
ON CONFLICT ("hospitalId", "code") DO NOTHING;

-- Assign weekday slots to actual service/room sessions. Services are rotated
-- within each specialty; a slot is used only when its real duration can cover
-- the selected service duration.
WITH service_pool AS (
  SELECT
    ms.*,
    row_number() OVER (
      PARTITION BY ms."hospitalId", ms."specialtyId"
      ORDER BY ms."name", ms."id"
    ) AS service_no,
    count(*) OVER (
      PARTITION BY ms."hospitalId", ms."specialtyId"
    ) AS service_count
  FROM "medical_services" ms
  WHERE ms."isActive" = true
    AND ms."specialtyId" IS NOT NULL
    AND ms."name" <> 'Khám dịch vụ ngoài giờ'
),
slot_pool AS (
  SELECT
    sl.*,
    dw."hospitalId",
    dw."specialtyId",
    row_number() OVER (
      PARTITION BY dw."hospitalId", dw."specialtyId"
      ORDER BY sl."startTime", sl."id"
    ) AS slot_no
  FROM "appointment_slots" sl
  JOIN "doctor_workplaces" dw ON dw."id" = sl."doctorWorkplaceId"
  LEFT JOIN "clinic_room_sessions" existing ON existing."slotId" = sl."id"
  WHERE sl."startTime" > CURRENT_TIMESTAMP
    AND sl."status" = 'AVAILABLE'
    AND sl."isActive" = true
    AND sl."isAvailable" = true
    AND dw."isActive" = true
    AND existing."id" IS NULL
    AND EXTRACT(ISODOW FROM sl."startTime" + INTERVAL '7 hours') BETWEEN 1 AND 5
),
assigned AS (
  SELECT sp."id" AS "slotId", svc."id" AS "serviceId", sp."hospitalId", sp."specialtyId"
  FROM slot_pool sp
  JOIN service_pool svc
    ON svc."hospitalId" = sp."hospitalId"
   AND svc."specialtyId" = sp."specialtyId"
   AND svc.service_no = ((sp.slot_no - 1) % svc.service_count) + 1
  WHERE EXTRACT(EPOCH FROM (sp."endTime" - sp."startTime")) / 60 >= svc."duration"
)
INSERT INTO "clinic_room_sessions" ("id", "roomId", "medicalServiceId", "slotId", "mode")
SELECT
  gen_random_uuid()::text,
  room."id",
  assigned."serviceId",
  assigned."slotId",
  'SERVICE'
FROM assigned
JOIN LATERAL (
  SELECT cr."id"
  FROM "clinic_rooms" cr
  WHERE cr."hospitalId" = assigned."hospitalId"
    AND cr."specialtyId" = assigned."specialtyId"
    AND cr."isActive" = true
  ORDER BY cr."code"
  LIMIT 1
) room ON true
ON CONFLICT ("slotId") DO NOTHING;

-- Open real weekend room sessions for the fixed after-hours service. A
-- 60-minute visit is backed by two consecutive 30-minute appointment slots;
-- only the first slot is exposed and checkout locks both real slots.
WITH weekend_slots AS (
  SELECT
    sl.*,
    dw."hospitalId",
    dw."specialtyId",
    row_number() OVER (
      PARTITION BY sl."doctorWorkplaceId", (sl."startTime" + INTERVAL '7 hours')::date
      ORDER BY sl."startTime"
    ) AS sequence_no,
    lead(sl."startTime") OVER (
      PARTITION BY sl."doctorWorkplaceId", (sl."startTime" + INTERVAL '7 hours')::date
      ORDER BY sl."startTime"
    ) AS next_start,
    lead(sl."id") OVER (
      PARTITION BY sl."doctorWorkplaceId", (sl."startTime" + INTERVAL '7 hours')::date
      ORDER BY sl."startTime"
    ) AS next_id
  FROM "appointment_slots" sl
  JOIN "doctor_workplaces" dw ON dw."id" = sl."doctorWorkplaceId"
  LEFT JOIN "clinic_room_sessions" existing ON existing."slotId" = sl."id"
  WHERE sl."startTime" > CURRENT_TIMESTAMP
    AND sl."status" = 'AVAILABLE'
    AND sl."isActive" = true
    AND sl."isAvailable" = true
    AND dw."isActive" = true
    AND existing."id" IS NULL
    AND EXTRACT(ISODOW FROM sl."startTime" + INTERVAL '7 hours') IN (6, 7)
),
eligible AS (
  SELECT ws.*
  FROM weekend_slots ws
  WHERE ws.sequence_no % 2 = 1
    AND ws.next_start = ws."endTime"
    AND NOT EXISTS (
      SELECT 1 FROM "clinic_room_sessions" continuation
      WHERE continuation."slotId" = ws.next_id
    )
)
INSERT INTO "clinic_room_sessions" ("id", "roomId", "medicalServiceId", "slotId", "mode")
SELECT
  gen_random_uuid()::text,
  room."id",
  service."id",
  eligible."id",
  'AFTER_HOURS'
FROM eligible
JOIN "after_hours_specialty_configs" cfg
  ON cfg."hospitalId" = eligible."hospitalId"
 AND cfg."specialtyId" = eligible."specialtyId"
 AND cfg."isActive" = true
JOIN LATERAL (
  SELECT ms."id"
  FROM "medical_services" ms
  WHERE ms."hospitalId" = eligible."hospitalId"
    AND ms."specialtyId" = eligible."specialtyId"
    AND ms."name" = 'Khám dịch vụ ngoài giờ'
    AND ms."duration" = 60
    AND ms."isActive" = true
  ORDER BY ms."id"
  LIMIT 1
) service ON true
JOIN LATERAL (
  SELECT cr."id"
  FROM "clinic_rooms" cr
  WHERE cr."hospitalId" = eligible."hospitalId"
    AND cr."specialtyId" = eligible."specialtyId"
    AND cr."isActive" = true
  ORDER BY cr."code"
  LIMIT 1
) room ON true
ON CONFLICT ("slotId") DO NOTHING;
