export type DoctorAppointmentStatus =
  | 'PENDING' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'PAID'
  | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'NO_SHOW' | 'FAILED' | 'REFUNDED';

export interface DoctorWorkplaceView {
  id: string;
  isPrimary: boolean;
  position?: string | null;
  hospital: { id: string; name: string; address?: string | null };
  branch?: { id: string; name: string; address?: string | null } | null;
  specialty: { id: string; name: string };
}

export interface DoctorProfileView {
  id: string;
  fullName: string;
  title?: string | null;
  qualification: string;
  yearsOfExperience: number;
  avatarUrl?: string | null;
  bio?: string | null;
  user: { id: string; email?: string | null; phone?: string | null; role: string };
  workPlaces: DoctorWorkplaceView[];
}

export interface DoctorScheduleView {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  bookingType: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  doctorWorkplace: DoctorWorkplaceView;
}

export interface DoctorSlotView {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  status: string;
  doctorWorkplace: DoctorWorkplaceView;
  roomSession?: {
    mode: string;
    room: { id: string; code: string; name: string };
    service?: { id: string; name: string };
  } | null;
  _count?: { primaryAppointments: number };
}

export interface DoctorAppointmentView {
  id: string;
  bookingCode: string;
  status: DoctorAppointmentStatus;
  reason?: string | null;
  symptoms?: string | null;
  checkInAt?: string | null;
  patientProfile: {
    id: string;
    fullName: string;
    phone?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    identityNumber?: string | null;
    address?: string | null;
  };
  medicalService?: { id: string; name: string; duration?: number } | null;
  preExamSession?: {
    id: string;
    status: string;
    riskLevel?: string | null;
    recommendations?: Record<string, unknown> | null;
    completedAt?: string | null;
  } | null;
  slot: DoctorSlotView;
  statusHistory?: Array<{ id: string; status: string; note?: string | null; createdAt: string }>;
}

export interface DoctorDashboardView {
  date: string;
  doctor: DoctorProfileView;
  stats: {
    totalToday: number;
    upcomingToday: number;
    completedToday: number;
    slotsToday: number;
    unreadNotifications: number;
  };
  nextAppointments: DoctorAppointmentView[];
}
