'use client';

import { useBookingStore } from '@/stores/booking.store';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { profileService } from '@/services/profile.service';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, User, FileText, Activity, ShieldCheck, PhoneCall, Sparkles, Stethoscope, Building2 } from 'lucide-react';

export function BookingSummary() {
  const { bookingData } = useBookingStore();
  const { doctorId, workplaceId, slot, patientProfileId, reason } = bookingData;

  // Fetch Doctor details
  const { data: doctor } = useQuery({
    queryKey: ['doctor-summary', doctorId],
    queryFn: () => doctorService.getById(doctorId!),
    enabled: !!doctorId,
  });

  // Find selected workplace
  const workplace = doctor?.workPlaces?.find((wp) => wp.id === workplaceId);

  // Fetch Patient Profile details
  const { data: profile } = useQuery({
    queryKey: ['profile-summary', patientProfileId],
    queryFn: () => profileService.getById(patientProfileId!),
    enabled: !!patientProfileId,
  });

  if (!doctorId) return null;

  const formattedTime = slot?.startTime
    ? new Date(slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;
  const formattedDate = slot?.startTime
    ? new Date(slot.startTime).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })
    : null;

  return (
    <Card className="sticky top-6 border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
      {/* Sidebar Header */}
      <div className="bg-[#4caf50]/10 px-4 py-3 border-b border-[#4caf50]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#4caf50]" />
          <span className="font-bold text-secondary text-sm">Tóm tắt lịch hẹn</span>
        </div>
        <span className="text-[10px] font-bold bg-[#4caf50] text-white px-2 py-0.5 rounded-full">
          NovaCare
        </span>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Doctor Summary */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bác sĩ & Cơ sở khám</p>
          <div className="flex items-start gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-[#4caf50]/10 flex items-center justify-center text-[#4caf50] font-bold text-sm shrink-0">
              {doctor?.fullName?.charAt(0) || 'BS'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-secondary text-sm truncate">{doctor?.fullName}</p>
              <p className="text-[11px] text-[#4caf50] font-medium truncate">{doctor?.qualification || 'Chuyên khoa'}</p>
              {workplace?.hospital && (
                <div className="mt-1.5 pt-1.5 border-t border-gray-200/60 text-[11px] text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-800 line-clamp-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#4caf50] shrink-0" />
                    {workplace.hospital.name}
                  </p>
                  <p className="text-gray-500 line-clamp-1 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                    {workplace.hospital.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time Summary */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Thời gian hẹn khám</p>
          {slot ? (
            <div className="flex items-center gap-3 bg-[#4caf50]/[0.03] p-3 rounded-xl border border-[#4caf50]/20">
              <div className="w-9 h-9 rounded-xl bg-[#4caf50] text-white flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-secondary text-sm">{formattedTime}</p>
                <p className="text-xs text-gray-500 capitalize">{formattedDate}</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 text-center">
              Chưa chọn ngày & giờ khám
            </div>
          )}
        </div>

        {/* Profile Summary */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Hồ sơ người khám</p>
          {profile ? (
            <div className="flex items-start gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-[#4caf50]/10 flex items-center justify-center text-[#4caf50] font-bold text-sm shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-secondary text-sm truncate">{profile.fullName}</p>
                <p className="text-[11px] text-gray-500">Mối quan hệ: {profile.relation || 'Bản thân'}</p>
                {reason && (
                  <p className="text-[11px] text-gray-600 truncate mt-1 pt-1 border-t border-gray-200/60">
                    Lý do: {reason}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 text-center">
              Chưa chọn hồ sơ người bệnh
            </div>
          )}
        </div>

        {/* Cost Summary */}
        {workplace && (
          <div className="pt-3 border-t border-gray-100 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Tạm tính phí khám:</span>
              <span className="font-bold text-secondary text-base">
                {Number(workplace.consultationFee).toLocaleString()}đ
              </span>
            </div>
          </div>
        )}

        {/* Support Hotline Tag */}
        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-[#4caf50]" />
            <span>Hỗ trợ đặt khám:</span>
          </div>
          <a href="tel:19002115" className="font-bold text-secondary hover:text-[#4caf50]">
            1900 2115
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

