'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; styleDark: string; styleLight: string }> = {
  PENDING: { label: 'Chờ xác nhận', styleDark: 'bg-amber-950 text-amber-400 border-amber-800', styleLight: 'bg-amber-100 text-amber-800 border-amber-300' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', styleDark: 'bg-orange-950 text-orange-400 border-orange-800', styleLight: 'bg-orange-100 text-orange-800 border-orange-300' },
  CONFIRMED: { label: 'Đã xác nhận', styleDark: 'bg-blue-950 text-blue-400 border-blue-800', styleLight: 'bg-blue-100 text-blue-800 border-blue-300' },
  PAID: { label: 'Đã thanh toán', styleDark: 'bg-purple-950 text-purple-400 border-purple-800', styleLight: 'bg-purple-100 text-purple-800 border-purple-300' },
  COMPLETED: { label: 'Hoàn thành khám', styleDark: 'bg-emerald-950 text-[#66FF33] border-emerald-800', styleLight: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CANCELLED: { label: 'Đã hủy', styleDark: 'bg-rose-950 text-rose-400 border-rose-800', styleLight: 'bg-rose-100 text-rose-800 border-rose-300' },
};

export default function AdminAppointmentsPage() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tableHeaderStyle = isLight
    ? 'bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider'
    : 'bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider';

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
          <h1 className={`text-xl font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <CalendarCheck className="w-6 h-6 text-[#0c4b39] dark:text-[#66FF33]" />
            Quản Lý Toàn Bộ Lịch Khám Bệnh
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Theo dõi dòng lịch hẹn khám, đối soát giao dịch và cập nhật trạng thái lịch khám toàn hệ thống.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className={`${cardStyle} p-4`}>
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
              className={`pl-9 text-xs rounded-xl ${isLight ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'}`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={`border text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0c4b39] w-full sm:w-56 ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
            }`}
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
      <Card className={`${cardStyle} overflow-hidden`}>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-[#0c4b39] animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className={tableHeaderStyle}>
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
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500 font-medium">
                      Không tìm thấy lịch khám nào phù hợp
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((appt: any) => {
                    const st = STATUS_MAP[appt.status] || { label: appt.status, styleDark: 'bg-slate-800 text-white', styleLight: 'bg-slate-100 text-slate-800' };
                    const docWp = appt.slot?.doctorWorkplace;

                    return (
                      <tr key={appt.id} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}`}>
                        <td className="p-4 font-mono font-black text-[#0c4b39] dark:text-[#66FF33] text-xs">
                          #{appt.bookingCode}
                        </td>
                        <td className={`p-4 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          <div>{appt.patientProfile?.fullName || appt.user?.fullName}</div>
                          <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>SĐT: {appt.patientProfile?.phone || appt.user?.phone}</div>
                        </td>
                        <td className={isLight ? 'p-4 text-slate-700' : 'p-4 text-slate-300'}>
                          <div className={`font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>BS. {docWp?.doctor?.fullName || 'Chưa cập nhật'}</div>
                          <div className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Building2 className="w-3 h-3 text-blue-500" />
                            {docWp?.hospital?.name || 'N/A'}
                          </div>
                        </td>
                        <td className={`p-4 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {appt.slot ? (
                            <div>
                              <div>{new Date(appt.slot.startTime).toLocaleDateString('vi-VN')}</div>
                              <div className="text-[11px] text-emerald-600">
                                {new Date(appt.slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(appt.slot.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Chưa xếp khung giờ</span>
                          )}
                        </td>
                        <td className={`p-4 font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {Number(appt.totalPrice || appt.consultationFee || 0).toLocaleString()}đ
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${isLight ? st.styleLight : st.styleDark}`}>
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
                              className={`text-xs font-bold rounded-xl ${
                                isLight ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-emerald-800 text-[#66FF33] hover:bg-emerald-950'
                              }`}
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
                              className={`text-xs font-bold rounded-xl ${
                                isLight ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : 'border-rose-900 text-rose-400 hover:bg-rose-950'
                              }`}
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
        <div className={`flex items-center justify-between p-4 rounded-xl border text-xs ${
          isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}>
          <span>
            Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng {data.total} lịch)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className={isLight ? 'border-slate-300 text-slate-800 rounded-xl' : 'border-slate-800 text-white rounded-xl'}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
              className={isLight ? 'border-slate-300 text-slate-800 rounded-xl' : 'border-slate-800 text-white rounded-xl'}
            >
              Trang sau <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
