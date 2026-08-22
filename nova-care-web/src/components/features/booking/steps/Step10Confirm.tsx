'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { paymentService } from '@/services/payment.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  Home,
  CreditCard,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export function Step10Confirm() {
  const queryClient = useQueryClient();
  const { bookingData, resetBooking } = useBookingStore();
  const { appointmentId } = bookingData;
  const [selectedMethod, setSelectedMethod] = useState<'MOMO' | 'VIETQR' | 'CARD'>('MOMO');

  const { data: appointment, refetch } = useQuery({
    queryKey: ['appointment-detail-step10', appointmentId],
    queryFn: () => appointmentService.getById(appointmentId!),
    enabled: !!appointmentId,
  });

  const payMutation = useMutation({
    mutationFn: () => paymentService.simulateSuccess(appointmentId!, selectedMethod),
    onSuccess: () => {
      toast.success('Thanh toán thành công! Lịch khám đã chuyển sang trạng thái Đã thanh toán');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Thanh toán thất bại');
    },
  });

  const isPaid = appointment?.status === 'PAID' || appointment?.status === 'CONFIRMED' || appointment?.status === 'COMPLETED';
  const bookingCode = appointment?.bookingCode || `NOVA-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const totalPrice = appointment?.totalPrice || bookingData.totalPrice || 200000;

  return (
    <div className="space-y-6 text-center animate-in zoom-in-95 duration-300 py-4">
      {/* Animated Icon Badge */}
      <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-lg ring-8 transition-all ${
        isPaid
          ? 'bg-emerald-100 text-[#0c4b39] ring-emerald-50 shadow-emerald-100'
          : 'bg-amber-100 text-amber-700 ring-amber-50 shadow-amber-100'
      }`}>
        {isPaid ? (
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        ) : (
          <CreditCard className="w-9 h-9 stroke-[2]" />
        )}
      </div>

      <div className="space-y-1.5 max-w-lg mx-auto">
        <Badge className={`${isPaid ? 'bg-[#0c4b39]' : 'bg-amber-600'} text-white font-extrabold text-xs px-3 py-1 border-none rounded-full`}>
          {isPaid ? 'Thanh Toán Thành Công' : 'Bước 10: Thanh Toán Đặt Khám'}
        </Badge>
        <h2 className="text-2xl md:text-3xl font-black text-secondary">
          {isPaid ? 'Thanh Toán & Đặt Lịch Thành Công!' : 'Xác Nhận & Thanh Toán Lịch Hẹn'}
        </h2>
        <p className="text-xs md:text-sm text-gray-500 font-medium">
          {isPaid
            ? 'Lịch hẹn của bạn đã chuyển sang trạng thái ĐÃ THANH TOÁN. Bạn có thể vào xem chi tiết lịch khám và mô phỏng hoàn tất khám.'
            : 'Vui lòng thực hiện thanh toán chi phí để hoàn tất xác nhận lịch hẹn khám với bệnh viện.'}
        </p>
      </div>

      {/* Booking Code Card */}
      <div className="max-w-md mx-auto bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mã Tra Cứu Lịch Hẹn</p>
        <p className="text-2xl md:text-3xl font-black text-[#0c4b39] tracking-wider select-all">{bookingCode}</p>
        <p className="text-[11px] text-emerald-800 font-medium">
          Trạng thái hiện tại: <strong className="uppercase">{isPaid ? '✅ ĐÃ THANH TOÁN' : '⏳ CHỜ THANH TOÁN'}</strong>
        </p>
      </div>

      {/* Instant Payment Simulation Card (If not paid yet) */}
      {!isPaid && (
        <Card className="max-w-xl mx-auto border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white rounded-2xl p-5 space-y-4 text-left shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 text-sm">Cổng Thanh Toán Demo (Instant Payment)</h3>
            </div>
            <span className="text-lg font-black text-[#0c4b39]">
              {totalPrice.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 block">Chọn phương thức thanh toán:</label>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              {[
                { id: 'MOMO', name: 'Ví MoMo', icon: '💖' },
                { id: 'VIETQR', name: 'VietQR / CK', icon: '🏦' },
                { id: 'CARD', name: 'Thẻ Quốc Tế', icon: '💳' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedMethod === m.id
                      ? 'border-[#0c4b39] bg-emerald-100/80 text-[#0c4b39] font-black'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending || !appointmentId}
            className="w-full bg-[#0c4b39] hover:bg-[#09382b] text-white font-black text-sm h-12 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {payMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang xử lý giao dịch thanh toán...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Mô Phỏng Thanh Toán Thành Công (Demo Instant)</span>
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Appointment Details Card */}
      <Card className="max-w-xl mx-auto border border-gray-200 rounded-2xl overflow-hidden text-left bg-white shadow-xs">
        <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#0c4b39]" />
            Chi tiết thông tin lịch hẹn
          </span>
          <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
            isPaid ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
          }`}>
            {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
          </span>
        </div>

        <CardContent className="p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Người khám bệnh</span>
              <strong className="text-secondary font-bold text-sm">
                {appointment?.patientProfile?.fullName || bookingData.patientProfileId || 'Bệnh nhân'}
              </strong>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Bác sĩ khám</span>
              <strong className="text-secondary font-bold text-sm">
                {appointment?.slot?.doctorWorkplace?.doctor?.fullName || bookingData.doctorName || 'Bác sĩ chuyên khoa'}
              </strong>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Chuyên khoa & Dịch vụ</span>
              <strong className="text-gray-800 font-bold">
                {bookingData.specialtyName || 'Chuyên khoa'} - {bookingData.medicalServiceName || 'Khám tiêu chuẩn'}
              </strong>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Hình thức khám</span>
              <strong className="text-[#0c4b39] font-bold">
                {bookingData.examinationType === 'BHYT'
                  ? 'Khám Bảo hiểm y tế (BHYT)'
                  : bookingData.examinationType === 'SERVICE'
                  ? 'Khám Dịch vụ VIP'
                  : 'Khám thường'}
              </strong>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/60 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0c4b39]" />
              <span className="font-bold text-secondary">{bookingData.selectedDate || 'Ngày khám đã chọn'}</span>
            </div>
            {bookingData.slot?.startTime && (
              <div className="flex items-center gap-1.5 font-black text-[#0c4b39]">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date(bookingData.slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <Link href="/">
          <Button variant="outline" onClick={() => resetBooking()} className="rounded-xl px-6 font-bold text-gray-700 cursor-pointer">
            <Home className="w-4 h-4 mr-1.5" />
            Về Trang Chủ
          </Button>
        </Link>

        {isPaid ? (
          <Link href={appointmentId ? `/lich-kham/${appointmentId}` : '/lich-kham'}>
            <Button
              onClick={() => resetBooking()}
              className="bg-[#0c4b39] hover:bg-[#09382b] text-white px-8 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-100 cursor-pointer"
            >
              <span>Xem Chi Tiết Lịch Khám & Mô Phỏng Trả Hồ Sơ</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/lich-kham">
            <Button variant="outline" className="border-slate-300 font-bold text-slate-700 rounded-xl px-6">
              Xem danh sách lịch khám của tôi
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
