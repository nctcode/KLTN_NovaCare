'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Users,
  Building2,
  KeyRound,
  Check,
  Minus,
  Search,
  Lock,
  Plus,
  Loader2,
  Shield,
  UserCheck,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from 'lucide-react';
import { CreateHospitalAdminDialog } from '@/components/admin/CreateHospitalAdminDialog';

interface PermissionMatrixItem {
  category: string;
  permissions: {
    name: string;
    description: string;
    admin: string;
    hospitalAdmin: string;
    doctor: string;
    patient: string;
  }[];
}

const PERMISSION_MATRIX: PermissionMatrixItem[] = [
  {
    category: 'Quản trị Người dùng & Phân quyền',
    permissions: [
      {
        name: 'Xem danh sách người dùng',
        description: 'Tra cứu hồ sơ tài khoản hệ thống',
        admin: 'Toàn hệ thống',
        hospitalAdmin: 'Bệnh nhân thuộc viện',
        doctor: 'Không',
        patient: 'Không',
      },
      {
        name: 'Khóa / Mở khóa tài khoản',
        description: 'Kiểm soát truy cập tài khoản vi phạm',
        admin: 'Toàn hệ thống',
        hospitalAdmin: 'Không',
        doctor: 'Không',
        patient: 'Không',
      },
      {
        name: 'Gán & Thay đổi vai trò',
        description: 'Chỉ định quyền Admin / Hospital Admin',
        admin: 'Toàn hệ thống',
        hospitalAdmin: 'Không',
        doctor: 'Không',
        patient: 'Không',
      },
    ],
  },
  {
    category: 'Quản lý Cơ sở Y tế & Bác sĩ',
    permissions: [
      {
        name: 'Cấu hình Bệnh viện & Chuyên khoa',
        description: 'Thêm/Sửa/Xóa thông tin cơ sở',
        admin: 'Toàn hệ thống',
        hospitalAdmin: 'Cơ sở quản lý',
        doctor: 'Không',
        patient: 'Chỉ xem',
      },
      {
        name: 'Quản lý Bác sĩ & Lịch trực',
        description: 'Tạo ca khám, phân công bác sĩ',
        admin: 'Toàn hệ thống',
        hospitalAdmin: 'Bác sĩ thuộc viện',
        doctor: 'Xem lịch cá nhân',
        patient: 'Chỉ xem',
      },
    ],
  },
  {
    category: 'Quản lý Lịch hẹn & Tiếp nhận khám',
    permissions: [
      {
        name: 'Xem danh sách đặt lịch',
        description: 'Theo dõi ca khám đặt qua cổng',
        admin: 'Toàn hệ thống',
        hospitalAdmin: 'Ca khám thuộc viện',
        doctor: 'Ca khám phụ trách',
        patient: 'Lịch của tôi',
      },
      {
        name: 'Tiếp nhận & Cập nhật kết quả',
        description: 'Hoàn thành khám / Hủy ca khám',
        admin: 'Toàn quyền',
        hospitalAdmin: 'Ca khám thuộc viện',
        doctor: 'Ca khám phụ trách',
        patient: 'Hủy lịch (trước giờ)',
      },
    ],
  },
  {
    category: 'Giám sát Liên thông Bệnh án (HIE)',
    permissions: [
      {
        name: 'Giám sát lưu lượng & Cổng HIS',
        description: 'Theo dõi metrics và tình trạng Node',
        admin: 'Toàn hệ thống',
        hospitalAdmin: 'Cổng của viện',
        doctor: 'Không',
        patient: 'Không',
      },
      {
        name: 'Tra cứu hồ sơ liên viện (FHIR)',
        description: 'Truy xuất lịch sử khám đa viện bằng PIN',
        admin: 'Xem Audit Log',
        hospitalAdmin: 'Không',
        doctor: 'Được bệnh nhân cấp PIN',
        patient: 'Hồ sơ bản thân',
      },
    ],
  },
];

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'matrix' | 'users'>('matrix');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<any | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<string>('PATIENT');

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tableHeaderStyle = isLight
    ? 'bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs'
    : 'bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-xs';

  // Fetch users with roles
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-roles-users', page, search, roleFilter],
    queryFn: () =>
      adminService.getUsers({
        page,
        limit: 10,
        search,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      }),
  });

  // Role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      toast.success('Đã cập nhật vai trò người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-roles-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUserForRole(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật vai trò');
    },
  });

  const handleOpenRoleModal = (user: any) => {
    setSelectedUserForRole(user);
    setNewSelectedRole(user.role || 'PATIENT');
  };

  const handleSaveRole = () => {
    if (!selectedUserForRole) return;
    updateRoleMutation.mutate({
      userId: selectedUserForRole.id,
      role: newSelectedRole,
    });
  };

  const renderBadge = (text: string) => {
    if (text === 'Toàn hệ thống' || text === 'Toàn quyền') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
          {text}
        </Badge>
      );
    }
    if (text.includes('thuộc viện') || text.includes('quản lý') || text.includes('phụ trách')) {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[11px] font-semibold">
          {text}
        </Badge>
      );
    }
    if (text.includes('PIN') || text.includes('của tôi') || text.includes('Chỉ xem') || text.includes('Audit')) {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[11px] font-semibold">
          {text}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-slate-400 text-[11px] font-normal">
        {text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-sm">
            <KeyRound className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Vai Trò & Phân Quyền Hệ Thống
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập ma trận quyền hạn (RBAC), kiểm soát vai trò quản trị viên và tài khoản vận hành.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateAdminOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo Quản trị Bệnh viện
        </Button>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cardStyle}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quản Trị Tối Cao</p>
              <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">ADMIN</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Toàn quyền hệ thống NovaCare</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyle}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quản Trị Bệnh Viện</p>
              <h3 className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">HOSPITAL_ADMIN</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Vận hành ca khám, bác sĩ tại viện</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyle}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bác Sĩ Khám</p>
              <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">DOCTOR</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Khám bệnh, tra cứu hồ sơ đa viện</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyle}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bệnh Nhân</p>
              <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 mt-1">PATIENT</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Đặt lịch, sổ khám, thanh toán</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Switcher */}
      <div className={`flex border-b ${isLight ? 'border-slate-200' : 'border-slate-800'} gap-6 text-xs sm:text-sm font-bold`}>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Ma Trận Phân Quyền (RBAC Matrix)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>Phân Quyền & Gán Vai Trò Tài Khoản</span>
        </button>
      </div>

      {/* TAB 1: PERMISSION MATRIX */}
      {activeTab === 'matrix' && (
        <Card className={`${cardStyle} overflow-hidden`}>
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold">Quyền Hạn Chi Tiết Theo Từng Vai Trò</CardTitle>
            <CardDescription className="text-xs">
              Bảng quy định phạm vi truy cập dữ liệu và tác vụ nghiệp vụ của từng nhóm người dùng trên hệ thống.
            </CardDescription>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={tableHeaderStyle}>
                <tr>
                  <th className="p-3.5 pl-5">Tác Vụ Nghiệp Vụ</th>
                  <th className="p-3.5 text-center">ADMIN</th>
                  <th className="p-3.5 text-center">HOSPITAL_ADMIN</th>
                  <th className="p-3.5 text-center">DOCTOR</th>
                  <th className="p-3.5 text-center pr-5">PATIENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {PERMISSION_MATRIX.map((group, gIdx) => (
                  <React.Fragment key={gIdx}>
                    <tr className={isLight ? 'bg-slate-50/80 font-bold text-slate-700' : 'bg-slate-900/60 font-bold text-slate-300'}>
                      <td colSpan={5} className="py-2.5 px-5 text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {group.category}
                      </td>
                    </tr>
                    {group.permissions.map((perm, pIdx) => (
                      <tr
                        key={pIdx}
                        className={`transition-colors ${
                          isLight ? 'hover:bg-slate-50/60' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <td className="py-3 px-5">
                          <div className="font-semibold text-slate-900 dark:text-white">{perm.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{perm.description}</div>
                        </td>
                        <td className="py-3 px-3.5 text-center">{renderBadge(perm.admin)}</td>
                        <td className="py-3 px-3.5 text-center">{renderBadge(perm.hospitalAdmin)}</td>
                        <td className="py-3 px-3.5 text-center">{renderBadge(perm.doctor)}</td>
                        <td className="py-3 px-3.5 text-center pr-5">{renderBadge(perm.patient)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: USER ROLES MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <Card className={`${cardStyle} p-4`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Tìm theo Tên, Email hoặc Số điện thoại người dùng..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className={`pl-9 text-xs rounded-xl ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`border text-xs px-3 py-2 rounded-xl focus:outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  <option value="HOSPITAL_ADMIN">Quản trị viện (HOSPITAL_ADMIN)</option>
                  <option value="PATIENT">Bệnh nhân (PATIENT)</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className={`${cardStyle} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={tableHeaderStyle}>
                  <tr>
                    <th className="p-3.5 pl-5">Người Dùng</th>
                    <th className="p-3.5">Liên Hệ</th>
                    <th className="p-3.5 text-center">Vai Trò Hiện Tại</th>
                    <th className="p-3.5">Bệnh Viện Phụ Trách</th>
                    <th className="p-3.5 text-right pr-5">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                        Đang tải danh sách người dùng...
                      </td>
                    </tr>
                  ) : usersData?.items && usersData.items.length > 0 ? (
                    usersData.items.map((user: any) => (
                      <tr
                        key={user.id}
                        className={`transition-colors ${
                          isLight ? 'hover:bg-slate-50/60' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <td className="py-3 px-5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {user.fullName || user.name || 'Người dùng hệ thống'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">ID: {user.id}</div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="text-slate-700 dark:text-slate-300">{user.email || '—'}</div>
                          <div className="text-[11px] text-slate-400">{user.phone || user.phoneNumber || '—'}</div>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <Badge
                            className={`text-[11px] font-bold ${
                              user.role === 'ADMIN'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : user.role === 'HOSPITAL_ADMIN'
                                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                                : 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30'
                            }`}
                          >
                            {user.role || 'PATIENT'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 text-xs">
                          {user.hospital?.name || (user.role === 'HOSPITAL_ADMIN' ? 'Chưa gán bệnh viện' : '—')}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRoleModal(user)}
                            className="text-xs rounded-lg h-8 gap-1.5"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                            Đổi vai trò
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        Không tìm thấy tài khoản nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {usersData?.total > 10 && (
              <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Tổng: {usersData.total} tài khoản</span>
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
                  <span>Trang {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersData.items.length < 10}
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
      )}

      {/* Change Role Dialog */}
      <Dialog open={!!selectedUserForRole} onOpenChange={(open) => !open && setSelectedUserForRole(null)}>
        <DialogContent className={cardStyle}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-500" />
              Thay Đổi Vai Trò Người Dùng
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Gán lại vai trò mới cho tài khoản: <b>{selectedUserForRole?.fullName || selectedUserForRole?.email}</b>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Chọn vai trò mới:
              </label>
              <select
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value)}
                className={`w-full border text-xs px-3 py-2 rounded-xl focus:outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value="PATIENT">Bệnh nhân (PATIENT) - Người dùng cơ bản</option>
                <option value="HOSPITAL_ADMIN">Quản trị viên Bệnh viện (HOSPITAL_ADMIN)</option>
                <option value="ADMIN">Quản trị viên Tối cao (ADMIN) - Toàn quyền</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Chú ý phân quyền:
              </p>
              Việc nâng quyền lên Quản trị viên (ADMIN) sẽ cho phép tài khoản này có toàn quyền thao tác dữ liệu, cấu hình cơ sở và kiểm soát toàn bộ người dùng khác trên hệ thống.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUserForRole(null)}
              className="text-xs rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              disabled={updateRoleMutation.isPending}
              onClick={handleSaveRole}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl gap-1.5"
            >
              {updateRoleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Lưu thay đổi vai trò
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Hospital Admin Modal */}
      <CreateHospitalAdminDialog
        open={isCreateAdminOpen}
        onOpenChange={setIsCreateAdminOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-roles-users'] });
        }}
      />
    </div>
  );
}
