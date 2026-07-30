'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  PENDING: { label: 'Chờ xác nhận', style: 'bg-amber-950 text-amber-400 border-amber-800' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', style: 'bg-orange-950 text-orange-400 border-orange-800' },
  CONFIRMED: { label: 'Đã xác nhận', style: 'bg-blue-950 text-blue-400 border-blue-800' },
  PAID: { label: 'Đã thanh toán', style: 'bg-purple-950 text-purple-400 border-purple-800' },
  COMPLETED: { label: 'Hoàn thành khám', style: 'bg-emerald-950 text-[#66FF33] border-emerald-800' },
  CANCELLED: { label: 'Đã hủy', style: 'bg-rose-950 text-rose-400 border-rose-800' },
};

export default function AdminAppointmentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-appointments', page, search, statusFilter],
    queryFn: () => adminService.getAppointments({ page, limit: 10, search, status: statusFilter }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  const handleCancelClick = (id: string) => {
    const reason = prompt('Nhập lý do hủy lịch khám:');
    if (reason !== null) {
      cancelMutation.mutate({ id, reason: reason || 'Admin hủy lịch' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#66FF33]" />
            Quản Lý Toàn Bộ Lịch Khám Bệnh
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi dòng lịch hẹn khám, đối soát giao dịch và cập nhật trạng thái lịch khám toàn hệ thống.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo Mã đặt khám, Tên bệnh nhân hoặc SĐT..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#66FF33] w-full sm:w-56"
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="PENDING">Chờ xác nhận (PENDING)</option>
            <option value="AWAITING_PAYMENT">Chờ thanh toán (AWAITING_PAYMENT)</option>
            <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="COMPLETED">Hoàn thành khám (COMPLETED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>
      </Card>

      {/* Appointments Table */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-[#66FF33] animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Mã Đặt Khám</th>
                  <th className="p-4">Bệnh Nhân</th>
                  <th className="p-4">Bác Sĩ & Bệnh Viện</th>
                  <th className="p-4">Khung Giờ Khám</th>
                  <th className="p-4">Tổng Tiền</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4 text-right">Thao tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500 font-medium">
                      Không tìm thấy lịch khám nào phù hợp
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((appt: any) => {
                    const st = STATUS_MAP[appt.status] || { label: appt.status, style: 'bg-slate-800 text-white' };
                    const docWp = appt.slot?.doctorWorkplace;

                    return (
                      <tr key={appt.id} className="hover:bg-slate-900/50 transition">
                        <td className="p-4 font-mono font-black text-[#66FF33] text-xs">
                          #{appt.bookingCode}
                        </td>
                        <td className="p-4 font-bold text-white">
                          <div>{appt.patientProfile?.fullName || appt.user?.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">SĐT: {appt.patientProfile?.phone || appt.user?.phone}</div>
                        </td>
                        <td className="p-4 text-slate-300">
                          <div className="font-extrabold text-white">BS. {docWp?.doctor?.fullName || 'Chưa cập nhật'}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-400" />
                            {docWp?.hospital?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="p-4 text-slate-300 font-semibold">
                          {appt.slot ? (
                            <div>
                              <div>{new Date(appt.slot.startTime).toLocaleDateString('vi-VN')}</div>
                              <div className="text-[11px] text-emerald-400">
                                {new Date(appt.slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(appt.slot.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Chưa xếp khung giờ</span>
                          )}
                        </td>
                        <td className="p-4 font-extrabold text-white">
                          {Number(appt.totalPrice || appt.consultationFee || 0).toLocaleString()}đ
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${st.style}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ id: appt.id, status: 'COMPLETED' })}
                              className="border-emerald-800 text-[#66FF33] hover:bg-emerald-950 text-xs font-bold rounded-xl"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Duyệt xong
                            </Button>
                          )}

                          {appt.status !== 'CANCELLED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={cancelMutation.isPending}
                              onClick={() => handleCancelClick(appt.id)}
                              className="border-rose-900 text-rose-400 hover:bg-rose-950 text-xs font-bold rounded-xl"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Hủy lịch
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
          <span>
            Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng {data.total} lịch)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-slate-800 text-white rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
              className="border-slate-800 text-white rounded-xl"
            >
              Trang sau <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
