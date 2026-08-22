'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Printer,
  QrCode,
  Building2,
  FileText,
  ShieldAlert,
  ChevronRight,
  Check,
  Activity,
  Pill
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Chờ xác nhận',
    style: 'bg-amber-50 text-amber-700 border-amber-200/80',
    icon: <Clock className="h-3.5 w-3.5" />
  },
  AWAITING_PAYMENT: {
    label: 'Chờ thanh toán',
    style: 'bg-amber-50 text-amber-700 border-amber-200/80',
    icon: <AlertCircle className="h-3.5 w-3.5" />
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />
  },
  PAID: {
    label: 'Đã thanh toán',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />
  },
  COMPLETED: {
    label: 'Đã khám',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />
  },
  CANCELLED: {
    label: 'Đã hủy',
    style: 'bg-red-50 text-red-700 border-red-200',
    icon: <XCircle className="h-3.5 w-3.5" />
  },
  EXPIRED: {
    label: 'Đã hết hạn',
    style: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: <XCircle className="h-3.5 w-3.5" />
  },
};

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('Bệnh nhân thay đổi kế hoạch');

  const { data: appointment, isLoading, refetch } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentService.getById(appointmentId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => appointmentService.cancel(appointmentId, { reason: cancelReason }),
    onSuccess: () => {
      toast.success('Hủy lịch khám thành công');
      setShowCancelDialog(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hủy lịch thất bại');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => appointmentService.complete(appointmentId),
    onSuccess: () => {
      toast.success('Giả lập hoàn thành khám thành công! Tiến trình đã cập nhật.');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hoàn thành lịch khám thất bại');
    },
  });

  const payMutation = useMutation({
    mutationFn: () => paymentService.simulateSuccess(appointmentId, 'MOMO'),
    onSuccess: () => {
      toast.success('🎉 Thanh toán thành công! Lịch hẹn đã chuyển sang Đã xác nhận.');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Thanh toán thất bại');
    },
  });

  const mockFulfillMutation = useMutation({
    mutationFn: () => appointmentService.mockFulfill(appointmentId),
    onSuccess: () => {
      toast.success('🎉 Bệnh viện đã hoàn tất khám & phát hành hồ sơ y tế thành công!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Mô phỏng trả hồ sơ thất bại');
    },
  });

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  const handleComplete = () => {
    completeMutation.mutate();
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-500 font-medium">Không tìm thấy thông tin lịch khám</p>
        <Button variant="outline" onClick={() => router.back()}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const status = statusConfig[appointment.status] || {
    label: appointment.status,
    style: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: null,
  };

  // Timeline step helper
  const getTimelineStep = () => {
    if (appointment.status === 'CANCELLED' || appointment.status === 'EXPIRED') return -1;
    if (appointment.status === 'COMPLETED') return 4;
    if (appointment.status === 'PAID' || appointment.status === 'CONFIRMED') return 3;
    if (appointment.status === 'AWAITING_PAYMENT') return 2;
    return 1;
  };

  const currentStep = getTimelineStep();

  return (
    <div className="w-full space-y-6">
      {/* Top Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0 rounded-xl border-slate-300 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4 text-slate-900" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Chi tiết phiếu khám</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.style}`}>
                {status.icon}
                {status.label}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
              <span>Mã phiếu: <strong className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded">{appointment.bookingCode}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Ngày tạo: <strong className="text-slate-900 font-semibold">{appointment.createdAt ? format(new Date(appointment.createdAt), 'dd/MM/yyyy HH:mm') : '---'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {appointment.status !== 'CANCELLED' && (
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-slate-300 text-slate-800 font-semibold hover:bg-slate-50">
              <Printer className="h-4 w-4" />
              In phiếu khám
            </Button>
          )}
        </div>
      </div>

      {/* Progress Timeline Banner (If not cancelled) */}
      {currentStep > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Tiến trình lịch hẹn</p>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Bước {currentStep}/4: {
                currentStep === 1 ? 'Đặt lịch thành công' :
                currentStep === 2 ? 'Đã thanh toán' :
                currentStep === 3 ? 'Đã xác nhận khám' : 'Đã hoàn thành khám'
              }
            </span>
          </div>

          <div className="relative">
            {/* Background connecting bar */}
            <div className="absolute top-4 left-8 right-8 h-1 bg-slate-200 rounded-full" />
            
            {/* Active filled connecting bar */}
            <div 
              className="absolute top-4 left-8 h-1 bg-emerald-600 transition-all duration-500 rounded-full" 
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '33.33%' : currentStep === 3 ? '66.66%' : '100%'
              }}
            />

            <div className="relative z-10 grid grid-cols-4 gap-2 text-center text-xs">
              {/* Step 1 */}
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm transition-colors ${
                  currentStep >= 1 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep > 1 ? <Check className="w-5 h-5 text-white" /> : '1'}
                </div>
                <span className={`font-bold text-xs ${currentStep >= 1 ? 'text-emerald-900' : 'text-slate-400'}`}>1. Đặt lịch khám</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm transition-colors ${
                  currentStep >= 2 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep > 2 ? <Check className="w-5 h-5 text-white" /> : '2'}
                </div>
                <span className={`font-bold text-xs ${currentStep >= 2 ? 'text-emerald-900' : 'text-slate-400'}`}>2. Thanh toán</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm transition-colors ${
                  currentStep >= 3 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep > 3 ? <Check className="w-5 h-5 text-white" /> : '3'}
                </div>
                <span className={`font-bold text-xs ${currentStep >= 3 ? 'text-emerald-900' : 'text-slate-400'}`}>3. Xác nhận khám</span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm transition-colors ${
                  currentStep >= 4 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep >= 4 ? <Check className="w-5 h-5 text-white" /> : '4'}
                </div>
                <span className={`font-bold text-xs ${currentStep >= 4 ? 'text-emerald-900' : 'text-slate-400'}`}>4. Hoàn thành khám</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Single Column Layout (Full Width Top-to-Bottom Flow) */}
      <div className="w-full space-y-6">

        {/* 1. Medical Encounter Details Card (If COMPLETED / Has Encounter) */}
        {appointment.medicalEncounter && (
          <Card className="border-emerald-200 shadow-md bg-white overflow-hidden rounded-2xl">
            <CardHeader className="bg-emerald-700 text-white p-5 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-200" />
                  <CardTitle className="text-lg font-extrabold text-white">📄 Hồ sơ khám đã có (PUBLISHED)</CardTitle>
                </div>
                <CardDescription className="text-emerald-100 text-xs mt-1">
                  Mã hồ sơ: <span className="font-mono font-bold text-white bg-emerald-800 px-2 py-0.5 rounded">{appointment.medicalEncounter.encounterCode}</span>
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs font-semibold"
                asChild
              >
                <Link href="/lich-su-kham">
                  Xem tại Lịch sử khám ➔
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Tóm tắt & Lý do */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block">Lý do khám / Lý do vào viện</span>
                  <p className="text-slate-900 font-semibold">{appointment.medicalEncounter.chiefComplaint || 'Khám bệnh theo hẹn'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block">Tóm tắt diễn biến lâm sàng</span>
                  <p className="text-slate-900 font-semibold">{appointment.medicalEncounter.clinicalSummary || 'Bệnh nhân được thăm khám kỹ lưỡng, tình trạng ổn định.'}</p>
                </div>
              </div>

              {/* Chẩn đoán ICD-10 */}
              {appointment.medicalEncounter.diagnoses && appointment.medicalEncounter.diagnoses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Chẩn đoán bệnh (ICD-10)
                  </h4>
                  <div className="space-y-2">
                    {appointment.medicalEncounter.diagnoses.map((diag: any, idx: number) => (
                      <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 mr-2">{diag.diseaseName}</span>
                          {diag.isPrimary ? (
                            <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">Bệnh chính</span>
                          ) : (
                            <span className="bg-slate-200 text-slate-700 font-semibold text-[10px] px-2 py-0.5 rounded-full">Bệnh kèm</span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                          ICD: {diag.icdCode}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sinh hiệu & Chỉ số */}
              {appointment.medicalEncounter.observations && appointment.medicalEncounter.observations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Sinh hiệu & Chỉ số lâm sàng
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {appointment.medicalEncounter.observations.map((obs: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                        <span className="text-slate-500 font-semibold block text-[11px]">{obs.name}</span>
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {obs.value} <small className="text-slate-500 font-normal">{obs.unit || ''}</small>
                        </span>
                        {obs.interpretation && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                            {obs.interpretation}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Đơn thuốc */}
              {appointment.medicalEncounter.prescription?.items && appointment.medicalEncounter.prescription.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-amber-600" />
                    Đơn thuốc được cấp (Mã RX: {appointment.medicalEncounter.prescription.prescriptionCode})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {appointment.medicalEncounter.prescription.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900">{item.drugName}</span>
                          <span className="text-slate-500 ml-2">({item.dosage})</span>
                          <p className="text-slate-600 text-[11px] font-medium">{item.usageInstruction}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 inline-block">
                            Số lượng: {item.quantity} {item.unit}
                          </span>
                          {item.note && <p className="text-[10px] text-slate-400 mt-0.5">{item.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 2. Mock Fulfillment Trigger Card (Shown AFTER Payment: PAID or CONFIRMED and no encounter yet) */}
        {(appointment.status === 'PAID' || appointment.status === 'CONFIRMED') && !appointment.medicalEncounter && (
          <Card className="border-indigo-200 bg-indigo-50/80 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-950 text-sm font-extrabold">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>[MOCK KLTN] Mô phỏng Bác sĩ hoàn tất khám & Bệnh viện trả hồ sơ</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Buổi khám đã được xác nhận thanh toán. Bạn hãy bấm bên dưới để mô phỏng Bác sĩ hoàn tất khám và Bệnh viện phát hành Hồ sơ y tế lên Cổng Liên thông.
              </p>
              <Button
                onClick={() => mockFulfillMutation.mutate()}
                disabled={mockFulfillMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-11 rounded-xl shadow-xs transition-all gap-2 cursor-pointer"
              >
                {mockFulfillMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Đang phát hành hồ sơ y tế...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Mô phỏng trả hồ sơ
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 3. Completed State Banner (If COMPLETED) */}
        {appointment.status === 'COMPLETED' && (
          <Card className="border-emerald-200 bg-emerald-50/70 shadow-xs rounded-2xl overflow-hidden">
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 text-xs font-extrabold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>✅ Đã khám - 📄 Hồ sơ khám đã có</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Bệnh viện đã trả Hồ sơ lâm sàng (trạng thái <b>PUBLISHED</b>) về hệ thống NovaCare. Hồ sơ đã sẵn sàng cho việc liên thông y tế.
              </p>
              <Button
                variant="outline"
                className="w-full text-xs font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                asChild
              >
                <Link href="/lich-su-kham">
                  Xem Lịch sử khám & Hồ sơ liên thông ➔
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 4. Doctor & Facility Information Card */}
        <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Thông tin khám bệnh & Cơ sở y tế</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Doctor Details */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bác sĩ phụ trách</p>
                <p className="text-base font-extrabold text-slate-900">
                  {appointment.slot?.doctorWorkplace?.doctor?.fullName || 'Đội ngũ Bác sĩ chuyên khoa'}
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  Chuyên môn: <strong className="text-slate-900">{appointment.slot?.doctorWorkplace?.doctor?.qualification || 'Bác sĩ chuyên khoa'}</strong>
                </p>
              </div>
            </div>

            {/* Hospital / Facility */}
            <div className="flex items-start gap-4 border-t border-slate-100 pt-5">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center font-bold text-base shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cơ sở y tế tiếp đón</p>
                <p className="text-base font-extrabold text-slate-900">
                  {appointment.slot?.doctorWorkplace?.hospital?.name || 'Cơ sở khám NovaCare'}
                </p>
                <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <strong className="text-slate-900">{appointment.slot?.doctorWorkplace?.hospital?.address || 'Chưa cập nhật địa chỉ'}</strong>
                </p>
              </div>
            </div>

            {/* Schedule time */}
            <div className="flex items-start gap-4 border-t border-slate-100 pt-5">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center font-bold text-base shrink-0">
                <Calendar className="w-6 h-6 text-slate-900" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian khám dự kiến</p>
                <p className="text-base font-extrabold text-slate-900 capitalize">
                  {appointment.slot?.startTime
                    ? format(new Date(appointment.slot.startTime), "EEEE, dd/MM/yyyy 'lúc' HH:mm", {
                      locale: vi,
                    })
                    : '---'}
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  Thời lượng khám ước tính: ~<strong className="text-slate-900">{appointment.slot?.doctorWorkplace?.hospital?.services?.[0]?.duration || 30} phút</strong>
                </p>
              </div>
            </div>

            {appointment.reason && (
              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lý do khám / Triệu chứng</p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 leading-relaxed">
                  {appointment.reason}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. Patient Details Card */}
        <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Thông tin bệnh nhân khám</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Họ và tên bệnh nhân</span>
                <span className="font-extrabold text-slate-900 text-sm">{appointment.patientProfile?.fullName || '---'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Mối quan hệ</span>
                <span className="font-bold text-slate-900 text-sm">{appointment.patientProfile?.relation || 'Bản thân'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Ngày sinh</span>
                <span className="font-bold text-slate-900 text-sm">
                  {appointment.patientProfile?.dateOfBirth
                    ? format(new Date(appointment.patientProfile.dateOfBirth), 'dd/MM/yyyy')
                    : '---'}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Giới tính</span>
                <span className="font-bold text-slate-900 text-sm">
                  {appointment.patientProfile?.gender === 'MALE'
                    ? 'Nam'
                    : appointment.patientProfile?.gender === 'FEMALE'
                      ? 'Nữ'
                      : 'Khác'}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Số điện thoại</span>
                <span className="font-bold text-slate-900 text-sm">{appointment.patientProfile?.phone || '---'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Số CCCD / Hộ chiếu</span>
                <span className="font-bold text-slate-900 text-sm">{appointment.patientProfile?.identityNumber || '---'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. QR Code Ticket & Billing Breakdown (Side-by-Side inside single column) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Ticket */}
          {appointment.status !== 'CANCELLED' && appointment.status !== 'EXPIRED' && (
            <Card className="border-slate-200 shadow-sm bg-white text-center rounded-2xl">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5 text-slate-900" />
                  Mã QR phiếu khám
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Xuất trình mã này tại quầy tiếp đón y tế
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm inline-block">
                  <QRCodeSVG
                    value={JSON.stringify({
                      bookingCode: appointment.bookingCode,
                      patientName: appointment.patientProfile?.fullName,
                      doctorName: appointment.slot?.doctorWorkplace?.doctor?.fullName,
                      hospitalName: appointment.slot?.doctorWorkplace?.hospital?.name,
                      startTime: appointment.slot?.startTime,
                    })}
                    size={160}
                  />
                </div>
                <p className="text-xs font-mono font-extrabold text-white bg-slate-900 mt-4 tracking-wider px-3.5 py-1 rounded-md shadow-xs">
                  {appointment.bookingCode}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Billing Card */}
          <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Chi phí khám bệnh</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Phí dịch vụ khám bệnh</span>
                <span className="font-bold text-slate-900">{appointment.consultationFee?.toLocaleString() || 0}đ</span>
              </div>
              {appointment.serviceFee > 0 && (
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Phí tiện ích hệ thống</span>
                  <span className="font-bold text-slate-900">{appointment.serviceFee?.toLocaleString() || 0}đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-3 border-t border-slate-100 text-sm text-slate-900">
                <span>Tổng chi phí thanh toán</span>
                <span className="text-xl font-extrabold text-emerald-700">{appointment.totalPrice?.toLocaleString() || 0}đ</span>
              </div>

              {(appointment.status === 'AWAITING_PAYMENT' || appointment.status === 'PENDING') && (
                <div className="space-y-2 mt-3">
                  <Button
                    onClick={() => payMutation.mutate()}
                    disabled={payMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold text-xs py-2.5 rounded-xl cursor-pointer shadow-xs"
                  >
                    {payMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Đang xử lý thanh toán...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Thanh toán ngay (Demo Instant)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 7. Cancel Action */}
        {['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'PAID'].includes(appointment.status) && (
          <Card className="border-slate-200 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4">
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full text-xs text-red-600 font-semibold border-red-200 hover:bg-red-50">
                    Hủy lịch hẹn khám này
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-slate-200">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-900">Xác nhận hủy lịch khám</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 pt-1">
                      Bạn có chắc chắn muốn hủy lịch hẹn khám này không?
                      Sau khi hủy, mã số phiếu khám sẽ bị huỷ bỏ.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 py-2">
                    <label className="text-xs font-bold text-slate-900">Lý do hủy lịch:</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Nhập lý do..."
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(false)} disabled={cancelMutation.isPending} className="font-semibold">
                      Quay lại
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelMutation.isPending} className="font-semibold">
                      {cancelMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

