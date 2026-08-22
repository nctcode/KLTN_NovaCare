export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type ExaminationType = 'REGULAR' | 'BHYT' | 'SERVICE';

export const EXAMINATION_TYPES = [
  {
    id: 'REGULAR' as ExaminationType,
    name: 'Khám thường',
    badge: 'Tiêu chuẩn',
    description: 'Khám bệnh theo quy trình lấy số thứ tự tiêu chuẩn của bệnh viện.',
    iconName: 'Stethoscope',
    colorTheme: 'emerald',
  },
  {
    id: 'BHYT' as ExaminationType,
    name: 'Khám BHYT',
    badge: 'Bảo hiểm y tế',
    description: 'Áp dụng thẻ BHYT để được hưởng chế độ giảm trừ theo quy định y tế.',
    iconName: 'ShieldCheck',
    colorTheme: 'blue',
  },
  {
    id: 'SERVICE' as ExaminationType,
    name: 'Khám dịch vụ',
    badge: 'Khám ưu tiên',
    description: 'Khám nhanh ưu tiên, không chờ đợi, lựa chọn Bác sĩ Chuyên gia.',
    iconName: 'Zap',
    colorTheme: 'amber',
  },
] as const;

export interface BookingState {
  hospitalId: string | null;
  hospitalName?: string | null;
  specialtyId: string | null;
  specialtyName?: string | null;
  branchId?: string | null;
  doctorId: string | null;
  doctorName?: string | null;
  workplaceId: string | null;
  slotId: string | null;
  slot?: any | null;
  selectedDate?: string | null;
  patientProfileId: string | null;
  medicalServiceId: string | null;
  medicalServiceName?: string | null;
  healthPackageId?: string | null;
  healthPackageName?: string | null;
  bookingType?: 'doctor' | 'specialty' | 'hospital' | 'clinic' | 'service' | 'package';
  examinationType?: ExaminationType;
  reason?: string;
  symptoms?: string;
  appointmentId: string | null;
}
