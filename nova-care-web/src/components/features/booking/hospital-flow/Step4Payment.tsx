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
  Smartphone,
  X,
  ExternalLink,
  Shield,
  ArrowRight,
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

  const [paymentMethod, setPaymentMethod] = useState<'AT_HOSPITAL' | 'VNPAY' | 'MOMO'>('AT_HOSPITAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<any | null>(null);

  // Modals state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [showMomoModal, setShowMomoModal] = useState(false);
  const [showVnPayModal, setShowVnPayModal] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [vnpayRedirectUrl, setVnpayRedirectUrl] = useState<string | null>(null);

  const consultationFee = service?.price || (service as any)?.fee || (doctor as any)?.consultationFee || 350000;

  const doctorWorkplaceId = doctor?.workPlaces?.find((w) => w.hospitalId === hospital.id)?.id || doctor?.workPlaces?.[0]?.id || null;

  const handleProcessBooking = async () => {
    if (!patientProfile) {
      toast.error('Vui lòng chọn hồ sơ bệnh nhân đi khám!');
      return;
    }

    if (!selectedSlotId) {
      toast.error('Khung giờ khám không hợp lệ. Vui lòng chọn lại khung giờ!');
      return;
    }

    setIsSubmitting(true);
    try {
      let appointment = createdAppointment;

      // 1. Re-use created appointment if already created for this slot & profile, otherwise create
      if (!appointment || appointment.slotId !== selectedSlotId || appointment.patientProfileId !== patientProfile.id) {
        // Only send medicalServiceId if it is a valid UUID and not a virtual/fallback string (e.g. default-service-...)
        const isValidUUID = (id?: string | null): boolean =>
          typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const validServiceId = isValidUUID(service?.id) ? service?.id : undefined;

        const idempotencyKey =
          typeof window !== 'undefined' && window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : `hosp_book_${patientProfile.id}_${selectedSlotId}_${Date.now()}`;

        appointment = await appointmentService.create({
          patientProfileId: patientProfile.id,
          slotId: selectedSlotId,
          ...(validServiceId ? { medicalServiceId: validServiceId } : {}),
          reason: reason || `Khám theo bác sĩ - ${specialty?.name || 'Chuyên khoa'}`,
          idempotencyKey,
        } as any);

        setCreatedAppointment(appointment);
      }

      // 2. Handle Payment Method
      if (paymentMethod === 'AT_HOSPITAL') {
        try {
          await appointmentService.confirm(appointment.id);
        } catch (confirmErr) {
          console.warn('Confirm appointment warning:', confirmErr);
        }
        setIsTicketModalOpen(true);
        toast.success('Đặt lịch khám thành công! Vui lòng thanh toán tại viện.');
      } else if (paymentMethod === 'MOMO') {
        // Only open MoMo Modal with QR code - DO NOT confirm or mark as paid yet
        setShowMomoModal(true);
      } else if (paymentMethod === 'VNPAY') {
        // Fetch VNPay Sandbox URL in background
        try {
          const res = await paymentService.createPayment(appointment.id);
          if (res?.paymentUrl) {
            setVnpayRedirectUrl(res.paymentUrl);
          }
        } catch (err) {
          console.warn('VNPay payment url generation warning:', err);
        }
        // Only open VNPay Modal with QR code - DO NOT confirm or mark as paid yet
        setShowVnPayModal(true);
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      const serverMessage = error?.response?.data?.message;
      const displayMsg = Array.isArray(serverMessage)
        ? serverMessage.join(', ')
        : typeof serverMessage === 'string'
        ? serverMessage
        : 'Có lỗi xảy ra khi tạo lịch hẹn. Vui lòng thử lại!';
      toast.error(displayMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmMomoSandbox = async () => {
    if (!createdAppointment?.id) return;
    setIsSimulatingPayment(true);
    try {
      await paymentService.simulateSuccess(createdAppointment.id, 'MOMO');
      toast.success('Thanh toán MoMo Sandbox thành công!');
      setShowMomoModal(false);
      setIsTicketModalOpen(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi khi xác nhận thanh toán MoMo Sandbox');
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const handleConfirmVnPaySandbox = async () => {
    if (!createdAppointment?.id) return;
    setIsSimulatingPayment(true);
    try {
      await paymentService.simulateSuccess(createdAppointment.id, 'VNPAY');
      toast.success('Thanh toán QR Ngân hàng (VNPay Sandbox) thành công!');
      setShowVnPayModal(false);
      setIsTicketModalOpen(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi khi xác nhận thanh toán VNPay Sandbox');
    } finally {
      setIsSimulatingPayment(false);
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

              {/* Option 2: Thanh toán QR Ngân hàng (VNPay) */}
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
                      <h4 className="font-extrabold text-sm text-slate-900">Thanh toán QR Ngân hàng</h4>
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

              {/* Option 3: Quét mã thanh toán Momo */}
              <div
                onClick={() => setPaymentMethod('MOMO')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  paymentMethod === 'MOMO'
                    ? 'bg-emerald-50/90 border-[#0c4b39] shadow-sm ring-1 ring-[#0c4b39]'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-100/80 text-[#ae2070] flex items-center justify-center shrink-0">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">Quét mã thanh toán Momo</h4>
                      <Badge variant="outline" className="bg-pink-50 text-[#ae2070] border-pink-200 text-[10px] font-bold">
                        Ví MoMo Sandbox
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Quét mã QR qua Ví MoMo thử nghiệm để giữ chỗ tức thì
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paymentMethod === 'MOMO'
                      ? 'border-[#0c4b39] bg-[#0c4b39] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {paymentMethod === 'MOMO' && <Check className="w-4 h-4 text-white" />}
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

      {/* MOMO SANDBOX MODAL */}
      <Dialog open={showMomoModal} onOpenChange={setShowMomoModal}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-0 border border-pink-200 shadow-2xl [&>button]:text-white [&>button]:hover:text-white [&>button]:bg-white/20 [&>button]:hover:bg-white/30 [&>button]:rounded-full [&>button]:p-1 font-sans">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#ae2070] to-[#d82d8b] p-5 text-white text-center space-y-1.5 relative">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-black text-[#ae2070] mx-auto shadow-md">
              M
            </div>
            <h3 className="text-lg font-black tracking-tight">Cổng Thanh Toán MoMo Sandbox</h3>
            <p className="text-[11px] text-pink-100 font-medium">Môi trường thử nghiệm Ví điện tử MoMo</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Amount Summary */}
            <div className="bg-pink-50/70 border border-pink-100 rounded-2xl p-3.5 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-medium">Mã đặt khám:</span>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  #{createdAppointment?.bookingCode || createdAppointment?.id?.slice(0, 8).toUpperCase() || 'NC-889922'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Số tiền thanh toán:</span>
                <p className="font-black text-base text-[#ae2070]">{formatPrice(consultationFee)}</p>
              </div>
            </div>

            {/* Native Scannable MoMo Wallet QR */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-44 h-44 bg-white rounded-2xl border-2 border-[#ae2070] p-1.5 relative shadow-md flex flex-col items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://nhantien.momo.vn/0706417103/${consultationFee}`)}`}
                  alt="MoMo Sandbox QR Code"
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute inset-x-0 -bottom-2.5 text-center">
                  <span className="bg-[#ae2070] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    VÍ MOMO (0706417103)
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 text-center flex items-center justify-center gap-1 font-medium pt-1">
                <Smartphone className="w-3.5 h-3.5 text-[#ae2070] shrink-0" />
                <span>Quét mã QR bằng App MoMo hoặc nhấn nút giả lập bên dưới</span>
              </p>
            </div>

            {/* MoMo Account Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Tên người nhận:</span>
                <span className="font-bold text-slate-900">NGUYỄN CHÍ THUẬN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại Ví MoMo:</span>
                <span className="font-mono font-bold text-[#ae2070]">0706417103</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Nội dung chuyển tiền:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {createdAppointment?.bookingCode || `NOVACARE ${createdAppointment?.id?.slice(0, 8).toUpperCase()}`}
                </span>
              </div>
            </div>

            {/* Action button */}
            <Button
              onClick={handleConfirmMomoSandbox}
              disabled={isSimulatingPayment}
              className="w-full bg-gradient-to-r from-[#ae2070] to-[#d82d8b] hover:opacity-95 text-white font-extrabold text-xs h-11 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {isSimulatingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý thanh toán MoMo...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-pink-200" />
                  <span>⚡ Thanh Toán MoMo Sandbox (Nút Giả Lập)</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VNPAY / BANK QR SANDBOX MODAL */}
      <Dialog open={showVnPayModal} onOpenChange={setShowVnPayModal}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-0 border border-blue-200 shadow-2xl [&>button]:text-white [&>button]:hover:text-white [&>button]:bg-white/20 [&>button]:hover:bg-white/30 [&>button]:rounded-full [&>button]:p-1 font-sans">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#005baa] to-[#0072bc] p-5 text-white text-center space-y-1.5 relative">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-700 mx-auto shadow-md">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black tracking-tight">Cổng Thanh Toán QR Ngân Hàng (VNPay)</h3>
            <p className="text-[11px] text-blue-100 font-medium">Môi trường thử nghiệm VNPay Sandbox & VietQR</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Amount Summary */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-medium">Mã đặt khám:</span>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  #{createdAppointment?.bookingCode || createdAppointment?.id?.slice(0, 8).toUpperCase() || 'NC-889922'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Số tiền thanh toán:</span>
                <p className="font-black text-base text-blue-700">{formatPrice(consultationFee)}</p>
              </div>
            </div>

            {/* Dynamic Scannable VietQR Code */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-48 h-48 bg-white rounded-2xl border-2 border-[#005baa] p-1.5 relative shadow-md flex flex-col items-center justify-center">
                <img
                  src={`https://img.vietqr.io/image/MB-0706417103-compact2.png?amount=${consultationFee}&addInfo=${encodeURIComponent(createdAppointment?.bookingCode || `NOVACARE ${createdAppointment?.id?.slice(0, 8).toUpperCase() || ''}`)}&accountName=NGUYEN%20CHI%20THUAN`}
                  alt="VietQR Bank QR Code"
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute inset-x-0 -bottom-2.5 text-center">
                  <span className="bg-[#005baa] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    VIETQR NGÂN HÀNG (MBBANK)
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 text-center flex items-center justify-center gap-1 font-medium pt-1">
                <Smartphone className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Quét mã bằng App Ngân hàng bất kỳ (hiển thị số tiền {formatPrice(consultationFee)})</span>
              </p>
            </div>

            {/* VietQR Bank Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-slate-900">MBBank (Ngân hàng TMCP Quân Đội)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-mono font-bold text-blue-700">0706417103</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tên chủ tài khoản:</span>
                <span className="font-bold text-slate-900">NGUYỄN CHÍ THUẬN</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Nội dung chuyển khoản:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {createdAppointment?.bookingCode || `NOVACARE ${createdAppointment?.id?.slice(0, 8).toUpperCase()}`}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {/* Nút giả lập thành công */}
              <Button
                onClick={handleConfirmVnPaySandbox}
                disabled={isSimulatingPayment}
                className="w-full bg-[#005baa] hover:bg-[#004887] text-white font-extrabold text-xs h-11 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {isSimulatingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý thanh toán VNPay...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-blue-200" />
                    <span>⚡ Thanh Toán QR Ngân Hàng (Nút Giả Lập)</span>
                  </>
                )}
              </Button>

              {vnpayRedirectUrl && (
                <Button
                  onClick={() => {
                    window.location.href = vnpayRedirectUrl;
                  }}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-800 hover:bg-blue-50 font-bold text-[11px] h-9 rounded-2xl flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Cổng Thanh Toán VNPay Thực Tế</span>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <span className="font-mono font-black text-[#0c4b39] text-sm">
                #{createdAppointment?.id?.slice(0, 8).toUpperCase() || 'NC-889922'}
              </span>
            </div>

            <div className="space-y-1.5">
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
              <p className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500">Hình thức thanh toán:</span>
                <strong className="text-emerald-700">
                  {paymentMethod === 'AT_HOSPITAL'
                    ? 'Thanh toán tại viện'
                    : paymentMethod === 'MOMO'
                    ? 'Ví MoMo Sandbox'
                    : 'QR Ngân hàng (VNPay Sandbox)'}
                </strong>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="button"
              onClick={() => router.push('/lich-kham')}
              className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs h-11 rounded-2xl flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Xem Quản Lý Lịch Hẹn
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs h-11 rounded-2xl flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Về Trang Chủ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

