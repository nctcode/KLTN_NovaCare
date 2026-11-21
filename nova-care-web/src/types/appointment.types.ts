import { DoctorWorkplace } from './index';

export interface Appointment {
  id: string;
  bookingCode: string;
  patientProfileId: string;
  slotId: string;
  medicalServiceId?: string;
  clinicRoomId?: string;
  serviceBookingMode?: 'SERVICE' | 'AFTER_HOURS';
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
  medicalEncounter?: any;
  payment?: any;
  statusHistory?: any[];
  preExamSession?: {
    id: string;
    status: string;
    riskLevel?: string;
    completedAt?: string;
  } | null;
}

export interface AppointmentScreeningQuestion {
  id: string;
  question: string;
  answer?: string;
  order: number;
  context?: Record<string, unknown>;
}

export interface AppointmentScreeningMedia {
  id: string;
  type: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  fileUrl: string;
}

export interface AppointmentScreening {
  id: string;
  status: string;
  source: string;
  completedAt?: string;
  symptoms?: string;
  voiceTranscript?: string;
  bodyDiagramData?: Record<string, unknown>;
  structuredData?: Record<string, any>;
  imageAnalysis?: Record<string, unknown>;
  recommendations?: Record<string, any>;
  riskLevel?: string;
  questions: AppointmentScreeningQuestion[];
  media: AppointmentScreeningMedia[];
}

export interface CreateAppointmentDto {
  patientProfileId: string;
  slotId: string;
  medicalServiceId?: string;
  reason?: string;
  symptoms?: string;
  idempotencyKey: string;
  screeningSessionId?: string;
}

export interface CancelAppointmentDto {
  reason?: string;
}
