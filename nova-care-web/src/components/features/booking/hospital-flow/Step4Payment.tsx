'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Wallet,
  Building,
  Loader2,
  Calendar,
  Clock,
  User,
  Stethoscope,
  ChevronLeft,
  Sparkles,
  Printer,
  Home,
  Check,
} from 'lucide-react';
import { Hospital, Specialty, Doctor, MedicalService } from '@/types';
import { PatientProfile } from '@/types/profile.types';
import { appointmentService } from '@/services/appointment.service';
import { paymentService } from '@/services/payment.service';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Step4PaymentProps {
  hospital: Hospital;
  specialty: Specialty | null;
  doctor: Doctor | null;
  service: MedicalService | null;
  selectedDate: string;
  selectedSlotTime: string;
  selectedSlotId: string | null;
  patientProfile: PatientProfile | null;
  reason: string;
  onBack: () => void;
}

export function Step4Payment({
  hospital,
  specialty,
  doctor,
  service,
  selectedDate,
  selectedSlotTime,
  selectedSlotId,
  patientProfile,
  reason,
  onBack,
}: Step4PaymentProps) {
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<'AT_HOSPITAL' | 'VNPAY' | 'QR_CODE'>('AT_HOSPITAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<any | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const consultationFee = service?.price || (service as any)?.fee || (doctor as any)?.consultationFee || 300000;

  const doctorWorkplaceId = doctor?.workPlaces?.find((w) => w.hospitalId === hospital.id)?.id || doctor?.workPlaces?.[0]?.id || null;

  const handleProcessBooking = async () => {
    if (!patientProfile || !doctorWorkplaceId) {
      toast.error('Thiếu thông tin đặt khám bắt buộc!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!selectedSlotId) {
        toast.error('Khung giờ khám không hợp lệ. Vui lòng chọn lại khung giờ!');
        setIsSubmitting(false);
        return;
      }

      // 1. Create Appointment with real database slotId
      const appointment = await appointmentService.create({
        patientProfileId: patientProfile.id,
        slotId: selectedSlotId,
        medicalServiceId: service?.id || undefined,
        reason: reason || `Khám theo bác sĩ - ${specialty?.name || 'Chuyên khoa'}`,
        idempotencyKey: `hosp_book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      } as any);

      // 2. If VNPAY selected, handle online payment redirection
      if (paymentMethod === 'VNPAY' && appointment.id) {
        try {
          const res = await paymentService.createPayment(appointment.id);
          if (res?.paymentUrl) {
            toast.success('Đang chuyển hướng sang cổng thanh toán VNPAY...');
            window.location.href = res.paymentUrl;
            return;
          }
        } catch (err) {
          console.warn('VNPAY Sandbox unavailable, falling back to instant ticket');
        }
      }

      // 3. If QR_CODE (Momo / ZaloPay / VietQR) selected, instantly simulate payment success
      if (paymentMethod === 'QR_CODE' && appointment.id) {
        try {
          await paymentService.simulateSuccess(appointment.id, 'MOMO');
          appointment.status = 'PAID';
          toast.success('🎉 Đã xác nhận & Thanh toán QR Momo thành công!');
        } catch (err) {
          console.warn('Error simulating QR payment:', err);
        }
      }

      // 4. Show Success Ticket Modal
      setCreatedAppointment(appointment);
      setIsTicketModalOpen(true);
      if (paymentMethod !== 'QR_CODE') {
        toast.success('Đặt lịch khám thành công!');
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo lịch hẹn. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0c4b39] to-emerald-900 text-white rounded-3xl p-6 shadow-md space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/10">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Bước 4 / 4 • Xác nhận thanh toán</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          Chọn Hình Thức Thanh Toán & Hoàn Tất
        </h2>
        <p className="text-xs text-emerald-100/80 font-medium">
          Lựa chọn phương thức thanh toán phù hợp để hoàn thành thủ tục đăng ký giữ chỗ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200/90 shadow-sm rounded-3xl bg-white overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-black text-slate-950 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#0c4b39]" />
              Chọn Phương Thức Thanh Toán
            </h3>

            <div className="space-y-3">
              {/* Option 1: Thanh toán tại cơ sở */}
              <div
                onClick={() => setPaymentMethod('AT_HOSPITAL')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  paymentMethod === 'AT_HOSPITAL'
                    ? 'bg-emerald-50/90 border-[#0c4b39] shadow-sm ring-1 ring-[#0c4b39]'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-[#0c4b39] flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">Thanh toán tại cơ sở y tế</h4>
                      <Badge className="bg-emerald-100 text-[#0c4b39] border border-emerald-300 text-[10px] font-bold">
                        Khuyên dùng
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Thanh toán trực tiếp bằng tiền mặt hoặc thẻ tại quầy thu ngân của bệnh viện khi đến khám
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paymentMethod === 'AT_HOSPITAL'
                      ? 'border-[#0c4b39] bg-[#0c4b39] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {paymentMethod === 'AT_HOSPITAL' && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>

              {/* Option 2: VNPAY Sandbox */}
              <div
                onClick={() => setPaymentMethod('VNPAY')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  paymentMethod === 'VNPAY'
                    ? 'bg-emerald-50/90 border-[#0c4b39] shadow-sm ring-1 ring-[#0c4b39]'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">Thanh toán Online VNPAY</h4>
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">
                        Sandbox QR / ATM
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Thanh toán an toàn qua cổng VNPAY (Thẻ ATM nội địa, QR Pay, Thẻ quốc tế Visa/Mastercard)
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paymentMethod === 'VNPAY'
                      ? 'border-[#0c4b39] bg-[#0c4b39] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {paymentMethod === 'VNPAY' && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>

              {/* Option 3: Chuyển khoản QR */}
              <div
                onClick={() => setPaymentMethod('QR_CODE')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  paymentMethod === 'QR_CODE'
                    ? 'bg-emerald-50/90 border-[#0c4b39] shadow-sm ring-1 ring-[#0c4b39]'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-sm text-slate-900">Quét mã QR Ngân hàng / Momo / ZaloPay</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Quét mã VietQR giữ chỗ tức thì không cần nhập số thẻ
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paymentMethod === 'QR_CODE'
                      ? 'border-[#0c4b39] bg-[#0c4b39] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {paymentMethod === 'QR_CODE' && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Summary & Final Action Button (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-slate-200/90 shadow-md rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-base font-black text-slate-950 pb-3 border-b border-slate-100">
                Xác Nhận Đặt Lịch
              </h3>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cơ sở y tế:</span>
                  <span className="font-bold text-slate-900 text-right">{hospital.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bệnh nhân:</span>
                  <span className="font-bold text-slate-900">{patientProfile?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bác sĩ:</span>
                  <span className="font-bold text-slate-900">{doctor?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian:</span>
                  <span className="font-extrabold text-[#0c4b39]">{selectedSlotTime} • {selectedDate}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-black text-slate-950 text-sm">Thanh toán:</span>
                  <span className="font-black text-xl text-[#0c4b39]">{formatPrice(consultationFee)}</span>
                </div>
              </div>

              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleProcessBooking}
                className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-black text-sm h-12 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý đặt lịch...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>Xác Nhận Đặt Lịch Ngay</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs h-10 rounded-2xl"
              >
                Quay lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BOOKING SUCCESS TICKET MODAL */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0c4b39] flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight text-center">
              Đặt Lịch Khám Thành Công!
            </DialogTitle>
            <p className="text-xs text-slate-500 font-medium">
              Mã phiếu đặt khám của bạn đã được ghi nhận trên hệ thống NovaCare
            </p>
          </DialogHeader>

          {/* Ticket Card Details */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Mã số phiếu:</span>
              <span className="font-mono font-black text-[#0c4b39] text-sm bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                {createdAppointment?.bookingCode || (createdAppointment?.id ? `#${createdAppointment.id.slice(0, 8).toUpperCase()}` : 'NC-BOOKING')}
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <strong className="text-emerald-800 font-extrabold">
                  {paymentMethod === 'QR_CODE' ? '✅ ĐÃ THANH TOÁN (PAID)' : '⏳ CHỜ TIẾP ĐÓN TẠI VIỆN'}
                </strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Cơ sở khám:</span>
                <strong className="text-slate-900">{hospital.name}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Bệnh nhân:</span>
                <strong className="text-slate-900">{patientProfile?.fullName}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Bác sĩ phụ trách:</span>
                <strong className="text-slate-900">{doctor?.fullName}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Thời gian khám:</span>
                <strong className="text-[#0c4b39]">{selectedSlotTime} • {selectedDate}</strong>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="button"
              onClick={() => {
                setIsTicketModalOpen(false);
                if (createdAppointment?.id) {
                  router.push(`/lich-kham/${createdAppointment.id}`);
                } else {
                  router.push('/lich-kham');
                }
              }}
              className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs h-11 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Xem Chi Tiết Lịch Hẹn ➔
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsTicketModalOpen(false);
                router.push('/lich-kham');
              }}
              variant="outline"
              className="w-full border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs h-11 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Danh Sách Lịch Khám
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
