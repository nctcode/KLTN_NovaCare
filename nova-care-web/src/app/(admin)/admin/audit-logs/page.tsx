'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { History, Search, Loader2, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs-full', page, search],
    queryFn: () => adminService.getAuditLogs({ page, limit: 15, search }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-[#66FF33]" />
            Nhật Ký Thao Tác Quản Trị (Audit Logs)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ghi vết toàn bộ hành động quản trị viên (Khóa/Mở tài khoản, Cập nhật trạng thái, Hoàn tiền, Thêm/Sửa/Xóa dữ liệu).
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-sm p-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Tìm theo Tên Admin, Hành động (LOCK_USER, UPDATE_STATUS...) hoặc Đối tượng..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>
      </Card>

      {/* Audit Logs Table */}
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
                  <th className="p-4">Hành Động (Action)</th>
                  <th className="p-4">Loại Đối Tượng</th>
                  <th className="p-4">ID Đối Tượng</th>
                  <th className="p-4">Người Thực Hiện</th>
                  <th className="p-4">Địa Chỉ IP</th>
                  <th className="p-4">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 font-medium">
                      Chưa có nhật ký thao tác nào
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-4 font-mono font-black text-[#66FF33]">
                        {log.action}
                      </td>
                      <td className="p-4 font-bold text-white">
                        {log.entityType}
                      </td>
                      <td className="p-4 font-mono text-slate-400 text-[11px]">
                        {log.entityId || 'N/A'}
                      </td>
                      <td className="p-4 font-semibold text-slate-200">
                        {log.user?.fullName || log.userId} ({log.user?.role || 'ADMIN'})
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
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
            Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng {data.total} bản ghi)
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
