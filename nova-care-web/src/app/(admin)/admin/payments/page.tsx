'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Search,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, search, statusFilter],
    queryFn: () => adminService.getPayments({ page, limit: 10, search, status: statusFilter }),
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.refundPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  const handleRefundClick = (id: string) => {
    const reason = prompt('Nhập lý do hoàn tiền giao dịch:');
    if (reason !== null) {
      refundMutation.mutate({ id, reason: reason || 'Admin hoàn tiền' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#66FF33]" />
            Quản Lý Thanh Toán & Giao Dịch
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi tất cả giao dịch cổng VNPay / MoMo / Thẻ, mã đối soát và xử lý hoàn tiền.
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
              placeholder="Tìm theo Mã giao dịch, Mã đặt khám hoặc Tên bệnh nhân..."
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
            <option value="PAID">Thành công (PAID)</option>
            <option value="PENDING">Chờ xử lý (PENDING)</option>
            <option value="FAILED">Thất bại (FAILED)</option>
            <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
          </select>
        </div>
      </Card>

      {/* Payments Table */}
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
                  <th className="p-4">Mã Giao Dịch</th>
                  <th className="p-4">Lịch Khám & Bệnh Nhân</th>
                  <th className="p-4">Phương Thức</th>
                  <th className="p-4">Số Tiền</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4">Thời Gian</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500 font-medium">
                      Chưa có giao dịch thanh toán nào
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((pay: any) => (
                    <tr key={pay.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-4 font-mono font-bold text-white">
                        <div>{pay.transactionCode}</div>
                        {pay.vnpTransactionNo && (
                          <div className="text-[10px] text-slate-500 font-mono">Ref: {pay.vnpTransactionNo}</div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-300">
                        <div className="text-[#66FF33] font-mono">#{pay.appointment?.bookingCode}</div>
                        <div className="text-[11px] text-white">{pay.appointment?.patientProfile?.fullName || pay.appointment?.user?.fullName}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800 text-[10px]">
                          {pay.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 font-black text-emerald-400 text-sm">
                        {Number(pay.amount || 0).toLocaleString()}đ
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            pay.status === 'PAID'
                              ? 'bg-emerald-950 text-[#66FF33] border-emerald-800'
                              : pay.status === 'REFUNDED'
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : 'bg-amber-950 text-amber-400 border-amber-800'
                          }`}
                        >
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(pay.paidAt || pay.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4 text-right">
                        {pay.status === 'PAID' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={refundMutation.isPending}
                            onClick={() => handleRefundClick(pay.id)}
                            className="border-rose-900 text-rose-400 hover:bg-rose-950 text-xs font-bold rounded-xl"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Hoàn tiền
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
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
            Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng {data.total} giao dịch)
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
