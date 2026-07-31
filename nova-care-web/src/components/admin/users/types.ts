export type AccountStatus = 'ACTIVE' | 'LOCKED';

export interface UserActivitySummary {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  reviewsSubmitted: number;
}

export interface UserBookingHistory {
  id: string;
  bookingCode: string;
  hospitalName: string;
  specialtyName: string;
  doctorName?: string;
  appointmentDate: string;
  status: 'COMPLETED' | 'CANCELLED' | 'PENDING' | 'CONFIRMED';
  fee: number;
}

export interface UserPaymentRecord {
  id: string;
  transactionId: string;
  paymentDate: string;
  method: 'MOMO' | 'VNPAY' | 'ATM_CARD' | 'CASH';
  amount: number;
  status: 'SUCCESS' | 'REFUNDED' | 'FAILED' | 'PENDING';
}

export interface UserAccountLog {
  id: string;
  action:
    | 'REGISTER'
    | 'LOGIN'
    | 'CHANGE_PASSWORD'
    | 'CHANGE_EMAIL'
    | 'CHANGE_PHONE'
    | 'ADMIN_LOCK'
    | 'ADMIN_UNLOCK'
    | 'ADMIN_RESET_PWD'
    | 'ADMIN_NOTE';
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  ipAddress?: string;
}

export interface InternalNote {
  id: string;
  adminName: string;
  content: string;
  createdAt: string;
}

export interface PatientProfileItem {
  id: string;
  fullName: string;
  relation?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  identityNumber?: string;
  maskedCccd?: string;
  healthInsurance?: string;
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isDefault?: boolean;
  createdAt?: string;
  bookingHistory?: UserBookingHistory[];
}

export interface AdminUserItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender?: 'NAM' | 'NU' | 'KHAC';
  createdAt: string;
  lastLogin: string;
  status: AccountStatus;
  role: 'PATIENT' | 'ADMIN' | 'HOSPITAL_STAFF';
  totalBookings: number;
  hasPendingBooking: boolean;
  avatarUrl?: string;
  patientProfilesCount?: number;
  patientProfiles?: PatientProfileItem[];
  activitySummary?: UserActivitySummary;
  bookingHistory?: UserBookingHistory[];
  paymentRecords?: UserPaymentRecord[];
  accountLogs?: UserAccountLog[];
  internalNotes?: InternalNote[];
}
