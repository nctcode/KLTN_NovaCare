'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { profileService } from '@/services/profile.service';
import { doctorService } from '@/services/doctor.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronRight, Loader2, Calendar, Clock, MapPin, User, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface StepConfirmProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepConfirm({ onNext, onBack }: StepConfirmProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const { slot, patientProfileId, workplaceId, reason, symptoms, doctorId } = bookingData;
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.success('Đặt lịch khám thành công! Hãy thực hiện thanh toán.');
      onNext();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể tạo lịch khám. Vui lòng thử lại.');
    },
  });

  const handleConfirm = () => {
    if (!patientProfileId || !slot?.id) {
      toast.error('Thiếu thông tin đặt lịch');
      return;
    }

    const payload = {
      patientProfileId: patientProfileId,
      slotId: slot.id,
      reason: reason || undefined,
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
      <h2 className="text-xl font-semibold text-secondary">Xác nhận thông tin đặt lịch</h2>

      <div className="space-y-4">
        {/* Doctor & Location Info */}
        <Card className="bg-gray-50/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-primary-dark shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Bác sĩ khám</p>
                <p className="font-semibold text-secondary">{doctor?.fullName}</p>
                <p className="text-xs text-gray-500">{doctor?.qualification}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-t pt-3">
              <MapPin className="h-5 w-5 text-primary-dark shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Địa điểm khám</p>
                <p className="font-semibold text-secondary">{workplace?.hospital?.name}</p>
                <p className="text-xs text-gray-500">{workplace?.hospital?.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Info */}
        <Card className="bg-gray-50/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary-dark shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Ngày khám</p>
                <p className="font-semibold text-secondary capitalize">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-t pt-3">
              <Clock className="h-5 w-5 text-primary-dark shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Thời gian khám</p>
                <p className="font-semibold text-secondary">{formattedTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Profile Info */}
        <Card className="bg-gray-50/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-primary-dark shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Người khám</p>
                <p className="font-semibold text-secondary">{profile?.fullName}</p>
                <p className="text-xs text-gray-500">Mối quan hệ: {profile?.relation || 'Bản thân'}</p>
              </div>
            </div>
            {reason && (
              <div className="flex items-start gap-3 border-t pt-3">
                <FileText className="h-5 w-5 text-primary-dark shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Lý do khám</p>
                  <p className="text-sm text-gray-650 leading-relaxed">{reason}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Info */}
        <div className="flex justify-between items-center bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-dark" />
            <span className="font-semibold text-secondary text-sm">Phí khám bệnh</span>
          </div>
          <span className="font-bold text-secondary text-lg">{fee.toLocaleString()}đ</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={mutation.isPending}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <Button onClick={handleConfirm} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Đang xác nhận...
            </>
          ) : (
            <>
              Xác nhận & Đặt lịch
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
