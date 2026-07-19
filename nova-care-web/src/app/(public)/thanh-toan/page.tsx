'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import { appointmentService } from '@/services/appointment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Suspense } from 'react';

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
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
        toast.error('Không thể tạo liên kết thanh toán');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo link thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 bg-gray-50 min-h-screen items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container-custom py-12 text-center bg-gray-50 min-h-screen flex flex-col justify-center items-center">
        <p className="text-gray-500">Không tìm thấy lịch khám</p>
        <Button variant="link" onClick={() => router.back()} className="font-semibold mt-2">
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center text-secondary">Xác nhận thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="bg-gray-100/50 rounded-lg p-4 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã lịch khám:</span>
                <span className="font-semibold text-secondary">{appointment.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bác sĩ khám:</span>
                <span className="font-medium text-secondary">{appointment.slot?.doctorWorkplace?.doctor?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cơ sở y tế:</span>
                <span className="font-medium text-secondary">{appointment.slot?.doctorWorkplace?.hospital?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian khám:</span>
                <span className="font-medium text-secondary">
                  {appointment.slot?.startTime
                    ? new Date(appointment.slot.startTime).toLocaleString('vi-VN')
                    : '---'}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-secondary">Tổng thanh toán:</span>
                <span className="text-primary-dark">
                  {appointment.totalPrice?.toLocaleString() || 0}đ
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-secondary mb-3 text-sm">Phương thức thanh toán</h3>
              <div className="space-y-2">
                <Card
                  className="cursor-pointer border-2 border-primary bg-primary/5"
                  onClick={handlePayment}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary-dark" />
                      <div>
                        <p className="font-semibold text-secondary">VNPay</p>
                        <p className="text-xs text-gray-500">Thanh toán qua ví điện tử VNPay hoặc tài khoản ngân hàng</p>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-primary-dark" />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Payment Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang kết nối cổng VNPay...
                </>
              ) : (
                'Thanh toán ngay'
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center leading-normal">
              Bằng việc click thanh toán, bạn đồng ý với các điều khoản đặt khám & điều kiện dịch vụ y tế của NovaCare.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12 bg-gray-50 min-h-screen items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
