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
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: appointment, isLoading, refetch } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentService.getById(appointmentId!),
    enabled: !!appointmentId,
  });

  const handleSimulatePayment = async (method: string = 'MOMO') => {
    if (!appointmentId) return;
    setIsProcessing(true);
    try {
      await paymentService.simulateSuccess(appointmentId, method);
      toast.success('🎉 Thanh toán thành công! Lịch hẹn của bạn đã chuyển sang Đã xác nhận.');
      setIsSuccess(true);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVNPayPayment = async () => {
    if (!appointmentId) return;
    setIsProcessing(true);
    try {
      const result = await paymentService.createPayment(appointmentId);
      if (result && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        toast.error('Không thể tạo liên kết VNPay, đang chuyển sang thanh toán thử nghiệm...');
        await handleSimulatePayment('VNPAY');
      }
    } catch (error: any) {
      toast.info('Tự động xác nhận thanh toán thử nghiệm cho Demo...');
      await handleSimulatePayment('MOMO');
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

  if (isSuccess || appointment.status === 'PAID' || appointment.status === 'CONFIRMED') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center p-4">
        <Card className="border-emerald-200 bg-white shadow-md max-w-lg w-full rounded-2xl overflow-hidden">
          <div className="bg-emerald-600 p-6 text-white text-center space-y-2">
            <div className="w-16 h-16 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-extrabold">Thanh toán thành công!</h2>
            <p className="text-emerald-100 text-xs font-medium">Phiếu khám của bạn đã được xác nhận thành công</p>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã phiếu khám:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{appointment.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">ĐÃ THANH TOÁN (PAID)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bác sĩ khám:</span>
                <span className="font-bold text-slate-900">{appointment.slot?.doctorWorkplace?.doctor?.fullName || 'Bác sĩ phụ trách'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng chi phí:</span>
                <span className="font-extrabold text-emerald-700 text-sm">{appointment.totalPrice?.toLocaleString() || 0}đ</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <Button
                onClick={() => router.push(`/lich-kham/${appointment.id}`)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl shadow-xs"
              >
                Xem chi tiết lịch khám & Mô phỏng Bác sĩ khám ➔
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/lich-kham')}
                className="w-full text-xs font-semibold text-slate-700 border-slate-300"
              >
                Về danh sách lịch khám của tôi
              </Button>
            </div>
          </CardContent>
        </Card>
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
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-slate-900 font-extrabold">Xác nhận thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="bg-slate-100/70 rounded-xl p-4 space-y-2 text-xs text-slate-700 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã phiếu khám:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{appointment.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bác sĩ khám:</span>
                <span className="font-bold text-slate-900">{appointment.slot?.doctorWorkplace?.doctor?.fullName || 'Bác sĩ phụ trách'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cơ sở y tế:</span>
                <span className="font-bold text-slate-900">{appointment.slot?.doctorWorkplace?.hospital?.name || 'Cơ sở y tế NovaCare'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian khám:</span>
                <span className="font-bold text-slate-900">
                  {appointment.slot?.startTime
                    ? new Date(appointment.slot.startTime).toLocaleString('vi-VN')
                    : '---'}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">Tổng chi phí thanh toán:</span>
                <span className="text-2xl font-extrabold text-emerald-600">
                  {appointment.totalPrice?.toLocaleString() || 0}đ
                </span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Chọn phương thức thanh toán:</h3>
              
              {/* Instant Demo Payment */}
              <div
                className="cursor-pointer p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 transition-all flex items-center justify-between"
                onClick={() => handleSimulatePayment('MOMO')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-950 text-sm">Thanh toán Thử nghiệm Tức thì (Demo Instant)</p>
                    <p className="text-xs text-emerald-700">Xác nhận thanh toán ngay lập tức cho buổi khám KLTN</p>
                  </div>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0" disabled={isProcessing}>
                  Thanh toán ngay
                </Button>
              </div>

              {/* VNPay Online Payment */}
              <div
                className="cursor-pointer p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between"
                onClick={handleVNPayPayment}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Ví VNPay / Thẻ ATM Ngân hàng</p>
                    <p className="text-xs text-slate-500">Cổng thanh toán trực tuyến VNPay</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Action Button */}
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl shadow-xs"
              size="lg"
              onClick={() => handleSimulatePayment('MOMO')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý thanh toán...
                </>
              ) : (
                'Xác nhận & Thanh toán ngay'
              )}
            </Button>

            <p className="text-xs text-slate-400 text-center leading-normal">
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
