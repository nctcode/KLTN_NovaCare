'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Users,
  Search,
  Lock,
  Unlock,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const inputStyle = isLight
    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
    : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500';

  const tableHeaderStyle = isLight
    ? 'bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider'
    : 'bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: () => adminService.getUsers({ page, limit: 10, search, role: roleFilter }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminService.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-audit-logs'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-audit-logs'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Users className="w-6 h-6 text-[#0c4b39] dark:text-[#66FF33]" />
            Quản Lý Tài Khoản Người Dùng
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Xem danh sách bệnh nhân, khóa/mở khóa tài khoản và phân quyền quản trị viên.
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
              placeholder="Tìm theo Tên, Email hoặc Số điện thoại..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`pl-9 text-xs rounded-xl ${inputStyle}`}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className={`border text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0c4b39] w-full sm:w-48 ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <option value="">Tất cả Vai trò (Roles)</option>
            <option value="PATIENT">Bệnh nhân (PATIENT)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
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
                  <th className="p-4">Họ và Tên</th>
                  <th className="p-4">Email / SĐT</th>
                  <th className="p-4">Vai trò (Role)</th>
                  <th className="p-4">Hồ sơ / Đặt khám</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày đăng ký</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500 font-medium">
                      Không tìm thấy tài khoản người dùng nào
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((user: any) => (
                    <tr key={user.id} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}`}>
                      <td className={`p-4 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {user.fullName}
                      </td>
                      <td className={isLight ? 'p-4 text-slate-700' : 'p-4 text-slate-300'}>
                        <div>{user.email || 'Chưa đăng ký email'}</div>
                        <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{user.phone || 'Chưa có SĐT'}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            user.role === 'ADMIN'
                              ? isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950 text-amber-400 border-amber-800'
                              : isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className={`p-4 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {user._count?.patientProfiles || 0} hồ sơ / {user._count?.appointments || 0} lịch
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            user.isActive
                              ? isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : isLight ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td className={isLight ? 'p-4 text-slate-600' : 'p-4 text-slate-400'}>
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={toggleStatusMutation.isPending}
                          onClick={() => toggleStatusMutation.mutate(user.id)}
                          className={`text-xs font-bold rounded-xl ${
                            user.isActive
                              ? isLight ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : 'border-rose-800 text-rose-400 hover:bg-rose-950'
                              : isLight ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950'
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <Lock className="w-3.5 h-3.5 mr-1" /> Khóa
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5 mr-1" /> Mở khóa
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updateRoleMutation.isPending}
                          onClick={() =>
                            updateRoleMutation.mutate({
                              id: user.id,
                              role: user.role === 'ADMIN' ? 'PATIENT' : 'ADMIN',
                            })
                          }
                          className={`text-xs font-bold rounded-xl ${
                            isLight ? 'border-slate-300 text-slate-800 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          {user.role === 'ADMIN' ? 'Gỡ Admin' : 'Thành Admin'}
                        </Button>
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
        <div className={`flex items-center justify-between p-4 rounded-xl border text-xs ${
          isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}>
          <span>
            Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng {data.total} người dùng)
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
