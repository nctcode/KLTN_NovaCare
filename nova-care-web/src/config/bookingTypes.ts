import {
  FileText,
  Crown,
  Stethoscope,
  Building2,
  UserCheck,
  Clock,
  LucideIcon,
} from 'lucide-react';

export type BookingType =
  | 'SERVICE'
  | 'VIP'
  | 'GENERAL'
  | 'INPATIENT_FOLLOWUP'
  | 'DOCTOR'
  | 'OUT_OF_HOURS';

export interface BookingTypeConfig {
  id: BookingType;
  title: string;
  badge: string;
  description: string;
  icon: LucideIcon;
  color: string;
  iconBg: string;
  badgeColor: string;
  features: string[];

  // High-level behavior flags for the booking type
  requiresFacility: boolean;
  requiresDepartment: boolean;
  requiresDoctor: boolean;
  requiresService: boolean;
  requiresAdmission: boolean;
  requiresDateTime: boolean;
  requiresPatient: boolean;
  requiresPayment: boolean;

  // Metadata filters applied to doctor/slot API calls
  filters?: {
    vipOnly?: boolean;
    outsideOfficeHourOnly?: boolean;
  };
}

export const BOOKING_TYPES_CONFIG: Record<BookingType, BookingTypeConfig> = {
  SERVICE: {
    id: 'SERVICE',
    title: 'Khám Dịch Vụ',
    badge: 'Gói khám & Xét nghiệm',
    description: 'Đăng ký các gói khám tổng quát, xét nghiệm máu, chẩn đoán hình ảnh kỹ thuật cao.',
    icon: FileText,
    color: 'border-blue-500 bg-blue-50/60',
    iconBg: 'bg-blue-100 text-blue-800',
    badgeColor: 'bg-blue-600 text-white',
    features: [
      'Gói khám tổng quát & chuyên sâu',
      'Xét nghiệm & CĐHA kỹ thuật cao',
      'Nhận kết quả trực tuyến nhanh chóng',
    ],
    requiresFacility: true,
    requiresDepartment: false,
    requiresDoctor: false, // Initial flag; dynamic service metadata will refine doctor requirement
    requiresService: true,
    requiresAdmission: false,
    requiresDateTime: true,
    requiresPatient: true,
    requiresPayment: true,
  },

  VIP: {
    id: 'VIP',
    title: 'Phòng Khám VIP',
    badge: 'Đặc quyền VIP • Ưu tiên',
    description: 'Đăng ký khu khám VIP/Quốc tế, làm việc với Bác sĩ Chuyên gia trong không gian riêng biệt.',
    icon: Crown,
    color: 'border-amber-500 bg-amber-50/60',
    iconBg: 'bg-amber-100 text-amber-900',
    badgeColor: 'bg-amber-600 text-white',
    features: [
      'Khu vực khám VIP & Phòng chờ riêng',
      'Bác sĩ Chuyên gia / Học vị cao',
      'Hỗ trợ tiếp nhận & chăm sóc ưu tiên',
    ],
    requiresFacility: true,
    requiresDepartment: true,
    requiresDoctor: false,
    requiresService: false,
    requiresAdmission: false,
    requiresDateTime: true,
    requiresPatient: true,
    requiresPayment: true,
    filters: {
      vipOnly: true,
    },
  },

  GENERAL: {
    id: 'GENERAL',
    title: 'Khám Thường / Tiếp Nhận',
    badge: 'Khám tiêu chuẩn',
    description: 'Đăng ký lượt khám tiêu chuẩn tại bệnh viện, lấy số thứ tự điện tử và tiếp nhận phân luồng.',
    icon: Stethoscope,
    color: 'border-slate-400 bg-slate-50',
    iconBg: 'bg-slate-200 text-slate-800',
    badgeColor: 'bg-slate-700 text-white',
    features: [
      'Lấy số thứ tự trực tuyến',
      'Quy trình tiếp nhận tiêu chuẩn',
      'Áp dụng đăng ký khám nhanh tại quầy',
    ],
    requiresFacility: true,
    requiresDepartment: true,
    requiresDoctor: false,
    requiresService: false,
    requiresAdmission: false,
    requiresDateTime: true,
    requiresPatient: true,
    requiresPayment: true,
  },

  INPATIENT_FOLLOWUP: {
    id: 'INPATIENT_FOLLOWUP',
    title: 'Tái Khám Nội Trú',
    badge: 'Theo dõi sau xuất viện',
    description: 'Dành cho bệnh nhân có hồ sơ điều trị nội trú, tra cứu bệnh án và đăng ký lịch tái khám.',
    icon: Building2,
    color: 'border-purple-500 bg-purple-50/60',
    iconBg: 'bg-purple-100 text-purple-800',
    badgeColor: 'bg-purple-700 text-white',
    features: [
      'Xác thực hồ sơ đợt điều trị nội trú',
      'Đặt hẹn theo dõi trực tiếp với BS điều trị',
      'Đồng bộ kết quả bệnh án điện tử',
    ],
    requiresFacility: true,
    requiresDepartment: false,
    requiresDoctor: false,
    requiresService: false,
    requiresAdmission: true,
    requiresDateTime: true,
    requiresPatient: true,
    requiresPayment: false,
  },

  DOCTOR: {
    id: 'DOCTOR',
    title: 'Khám Theo Bác Sĩ',
    badge: 'Khuyên dùng • Lựa chọn Bác sĩ',
    description: 'Chủ động lựa chọn Bác sĩ chuyên khoa giỏi, xem học vị, lịch khám và giữ khung giờ hẹn.',
    icon: UserCheck,
    color: 'border-[#0c4b39] bg-emerald-50/60',
    iconBg: 'bg-emerald-100 text-[#0c4b39]',
    badgeColor: 'bg-[#0c4b39] text-white',
    features: [
      'Chọn Bác sĩ & Học vị mong muốn',
      'Khung giờ khám linh hoạt trong ngày',
      'Xác nhận giữ chỗ tức thì',
    ],
    requiresFacility: true,
    requiresDepartment: false,
    requiresDoctor: true,
    requiresService: false,
    requiresAdmission: false,
    requiresDateTime: true,
    requiresPatient: true,
    requiresPayment: true,
  },

  OUT_OF_HOURS: {
    id: 'OUT_OF_HOURS',
    title: 'Khám Ngoài Giờ',
    badge: 'Buổi tối & Cuối tuần',
    description: 'Đăng ký các ca khám ngoài giờ hành chính (buổi tối và các ngày cuối tuần).',
    icon: Clock,
    color: 'border-indigo-500 bg-indigo-50/60',
    iconBg: 'bg-indigo-100 text-indigo-800',
    badgeColor: 'bg-indigo-700 text-white',
    features: [
      'Ca khám buổi tối (17h00 - 20h00)',
      'Lịch khám ngày Thứ 7 & Chủ Nhật',
      'Phù hợp với người đi làm & bận rộn',
    ],
    requiresFacility: true,
    requiresDepartment: true,
    requiresDoctor: false,
    requiresService: false,
    requiresAdmission: false,
    requiresDateTime: true,
    requiresPatient: true,
    requiresPayment: true,
    filters: {
      outsideOfficeHourOnly: true,
    },
  },
};
