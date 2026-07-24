'use client';

import { useState } from 'react';
import { useBookingStore } from '@/stores/booking.store';
import { paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, CheckCircle2, Loader2, Calendar, MapPin, User, ShieldCheck, Clock, QrCode, Wallet, Building2, ChevronRight, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';

const paymentMethods = [
  {
    id: 'vnpay',
    name: 'VNPay (Thẻ ATM, Internet Banking, QR Code)',
    description: 'Thanh toán trực tiếp qua ứng dụng ngân hàng hoặc thẻ ATM nội địa',
    icon: CreditCard,
    popular: true,
  },
  {
    id: 'momo',
    name: 'Ví điện tử MoMo',
    description: 'Quét mã QR bằng ứng dụng MoMo trên điện thoại',
    icon: Wallet,
    popular: false,
  },
  {
    id: 'vietqr',
    name: 'Chuyển khoản VietQR Chanh chóng',
    description: 'Chuyển khoản qua mã QR Ngân hàng (Miễn phí giao dịch)',
    icon: QrCode,
    popular: false,
  },
  {
    id: 'card',
    name: 'Thẻ quốc tế (Visa, Mastercard, JCB)',
    description: 'Hỗ trợ tất cả các dòng thẻ tín dụng & ghi nợ quốc tế',
    icon: CreditCard,
    popular: false,
  },
];

export function StepPayment() {
  const { bookingData } = useBookingStore();
  const { appointmentId } = bookingData;
  const [selectedMethod, setSelectedMethod] = useState('vnpay');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get created appointment details
  const { data: appointment, isLoading: loadingAppointment } = useQuery({
    queryKey: ['appointment-created', appointmentId],
    queryFn: () => appointmentService.getById(appointmentId!),
    enabled: !!appointmentId,
  });

  const handlePayment = async () => {
    if (!appointmentId) {
      toast.error('Không tìm thấy thông tin lịch hẹn để thanh toán');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await paymentService.createPayment(appointmentId);
      if (result && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        toast.error('Không thể khởi tạo cổng thanh toán');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadingAppointment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
        <p className="text-sm">Đang tải thông tin lịch hẹn...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Badge & Title */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4caf50]/10 text-[#4caf50] text-xs font-bold uppercase tracking-wider mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            Bước 5: Thanh toán
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-secondary">Thanh toán & Hoàn tất đặt lịch</h2>
        </div>
      </div>

      {/* Reservation Timer Banner */}
      <div className="bg-[#4caf50]/10 border border-[#4caf50]/30 rounded-2xl p-4 flex gap-3 items-start">
        <Clock className="h-5 w-5 text-[#4caf50] shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 space-y-0.5">
          <p className="font-bold text-secondary text-sm">Lịch khám của bạn đã được giữ chỗ thành công!</p>
          <p className="text-gray-600">
            Vui lòng chọn phương thức và hoàn tất thanh toán trong vòng <strong className="text-[#4caf50]">15:00 phút</strong> để nhận mã phiếu khám.
          </p>
        </div>
      </div>

      {/* Order Summary Brief Card */}
      {appointment && (
        <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <CardContent className="p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-400">Mã phiếu đặt khám:</span>
              <span className="font-bold text-[#4caf50] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 font-mono text-sm">
                {appointment.bookingCode || 'NC-884920'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
              <div>
                <span className="text-gray-400">Người khám:</span>{' '}
                <strong className="text-secondary">{appointment.patientProfile?.fullName}</strong>
              </div>
              <div>
                <span className="text-gray-400">Bác sĩ:</span>{' '}
                <strong className="text-secondary">{appointment.slot?.doctorWorkplace?.doctor?.fullName}</strong>
              </div>
              <div>
                <span className="text-gray-400">Thời gian:</span>{' '}
                <strong className="text-secondary">
                  {appointment.slot?.startTime
                    ? new Date(appointment.slot.startTime).toLocaleString('vi-VN')
                    : '---'}
                </strong>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 font-bold text-sm">
              <span className="text-secondary">Tổng thanh toán:</span>
              <span className="text-xl text-[#4caf50]">
                {appointment.totalPrice?.toLocaleString() || '350.000'}đ
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Selector */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
          Chọn phương thức thanh toán
        </label>

        <div className="space-y-2.5">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;

            return (
              <Card
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`cursor-pointer transition-all duration-200 rounded-2xl overflow-hidden bg-white ${
                  isSelected
                    ? 'border-2 border-[#4caf50] bg-[#4caf50]/[0.02] shadow-sm ring-2 ring-[#4caf50]/20'
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
              >
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#4caf50] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-secondary text-sm truncate">{method.name}</p>
                        {method.popular && (
                          <span className="text-[9px] font-bold bg-[#4caf50] text-white px-1.5 py-0.5 rounded">
                            Khuyên dùng
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{method.description}</p>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#4caf50] bg-[#4caf50]' : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-gray-400 justify-center py-1">
        <Lock className="w-3.5 h-3.5 text-emerald-600" />
        <span>Giao dịch an toàn & mã hóa SSL 256-bit chuẩn ngân hàng</span>
      </div>

      {/* Action button */}
      <div className="pt-2">
        <Button
          size="lg"
          className="w-full bg-[#4caf50] hover:bg-[#439e47] text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-100 transition-all cursor-pointer disabled:opacity-50 text-base"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Đang chuyển hướng thanh toán...
            </>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Thanh toán ngay</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}

