'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  Activity,
  Calendar,
  Lock,
  Unlock,
  KeyRound,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUserActivityPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tableHeaderStyle = isLight
    ? 'bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs'
    : 'bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-xs';

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-user-activities', page, search],
    queryFn: () => adminService.getAuditLogs({ page, limit: 15, search }),
  });

  const getActionBadge = (action: string) => {
    const act = action?.toUpperCase() || '';
    if (act.includes('LOCK')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
          <Lock className="w-3 h-3" />
          {action}
        </span>
      );
    }
    if (act.includes('UNLOCK')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <Unlock className="w-3 h-3" />
          {action}
        </span>
      );
    }
    if (act.includes('ROLE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
          <KeyRound className="w-3 h-3" />
          {action}
        </span>
      );
    }
    if (act.includes('APPOINTMENT') || act.includes('STATUS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
          <Calendar className="w-3 h-3" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
        <Activity className="w-3 h-3" />
        {action || 'SYSTEM'}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-sm">
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Lịch Sử Hoạt Động & Giao Tác Người Dùng
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi vết hoạt động, thay đổi quyền hạn, thao tác khóa tài khoản và biến động dữ liệu.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetch();
            toast.info('Đang làm mới lịch sử hoạt động...');
          }}
          disabled={isFetching}
          className="text-xs rounded-xl h-9 gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className={`${cardStyle} p-4`}>
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo Tên Người dùng, Quản trị viên, Hành động (LOCK, ROLE, STATUS...) hoặc Mô tả..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={`pl-9 text-xs rounded-xl ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'
            }`}
          />
        </div>
      </Card>

      {/* Table of Activities */}
      <Card className={`${cardStyle} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={tableHeaderStyle}>
              <tr>
                <th className="p-3.5 pl-5">Thời Gian</th>
                <th className="p-3.5">Người Thực Hiện (Actor)</th>
                <th className="p-3.5 text-center">Hành Động</th>
                <th className="p-3.5">Đối Tượng Tác Động</th>
                <th className="p-3.5 pr-5">Nội Dung Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Đang tải nhật ký hoạt động...
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((log: any) => (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      isLight ? 'hover:bg-slate-50/60' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="py-3 px-5 whitespace-nowrap text-slate-500">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{log.actorName || log.admin?.fullName || log.admin?.email || 'Hệ thống'}</span>
                      </div>
                      {log.actorRole && (
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                          {log.actorRole}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {log.targetType || 'User'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        ID: {log.targetId || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-5 pr-5">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {log.description || log.details || 'Thao tác cập nhật bản ghi'}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Chưa có nhật ký hoạt động nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.total > 15 && (
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Tổng: {data.total} bản ghi</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 text-xs rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>Trang {page} / {Math.ceil(data.total / 15) || 1}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.items.length < 15}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2.5 text-xs rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
