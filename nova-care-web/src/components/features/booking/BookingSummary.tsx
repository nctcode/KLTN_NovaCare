'use client';

import { useBookingStore } from '@/stores/booking.store';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { profileService } from '@/services/profile.service';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, User, FileText, Activity, CreditCard, Sparkles } from 'lucide-react';

export function BookingSummary() {
  const { bookingData } = useBookingStore();
  const { doctorId, workplaceId, slot, patientProfileId, reason, symptoms } = bookingData;

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
    ? new Date(slot.startTime).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })
    : null;

  return (
    <Card className="sticky top-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
      <div className="bg-[#4caf50]/10 px-4 py-3.5 border-b border-[#4caf50]/20 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#4caf50]" />
        <span className="font-bold text-secondary text-sm">Thông tin đặt lịch</span>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Doctor Summary */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Bác sĩ & địa điểm</p>
          <div className="flex items-start gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-[#4caf50]/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-[#4caf50]" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-secondary text-sm truncate">{doctor?.fullName}</p>
              <p className="text-[11px] text-gray-500 truncate">{doctor?.qualification}</p>
              {workplace && (
                <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-start gap-1">
                  <MapPin className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                    {workplace.hospital?.name} - {workplace.hospital?.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time Summary */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Thời gian khám</p>
          {slot ? (
            <div className="flex items-start gap-3 bg-[#4caf50]/5 p-3 rounded-xl border border-[#4caf50]/20">
              <div className="w-10 h-10 rounded-full bg-[#4caf50]/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-[#4caf50]" />
              </div>
              <div>
                <p className="font-bold text-secondary text-sm">{formattedTime}</p>
                <p className="text-xs text-gray-600 capitalize">{formattedDate}</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-200 text-center">
              Chưa chọn thời gian khám
            </div>
          )}
        </div>

        {/* Profile Summary */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Người khám bệnh</p>
          {profile ? (
            <div className="flex items-start gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#4caf50]/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-[#4caf50]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-secondary text-sm truncate">{profile.fullName}</p>
                <p className="text-[11px] text-gray-500">Mối quan hệ: {profile.relation || 'Bản thân'}</p>
                {reason && (
                  <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-start gap-1">
                    <FileText className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-gray-600 truncate">Lý do: {reason}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-200 text-center">
              Chưa chọn hồ sơ người bệnh
            </div>
          )}
        </div>

        {/* Cost summary */}
        {workplace && (
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500">Phí khám bệnh:</span>
            <span className="font-bold text-secondary text-base">
              {Number(workplace.consultationFee).toLocaleString()}đ
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
