'use client';

import { useState } from 'react';
import { useBookingStore } from '@/stores/booking.store';
import { paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, CheckCircle, Loader2, Calendar, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';

export function StepPayment() {
  const { bookingData, resetBooking } = useBookingStore();
  const { appointmentId } = bookingData;
  const [isProcessing, setIsProcessing] = useState(false);

  // Get created appointment details
  const { data: appointment, isLoading: loadingAppointment } = useQuery({
    queryKey: ['appointment-created', appointmentId],
    queryFn: () => appointmentService.getById(appointmentId!),
    enabled: !!appointmentId,
  });

  const handlePayment = async () => {
    if (!appointmentId) return;
    setIsProcessing(true);
    try {
      const result = await paymentService.createPayment(appointmentId);
      if (result && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        toast.error('Không thể tạo link thanh toán VNPay');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadingAppointment) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-10 w-10 text-[#4caf50]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Thanh toán lịch khám</h2>

      <div className="bg-[#4caf50]/10 border border-[#4caf50]/20 rounded-lg p-4 flex gap-3 items-start">
        <CheckCircle className="h-6 w-6 text-[#4caf50] shrink-0" />
        <div>
          <p className="font-semibold text-secondary">Lịch hẹn đã được giữ chỗ!</p>
          <p className="text-sm text-gray-600">
            Vui lòng thực hiện thanh toán trong vòng 15 phút để hoàn tất quy trình xác nhận lịch khám.
          </p>
        </div>
      </div>

      {appointment && (
        <Card className="bg-gray-50/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Mã đặt lịch:</span>
              <span className="font-semibold text-secondary">{appointment.bookingCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Người khám:</span>
              <span className="font-medium text-secondary">{appointment.patientProfile?.fullName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bác sĩ:</span>
              <span className="font-medium text-secondary">
                {appointment.slot?.doctorWorkplace?.doctor?.fullName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Thời gian:</span>
              <span className="font-medium text-secondary">
                {appointment.slot?.startTime
                  ? new Date(appointment.slot.startTime).toLocaleString('vi-VN')
                  : '---'}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-3 border-t text-base text-secondary">
              <span>Tổng tiền thanh toán:</span>
              <span className="text-[#4caf50]">{appointment.totalPrice?.toLocaleString() || 0}đ</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="font-medium text-secondary text-sm">Chọn phương thức thanh toán</h3>
        <Card
          className="border-2 border-[#4caf50] bg-[#4caf50]/5 cursor-pointer"
          onClick={handlePayment}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[#4caf50]" />
              <div>
                <p className="font-semibold text-secondary">VNPay</p>
                <p className="text-xs text-gray-500">Thanh toán qua tài khoản ngân hàng, ví điện tử</p>
              </div>
            </div>
            <CheckCircle className="h-5 w-5 text-[#4caf50]" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t">
        <Button 
          size="lg" 
          className="w-full bg-[#4caf50] hover:bg-[#439e47] text-white font-bold cursor-pointer transition-all disabled:opacity-50" 
          onClick={handlePayment} 
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Đang chuyển hướng đến cổng thanh toán VNPay...
            </>
          ) : (
            'Thanh toán ngay'
          )}
        </Button>
      </div>
    </div>
  );
}
