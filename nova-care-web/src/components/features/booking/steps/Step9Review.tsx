'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { profileService } from '@/services/profile.service';
import { doctorService } from '@/services/doctor.service';
import { hospitalService } from '@/services/hospital.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  FileCheck2,
  ShieldCheck,
  Stethoscope,
  Building2,
  CheckCircle2,
  Zap,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface Step9ReviewProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step9Review({ onNext, onBack }: Step9ReviewProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const {
    slot,
    patientProfileId,
    hospitalId,
    hospitalName,
    specialtyId,
    specialtyName,
    medicalServiceName,
    doctorId,
    doctorName,
    workplaceId,
    reason: initialReason,
    symptoms: initialSymptoms,
    examinationType,
  } = bookingData;

  const [agreedTerms, setAgreedTerms] = useState(true);
  const [reason, setReason] = useState(initialReason || '');
  const [symptoms, setSymptoms] = useState(initialSymptoms || '');

  // Get selected profile details
  const { data: profile } = useQuery({
    queryKey: ['profile-details-step9', patientProfileId],
    queryFn: () => profileService.getById(patientProfileId!),
    enabled: !!patientProfileId,
  });

  // Get selected doctor details
  const { data: doctor } = useQuery({
    queryKey: ['doctor-details-step9', doctorId],
    queryFn: () => doctorService.getById(doctorId!),
    enabled: !!doctorId,
  });

  // Get selected hospital details
  const { data: hospital } = useQuery({
    queryKey: ['hospital-details-step9', hospitalId],
    queryFn: () => hospitalService.getById(hospitalId!),
    enabled: !!hospitalId,
  });

  const workplace = doctor?.workPlaces?.find((wp) => wp.id === workplaceId) || doctor?.workPlaces?.[0];

  const mutation = useMutation({
    mutationFn: appointmentService.create,
    onSuccess: (data) => {
      setBookingData({ appointmentId: data.id });
      toast.success('Đặt lịch khám thành công!');
      onNext();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo lịch hẹn. Vui lòng thử lại.');
    },
  });

  const handleConfirm = () => {
    if (!patientProfileId || !slot?.id) {
      toast.error('Thiếu thông tin đặt lịch bắt buộc');
      return;
    }

    if (!agreedTerms) {
      toast.error('Vui lòng xác nhận đồng ý với điều khoản đặt lịch khám.');
      return;
    }

    const examTypeLabel =
      examinationType === 'BHYT'
        ? '[Khám BHYT]'
        : examinationType === 'SERVICE'
        ? '[Khám dịch vụ]'
        : '[Khám thường]';

    const serviceTag = medicalServiceName ? ` [Dịch vụ: ${medicalServiceName}]` : '';
    const finalReason = `${examTypeLabel}${serviceTag} ${reason}`.trim();

    const payload = {
      patientProfileId: patientProfileId,
      slotId: slot.id,
      reason: finalReason,
      symptoms: symptoms || undefined,
      idempotencyKey: `idempotency-${patientProfileId}-${slot.id}-${Date.now()}`,
    };

    setBookingData({ reason, symptoms });
    mutation.mutate(payload);
  };

  const startTime = slot?.startTime ? new Date(slot.startTime) : null;
  const formattedTime = startTime
    ? startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const formattedDate = startTime
    ? startTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const fee = workplace ? Number(workplace.consultationFee) : 300000;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0c4b39]/10 text-[#0c4b39] text-xs font-black uppercase tracking-wider mb-1">
            <FileCheck2 className="w-3.5 h-3.5" />
            Bước 9: Kiểm tra thông tin đặt lịch
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-secondary">Kiểm Tra & Xác Nhận Đặt Lịch</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Vui lòng rà soát lại toàn bộ 8 hạng mục chi tiết bên dưới trước khi bấm xác nhận.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Examination Type Badge Banner */}
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
                    <h4 className="font-extrabold text-amber-950 text-sm">Khám dịch vụ (Ưu tiên VIP)</h4>
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

        {/* 2. Doctor & Hospital Info Grid Card */}
        <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#0c4b39]" />
              Cơ sở khám & Bác sĩ phụ trách
            </span>
          </div>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Chuyên khoa & Dịch vụ</p>
                <p className="font-extrabold text-secondary text-sm">{specialtyName || 'Chuyên khoa Tiêu chuẩn'}</p>
                <p className="text-gray-600 font-medium flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-[#0c4b39]" />
                  Dịch vụ: {medicalServiceName || `Khám Chuyên Khoa ${specialtyName || ''}`}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Bác sĩ khám</p>
                <p className="font-extrabold text-secondary text-sm">{doctorName || doctor?.fullName}</p>
                <p className="text-gray-500 font-medium">{doctor?.qualification || 'Chuyên gia y tế'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-start gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-[#0c4b39] shrink-0 mt-0.5" />
              <div>
                <strong className="text-secondary font-bold">{hospitalName || workplace?.hospital?.name || 'Bệnh viện NovaCare'}</strong>
                <p className="text-gray-500">{hospital?.address || workplace?.hospital?.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Appointment Date & Time Highlight Card */}
        <Card className="bg-[#0c4b39]/[0.03] border border-[#0c4b39]/20 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0c4b39] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thời gian hẹn khám</p>
                  <p className="font-extrabold text-secondary text-base capitalize">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                <Clock className="h-4 w-4 text-[#0c4b39]" />
                <span className="font-black text-[#0c4b39] text-sm">{formattedTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Patient Profile Info Card */}
        <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-100">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0c4b39]" />
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
          </CardContent>
        </Card>

        {/* 5. Inputs for Reason & Symptoms */}
        <Card className="bg-gray-50/70 border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#0c4b39]" />
              Lý do chính đi khám
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Đau đầu dai dẳng, kiểm tra sức khỏe định kỳ, tái khám..."
              className="bg-white border-gray-200 focus-visible:ring-0 focus-visible:border-[#0c4b39] rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="symptoms" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-[#0c4b39]" />
              Triệu chứng cụ thể (tùy chọn)
            </Label>
            <Input
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Ví dụ: Đau tăng khi vận động, ho nhẹ 3 ngày nay..."
              className="bg-white border-gray-200 focus-visible:ring-0 focus-visible:border-[#0c4b39] rounded-xl text-sm"
            />
          </div>
        </Card>

        {/* 6. Terms Agreement Checkbox */}
        <div className="flex items-start space-x-3 pt-2 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
          <Checkbox
            id="terms"
            checked={agreedTerms}
            onCheckedChange={(checked) => setAgreedTerms(Boolean(checked))}
            className="mt-0.5 data-[state=checked]:bg-[#0c4b39] data-[state=checked]:border-[#0c4b39]"
          />
          <Label htmlFor="terms" className="text-xs text-gray-700 leading-relaxed cursor-pointer font-medium">
            Tôi xác nhận toàn bộ thông tin người bệnh và lịch hẹn trên là hoàn toàn chính xác. Tôi đồng ý tuân thủ quy định tiếp đón của bệnh viện NovaCare.
          </Label>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={mutation.isPending}
          className="rounded-xl px-5 text-gray-600 border-gray-300 hover:bg-gray-50 font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Quay lại
        </Button>

        <Button
          onClick={handleConfirm}
          disabled={mutation.isPending || !agreedTerms}
          className="bg-[#0c4b39] hover:bg-[#09382b] text-white px-8 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang khởi tạo lịch hẹn...
            </>
          ) : (
            <>
              Xác Nhận Đặt Lịch
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
