'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { profileService } from '@/services/profile.service';
import { doctorService } from '@/services/doctor.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ChevronRight, Loader2, Calendar, Clock, MapPin, User, FileText, FileCheck2, ShieldCheck, Stethoscope, Building2, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface StepConfirmProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepConfirm({ onNext, onBack }: StepConfirmProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const { slot, patientProfileId, workplaceId, reason, symptoms, doctorId, examinationType } = bookingData;
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Get selected profile details
  const { data: profile } = useQuery({
    queryKey: ['profile-details', patientProfileId],
    queryFn: () => profileService.getById(patientProfileId!),
    enabled: !!patientProfileId,
  });

  // Get selected workplace details
  const { data: workplace } = useQuery({
    queryKey: ['workplace-details', workplaceId],
    queryFn: () => doctorService.getWorkplace(workplaceId!),
    enabled: !!workplaceId,
  });

  // Get doctor details
  const { data: doctor } = useQuery({
    queryKey: ['doctor-details', doctorId],
    queryFn: () => doctorService.getById(doctorId!),
    enabled: !!doctorId,
  });

  const mutation = useMutation({
    mutationFn: appointmentService.create,
    onSuccess: (appointment) => {
      setBookingData({ appointmentId: appointment.id });
      toast.success('Xác nhận đặt lịch thành công! Tiến hành thanh toán.');
      onNext();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể tạo lịch khám. Vui lòng thử lại.');
    },
  });

  const handleConfirm = () => {
    if (!agreedTerms) {
      toast.error('Vui lòng đồng ý với điều khoản đặt lịch trước khi tiếp tục.');
      return;
    }

    if (!patientProfileId || !slot?.id) {
      toast.error('Thiếu thông tin đặt lịch');
      return;
    }

    const examTypeLabel =
      examinationType === 'BHYT'
        ? '[Khám BHYT]'
        : examinationType === 'SERVICE'
        ? '[Khám dịch vụ]'
        : '[Khám thường]';
    const finalReason = reason ? `${examTypeLabel} ${reason}` : examTypeLabel;

    const payload = {
      patientProfileId: patientProfileId,
      slotId: slot.id,
      reason: finalReason,
      symptoms: symptoms || undefined,
      idempotencyKey: `idempotency-${patientProfileId}-${slot.id}-${Date.now()}`,
    };

    mutation.mutate(payload);
  };

  const startTime = slot?.startTime ? new Date(slot.startTime) : null;
  const formattedTime = startTime
    ? startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const formattedDate = startTime
    ? startTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const fee = workplace ? Number(workplace.consultationFee) : 0;

  return (
    <div className="space-y-6">
      {/* Header Badge & Title */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4caf50]/10 text-[#4caf50] text-xs font-bold uppercase tracking-wider mb-1">
            <FileCheck2 className="w-3.5 h-3.5" />
            Bước 4: Xác nhận
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-secondary">Kiểm tra & Xác nhận thông tin</h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* Examination Type Card */}
        {(() => {
          const type = examinationType || 'REGULAR';
          if (type === 'BHYT') {
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Hình thức khám</span>
                    <h4 className="font-extrabold text-blue-950 text-sm">Khám Bảo hiểm y tế (BHYT)</h4>
                    <p className="text-blue-700 text-[11px]">Vui lòng xuất trình thẻ BHYT và CCCD khi đến khám.</p>
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white font-extrabold text-xs px-3 py-1 border-none rounded-xl">BHYT</Badge>
              </div>
            );
          }
          if (type === 'SERVICE') {
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-600 text-white shrink-0 shadow-xs">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Hình thức khám</span>
                    <h4 className="font-extrabold text-amber-950 text-sm">Khám dịch vụ (Khám ưu tiên)</h4>
                    <p className="text-amber-700 text-[11px]">Khám nhanh không chờ đợi, ưu tiên tiếp đón.</p>
                  </div>
                </div>
                <Badge className="bg-amber-600 text-white font-extrabold text-xs px-3 py-1 border-none rounded-xl">Ưu tiên</Badge>
              </div>
            );
          }
          return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#0c4b39] text-white shrink-0 shadow-xs">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Hình thức khám</span>
                  <h4 className="font-extrabold text-emerald-950 text-sm">Khám thường (Tiêu chuẩn)</h4>
                  <p className="text-emerald-800 text-[11px]">Quy trình xếp số thứ tự tiêu chuẩn bệnh viện.</p>
                </div>
              </div>
              <Badge className="bg-[#0c4b39] text-white font-extrabold text-xs px-3 py-1 border-none rounded-xl">Tiêu chuẩn</Badge>
            </div>
          );
        })()}

        {/* Doctor & Location Info Card */}
        <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#4caf50]" />
              Bác sĩ & Cơ sở khám bệnh
            </span>
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#4caf50]/10 flex items-center justify-center text-[#4caf50] font-bold text-lg shrink-0">
                {doctor?.fullName?.charAt(0) || 'BS'}
              </div>
              <div>
                <p className="font-bold text-secondary text-base">{doctor?.fullName}</p>
                <p className="text-xs font-semibold text-[#4caf50]">{doctor?.qualification || 'Bác sĩ chuyên khoa'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-1 text-xs">
              <div className="flex items-start gap-2 text-gray-700">
                <Building2 className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-secondary">{workplace?.hospital?.name}</span>
                  <p className="text-gray-500">{workplace?.hospital?.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Info Highlight Card */}
        <Card className="bg-[#4caf50]/[0.03] border border-[#4caf50]/20 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4caf50] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thời gian hẹn khám</p>
                  <p className="font-bold text-secondary text-base capitalize">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-100 shadow-2xs">
                <Clock className="h-4 w-4 text-[#4caf50]" />
                <span className="font-bold text-[#4caf50] text-sm">{formattedTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Profile Info Card */}
        <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#4caf50]" />
              Thông tin người khám bệnh
            </span>
          </div>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
              <div>
                <span className="text-gray-400">Họ và tên:</span>{' '}
                <strong className="text-secondary font-bold text-sm">{profile?.fullName}</strong>
              </div>
              <div>
                <span className="text-gray-400">Mối quan hệ:</span>{' '}
                <strong className="text-gray-800 font-medium">{profile?.relation || 'Bản thân'}</strong>
              </div>
              <div>
                <span className="text-gray-400">Số điện thoại:</span>{' '}
                <strong className="text-gray-800 font-medium">{profile?.phone || 'Chưa cập nhật'}</strong>
              </div>
              <div>
                <span className="text-gray-400">Số CCCD/CMND:</span>{' '}
                <strong className="text-gray-800 font-medium">{profile?.identityNumber || 'Chưa cập nhật'}</strong>
              </div>
            </div>

            {reason && (
              <div className="pt-2.5 border-t border-gray-100 flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400">Lý do khám:</span>
                  <p className="text-gray-700 font-medium">{reason}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
          <div className="flex justify-between items-center text-gray-600">
            <span>Phí khám bệnh:</span>
            <span className="font-semibold text-secondary">{fee.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Phí tiện ích đặt lịch:</span>
            <span className="font-semibold text-emerald-600">Miễn phí (0đ)</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm font-bold text-secondary">
            <span>Tổng tiền thanh toán:</span>
            <span className="text-lg text-[#4caf50]">{fee.toLocaleString()}đ</span>
          </div>
        </div>

        {/* Terms agreement checkbox */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <Checkbox
            id="terms"
            checked={agreedTerms}
            onCheckedChange={(checked) => setAgreedTerms(!!checked)}
            className="mt-0.5 border-[#4caf50] data-[state=checked]:bg-[#4caf50]"
          />
          <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
            Tôi đã kiểm tra kỹ các thông tin trên và đồng ý với{' '}
            <span className="font-semibold text-[#4caf50] underline">Quy định đặt lịch & Chính sách dịch vụ</span> của NovaCare.
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack} disabled={mutation.isPending} className="rounded-xl px-5 text-gray-600 border-gray-300 hover:bg-gray-50 font-semibold cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Quay lại
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={mutation.isPending || !agreedTerms}
          className="bg-[#4caf50] hover:bg-[#439e47] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Đang xác nhận lịch hẹn...
            </>
          ) : (
            <>
              Xác nhận & Tiến hành thanh toán
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

