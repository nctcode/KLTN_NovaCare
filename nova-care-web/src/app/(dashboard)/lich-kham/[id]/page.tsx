'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800 border-yellow-250', icon: <AlertCircle className="h-4 w-4" /> },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-orange-100 text-orange-850 border-orange-250', icon: <AlertCircle className="h-4 w-4" /> },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-green-105 text-green-800 border-green-250', icon: <CheckCircle className="h-4 w-4" /> },
  PAID: { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-800 border-blue-250', icon: <CheckCircle className="h-4 w-4" /> },
  COMPLETED: { label: 'Đã hoàn thành', color: 'bg-gray-100 text-gray-800 border-gray-250', icon: <CheckCircle className="h-4 w-4" /> },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800 border-red-250', icon: <XCircle className="h-4 w-4" /> },
  EXPIRED: { label: 'Đã hết hạn', color: 'bg-gray-100 text-gray-800 border-gray-250', icon: <XCircle className="h-4 w-4" /> },
};

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('Bệnh nhân hủy lịch');

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy lịch khám</p>
        <Button variant="link" onClick={() => router.back()} className="font-semibold">
          Quay lại
        </Button>
      </div>
    );
  }

  const status = statusConfig[appointment.status] || {
    label: appointment.status,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: null,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-secondary">Chi tiết lịch khám</h1>
          <p className="text-sm text-gray-500">Mã lịch: {appointment.bookingCode}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor & Hospital */}
          <Card>
            <CardHeader>
              <CardTitle className="text-secondary text-lg">Thông tin khám</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <User className="h-5 w-5 text-primary-dark mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-secondary">Bác sĩ phụ trách</p>
                  <p className="text-sm">{appointment.slot?.doctorWorkplace?.doctor?.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {appointment.slot?.doctorWorkplace?.doctor?.qualification}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-t pt-4">
                <MapPin className="h-5 w-5 text-primary-dark mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-secondary">Cơ sở y tế</p>
                  <p className="text-sm">{appointment.slot?.doctorWorkplace?.hospital?.name}</p>
                  <p className="text-xs text-gray-500">
                    {appointment.slot?.doctorWorkplace?.hospital?.address}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-t pt-4">
                <Calendar className="h-5 w-5 text-primary-dark mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-secondary">Thời gian khám</p>
                  <p className="text-sm capitalize">
                    {appointment.slot?.startTime
                      ? format(new Date(appointment.slot.startTime), "EEEE, dd/MM/yyyy 'lúc' HH:mm", {
                          locale: vi,
                        })
                      : '---'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Thời lượng khám ước tính: ~{appointment.slot?.doctorWorkplace?.hospital?.services?.[0]?.duration || 30} phút
                  </p>
                </div>
              </div>
              {appointment.reason && (
                <div className="flex items-start gap-4 border-t pt-4">
                  <AlertCircle className="h-5 w-5 text-primary-dark mt-1 shrink-0" />
                  <div>
                    <p className="font-semibold text-secondary">Lý do đi khám</p>
                    <p className="text-sm text-gray-650 leading-relaxed">{appointment.reason}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-secondary text-lg">Hồ sơ người khám bệnh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-550 block text-xs">Họ và tên:</span>
                  <span className="font-semibold text-secondary">{appointment.patientProfile?.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-550 block text-xs">Mối quan hệ:</span>
                  <span className="text-secondary">{appointment.patientProfile?.relation || 'Bản thân'}</span>
                </div>
                <div>
                  <span className="text-gray-550 block text-xs">Ngày sinh:</span>
                  <span className="text-secondary">
                    {appointment.patientProfile?.dateOfBirth
                      ? format(new Date(appointment.patientProfile.dateOfBirth), 'dd/MM/yyyy')
                      : '---'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-550 block text-xs">Giới tính:</span>
                  <span className="text-secondary">
                    {appointment.patientProfile?.gender === 'MALE'
                      ? 'Nam'
                      : appointment.patientProfile?.gender === 'FEMALE'
                      ? 'Nữ'
                      : 'Khác'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-550 block text-xs">Số điện thoại:</span>
                  <span className="text-secondary">{appointment.patientProfile?.phone || '---'}</span>
                </div>
                <div>
                  <span className="text-gray-550 block text-xs">Số CCCD / Hộ chiếu:</span>
                  <span className="text-secondary">{appointment.patientProfile?.identityNumber || '---'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-secondary text-lg">Hóa đơn & Thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phí khám bệnh</span>
                <span className="font-medium text-secondary">{appointment.consultationFee?.toLocaleString() || 0}đ</span>
              </div>
              {appointment.serviceFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phí dịch vụ</span>
                  <span className="font-medium text-secondary">{appointment.serviceFee?.toLocaleString() || 0}đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-3 border-t text-base text-secondary">
                <span>Tổng chi phí</span>
                <span className="text-primary-dark">{appointment.totalPrice?.toLocaleString() || 0}đ</span>
              </div>

              {appointment.status === 'AWAITING_PAYMENT' && (
                <Button className="w-full mt-2" asChild>
                  <Link href={`/thanh-toan?appointmentId=${appointment.id}`}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Thanh toán ngay
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* QR Code ticket */}
          {appointment.status !== 'CANCELLED' && appointment.status !== 'EXPIRED' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-secondary text-base">Phiếu khám điện tử</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
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
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Vui lòng xuất trình mã QR này tại quầy tiếp đón của cơ sở y tế khi đến khám bệnh.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cancel Action */}
          {['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'PAID'].includes(appointment.status) && (
            <Card>
              <CardContent className="p-4">
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Hủy lịch khám
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xác nhận hủy lịch khám</DialogTitle>
                      <DialogDescription className="pt-2">
                        Bạn có chắc chắn muốn hủy lịch hẹn khám bệnh này không? 
                        Hành động này sẽ không thể khôi phục lại.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-3">
                      <label className="text-sm font-medium text-gray-700">Lý do hủy lịch:</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Nhập lý do hủy lịch..."
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={cancelMutation.isPending}>
                        Quay lại
                      </Button>
                      <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
                        {cancelMutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
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
