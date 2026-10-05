ALTER TABLE "appointments" ADD COLUMN "clinicRoomId" TEXT, ADD COLUMN "serviceBookingMode" TEXT;
CREATE TABLE "clinic_rooms" (
  "id" TEXT PRIMARY KEY, "hospitalId" TEXT NOT NULL, "specialtyId" TEXT NOT NULL,
  "code" TEXT NOT NULL, "name" TEXT NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX "clinic_rooms_hospitalId_code_key" ON "clinic_rooms"("hospitalId", "code");
CREATE TABLE "clinic_room_sessions" (
  "id" TEXT PRIMARY KEY, "roomId" TEXT NOT NULL, "medicalServiceId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL, "mode" TEXT NOT NULL,
  CONSTRAINT "clinic_room_sessions_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "clinic_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "clinic_room_sessions_medicalServiceId_fkey" FOREIGN KEY ("medicalServiceId") REFERENCES "medical_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "clinic_room_sessions_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "appointment_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "clinic_room_sessions_slotId_key" ON "clinic_room_sessions"("slotId");
CREATE INDEX "clinic_room_sessions_roomId_mode_idx" ON "clinic_room_sessions"("roomId", "mode");
