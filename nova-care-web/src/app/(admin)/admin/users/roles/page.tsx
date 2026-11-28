'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAuthStore } from '@/stores/auth.store';
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
import { CreateHospitalAdminDialog } from '@/components/admin/CreateHospitalAdminDialog';
import {
  ShieldCheck,
  Users,
  Building2,
  Search,
  Plus,
  Loader2,
  Shield,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Info,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';

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

// Đồng bộ 100% với phân quyền thực thi tại Backend (@Roles Guard & phạm vi hospitalId)
const PERMISSION_MATRIX: PermissionMatrixItem[] = [
  {
    category: 'Quản trị người dùng & Phân quyền',
    permissions: [
      {
        name: 'Quản lý tài khoản & Khóa / Mở khóa',
        description: 'Tra cứu tài khoản, xem lịch sử hoạt động và kiểm soát truy cập',
        admin: 'Toàn hệ thống',
        hospitalAdmin: 'Không',
        doctor: 'Không',
        patient: 'Không',
      },
      {
        name: 'Cấp tài khoản & Điều chuyển cơ sở quản trị',
        description: 'Cấp tài khoản quản trị cơ sở (email kích hoạt 24h) và điều chuyển phạm vi bệnh viện',
        admin: 'Toàn hệ thống',
        hospitalAdmin: 'Không',
        doctor: 'Không',
        patient: 'Không',
      },
    ],
  },
  {
    category: 'Quản lý cơ sở y tế, bác sĩ & lịch trực',
    permissions: [
      {
        name: 'Quản lý cơ sở y tế & Duyệt hợp tác',
        description: 'Tạo mới bệnh viện đối tác, duyệt yêu cầu hợp tác và cập nhật hồ sơ cơ sở',
        admin: 'Toàn hệ thống',
        hospitalAdmin: 'Hồ sơ cơ sở mình',
        doctor: 'Không',
        patient: 'Chỉ xem',
      },
      {
        name: 'Quản lý đội ngũ bác sĩ & Lịch làm việc',
        description: 'Thêm hồ sơ bác sĩ, thiết lập ca khám định kỳ và quản lý dịch vụ y tế',
        admin: 'Giám sát toàn hệ thống',
        hospitalAdmin: 'Trong cơ sở mình',
        doctor: 'Xem lịch cá nhân',
        patient: 'Chỉ xem',
      },
    ],
  },
  {
    category: 'Quản lý lịch hẹn & Tiếp nhận khám',
    permissions: [
      {
        name: 'Tra cứu danh sách lịch hẹn',
        description: 'Theo dõi lịch đặt khám và thống kê tình trạng tiếp nhận',
        admin: 'Giám sát toàn hệ thống',
        hospitalAdmin: 'Lịch thuộc cơ sở mình',
        doctor: 'Lịch phụ trách',
        patient: 'Lịch của tôi',
      },
      {
        name: 'Cập nhật trạng thái lịch hẹn',
        description: 'Xác nhận, Check-in, Hoàn thành khám, Hủy lịch, đánh dấu Vắng mặt & Khôi phục',
        admin: 'Chỉ xem',
        hospitalAdmin: 'Trong cơ sở mình',
        doctor: 'Ghi nhận khám',
        patient: 'Hủy trước giờ hẹn',
      },
    ],
  },
  {
    category: 'Đồng bộ HIS & Liên thông bệnh án (HIE)',
    permissions: [
      {
        name: 'Cấu hình cổng HIS & Đồng bộ danh mục',
        description: 'Kết nối API đối tác HIS, kiểm tra kết nối và đồng bộ bác sĩ / lịch khám',
        admin: 'Giám sát toàn hệ thống',
        hospitalAdmin: 'Cổng của cơ sở mình',
        doctor: 'Không',
        patient: 'Không',
      },
      {
        name: 'Tra cứu hồ sơ bệnh án liên viện (FHIR)',
        description: 'Truy xuất lịch sử khám đa viện theo mã PIN xác thực của người bệnh',
        admin: 'Xem Audit Log',
        hospitalAdmin: 'Không',
        doctor: 'Khi bệnh nhân cấp PIN',
        patient: 'Hồ sơ cá nhân',
      },
    ],
  },
];

const ROLE_CARDS = [
  {
    code: 'ADMIN',
    title: 'Quản trị nền tảng',
    desc: 'Điều phối đối tác, giám sát toàn hệ thống & phân quyền cơ sở',
    icon: ShieldCheck,
    accentLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentDark: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
  },
  {
    code: 'HOSPITAL_ADMIN',
    title: 'Quản trị cơ sở y tế',
    desc: 'Vận hành bác sĩ, lịch trực, lịch hẹn & cổng HIS của cơ sở mình',
    icon: Building2,
    accentLight: 'bg-sky-50 text-sky-700 border-sky-200',
    accentDark: 'bg-sky-950/40 text-sky-400 border-sky-800/60',
  },
  {
    code: 'DOCTOR',
    title: 'Bác sĩ khám bệnh',
    desc: 'Xem lịch phụ trách, khám bệnh & tra cứu hồ sơ khi có PIN',
    icon: Stethoscope,
    accentLight: 'bg-teal-50 text-teal-700 border-teal-200',
    accentDark: 'bg-teal-950/40 text-teal-400 border-teal-800/60',
  },
  {
    code: 'PATIENT',
    title: 'Người bệnh',
    desc: 'Đặt lịch khám, thanh toán & quản lý sổ sức khỏe cá nhân',
    icon: Users,
    accentLight: 'bg-slate-100 text-slate-700 border-slate-200',
    accentDark: 'bg-slate-800/80 text-slate-300 border-slate-700',
  },
];

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'matrix' | 'admins'>('matrix');
  const [roleFilter, setRoleFilter] = useState<'ALL_ADMIN' | 'HOSPITAL_ADMIN' | 'ADMIN'>('ALL_ADMIN');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selectedAdminForTransfer, setSelectedAdminForTransfer] = useState<any | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);

  const cardStyle = isLight
    ? 'bg-white border-slate-200/90 text-slate-900 shadow-xs rounded-xl'
    : 'bg-slate-950 border-slate-800 text-slate-100 shadow-xs rounded-xl';

  const tableHeaderStyle = isLight
    ? 'bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs'
    : 'bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold text-xs';

  // Chỉ tải danh sách tài khoản quản trị (ADMIN & HOSPITAL_ADMIN) — tách bạch hoàn toàn với PATIENT / DOCTOR
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-roles-users', page, search, roleFilter],
    queryFn: () =>
      adminService.getUsers({
        page,
        limit: 10,
        search: search.trim() || undefined,
        ...(roleFilter === 'ALL_ADMIN'
          ? { roles: ['HOSPITAL_ADMIN', 'ADMIN'] }
          : { role: roleFilter }),
      }),
  });

  // Danh sách cơ sở y tế phục vụ điều chuyển
  const { data: hospitalsData, isLoading: loadingHospitals } = useQuery({
    queryKey: ['admin-hospitals-simple-list'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
  });

  const activeHospitals: any[] = (hospitalsData?.items || []).filter(
    (h: any) => (h.rawStatus || h.status) !== 'TERMINATED' && h.status !== 'Ngừng hợp tác',
  );

  // Điều chuyển cơ sở y tế phụ trách cho HOSPITAL_ADMIN
  const transferScopeMutation = useMutation({
    mutationFn: ({ userId, hospitalId }: { userId: string; hospitalId: string }) =>
      adminService.updateUserRole(userId, 'HOSPITAL_ADMIN', hospitalId),
    onSuccess: (res: any) => {
      toast.success(
        res?.message || 'Đã điều chuyển cơ sở y tế phụ trách và thu hồi phiên đăng nhập cũ thành công',
      );
      queryClient.invalidateQueries({ queryKey: ['admin-roles-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-audit-logs'] });
      setSelectedAdminForTransfer(null);
      setSelectedHospitalId('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể điều chuyển cơ sở y tế phụ trách');
    },
  });

  const handleOpenTransferModal = (adminAccount: any) => {
    setSelectedAdminForTransfer(adminAccount);
    setSelectedHospitalId(adminAccount.hospitalId || adminAccount.hospital?.id || '');
  };

  const handleSaveTransfer = () => {
    if (!selectedAdminForTransfer) return;
    if (!selectedHospitalId) {
      toast.error('Vui lòng chọn cơ sở y tế phụ trách mới');
      return;
    }
    const currentHospitalId =
      selectedAdminForTransfer.hospitalId || selectedAdminForTransfer.hospital?.id || '';
    if (selectedHospitalId === currentHospitalId) {
      toast.error('Vui lòng chọn một cơ sở y tế khác với cơ sở hiện tại');
      return;
    }
    transferScopeMutation.mutate({
      userId: selectedAdminForTransfer.id,
      hospitalId: selectedHospitalId,
    });
  };

  const renderPermissionBadge = (text: string) => {
    if (text === 'Toàn hệ thống') {
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
            isLight
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/70'
          }`}
        >
          {text}
        </span>
      );
    }
    if (
      text.includes('cơ sở mình') ||
      text.includes('phụ trách') ||
      text.includes('cá nhân') ||
      text.includes('Ghi nhận')
    ) {
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
            isLight
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-sky-950/40 text-sky-400 border-sky-800/70'
          }`}
        >
          {text}
        </span>
      );
    }
    if (
      text.includes('Giám sát') ||
      text.includes('Chỉ xem') ||
      text.includes('PIN') ||
      text.includes('Audit') ||
      text.includes('của tôi') ||
      text.includes('Hủy trước')
    ) {
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
            isLight
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-amber-950/40 text-amber-400 border-amber-800/70'
          }`}
        >
          {text}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] ${
          isLight ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        —
      </span>
    );
  };

  const renderAccountStatus = (u: any) => {
    if (u.isActive) {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
            isLight
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" /> Hoạt động
        </span>
      );
    }
    if (!u.lastLoginAt) {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
            isLight
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-amber-950/40 text-amber-400 border-amber-800/60'
          }`}
        >
          <Clock className="w-3 h-3" /> Chờ kích hoạt
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
          isLight
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
        }`}
      >
        <Ban className="w-3 h-3" /> Đã khóa
      </span>
    );
  };

  const totalPages = usersData?.totalPages || 1;
  const currentHospitalId =
    selectedAdminForTransfer?.hospitalId || selectedAdminForTransfer?.hospital?.id || '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header đơn giản chuẩn y tế */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-400'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Vai trò &amp; Phân quyền hệ thống
            </h1>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Quy định ma trận phân quyền y tế (RBAC), cấp tài khoản quản trị cơ sở y tế bổ sung và điều chuyển phạm vi phụ trách.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateAdminOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold gap-1.5 h-9 px-3.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cấp tài khoản quản trị cơ sở
        </Button>
      </div>

      {/* Tóm tắt 4 vai trò cố định */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ROLE_CARDS.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.code} className={cardStyle}>
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isLight ? role.accentLight : role.accentDark
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {role.title}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {role.code}
                  </span>
                  <p className={`text-[11px] leading-relaxed mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {role.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Thanh chuyển 2 Tab */}
      <div className={`flex border-b ${isLight ? 'border-slate-200' : 'border-slate-800'} gap-6 text-xs sm:text-sm font-semibold`}>
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Ma trận phân quyền (RBAC)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'admins'
              ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tài khoản quản trị &amp; Phạm vi cơ sở</span>
        </button>
      </div>

      {/* TAB 1: MA TRẬN PHÂN QUYỀN */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div
            className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs ${
              isLight
                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            }`}
          >
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Chính sách phân quyền theo vai trò (<strong>RBAC</strong>) được cố định và thực thi bắt buộc ở tầng máy chủ để bảo vệ dữ liệu y tế và tách bạch danh tính giữa người bệnh, bác sĩ và đơn vị quản trị.
            </p>
          </div>

          <Card className={`${cardStyle} overflow-hidden`}>
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold">Phạm vi quyền hạn theo từng vai trò</CardTitle>
              <CardDescription className="text-xs">
                Đối chiếu trực tiếp với quyền truy cập thực tế trên các phân hệ của nền tảng NovaCare.
              </CardDescription>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={tableHeaderStyle}>
                  <tr>
                    <th className="py-3 pl-5 pr-3">Chức năng nghiệp vụ</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">ADMIN</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">HOSPITAL_ADMIN</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">DOCTOR</th>
                    <th className="py-3 pl-3 pr-5 text-center whitespace-nowrap">PATIENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {PERMISSION_MATRIX.map((group, gIdx) => (
                    <React.Fragment key={gIdx}>
                      <tr className={isLight ? 'bg-slate-50/90' : 'bg-slate-900/50'}>
                        <td
                          colSpan={5}
                          className="py-2 px-5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400"
                        >
                          {group.category}
                        </td>
                      </tr>
                      {group.permissions.map((perm, pIdx) => (
                        <tr
                          key={pIdx}
                          className={isLight ? 'hover:bg-slate-50/70 transition-colors' : 'hover:bg-slate-900/40 transition-colors'}
                        >
                          <td className="py-3 pl-5 pr-3">
                            <div className={`font-medium ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                              {perm.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {perm.description}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">{renderPermissionBadge(perm.admin)}</td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">{renderPermissionBadge(perm.hospitalAdmin)}</td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">{renderPermissionBadge(perm.doctor)}</td>
                          <td className="py-3 pl-3 pr-5 text-center whitespace-nowrap">{renderPermissionBadge(perm.patient)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: TÀI KHOẢN QUẢN TRỊ & ĐIỀU CHUYỂN PHẠM VI CƠ SỞ */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          <div
            className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-slate-900/70 border-slate-800 text-slate-300'
            }`}
          >
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Danh sách chỉ quản lý tài khoản quản trị (<strong>HOSPITAL_ADMIN</strong> và <strong>ADMIN</strong>). Tài khoản bệnh nhân và bác sĩ được tách biệt để bảo đảm an toàn dữ liệu y tế; việc khóa/mở khóa tài khoản thực hiện tại mục <strong>Quản lý người dùng</strong>.
            </p>
          </div>

          <Card className={`${cardStyle} p-3.5`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Tìm theo họ tên, email hoặc số điện thoại quản trị viên..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className={`pl-9 text-xs h-9 rounded-lg ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as any);
                  setPage(1);
                }}
                className={`border text-xs px-3 h-9 rounded-lg focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value="ALL_ADMIN">Tất cả tài khoản quản trị</option>
                <option value="HOSPITAL_ADMIN">Quản trị cơ sở y tế (HOSPITAL_ADMIN)</option>
                <option value="ADMIN">Quản trị nền tảng (ADMIN)</option>
              </select>
            </div>
          </Card>

          <Card className={`${cardStyle} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={tableHeaderStyle}>
                  <tr>
                    <th className="py-3 pl-5 pr-3">Quản trị viên</th>
                    <th className="py-3 px-3">Liên hệ</th>
                    <th className="py-3 px-3 text-center">Vai trò</th>
                    <th className="py-3 px-3">Cơ sở y tế phụ trách</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 pl-3 pr-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                        Đang tải danh sách tài khoản quản trị...
                      </td>
                    </tr>
                  ) : usersData?.items && usersData.items.length > 0 ? (
                    usersData.items.map((account: any) => {
                      const isSelf = currentUser?.id === account.id;
                      const isHospitalAdminRow = account.role === 'HOSPITAL_ADMIN';

                      return (
                        <tr
                          key={account.id}
                          className={isLight ? 'hover:bg-slate-50/70 transition-colors' : 'hover:bg-slate-900/40 transition-colors'}
                        >
                          <td className="py-3 pl-5 pr-3">
                            <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {account.fullName || 'Quản trị viên'}
                              {isSelf && (
                                <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {account.id.slice(0, 8)}…
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                              {account.email || '—'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {account.phone || '—'}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <Badge
                              className={`text-[11px] font-semibold ${
                                account.role === 'ADMIN'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                  : 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800'
                              }`}
                            >
                              {account.role}
                            </Badge>
                          </td>

                          <td className="py-3 px-3">
                            {isHospitalAdminRow ? (
                              <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                {account.hospital?.name || 'Chưa gán cơ sở y tế'}
                              </span>
                            ) : (
                              <span className="text-slate-400">Toàn nền tảng NovaCare</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {renderAccountStatus(account)}
                          </td>

                          <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                            {isHospitalAdminRow && !isSelf ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenTransferModal(account)}
                                className={`text-xs rounded-lg h-8 gap-1.5 font-medium ${
                                  isLight
                                    ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                    : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950/40'
                                }`}
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                Điều chuyển cơ sở
                              </Button>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 px-2 py-1"
                                title="Vai trò quản trị nền tảng cố định theo chính sách bảo mật"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600/70" /> Vai trò cố định
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Không tìm thấy tài khoản quản trị nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng {usersData?.total || 0} tài khoản quản trị)
                </span>
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
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Hộp thoại Điều chuyển cơ sở y tế phụ trách */}
      <Dialog
        open={!!selectedAdminForTransfer}
        onOpenChange={(open) => !open && !transferScopeMutation.isPending && setSelectedAdminForTransfer(null)}
      >
        <DialogContent
          className={`max-w-md p-6 rounded-2xl ${
            isLight
              ? 'bg-white text-slate-900 border-slate-200'
              : 'bg-slate-950 text-slate-100 border-slate-800'
          }`}
        >
          <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold">
                  Điều chuyển cơ sở y tế phụ trách
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tài khoản: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{selectedAdminForTransfer?.fullName || selectedAdminForTransfer?.email}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div
              className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="text-[11px] text-slate-500">Cơ sở y tế phụ trách hiện tại</div>
              <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {selectedAdminForTransfer?.hospital?.name || 'Chưa gán cơ sở y tế'}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Cơ sở y tế phụ trách mới <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                className={`w-full h-10 border text-xs px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value="">-- Chọn cơ sở y tế mới --</option>
                {activeHospitals.map((h: any) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                    {h.city ? ` (${h.city})` : ''}
                    {h.id === currentHospitalId ? ' — Hiện tại' : ''}
                  </option>
                ))}
              </select>
              {loadingHospitals && (
                <p className="text-[11px] text-slate-400">Đang tải danh sách cơ sở y tế...</p>
              )}
            </div>

            <div
              className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              }`}
            >
              Sau khi xác nhận, hệ thống sẽ <strong>tự động thu hồi phiên đăng nhập cũ</strong> (buộc quản trị viên đăng nhập lại theo phạm vi cơ sở mới) và ghi nhận toàn bộ lịch sử điều chuyển vào <strong>Audit Log</strong>.
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={transferScopeMutation.isPending}
              onClick={() => setSelectedAdminForTransfer(null)}
              className="text-xs rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={
                transferScopeMutation.isPending ||
                !selectedHospitalId ||
                selectedHospitalId === currentHospitalId
              }
              onClick={handleSaveTransfer}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg gap-1.5"
            >
              {transferScopeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Xác nhận điều chuyển
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hộp thoại Cấp tài khoản quản trị cơ sở y tế bổ sung */}
      <CreateHospitalAdminDialog
        open={isCreateAdminOpen}
        onOpenChange={setIsCreateAdminOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-roles-users'] })}
      />
    </div>
  );
}
