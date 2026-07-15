export type BookingStep = 1 | 2 | 3 | 4 | 5;

export interface BookingState {
  hospitalId: string | null;
  specialtyId: string | null;
  doctorId: string | null;
  doctorName?: string | null;
  workplaceId: string | null;
  slotId: string | null;
  slot?: any | null;
  patientProfileId: string | null;
  medicalServiceId: string | null;
  reason?: string;
  symptoms?: string;
  appointmentId: string | null;
}
