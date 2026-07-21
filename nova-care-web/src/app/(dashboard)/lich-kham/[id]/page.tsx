'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
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
  Check
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
    label: 'Đã hoàn thành', 
    style: 'bg-slate-100 text-slate-700 border-slate-200', 
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

  const handleCancel = () => {
    cancelMutation.mutate();
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
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Tiến trình lịch hẹn</p>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="space-y-2">
              <div className={`w-9 h-9 rounded-full mx-auto flex items-center justify-center font-extrabold text-xs shadow-xs ${currentStep >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {currentStep > 1 ? <Check className="w-5 h-5 text-white" /> : '1'}
              </div>
              <p className={`font-bold ${currentStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>Đặt lịch khám</p>
            </div>
            <div className="space-y-2">
              <div className={`w-9 h-9 rounded-full mx-auto flex items-center justify-center font-extrabold text-xs shadow-xs ${currentStep >= 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {currentStep > 2 ? <Check className="w-5 h-5 text-white" /> : '2'}
              </div>
              <p className={`font-bold ${currentStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>Thanh toán</p>
            </div>
            <div className="space-y-2">
              <div className={`w-9 h-9 rounded-full mx-auto flex items-center justify-center font-extrabold text-xs shadow-xs ${currentStep >= 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {currentStep > 3 ? <Check className="w-5 h-5 text-white" /> : '3'}
              </div>
              <p className={`font-bold ${currentStep >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>Xác nhận khám</p>
            </div>
            <div className="space-y-2">
              <div className={`w-9 h-9 rounded-full mx-auto flex items-center justify-center font-extrabold text-xs shadow-xs ${currentStep >= 4 ? 'bg-emerald-600 text-white ring-4 ring-emerald-50' : 'bg-slate-100 text-slate-400'}`}>
                {currentStep >= 4 ? <Check className="w-5 h-5 text-white" /> : '4'}
              </div>
              <p className={`font-bold ${currentStep >= 4 ? 'text-emerald-700' : 'text-slate-400'}`}>Hoàn thành khám</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Doctor, Facility & Patient Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor & Facility Card */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-900">Thông tin khám bệnh</CardTitle>
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

          {/* Patient Details Card */}
          <Card className="border-slate-200 shadow-sm bg-white">
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
        </div>

        {/* Right Column: Digital Ticket & Payment summary */}
        <div className="space-y-6">
          {/* QR Ticket */}
          {appointment.status !== 'CANCELLED' && appointment.status !== 'EXPIRED' && (
            <Card className="border-slate-200 shadow-sm bg-white text-center">
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
                    size={170}
                  />
                </div>
                <p className="text-xs font-mono font-extrabold text-white bg-slate-900 mt-4 tracking-wider px-3.5 py-1 rounded-md shadow-xs">
                  {appointment.bookingCode}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Billing Card */}
          <Card className="border-slate-200 shadow-sm bg-white">
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

              {appointment.status === 'AWAITING_PAYMENT' && (
                <Button className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold" asChild>
                  <Link href={`/thanh-toan?appointmentId=${appointment.id}`}>
                    <CreditCard className="h-4 w-4" />
                    Thanh toán ngay
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Cancel Action */}
          {['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'PAID'].includes(appointment.status) && (
            <Card className="border-slate-200 shadow-sm bg-white">
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
    </div>
  );
}

