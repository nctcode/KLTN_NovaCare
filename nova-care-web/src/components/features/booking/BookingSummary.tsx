'use client';

import { useBookingStore } from '@/stores/booking.store';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { profileService } from '@/services/profile.service';
import { hospitalService } from '@/services/hospital.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Activity,
  ShieldCheck,
  PhoneCall,
  Sparkles,
  Stethoscope,
  Building2,
  Zap,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export function BookingSummary() {
  const { bookingData } = useBookingStore();
  const {
    doctorId,
    doctorName,
    workplaceId,
    hospitalId,
    hospitalName,
    specialtyName,
    medicalServiceName,
    slot,
    selectedDate,
    patientProfileId,
    reason,
    examinationType,
  } = bookingData;

  // Fetch Doctor details if doctorId is set
  const { data: doctor } = useQuery({
    queryKey: ['doctor-summary-10steps', doctorId],
    queryFn: () => doctorService.getById(doctorId!),
    enabled: !!doctorId,
  });

  // Find selected workplace
  const workplace = doctor?.workPlaces?.find((wp) => wp.id === workplaceId) || doctor?.workPlaces?.[0];

  // Fetch Patient Profile details
  const { data: profile } = useQuery({
    queryKey: ['profile-summary-10steps', patientProfileId],
    queryFn: () => profileService.getById(patientProfileId!),
    enabled: !!patientProfileId,
  });

  // Fetch Hospital details if set
  const { data: hospital } = useQuery({
    queryKey: ['hospital-summary-10steps', hospitalId],
    queryFn: () => hospitalService.getById(hospitalId!),
    enabled: !!hospitalId,
  });

  const formattedTime = slot?.startTime
    ? new Date(slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;

  const displayDate = slot?.startTime
    ? new Date(slot.startTime).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })
    : selectedDate || null;

  const consultationFee = workplace?.consultationFee
    ? Number(workplace.consultationFee)
    : 300000;

  return (
    <Card className="sticky top-6 border border-gray-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
      {/* Sidebar Header */}
      <div className="bg-[#0c4b39]/10 px-4 py-3 border-b border-[#0c4b39]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#0c4b39]" />
          <span className="font-extrabold text-secondary text-sm">Tóm Tắt Lịch Hẹn</span>
        </div>
        <span className="text-[10px] font-bold bg-[#0c4b39] text-white px-2.5 py-0.5 rounded-full">
          NovaCare
        </span>
      </div>

      <CardContent className="p-4 space-y-3.5">
        {/* 1. Patient Profile Summary */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">1. Người khám bệnh</p>
          {profile ? (
            <div className="flex items-center gap-2.5 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-xs">
              <div className="w-8 h-8 rounded-full bg-[#0c4b39]/10 flex items-center justify-center text-[#0c4b39] font-bold shrink-0">
                {profile.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-secondary truncate">{profile.fullName}</p>
                <p className="text-[11px] text-gray-500">{profile.relation || 'Bản thân'}</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-dashed border-gray-200 text-center">
              Chưa chọn hồ sơ người bệnh
            </div>
          )}
        </div>

        {/* 2. Specialty & Service Summary */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">2. Chuyên khoa & Dịch vụ</p>
          {specialtyName || medicalServiceName ? (
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-xs space-y-0.5">
              <p className="font-extrabold text-secondary flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[#0c4b39] shrink-0" />
                <span>{specialtyName || 'Chuyên khoa Tiêu chuẩn'}</span>
              </p>
              {medicalServiceName && (
                <p className="text-[11px] text-gray-600 font-medium pl-5">
                  Dịch vụ: {medicalServiceName}
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-dashed border-gray-200 text-center">
              Chưa chọn chuyên khoa
            </div>
          )}
        </div>

        {/* 3. Examination Type Summary */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">3. Hình thức khám</p>
          {(() => {
            const currentType = examinationType || 'REGULAR';
            if (currentType === 'BHYT') {
              return (
                <div className="flex items-center justify-between bg-blue-50/80 p-2.5 rounded-xl border border-blue-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Khám Bảo hiểm y tế (BHYT)</span>
                  </div>
                  <Badge className="bg-blue-600 text-white text-[10px] font-bold border-none px-2">BHYT</Badge>
                </div>
              );
            }
            if (currentType === 'SERVICE') {
              return (
                <div className="flex items-center justify-between bg-amber-50/80 p-2.5 rounded-xl border border-amber-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Khám dịch vụ (Ưu tiên VIP)</span>
                  </div>
                  <Badge className="bg-amber-600 text-white text-[10px] font-bold border-none px-2">Ưu tiên</Badge>
                </div>
              );
            }
            return (
              <div className="flex items-center justify-between bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <Stethoscope className="w-4 h-4 text-[#0c4b39] shrink-0" />
                  <span>Khám thường (Tiêu chuẩn)</span>
                </div>
                <Badge className="bg-[#0c4b39] text-white text-[10px] font-bold border-none px-2">Tiêu chuẩn</Badge>
              </div>
            );
          })()}
        </div>

        {/* 4. Hospital & Doctor Summary */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">4. Bệnh viện & Bác sĩ</p>
          {hospitalName || doctorName || doctor ? (
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-xs space-y-1">
              <p className="font-extrabold text-secondary flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0c4b39] shrink-0" />
                <span className="truncate">{hospitalName || hospital?.name || workplace?.hospital?.name || 'Bệnh viện NovaCare'}</span>
              </p>
              {(doctorName || doctor) && (
                <p className="text-[11px] text-[#0c4b39] font-bold pl-5 truncate">
                  Bác sĩ: {doctorName || doctor?.fullName}
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-dashed border-gray-200 text-center">
              Chưa chọn bệnh viện & bác sĩ
            </div>
          )}
        </div>

        {/* 5. Date & Slot Summary */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">5. Ngày & Khung giờ</p>
          {displayDate || formattedTime ? (
            <div className="flex items-center gap-2.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-xs">
              <div className="w-8 h-8 rounded-lg bg-[#0c4b39] text-white flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-secondary">{formattedTime || 'Chưa chọn giờ'}</p>
                <p className="text-[11px] text-gray-500 capitalize">{displayDate || 'Chưa chọn ngày'}</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-dashed border-gray-200 text-center">
              Chưa chọn ngày & giờ
            </div>
          )}
        </div>

        {/* Fee Estimate */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Chi phí khám dự kiến:</span>
          <span className="font-black text-[#0c4b39] text-base">
            {formatPrice(consultationFee)}đ
          </span>
        </div>

        {/* Support Hotline Tag */}
        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-[#0c4b39]" />
            <span>Tổng đài tư vấn:</span>
          </div>
          <a href="tel:19002115" className="font-extrabold text-secondary hover:text-[#0c4b39]">
            1900 2115
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
