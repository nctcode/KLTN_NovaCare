export type BookingStep = 1 | 2 | 3 | 4 | 5;

export interface BookingState {
  hospitalId: string | null;
  specialtyId: string | null;
  branchId?: string | null;
  doctorId: string | null;
  doctorName?: string | null;
  workplaceId: string | null;
  slotId: string | null;
  slot?: any | null;
  patientProfileId: string | null;
  medicalServiceId: string | null;
  medicalServiceName?: string | null;
  healthPackageId?: string | null;
  healthPackageName?: string | null;
  bookingType?: 'doctor' | 'specialty' | 'hospital' | 'clinic' | 'service' | 'package';
  reason?: string;
  symptoms?: string;
  appointmentId: string | null;
}
