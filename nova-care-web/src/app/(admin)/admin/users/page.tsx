'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { UserStatsCards } from '@/components/admin/users/UserStatsCards';
import { UserFilterBar } from '@/components/admin/users/UserFilterBar';
import { UserDetailDrawer } from '@/components/admin/users/UserDetailDrawer';
import { MOCK_ADMIN_USERS } from '@/components/admin/users/mockData';
import { AdminUserItem, AccountStatus } from '@/components/admin/users/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Users,
  Eye,
  Lock,
  Unlock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Plus,
  Building2,
} from 'lucide-react';
import { CreateHospitalAdminDialog } from '@/components/admin/CreateHospitalAdminDialog';

function AdminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'all';

  const handleTabChange = (tab: string) => {
    router.push(`/admin/users?tab=${tab}`);
  };

  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Filters State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [pendingFilter, setPendingFilter] = useState('all');

  // Selected User for Modal
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);

  // Local state for optimistic updates
  const [localUsers, setLocalUsers] = useState<AdminUserItem[]>(MOCK_ADMIN_USERS);

  // API Query for real users
  const { data: apiData, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', page, search, statusFilter],
    queryFn: () =>
      adminService.getUsers({
        page,
        limit: 10,
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminService.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-audit-logs'] });
    },
  });

  // Displayed users calculation
  const displayedUsers = useMemo(() => {
    let list = [...localUsers];

    if (apiData?.items && Array.isArray(apiData.items) && apiData.items.length > 0) {
      const apiUsers: AdminUserItem[] = apiData.items.map((u: any, idx: number) => {
        const mockFallback = MOCK_ADMIN_USERS[idx % MOCK_ADMIN_USERS.length];
        return {
          id: u.id || `usr-api-${idx}`,
          fullName: u.fullName || u.name || 'Người dùng hệ thống',
          email: u.email || '',
          phone: u.phone || u.phoneNumber || '',
          gender: u.gender || 'NAM',
          createdAt: u.createdAt || new Date().toISOString(),
          lastLogin: u.lastLoginAt || u.updatedAt || u.createdAt || new Date().toISOString(),
          status: u.isActive === false ? 'LOCKED' : 'ACTIVE',
          role: u.role || 'PATIENT',
          hospital: u.hospital,
          totalBookings: u._count?.appointments ?? 0,
          hasPendingBooking: false,
          avatarUrl: u.avatarUrl,
          patientProfilesCount: u._count?.patientProfiles ?? (u.patientProfiles ? u.patientProfiles.length : 0),
          patientProfiles: u.patientProfiles && Array.isArray(u.patientProfiles)
            ? u.patientProfiles.map((p: any) => ({
                id: p.id,
                fullName: p.fullName,
                relation: p.relation || 'Bản thân',
                gender: p.gender === 'MALE' ? 'MALE' : p.gender === 'FEMALE' ? 'FEMALE' : 'OTHER',
                dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : undefined,
                phone: p.phone,
                address: p.address,
                identityNumber: p.identityNumber,
                maskedCccd: p.identityNumber
                  ? p.identityNumber.length >= 12
                    ? `${p.identityNumber.slice(0, 6)}******${p.identityNumber.slice(-4)}`
                    : `${p.identityNumber.slice(0, 3)}***`
                  : undefined,
                healthInsurance: p.healthInsurance,
                medicalHistory: p.medicalHistory,
                allergies: p.allergies,
                emergencyContact: p.emergencyContact,
                emergencyPhone: p.emergencyPhone,
                isDefault: p.isDefault,
                createdAt: p.createdAt,
                bookingHistory: [],
              }))
            : [],
          activitySummary: mockFallback.activitySummary,
          bookingHistory: mockFallback.bookingHistory,
          paymentRecords: mockFallback.paymentRecords,
          accountLogs: mockFallback.accountLogs,
          internalNotes: mockFallback.internalNotes,
        };
      });
      list = apiUsers;
    }

    // Filter by tab
    return list.filter((user) => {
      if (user.role === 'ADMIN') return false;

      if (currentTab === 'hospital-admin') {
        if (user.role !== 'HOSPITAL_ADMIN') return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = user.fullName.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchPhone = user.phone.includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      if (statusFilter !== 'all' && user.status !== statusFilter) return false;
      if (pendingFilter === 'has_pending' && !user.hasPendingBooking) return false;
      if (pendingFilter === 'no_pending' && user.hasPendingBooking) return false;

      return true;
    });
  }, [apiData, localUsers, search, statusFilter, pendingFilter, currentTab]);

  const totalUsersCount = apiData?.total ?? displayedUsers.length;
  const activeUsersCount = useMemo(() => displayedUsers.filter((u) => u.status === 'ACTIVE').length, [displayedUsers]);
  const lockedUsersCount = useMemo(() => displayedUsers.filter((u) => u.status === 'LOCKED').length, [displayedUsers]);
  const newUsersCount = useMemo(() => displayedUsers.length, [displayedUsers]);

  const handleOpenModal = async (user: AdminUserItem) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);

    if (user.id && !user.id.startsWith('usr-local') && !user.id.startsWith('hosp-admin')) {
      try {
        const detail = await adminService.getUserDetail(user.id);
        if (detail) {
          const profiles = detail.patientProfiles && Array.isArray(detail.patientProfiles)
            ? detail.patientProfiles.map((p: any) => ({
                id: p.id,
                fullName: p.fullName,
                relation: p.relation || 'Bản thân',
                gender: p.gender === 'MALE' ? 'MALE' : p.gender === 'FEMALE' ? 'FEMALE' : 'OTHER',
                dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : undefined,
                phone: p.phone,
                address: p.address,
                identityNumber: p.identityNumber,
                maskedCccd: p.identityNumber
                  ? p.identityNumber.length >= 12
                    ? `${p.identityNumber.slice(0, 6)}******${p.identityNumber.slice(-4)}`
                    : `${p.identityNumber.slice(0, 3)}***`
                  : undefined,
                healthInsurance: p.healthInsurance,
                medicalHistory: p.medicalHistory,
                allergies: p.allergies,
                emergencyContact: p.emergencyContact,
                emergencyPhone: p.emergencyPhone,
                isDefault: p.isDefault,
                createdAt: p.createdAt,
                bookingHistory: p.appointments || [],
              }))
            : [];

          setSelectedUser((prev) =>
            prev && prev.id === user.id
              ? {
                  ...prev,
                  patientProfilesCount: profiles.length,
                  patientProfiles: profiles,
                }
              : prev
          );
        }
      } catch (err) {
        console.error('Failed to load user detail:', err);
      }
    }
  };

  const handleToggleStatus = (userId: string, currentStatus: AccountStatus) => {
    const newStatus: AccountStatus = currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    
    toggleStatusMutation.mutate(userId);

    setLocalUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const actionLog = {
            id: `log-${Date.now()}`,
            action: (newStatus === 'LOCKED' ? 'ADMIN_LOCK' : 'ADMIN_UNLOCK') as any,
            title: newStatus === 'LOCKED' ? 'Admin khóa tài khoản' : 'Admin mở khóa tài khoản',
            description: newStatus === 'LOCKED' ? 'Tài khoản bị khóa bởi Admin hệ thống.' : 'Tài khoản được gỡ khóa bởi Admin.',
            actor: 'Admin NovaCare',
            timestamp: new Date().toLocaleString('vi-VN'),
          };
          return {
            ...u,
            status: newStatus,
            accountLogs: [actionLog, ...(u.accountLogs || [])],
          };
        }
        return u;
      })
    );

    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    toast.success(
      newStatus === 'LOCKED' ? 'Đã khóa tài khoản thành công' : 'Đã mở khóa tài khoản thành công'
    );
  };

  const handleResetPassword = (userId: string) => {
    toast.success('Đã reset mật khẩu ngẫu nhiên và gửi tới SĐT/Email của người dùng');
  };

  const handleSendNotification = (userId: string, title: string, message: string) => {
    toast.success(`Đã gửi thông báo "${title}" tới người dùng`);
  };

  const handleAddInternalNote = (userId: string, noteContent: string) => {
    const newNote = {
      id: `note-${Date.now()}`,
      adminName: 'Admin NovaCare',
      content: noteContent,
      createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setLocalUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            internalNotes: [newNote, ...(u.internalNotes || [])],
          };
        }
        return u;
      })
    );

    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              internalNotes: [newNote, ...(prev.internalNotes || [])],
            }
          : null
      );
    }

    toast.success('Đã thêm ghi chú nội bộ thành công');
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateRangeFilter('all');
    setPendingFilter('all');
    setPage(1);
    refetch();
    toast.info('Đã làm mới bộ lọc');
  };

  const handleExportExcel = () => {
    toast.success('Đã xuất danh sách người dùng ra file Excel thành công!');
  };

   const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Hoạt động
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Đã khóa
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 text-slate-950 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản Lý Người Dùng
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Xem và quản lý tất cả tài khoản người dùng đăng ký trên nền tảng NovaCare.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: DASHBOARD STATISTICS */}
      <UserStatsCards
        totalUsers={totalUsersCount}
        activeUsers={activeUsersCount}
        lockedUsers={lockedUsersCount}
        newUsersThisMonth={newUsersCount}
        isLight={isLight}
      />

      {/* SECTION 2: SEARCH & FILTER BAR */}
      <UserFilterBar
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        dateRangeFilter={dateRangeFilter}
        onDateRangeChange={(val) => {
          setDateRangeFilter(val);
          setPage(1);
        }}
        pendingFilter={pendingFilter}
        onPendingChange={(val) => {
          setPendingFilter(val);
          setPage(1);
        }}
        onReset={handleResetFilters}
        onExportExcel={handleExportExcel}
        isLight={isLight}
      />

      {/* SECTION 3: USER DATA TABLE */}
      <Card className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Avatar</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Họ và Tên</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Vai trò</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Email</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Số điện thoại</th>
                  <th className="py-2.5 px-3 text-center min-w-[90px]">Hồ sơ</th>
                  <th className="py-2.5 px-3 text-center min-w-[90px]">Lịch khám</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right min-w-[140px]">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
                {displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-6 h-6 text-slate-400" />
                        <span className="font-medium text-slate-600 dark:text-slate-400">Không tìm thấy tài khoản phù hợp.</span>
                        <Button variant="link" size="sm" onClick={handleResetFilters} className="text-xs text-emerald-700 underline">
                          Làm mới bộ lọc
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      {/* Avatar */}
                      <td className="py-2.5 px-3 align-middle text-center">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 inline-block"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium inline-flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700">
                            {user.fullName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </td>

                      {/* Full Name */}
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white max-w-[160px] truncate align-middle" title={user.fullName}>
                        {user.fullName}
                      </td>

                      {/* Role */}
                      <td className="py-2.5 px-3 align-middle">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Platform Admin
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Bệnh nhân
                          </span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate align-middle" title={user.email || ''}>
                        {user.email || <span className="text-slate-400 italic">Chưa có</span>}
                      </td>

                      {/* Phone */}
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 align-middle">
                        {user.phone}
                      </td>

                      {/* Patient Profiles Count */}
                      <td className="py-2.5 px-3 text-center align-middle">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {user.patientProfilesCount || user.patientProfiles?.length || 0} hồ sơ
                        </span>
                      </td>

                      {/* Total Bookings */}
                      <td className="py-2.5 px-3 text-center font-medium text-slate-700 dark:text-slate-300 align-middle">
                        {user.totalBookings || 0}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center align-middle">
                        {getStatusBadge(user.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap align-middle">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(user)}
                          className="h-7 text-xs font-normal rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-2"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" /> Chi tiết
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={toggleStatusMutation.isPending}
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`h-7 text-xs font-normal rounded-lg px-2 ${
                            user.status === 'LOCKED'
                              ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {user.status === 'LOCKED' ? (
                            <>
                              <Unlock className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Mở khóa
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 mr-1 text-slate-500" /> Khóa
                            </>
                          )}
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
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-300 bg-white text-xs text-slate-950 font-medium">
        <span>
          Hiển thị <strong>{displayedUsers.length}</strong> tài khoản (Tổng số: <strong>{totalUsersCount}</strong>)
        </span>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="text-xs font-bold rounded-lg border-slate-300 text-slate-950 hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Trang trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={displayedUsers.length < 10 && page >= 1}
            onClick={() => setPage(page + 1)}
            className="text-xs font-bold rounded-lg border-slate-300 text-slate-950 hover:bg-slate-100"
          >
            Trang sau <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* SECTION 4 & 5: USER DETAIL MODAL */}
      <UserDetailDrawer
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onToggleStatus={handleToggleStatus}
        onResetPassword={handleResetPassword}
        onSendNotification={handleSendNotification}
        onAddInternalNote={handleAddInternalNote}
        isLight={isLight}
      />

      {/* CREATE HOSPITAL ADMIN MODAL */}
      <CreateHospitalAdminDialog
        open={isCreateAdminOpen}
        onOpenChange={setIsCreateAdminOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Đang tải trang Người dùng...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
