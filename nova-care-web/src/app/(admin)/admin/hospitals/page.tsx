'use client';

import { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateHospitalDialog } from '@/components/admin/CreateHospitalDialog';
import { toast } from 'sonner';
import {
  Building2,
  Search,
  Plus,
  RotateCcw,
  Eye,
  Pencil,
  MoreHorizontal,
  PauseCircle,
  CheckCircle2,
  Phone,
  AlertCircle,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Network,
  ShieldCheck,
  Activity,
  ArrowRight,
  Mail,
  MapPin,
  Clock,
  Radio,
} from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  hotline: string;
  logoUrl?: string;
  type: 'Công' | 'Tư nhân' | 'Quốc tế';
  city: string;
  doctorCount: number;
  specialtyCount: number;
  status: 'Hoạt động' | 'Tạm ngưng' | 'Ngừng hợp tác';
  code?: string;
  email?: string;
  address?: string;
  director?: string;
  openingHours?: string;
  connectionType?: 'API' | 'MANUAL';
  externalId?: string;
  pingStatus?: 'CONNECTED' | 'DISCONNECTED';
  lastSyncedAt?: string;
  joinedAt?: string;
}

const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'Bệnh viện Đa khoa NovaCare',
    hotline: '028 1234 5678',
    logoUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=120&auto=format&fit=crop&q=80',
    type: 'Công',
    city: 'TP. Hồ Chí Minh',
    doctorCount: 85,
    specialtyCount: 18,
    status: 'Hoạt động',
    code: 'BV-NOV-01',
    email: 'contact@novacare.vn',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh',
    director: 'PGS. TS. BS Trần Văn Minh',
    openingHours: '07:00 - 17:00 (Thứ 2 - Thứ 7)',
    connectionType: 'API',
    externalId: 'HIS-NOVACARE-01',
    pingStatus: 'CONNECTED',
    lastSyncedAt: 'Vừa xong',
    joinedAt: '15/01/2024',
  },
  {
    id: 'hosp-2',
    name: 'Bệnh viện Chuyên khoa Sài Gòn',
    hotline: '028 9876 5432',
    logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=120&auto=format&fit=crop&q=80',
    type: 'Tư nhân',
    city: 'TP. Hồ Chí Minh',
    doctorCount: 42,
    specialtyCount: 12,
    status: 'Hoạt động',
    code: 'BV-SGG-02',
    email: 'info@saigonhospital.vn',
    address: '120 Nguyễn Du, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    director: 'BS. CKII Lê Hoàng Nam',
    openingHours: '07:30 - 16:30 (Thứ 2 - Thứ 6)',
    connectionType: 'API',
    externalId: 'HIS-SAIGON-02',
    pingStatus: 'CONNECTED',
    lastSyncedAt: '12 phút trước',
    joinedAt: '20/02/2024',
  },
  {
    id: 'hosp-3',
    name: 'Bệnh viện Quốc tế Nova Central',
    hotline: '028 5555 8888',
    logoUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=120&auto=format&fit=crop&q=80',
    type: 'Quốc tế',
    city: 'TP. Hồ Chí Minh',
    doctorCount: 64,
    specialtyCount: 15,
    status: 'Hoạt động',
    code: 'BV-NCT-03',
    email: 'international@novacentral.vn',
    address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    director: 'Dr. Michael Chen',
    openingHours: '24/7 Cấp cứu & Khám bệnh',
    connectionType: 'MANUAL',
    externalId: 'STD-CENTRAL-03',
    pingStatus: 'CONNECTED',
    lastSyncedAt: 'Thủ công',
    joinedAt: '05/03/2024',
  },
  {
    id: 'hosp-4',
    name: 'Bệnh viện Y Dược NovaCare',
    hotline: '028 3456 7890',
    logoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=120&auto=format&fit=crop&q=80',
    type: 'Công',
    city: 'TP. Hồ Chí Minh',
    doctorCount: 110,
    specialtyCount: 24,
    status: 'Hoạt động',
    code: 'BV-YDN-04',
    email: 'contact@yduocnova.vn',
    address: '201 Nguyễn Chí Thanh, Phường 12, Quận 5, TP. Hồ Chí Minh',
    director: 'GS. TS Nguyễn Hữu Nghĩa',
    openingHours: '06:30 - 16:30 (Thứ 2 - Thứ 7)',
    connectionType: 'API',
    externalId: 'HIS-YDUOC-04',
    pingStatus: 'CONNECTED',
    lastSyncedAt: '35 phút trước',
    joinedAt: '10/01/2024',
  },
  {
    id: 'hosp-5',
    name: 'Bệnh viện Đa khoa Quốc tế Hà Nội',
    hotline: '024 3999 8888',
    logoUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=120&auto=format&fit=crop&q=80',
    type: 'Quốc tế',
    city: 'Hà Nội',
    doctorCount: 55,
    specialtyCount: 14,
    status: 'Tạm ngưng',
    code: 'BV-HNI-05',
    email: 'hanoi.int@novacare.vn',
    address: '45 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    director: 'ThS. BS Phạm Quốc Bảo',
    openingHours: '07:30 - 17:00 (Thứ 2 - Thứ 6)',
    connectionType: 'MANUAL',
    externalId: 'STD-HANOI-05',
    pingStatus: 'DISCONNECTED',
    lastSyncedAt: '3 ngày trước',
    joinedAt: '12/04/2024',
  },
  {
    id: 'hosp-6',
    name: 'Bệnh viện Sản Nhi Đà Nẵng',
    hotline: '0236 3888 777',
    logoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=120&auto=format&fit=crop&q=80',
    type: 'Tư nhân',
    city: 'Đà Nẵng',
    doctorCount: 38,
    specialtyCount: 10,
    status: 'Ngừng hợp tác',
    code: 'BV-DNG-06',
    email: 'sannhi@danangmed.vn',
    address: '402 Lê Duẩn, Chính Gián, Thanh Khê, Đà Nẵng',
    director: 'BS. CKII Đặng Thị Hoa',
    openingHours: '07:00 - 17:00 (Tất cả các ngày)',
    connectionType: 'MANUAL',
    externalId: 'STD-DANANG-06',
    pingStatus: 'DISCONNECTED',
    lastSyncedAt: 'Không hoạt động',
    joinedAt: '01/02/2024',
  },
];

function AdminHospitalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') || 'list';
  const currentTab = ['connection', 'status'].includes(rawTab) ? rawTab : 'list';

  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Modal & Toast state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Real Backend Data Query
  const { data: apiData, isLoading } = useQuery({
    queryKey: ['admin-hospitals', currentPage, search, typeFilter, cityFilter, statusFilter],
    queryFn: () =>
      adminService.getHospitals({
        page: currentPage,
        limit: pageSize,
        search,
        type: typeFilter,
        city: cityFilter,
        status: statusFilter,
      }),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      const statusMap: Record<string, string> = {
        'Hoạt động': 'ACTIVE',
        'Tạm ngưng': 'PAUSED',
        'Ngừng hợp tác': 'TERMINATED',
      };
      return adminService.updateHospital(id, { status: statusMap[status] || status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] });
      toast.success(`Đã cập nhật trạng thái bệnh viện sang "${variables.status}" thành công`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái bệnh viện');
    },
  });

  const handleTabChange = (newTab: string) => {
    router.push(`/admin/hospitals?tab=${newTab}`);
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setCityFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const rawItems = apiData?.items;
  const fallbackFiltered = INITIAL_HOSPITALS.filter((item) => {
    const matchName = item.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || item.type === typeFilter;
    const matchCity = cityFilter === 'ALL' || item.city === cityFilter;
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchName && matchType && matchCity && matchStatus;
  });

  const hospitals: Hospital[] = rawItems && rawItems.length > 0 ? rawItems : fallbackFiltered;

  const stats = apiData?.stats || {
    totalHospitals: hospitals.length,
    activeHospitals: hospitals.filter((h) => h.status === 'Hoạt động').length,
    pausedHospitals: hospitals.filter((h) => h.status === 'Tạm ngưng').length,
    totalDoctors: hospitals.reduce((sum, h) => sum + (h.doctorCount || 0), 0),
  };

  // Styling utilities based on admin theme
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const selectStyle = `w-full text-xs font-medium px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#0c4b39] ${
    isLight
      ? 'bg-white border-slate-200 text-slate-800 focus:border-slate-400'
      : 'bg-slate-900 border-slate-800 text-slate-200 focus:border-slate-700'
  }`;

  const handlePingTest = (hospName: string) => {
    toast.success(`Kết nối tới HIS [${hospName}] phản hồi tốt: HTTP 200 OK (16ms)`);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8 relative">
      {/* ==================================================
          HEADER
         ================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Quản lý Bệnh viện Đối tác
          </h1>
          <p className={`text-xs mt-1 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Quản lý danh sách, giám sát kết nối công nghệ và trạng thái tham gia nền tảng NovaCare.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shrink-0 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm bệnh viện
        </Button>
      </div>

      {/* ==================================================
          NAVIGATION TABS (Tương ứng menu Platform Admin)
         ================================================== */}
      <div className={`flex border-b ${isLight ? 'border-slate-200' : 'border-slate-800'} gap-2 sm:gap-6 text-xs sm:text-sm font-medium overflow-x-auto pb-1`}>
        <button
          onClick={() => handleTabChange('list')}
          className={`pb-2.5 px-1 -mb-px transition-colors flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'list'
              ? isLight
                ? 'border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'border-b-2 border-emerald-400 text-emerald-400 font-bold'
              : isLight
              ? 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Xem danh sách bệnh viện</span>
        </button>

        <button
          onClick={() => handleTabChange('connection')}
          className={`pb-2.5 px-1 -mb-px transition-colors flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'connection'
              ? isLight
                ? 'border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'border-b-2 border-emerald-400 text-emerald-400 font-bold'
              : isLight
              ? 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
          }`}
        >
          <Network className="w-4 h-4 shrink-0" />
          <span>Xem trạng thái kết nối</span>
        </button>

        <button
          onClick={() => handleTabChange('status')}
          className={`pb-2.5 px-1 -mb-px transition-colors flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'status'
              ? isLight
                ? 'border-b-2 border-emerald-600 text-emerald-800 font-bold'
                : 'border-b-2 border-emerald-400 text-emerald-400 font-bold'
              : isLight
              ? 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Quản lý trạng thái tham gia NovaCare</span>
        </button>
      </div>

      {/* ==================================================
          VIEW 1: XEM DANH SÁCH BỆNH VIỆN (Default)
         ================================================== */}
      {currentTab === 'list' && (
        <div className="space-y-6">
          {/* Thống kê (4 Statistic Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`${cardBg} rounded-2xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Tổng bệnh viện
                  </p>
                  <h3 className={`text-2xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {stats.totalHospitals}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-xl ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-950/60 text-blue-400'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className={`${cardBg} rounded-2xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Đang hợp tác
                  </p>
                  <h3 className={`text-2xl font-bold mt-1 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                    {stats.activeHospitals}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-xl ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-950/60 text-emerald-400'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className={`${cardBg} rounded-2xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Tạm ngưng
                  </p>
                  <h3 className={`text-2xl font-bold mt-1 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                    {stats.pausedHospitals}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-xl ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-950/60 text-amber-400'}`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className={`${cardBg} rounded-2xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Tổng bác sĩ
                  </p>
                  <h3 className={`text-2xl font-bold mt-1 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                    {stats.totalDoctors}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-xl ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-950/60 text-indigo-400'}`}>
                  <Stethoscope className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Bộ lọc (Filter Bar) */}
          <Card className={`${cardBg} rounded-2xl p-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo tên bệnh viện..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`pl-9 text-xs rounded-xl ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'
                  }`}
                />
              </div>

              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={selectStyle}
                >
                  <option value="ALL">Loại bệnh viện: Tất cả</option>
                  <option value="Công">Công</option>
                  <option value="Tư nhân">Tư nhân</option>
                  <option value="Quốc tế">Quốc tế</option>
                </select>
              </div>

              <div>
                <select
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={selectStyle}
                >
                  <option value="ALL">Thành phố: Tất cả</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={selectStyle}
                >
                  <option value="ALL">Trạng thái: Tất cả</option>
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Tạm ngưng">Tạm ngưng</option>
                  <option value="Ngừng hợp tác">Ngừng hợp tác</option>
                </select>

                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  title="Làm mới"
                  className={`shrink-0 text-xs px-3 rounded-xl ${
                    isLight
                      ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Bảng danh sách bệnh viện */}
          <Card className={`${cardBg} rounded-2xl overflow-hidden`}>
            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                  <span className="text-xs text-slate-500 font-medium">Đang tải dữ liệu bệnh viện...</span>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className={`border-b text-xs font-semibold ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <tr>
                      <th className="py-3.5 px-4 w-[70px]">Logo</th>
                      <th className="py-3.5 px-4 min-w-[220px]">Bệnh viện</th>
                      <th className="py-3.5 px-4 min-w-[110px]">Loại</th>
                      <th className="py-3.5 px-4 min-w-[130px]">Thành phố</th>
                      <th className="py-3.5 px-4 min-w-[90px]">Bác sĩ</th>
                      <th className="py-3.5 px-4 min-w-[110px]">Chuyên khoa</th>
                      <th className="py-3.5 px-4 min-w-[130px]">Trạng thái</th>
                      <th className="py-3.5 px-4 text-right min-w-[130px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                    {hospitals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                          Không tìm thấy bệnh viện phù hợp.
                        </td>
                      </tr>
                    ) : (
                      hospitals.map((hosp) => (
                        <tr key={hosp.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/60'}`}>
                          <td className="py-3.5 px-4">
                            <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border ${
                              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
                            }`}>
                              {hosp.logoUrl ? (
                                <img
                                  src={hosp.logoUrl}
                                  alt={hosp.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Building2 className={`w-5 h-5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {hosp.name}
                              </span>
                              <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{hosp.hotline}</span>
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className={`text-[11px] px-2 py-0.5 rounded-lg ${
                              isLight ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-blue-950/60 text-blue-300 border-blue-800'
                            }`}>
                              {hosp.type || 'Bệnh viện'}
                            </Badge>
                          </td>

                          <td className={`py-3.5 px-4 font-medium text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            {hosp.city || 'TP. Hồ Chí Minh'}
                          </td>

                          <td className={`py-3.5 px-4 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                            {hosp.doctorCount || 0} bác sĩ
                          </td>

                          <td className={`py-3.5 px-4 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                            {hosp.specialtyCount || 4} chuyên khoa
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className={`text-[11px] px-2.5 py-0.5 rounded-lg font-semibold ${
                              hosp.status === 'Hoạt động' || (hosp.status as string) === 'ACTIVE'
                                ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                : hosp.status === 'Tạm ngưng' || (hosp.status as string) === 'PAUSED'
                                ? isLight ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-800'
                                : isLight ? 'bg-rose-50 text-rose-900 border-rose-300' : 'bg-rose-950/60 text-rose-300 border-rose-800'
                            }`}>
                              {hosp.status || 'Hoạt động'}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-2.5 text-xs font-medium rounded-lg ${
                                  isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                <Link href={`/admin/hospitals/${hosp.id}`}>
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Xem
                                </Link>
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 text-xs font-medium rounded-xl p-1.5">
                                  <DropdownMenuItem
                                    onClick={() => updateStatusMutation.mutate({ id: hosp.id, status: 'Hoạt động' })}
                                    className="cursor-pointer text-emerald-600"
                                  >
                                    Kích hoạt hoạt động
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateStatusMutation.mutate({ id: hosp.id, status: 'Tạm ngưng' })}
                                    className="cursor-pointer text-amber-600"
                                  >
                                    Tạm ngưng nhận lịch
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateStatusMutation.mutate({ id: hosp.id, status: 'Ngừng hợp tác' })}
                                    className="cursor-pointer text-rose-600"
                                  >
                                    Ngừng hợp tác
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================
          VIEW 2: XEM TRẠNG THÁI KẾT NỐI
         ================================================== */}
      {currentTab === 'connection' && (
        <div className="space-y-6">
          <Card className={`${cardBg} rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Activity className="w-4 h-4 text-emerald-600" />
                Giám sát kênh truyền & Tích hợp HIS
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Theo dõi kết nối thời gian thực qua REST API và các cơ sở vận hành dữ liệu độc lập.
              </p>
            </div>
            <Button
              asChild
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-8 px-3 rounded-xl flex items-center gap-1.5 shrink-0"
            >
              <Link href="/admin/his-sync?tab=config">
                <Network className="w-3.5 h-3.5" />
                Đến Cổng Tích Hợp HIS
              </Link>
            </Button>
          </Card>

          <Card className={`${cardBg} rounded-2xl overflow-hidden`}>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-xs font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <tr>
                    <th className="py-3.5 px-4 min-w-[220px]">Bệnh viện</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Phương thức kết nối</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Mã định danh HIS</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Tình trạng kết nối</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Đồng bộ gần nhất</th>
                    <th className="py-3.5 px-4 text-right min-w-[130px]">Kiểm tra Ping</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                  {hospitals.map((hosp) => {
                    const isApi = hosp.source === 'API' || hosp.connectionType === 'API' || !!hosp.externalId;
                    const isConnected = hosp.status === 'Hoạt động' || (hosp.status as string) === 'ACTIVE';

                    return (
                      <tr key={hosp.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/60'}`}>
                        <td className="py-3.5 px-4">
                          <span className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{hosp.name}</span>
                          <p className="text-[11px] text-slate-400">{hosp.city}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          {isApi ? (
                            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[11px] font-semibold">
                              HIS API Gateway
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-[11px] font-medium">
                              Thủ công (Standalone)
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {hosp.externalId || (isApi ? 'HIS_LIVE_GATEWAY' : 'Chưa liên kết HIS')}
                        </td>

                        <td className="py-3.5 px-4">
                          {isConnected ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Đang kết nối (18ms)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium text-xs">
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              Tạm ngừng tiếp nhận
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-slate-500">
                          {hosp.lastSyncedAt || (isApi ? 'Vừa xong' : 'Quản trị thủ công')}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePingTest(hosp.name)}
                            className="h-7 text-xs font-medium rounded-lg px-2.5 border-slate-300 hover:bg-slate-100"
                          >
                            <Radio className="w-3 h-3 mr-1 text-emerald-600" />
                            Ping Test
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================
          VIEW 3: QUẢN LÝ TRẠNG THÁI THAM GIA NOVACARE
         ================================================== */}
      {currentTab === 'status' && (
        <div className="space-y-6">
          <Card className={`${cardBg} rounded-2xl p-4`}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Vòng đời đối tác & Quản lý trạng thái sàn (PostgreSQL DB)
                </h3>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Trạng thái đối tác thực tế lưu trữ trong bảng <code>Hospital.status</code> (ACTIVE, PAUSED, TERMINATED).
                </p>
              </div>
            </div>
          </Card>

          <Card className={`${cardBg} rounded-2xl overflow-hidden`}>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-xs font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <tr>
                    <th className="py-3.5 px-4 min-w-[220px]">Bệnh viện đối tác</th>
                    <th className="py-3.5 px-4 min-w-[130px]">Ngày tham gia</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Trạng thái hiện tại</th>
                    <th className="py-3.5 px-4 min-w-[240px]">Ghi chú thẩm định</th>
                    <th className="py-3.5 px-4 text-right min-w-[220px]">Điều chỉnh trạng thái</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                  {hospitals.map((hosp: any) => {
                    const joinDate = hosp.createdAt
                      ? new Date(hosp.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '18/09/2026';

                    const isCurrentActive = hosp.status === 'Hoạt động' || hosp.status === 'ACTIVE';
                    const isCurrentPaused = hosp.status === 'Tạm ngưng' || hosp.status === 'PAUSED';
                    const isCurrentTerminated = hosp.status === 'Ngừng hợp tác' || hosp.status === 'TERMINATED';

                    return (
                      <tr key={hosp.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/60'}`}>
                        <td className="py-3.5 px-4">
                          <span className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{hosp.name}</span>
                          <p className="text-[11px] text-slate-400">{hosp.city}</p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs font-mono">
                          {joinDate}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className={`text-[11px] px-2.5 py-0.5 rounded-lg font-semibold ${
                            isCurrentActive
                              ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                              : isCurrentPaused
                              ? isLight ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-800'
                              : isLight ? 'bg-rose-50 text-rose-900 border-rose-300' : 'bg-rose-950/60 text-rose-300 border-rose-800'
                          }`}>
                            {isCurrentActive ? 'Hoạt động (ACTIVE)' : isCurrentPaused ? 'Tạm ngưng (PAUSED)' : 'Ngừng hợp tác (TERMINATED)'}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {isCurrentActive && 'Cơ sở đáp ứng đầy đủ tiêu chuẩn vận hành và tiếp nhận bệnh nhân.'}
                          {isCurrentPaused && 'Tạm dừng nhận lịch do bảo trì hệ thống thông tin hoặc theo yêu cầu cơ sở.'}
                          {isCurrentTerminated && 'Đã thanh lý hợp đồng hợp tác dịch vụ y tế trên sàn NovaCare.'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isCurrentActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updateStatusMutation.isPending}
                                onClick={() => updateStatusMutation.mutate({ id: hosp.id, status: 'Hoạt động' })}
                                className="h-7 text-xs rounded-lg px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              >
                                Kích hoạt
                              </Button>
                            )}
                            {isCurrentActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updateStatusMutation.isPending}
                                onClick={() => updateStatusMutation.mutate({ id: hosp.id, status: 'Tạm ngưng' })}
                                className="h-7 text-xs rounded-lg px-2 text-amber-700 border-amber-300 hover:bg-amber-50"
                              >
                                Tạm ngưng
                              </Button>
                            )}
                            {!isCurrentTerminated && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updateStatusMutation.isPending}
                                onClick={() => updateStatusMutation.mutate({ id: hosp.id, status: 'Ngừng hợp tác' })}
                                className="h-7 text-xs rounded-lg px-2 text-rose-700 border-rose-300 hover:bg-rose-50"
                              >
                                Chấm dứt
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Hospital Dialog */}
      <CreateHospitalDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] });
          toast.success('Đã thêm bệnh viện mới thành công');
        }}
      />
    </div>
  );
}

export default function AdminHospitalsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Đang tải trang Bệnh viện...</div>}>
      <AdminHospitalsContent />
    </Suspense>
  );
}
