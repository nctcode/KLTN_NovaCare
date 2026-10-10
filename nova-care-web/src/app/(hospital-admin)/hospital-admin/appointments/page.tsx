'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalAdminService } from '@/services/hospital-admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  CalendarCheck,
  Search,
  Clock,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Stethoscope,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: any }
> = {
  PENDING: {
    label: 'Chờ xác nhận',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertCircle,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Hoàn thành khám',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Đã hủy',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
  AWAITING_PAYMENT: {
    label: 'Chờ thanh toán',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Clock,
  },
  PAID: {
    label: 'Đã thanh toán',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: CheckCircle2,
  },
};

export default function HospitalAdminAppointmentsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Detail Modal
  const [viewingAppt, setViewingAppt] = useState<any | null>(null);

  // Status Action Modal (Confirm, Complete, Cancel)
  const [actionAppt, setActionAppt] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('CONFIRMED');
  const [statusNote, setStatusNote] = useState<string>('');

  // Fetch Appointments
  const { data, isLoading } = useQuery({
    queryKey: ['hospital-admin-appointments', page, search, statusFilter],
    queryFn: () =>
      hospitalAdminService.getAppointments({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
  });

  const appointments = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: string;
      note?: string;
    }) => hospitalAdminService.updateAppointmentStatus(id, status, note),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái lịch hẹn thành công!');
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-dashboard'] });
      setActionAppt(null);
      setStatusNote('');
    },
    onError: (err: any) => {
      toast.error('Lỗi: ' + (err?.response?.data?.message || err?.message || 'Không thể cập nhật'));
    },
  });

  const handleOpenAction = (appt: any, newStatus: string) => {
    setActionAppt(appt);
    setTargetStatus(newStatus);
    setStatusNote('');
  };

  const handleConfirmAction = () => {
    if (!actionAppt) return;
    updateStatusMutation.mutate({
      id: actionAppt.id,
      status: targetStatus,
      note: statusNote.trim() || undefined,
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Quản Lý Lịch Hẹn Khám</h1>
              <p className="text-xs text-slate-500">
                Theo dõi, xác nhận và xử lý lịch hẹn của bệnh nhân đặt khám tại cơ sở y tế của bạn
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 px-3 py-1 text-xs">
            Tổng cộng: {pagination.total} lịch hẹn
          </Badge>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
        <CardContent className="p-4 space-y-3">
          {/* Quick status tabs */}
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-200">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PENDING', label: 'Chờ xác nhận' },
              { id: 'CONFIRMED', label: 'Đã xác nhận' },
              { id: 'COMPLETED', label: 'Đã khám' },
              { id: 'CANCELLED', label: 'Đã hủy' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm mã đặt chỗ, tên bệnh nhân, tên bác sĩ..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 h-9 text-xs rounded-lg focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Xóa tìm kiếm
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                  <th className="py-3 px-4">Mã hẹn</th>
                  <th className="py-3 px-4">Bệnh nhân</th>
                  <th className="py-3 px-4">Bác sĩ / Chuyên khoa</th>
                  <th className="py-3 px-4">Giờ hẹn khám</th>
                  <th className="py-3 px-4 text-right">Chi phí</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        <span>Đang tải danh sách lịch hẹn...</span>
                      </div>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <CalendarCheck className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                      Không tìm thấy lịch hẹn nào phù hợp điều kiện.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt: any) => {
                    const statusCfg = STATUS_CONFIG[appt.status] || {
                      label: appt.status,
                      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                      icon: AlertCircle,
                    };
                    const StatusIcon = statusCfg.icon;

                    return (
                      <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                        {/* Booking Code */}
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {appt.bookingCode || 'NOV-APPT'}
                        </td>

                        {/* Patient info */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{appt.patientName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {appt.patientPhone || 'Chưa cập nhật SĐT'}
                          </div>
                        </td>

                        {/* Doctor & Specialty */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{appt.doctorName}</div>
                          <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5 font-medium">
                            <Stethoscope className="w-3 h-3 text-emerald-600" />
                            {appt.specialty}
                          </div>
                        </td>

                        {/* Time */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDateTime(appt.startTime)}</span>
                          </div>
                        </td>

                        {/* Total Price & Payment */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-emerald-700">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(appt.totalPrice || 0)}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {appt.paymentStatus === 'PAID' ? 'Đã TT' : 'Chưa TT'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`border text-[10px] px-2 py-0.5 ${statusCfg.badgeClass}`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View detail button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingAppt(appt)}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>

                            {/* Status quick actions */}
                            {appt.status === 'PENDING' && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenAction(appt, 'CONFIRMED')}
                                className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg shadow-sm"
                              >
                                Xác nhận
                              </Button>
                            )}

                            {appt.status === 'CONFIRMED' && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenAction(appt, 'COMPLETED')}
                                className="h-7 px-2 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold rounded-lg shadow-sm"
                              >
                                Hoàn thành
                              </Button>
                            )}

                            {['PENDING', 'CONFIRMED'].includes(appt.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenAction(appt, 'CANCELLED')}
                                className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] rounded-lg"
                              >
                                Hủy
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-500">
                Hiển thị trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} lịch hẹn)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="h-7 px-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog (Confirm / Complete / Cancel) */}
      <Dialog open={!!actionAppt} onOpenChange={(open) => !open && setActionAppt(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              {targetStatus === 'CONFIRMED' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Xác nhận lịch hẹn khám
                </>
              )}
              {targetStatus === 'COMPLETED' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Xác nhận hoàn thành khám
                </>
              )}
              {targetStatus === 'CANCELLED' && (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Hủy lịch hẹn của bệnh nhân
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {actionAppt && (
                <span>
                  Mã hẹn: <strong>{actionAppt.bookingCode}</strong> • Bệnh nhân: <strong>{actionAppt.patientName}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-slate-600">
              {targetStatus === 'CONFIRMED' &&
                'Bệnh viện xác nhận tiếp nhận lịch hẹn. Bệnh nhân sẽ nhận được thông báo về lịch khám đã được phê duyệt.'}
              {targetStatus === 'COMPLETED' &&
                'Bệnh nhân đã đến khám và hoàn tất quy trình khám bệnh tại bệnh viện.'}
              {targetStatus === 'CANCELLED' &&
                'Lịch hẹn sẽ bị hủy bỏ. Vui lòng nhập lý do để lưu vết hệ thống.'}
            </p>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-medium">Ghi chú (Tùy chọn):</label>
              <Input
                placeholder="Nhập ghi chú hoặc lý do thay đổi trạng thái..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="bg-white border-slate-300 text-slate-900 h-9 text-xs focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActionAppt(null)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAction}
              disabled={updateStatusMutation.isPending}
              className={`text-xs font-semibold text-white ${
                targetStatus === 'CANCELLED'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : targetStatus === 'COMPLETED'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : targetStatus === 'CANCELLED' ? (
                'Xác nhận Hủy'
              ) : targetStatus === 'COMPLETED' ? (
                'Hoàn thành'
              ) : (
                'Xác nhận Lịch'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!viewingAppt} onOpenChange={(open) => !open && setViewingAppt(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              Chi tiết Lịch hẹn {viewingAppt?.bookingCode}
            </DialogTitle>
          </DialogHeader>

          {viewingAppt && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Bệnh nhân</span>
                  <span className="font-semibold text-slate-900 text-sm">{viewingAppt.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Số điện thoại</span>
                  <span className="font-semibold text-slate-900">{viewingAppt.patientPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bác sĩ phụ trách</span>
                  <span className="font-semibold text-slate-900">{viewingAppt.doctorName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Chuyên khoa</span>
                  <span className="font-semibold text-emerald-700">{viewingAppt.specialty}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Thời gian khám</span>
                  <span className="font-semibold text-slate-700">
                    {formatDateTime(viewingAppt.startTime)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tổng chi phí khám</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(viewingAppt.totalPrice || 0)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">Trạng thái hiện tại:</span>
                <Badge className={`border text-xs ${STATUS_CONFIG[viewingAppt.status]?.badgeClass || ''}`}>
                  {STATUS_CONFIG[viewingAppt.status]?.label || viewingAppt.status}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewingAppt(null)}
              className="bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 text-xs rounded-xl"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
