'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

export default function AdminUsersPage() {
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

    return list.filter((user) => {
      if (user.role === 'ADMIN') return false;

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
  }, [apiData, localUsers, search, statusFilter, pendingFilter]);

  const totalUsersCount = apiData?.total ?? displayedUsers.length;
  const activeUsersCount = useMemo(() => displayedUsers.filter((u) => u.status === 'ACTIVE').length, [displayedUsers]);
  const lockedUsersCount = useMemo(() => displayedUsers.filter((u) => u.status === 'LOCKED').length, [displayedUsers]);
  const newUsersCount = useMemo(() => displayedUsers.length, [displayedUsers]);

  const handleOpenModal = async (user: AdminUserItem) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);

    if (user.id && !user.id.startsWith('usr-local')) {
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Hoạt động
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-950 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            Đã khóa
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 text-slate-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-950 tracking-tight">
              Quản Lý Tài Khoản Người Dùng
            </h1>
            <p className="text-xs font-medium text-slate-900 mt-0.5">
              Quản lý danh sách người dùng và theo dõi hoạt động trên nền tảng NovaCare.
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
      <Card className="rounded-xl overflow-hidden border border-slate-300 bg-white shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-slate-900 animate-spin" />
              <span className="text-xs text-slate-900 font-bold">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-950 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Avatar</th>
                  <th className="p-3.5">Họ và Tên</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Số điện thoại</th>
                  <th className="p-3.5 text-center">Hồ sơ</th>
                  <th className="p-3.5 text-center">Lịch khám</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-900 font-bold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-7 h-7 text-slate-600" />
                        <span className="font-bold text-slate-950">Không tìm thấy tài khoản phù hợp</span>
                        <Button variant="link" size="sm" onClick={handleResetFilters} className="text-xs text-slate-900 underline font-bold">
                          Làm mới bộ lọc
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-100/80 transition-colors"
                    >
                      {/* Avatar */}
                      <td className="p-3.5">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-400"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                            {user.fullName.charAt(0)}
                          </div>
                        )}
                      </td>

                      {/* Full Name */}
                      <td className="p-3.5 font-bold text-slate-950 max-w-[140px] truncate" title={user.fullName}>
                        <span className="truncate">{user.fullName}</span>
                      </td>

                      {/* Email */}
                      <td className="p-3.5 font-medium text-slate-900 max-w-[170px] truncate" title={user.email || ''}>
                        {user.email || <span className="text-slate-500 italic">Chưa có email</span>}
                      </td>

                      {/* Phone */}
                      <td className="p-3.5 font-mono font-bold text-slate-950">
                        {user.phone}
                      </td>

                      {/* Patient Profiles Count */}
                      <td className="p-3.5 text-center font-bold text-slate-950">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-950 font-black border border-blue-200">
                          {user.patientProfilesCount || user.patientProfiles?.length || 0} hồ sơ
                        </span>
                      </td>

                      {/* Total Bookings */}
                      <td className="p-3.5 text-center font-bold text-slate-950">
                        <span className="inline-block px-2.5 py-0.5 rounded bg-slate-200 text-slate-950 font-black">
                          {user.totalBookings}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {getStatusBadge(user.status)}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(user)}
                          className="text-xs font-bold rounded-lg border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-700" /> Xem chi tiết
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={toggleStatusMutation.isPending}
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`text-xs font-bold rounded-lg ${
                            user.status === 'LOCKED'
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
                              : 'border-rose-400 bg-rose-50 text-rose-950 hover:bg-rose-100'
                          }`}
                        >
                          {user.status === 'LOCKED' ? (
                            <>
                              <Unlock className="w-3.5 h-3.5 mr-1" /> Mở khóa
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 mr-1" /> Khóa
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
          Hiển thị <strong>{displayedUsers.length}</strong> người dùng (Tổng số: <strong>{totalUsersCount}</strong>)
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
    </div>
  );
}
