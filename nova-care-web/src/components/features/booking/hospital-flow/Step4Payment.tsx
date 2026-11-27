'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CreditCard,
  CheckCircle2,
  Wallet,
  Building,
  Loader2,
  Calendar,
  Home,
  Check,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Hospital, Specialty, Doctor, MedicalService } from '@/types';
import { PatientProfile } from '@/types/profile.types';
import { appointmentService } from '@/services/appointment.service';
import { paymentService } from '@/services/payment.service';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { interoperabilityService } from '@/services/interoperability.service';
import { MedicalRecordShareDraft } from './MedicalRecordShareConsent';
import { ClinicRoom } from './RoomSelectModal';
import { BookingType } from '@/config/bookingTypes';

interface Step4PaymentProps {
  hospital: Hospital;
  specialty: Specialty | null;
  doctor: Doctor | null;
  service: MedicalService | null;
  room: ClinicRoom | null;
  bookingMode?: BookingType | null;
  selectedDate: string;
  selectedSlotTime: string;
  selectedSlotId: string | null;
  patientProfile: PatientProfile | null;
  reason: string;
  medicalRecordShare: MedicalRecordShareDraft | null;
  onBack: () => void;
}

export function Step4Payment({
  hospital,
  specialty,
  doctor,
  service,
  room,
  bookingMode,
  selectedDate,
  selectedSlotTime,
  selectedSlotId,
  patientProfile,
  reason,
  medicalRecordShare,
  onBack,
}: Step4PaymentProps) {
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<'AT_HOSPITAL' | 'VNPAY'>('AT_HOSPITAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<any | null>(null);

  // Modals state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [showVnPayModal, setShowVnPayModal] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [isRefreshingVnpay, setIsRefreshingVnpay] = useState(false);
  const [vnpayRedirectUrl, setVnpayRedirectUrl] = useState<string | null>(null);
  const [vnpayError, setVnpayError] = useState<string | null>(null);

  const consultationFee =
    service?.price || (service as any)?.fee || (doctor as any)?.consultationFee || 350000;

  const defaultReason =
    bookingMode === 'OUT_OF_HOURS'
      ? `Khám ngoài giờ - ${specialty?.name || 'Chuyên khoa'}`
      : bookingMode === 'SERVICE'
      ? `${service?.name || 'Khám dịch vụ'} - ${specialty?.name || 'Chuyên khoa'}`
      : `Khám theo bác sĩ - ${specialty?.name || 'Chuyên khoa'}`;

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
    setVnpayError(null);
    try {
      let appointment = createdAppointment;

      // 1. Re-use created appointment if already created for this slot & profile, otherwise create
      if (
        !appointment ||
        appointment.slotId !== selectedSlotId ||
        appointment.patientProfileId !== patientProfile.id
      ) {
        const isValidUUID = (id?: string | null): boolean =>
          typeof id === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const validServiceId = isValidUUID(service?.id) ? service?.id : undefined;
        const validRoomId = isValidUUID(room?.id) ? room.id : undefined;
        const normalizedBookingMode =
          bookingMode === 'OUT_OF_HOURS'
            ? 'AFTER_HOURS'
            : bookingMode === 'SERVICE'
              ? 'SERVICE'
              : undefined;

        if (
          (bookingMode === 'SERVICE' || bookingMode === 'OUT_OF_HOURS') &&
          !validRoomId
        ) {
          toast.error('Phòng khám không hợp lệ. Vui lòng chọn lại phòng khám.');
          return;
        }

        const idempotencyKey =
          typeof window !== 'undefined' && window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : `hosp_book_${patientProfile.id}_${selectedSlotId}_${Date.now()}`;

        appointment = await appointmentService.create({
          patientProfileId: patientProfile.id,
          slotId: selectedSlotId,
          ...(validServiceId ? { medicalServiceId: validServiceId } : {}),
          ...(validRoomId && normalizedBookingMode
            ? {
                clinicRoomId: validRoomId,
                serviceBookingMode: normalizedBookingMode,
              }
            : {}),
          reason: reason || defaultReason,
          idempotencyKey,
        } as any);

        setCreatedAppointment(appointment);
      }

      if (medicalRecordShare) {
        if (medicalRecordShare.hospitalShares && medicalRecordShare.hospitalShares.length > 0) {
          for (const hShare of medicalRecordShare.hospitalShares) {
            const consent = await interoperabilityService.createConsent({
              patientProfileId: patientProfile.id,
              sourceHospitalId: hShare.sourceHospitalId,
              targetHospitalId: hospital.id,
              encounterIds: hShare.encounterIds,
              allowedSections: medicalRecordShare.allowedSections,
              expiresAt: medicalRecordShare.expiresAt,
              purpose: 'TREATMENT',
            });
            await interoperabilityService.grantConsent(consent.id);
          }
          toast.success('Đã cấp quyền chia sẻ hồ sơ theo phạm vi bạn đã chọn.');
        } else if (medicalRecordShare.sourceHospitalId) {
          const consent = await interoperabilityService.createConsent({
            patientProfileId: patientProfile.id,
            sourceHospitalId: medicalRecordShare.sourceHospitalId,
            targetHospitalId: hospital.id,
            encounterIds: medicalRecordShare.encounterIds,
            allowedSections: medicalRecordShare.allowedSections,
            expiresAt: medicalRecordShare.expiresAt,
            purpose: 'TREATMENT',
          });
          await interoperabilityService.grantConsent(consent.id);
          toast.success('Đã cấp quyền chia sẻ hồ sơ theo phạm vi bạn đã chọn.');
        }
      }

      // 2. Handle Payment Method (synced with Mobile: AT_HOSPITAL or VNPAY Sandbox)
      if (paymentMethod === 'AT_HOSPITAL') {
        setIsTicketModalOpen(true);
        toast.success('Đặt lịch khám thành công! Lịch đang chờ cơ sở y tế xác nhận.');
      } else if (paymentMethod === 'VNPAY') {
        try {
          const res = await paymentService.createPayment(appointment.id);
          if (res?.paymentUrl) {
            setVnpayRedirectUrl(res.paymentUrl);
          } else {
            setVnpayError('Không nhận được liên kết cổng thanh toán VNPAY Sandbox.');
          }
        } catch (err: any) {
          setVnpayError(
            err?.response?.data?.message || 'Không thể khởi tạo liên kết VNPAY Sandbox.',
          );
        }
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

  const handleRefreshVnpayUrl = async () => {
    if (!createdAppointment?.id) return;
    setIsRefreshingVnpay(true);
    setVnpayError(null);
    try {
      const res = await paymentService.createPayment(createdAppointment.id);
      if (res?.paymentUrl) {
        setVnpayRedirectUrl(res.paymentUrl);
        toast.success('Đã tạo lại liên kết cổng thanh toán VNPAY Sandbox');
      } else {
        setVnpayError('Không thể tạo liên kết VNPAY Sandbox');
      }
    } catch (err: any) {
      setVnpayError(err?.response?.data?.message || 'Lỗi khi tải lại liên kết VNPAY Sandbox');
    } finally {
      setIsRefreshingVnpay(false);
    }
  };

  const handleConfirmVnPaySandbox = async () => {
    if (!createdAppointment?.id) return;
    setIsSimulatingPayment(true);
    try {
      await paymentService.simulateSuccess(createdAppointment.id, 'VNPAY');
      toast.success('Thanh toán VNPAY Sandbox thành công!');
      setShowVnPayModal(false);
      setIsTicketModalOpen(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi khi xác nhận thanh toán VNPAY Sandbox');
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
          Chọn Hình Thức Thanh Toán &amp; Hoàn Tất
        </h2>
        <p className="text-xs text-emerald-100/80 font-medium">
          Lựa chọn thanh toán tại cơ sở y tế hoặc thanh toán trực tuyến qua cổng VNPAY Sandbox
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
              {/* Option 1: Thanh toán tại cơ sở y tế */}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Thanh toán tại cơ sở y tế
                      </h4>
                      <Badge className="bg-emerald-100 text-[#0c4b39] border border-emerald-300 text-[10px] font-bold">
                        Khuyên dùng
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Thanh toán trực tiếp bằng tiền mặt hoặc thẻ tại quầy lễ tân của bệnh viện khi đến khám
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

              {/* Option 2: Cổng thanh toán VNPAY Sandbox */}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Cổng thanh toán VNPAY
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold"
                      >
                        VNPAY Sandbox
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Thanh toán trực tuyến qua cổng VNPAY Sandbox (Thẻ ATM nội địa NCB, VNPAY-QR, thẻ quốc tế)
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
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Cơ sở y tế:</span>
                  <span className="font-bold text-slate-900 text-right">{hospital.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Bệnh nhân:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {patientProfile?.fullName}
                  </span>
                </div>
                {doctor?.fullName && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Bác sĩ:</span>
                    <span className="font-bold text-slate-900 text-right">{doctor.fullName}</span>
                  </div>
                )}
                {room?.name && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Phòng khám:</span>
                    <span className="font-bold text-slate-900 text-right">
                      {(room as any)?.code ? `${(room as any).code} · ` : ''}
                      {room.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Thời gian:</span>
                  <span className="font-extrabold text-[#0c4b39] text-right">
                    {selectedSlotTime} • {selectedDate}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-black text-slate-950 text-sm">Thanh toán:</span>
                  <span className="font-black text-xl text-[#0c4b39]">
                    {formatPrice(consultationFee)}
                  </span>
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
                    <span>
                      {paymentMethod === 'VNPAY'
                        ? 'Tiếp Tục Thanh Toán VNPAY'
                        : 'Xác Nhận Đặt Lịch Ngay'}
                    </span>
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

      {/* VNPAY SANDBOX PAYMENT MODAL (Synced with Mobile VnpaySandboxPaymentDialog) */}
      <Dialog open={showVnPayModal} onOpenChange={setShowVnPayModal}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-0 border border-blue-200 shadow-2xl [&>button]:text-white [&>button]:hover:text-white [&>button]:bg-white/20 [&>button]:hover:bg-white/30 [&>button]:rounded-full [&>button]:p-1 font-sans">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#005baa] to-[#0072bc] p-5 text-white text-center space-y-1.5 relative">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-700 mx-auto shadow-md">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black tracking-tight">Cổng Thanh Toán VNPAY Sandbox</h3>
            <p className="text-[11px] text-blue-100 font-medium">
              Thanh toán trực tuyến an toàn đồng bộ với ứng dụng di động NovaCare
            </p>
          </div>

          <div className="p-5 space-y-4">
            {/* Amount Summary */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-medium">Mã đặt khám:</span>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  #{createdAppointment?.bookingCode || createdAppointment?.id?.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Số tiền thanh toán:</span>
                <p className="font-black text-base text-blue-700">{formatPrice(consultationFee)}</p>
              </div>
            </div>

            {vnpayError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center justify-between gap-2">
                <span>{vnpayError}</span>
                <button
                  type="button"
                  onClick={handleRefreshVnpayUrl}
                  disabled={isRefreshingVnpay}
                  className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingVnpay ? 'animate-spin' : ''}`} />
                  Thử lại
                </button>
              </div>
            )}

            {/* VNPay Sandbox Test Card Guide */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-1 border-b border-slate-200">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Thẻ thử nghiệm VNPAY Sandbox (Ngân hàng NCB)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số thẻ ATM:</span>
                <span className="font-mono font-bold text-blue-700 select-all">
                  9704198526191432198
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tên chủ thẻ:</span>
                <span className="font-mono font-bold text-slate-900 select-all">NGUYEN VAN A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày phát hành / OTP:</span>
                <span className="font-mono font-bold text-slate-900">07/15 · OTP: 123456</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              {vnpayRedirectUrl ? (
                <Button
                  type="button"
                  onClick={() => {
                    window.location.href = vnpayRedirectUrl;
                  }}
                  className="w-full bg-[#005baa] hover:bg-[#004887] text-white font-extrabold text-xs h-11 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Cổng Thanh Toán VNPAY Sandbox</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleRefreshVnpayUrl}
                  disabled={isRefreshingVnpay}
                  className="w-full bg-[#005baa] hover:bg-[#004887] text-white font-extrabold text-xs h-11 rounded-2xl shadow-md flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingVnpay ? 'animate-spin' : ''}`} />
                  <span>Tải lại liên kết VNPAY Sandbox</span>
                </Button>
              )}

              {/* Fallback simulate VNPAY button (synced with Mobile) */}
              <Button
                type="button"
                onClick={handleConfirmVnPaySandbox}
                disabled={isSimulatingPayment}
                variant="outline"
                className="w-full border-blue-300 text-blue-800 hover:bg-blue-50 font-bold text-xs h-10 rounded-2xl flex items-center justify-center gap-1.5"
              >
                {isSimulatingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác nhận thanh toán VNPAY...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Xác nhận thanh toán mô phỏng VNPAY</span>
                  </>
                )}
              </Button>
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
                #{createdAppointment?.bookingCode || createdAppointment?.id?.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="flex justify-between gap-2">
                <span className="text-slate-500">Cơ sở khám:</span>
                <strong className="text-slate-900 text-right">{hospital.name}</strong>
              </p>
              <p className="flex justify-between gap-2">
                <span className="text-slate-500">Bệnh nhân:</span>
                <strong className="text-slate-900">{patientProfile?.fullName}</strong>
              </p>
              {doctor?.fullName && (
                <p className="flex justify-between gap-2">
                  <span className="text-slate-500">Bác sĩ phụ trách:</span>
                  <strong className="text-slate-900">{doctor.fullName}</strong>
                </p>
              )}
              <p className="flex justify-between gap-2">
                <span className="text-slate-500">Thời gian khám:</span>
                <strong className="text-[#0c4b39]">
                  {selectedSlotTime} • {selectedDate}
                </strong>
              </p>
              <p className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500">Hình thức thanh toán:</span>
                <strong className="text-emerald-700">
                  {paymentMethod === 'AT_HOSPITAL'
                    ? 'Thanh toán tại cơ sở y tế'
                    : 'Cổng thanh toán VNPAY Sandbox'}
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
