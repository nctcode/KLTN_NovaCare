import { DoctorWorkplace } from './index';

export interface Appointment {
  id: string;
  bookingCode: string;
  patientProfileId: string;
  slotId: string;
  medicalServiceId?: string;
  userId: string;
  status: string;
  reason?: string;
  symptoms?: string;
  totalPrice: number;
  consultationFee: number;
  serviceFee: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  patientProfile?: any;
  slot?: {
    id: string;
    startTime: string;
    endTime: string;
    doctorWorkplace?: DoctorWorkplace;
  };
  medicalService?: any;
  payment?: any;
  medicalEncounter?: any;
  statusHistory?: any[];
}

export interface CreateAppointmentDto {
  patientProfileId: string;
  slotId: string;
  medicalServiceId?: string;
  reason?: string;
  symptoms?: string;
  idempotencyKey: string;
}

export interface CancelAppointmentDto {
  reason?: string;
}
