'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import Link from 'next/link';
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
  Trash2,
  Phone,
  AlertCircle,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Loader2,
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
  },
];

export default function AdminHospitalsPage() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Modal & Toast state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteHospital(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] });
    },
  });

  // Reset Filters
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

  const hospitals: Hospital[] = (rawItems && rawItems.length > 0) ? rawItems : fallbackFiltered;

  const getHospitalSpecialtyCount = (hosp: Hospital) => {
    if (typeof window !== 'undefined' && hosp.id) {
      const saved = localStorage.getItem(`novacare_hospital_specialties_${hosp.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.length;
          }
        } catch (e) {
          // ignore
        }
      }
    }
    return hosp.specialtyCount > 0 ? hosp.specialtyCount : 4;
  };

  const stats = apiData?.stats || {
    totalHospitals: hospitals.length,
    activeHospitals: hospitals.filter((h) => h.status === 'Hoạt động').length,
    pausedHospitals: hospitals.filter((h) => h.status === 'Tạm ngưng').length,
    totalDoctors: hospitals.reduce((sum, h) => sum + (h.doctorCount || 0), 0),
  };
  const totalPages = apiData?.totalPages || Math.ceil(hospitals.length / pageSize) || 1;

  // Styling utilities based on admin theme
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const selectStyle = `w-full text-xs font-medium px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#0c4b39] ${isLight
    ? 'bg-white border-slate-200 text-slate-800 focus:border-slate-400'
    : 'bg-slate-900 border-slate-800 text-slate-200 focus:border-slate-700'
    }`;

  const handleCreateSuccess = (newHospital?: any) => {
    setToastMessage('Đã thêm bệnh viện thành công.');
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 font-bold text-xs">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================
          HEADER
         ================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Building2 className="w-6 h-6 text-[#0c4b39] dark:text-[#66FF33]" />
            Quản lý Bệnh viện Đối tác
          </h1>
          <p className={`text-xs mt-1 font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Quản lý danh sách các bệnh viện đang hợp tác trên nền tảng NovaCare.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#0c4b39] hover:bg-[#09392b] text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shrink-0 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm bệnh viện
        </Button>
      </div>

      {/* ==================================================
          THỐNG KÊ (4 Statistic Cards)
         ================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hospitals */}
        <Card className={`${cardBg} rounded-2xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700`}>
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

        {/* Active Hospitals */}
        <Card className={`${cardBg} rounded-2xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700`}>
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

        {/* Paused Hospitals */}
        <Card className={`${cardBg} rounded-2xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700`}>
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

        {/* Total Doctors */}
        <Card className={`${cardBg} rounded-2xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700`}>
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

      {/* ==================================================
          BỘ LỌC (Filter Bar)
         ================================================== */}
      <Card className={`${cardBg} rounded-2xl p-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
          {/* Ô tìm kiếm theo tên bệnh viện */}
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
              className={`pl-9 text-xs rounded-xl ${isLight
                ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
                : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-slate-700'
                }`}
            />
          </div>

          {/* Dropdown Loại bệnh viện */}
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

          {/* Dropdown Thành phố */}
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
              <option value="Cần Thơ">Cần Thơ</option>
            </select>
          </div>

          {/* Dropdown Trạng thái & Nút Làm mới */}
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
              title="Làm mới bộ lọc"
              className={`shrink-0 text-xs px-3 rounded-xl ${isLight
                ? 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span className="hidden xl:inline">Làm mới</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ==================================================
          DANH SÁCH BỆNH VIỆN (DataTable)
         ================================================== */}
      <Card className={`${cardBg} rounded-2xl overflow-hidden`}>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#0c4b39]" />
              <span className="text-xs text-slate-500 font-medium">Đang tải dữ liệu bệnh viện từ CSDL...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-xs font-semibold ${isLight
                ? 'bg-slate-50/80 border-slate-200 text-slate-600'
                : 'bg-slate-900/80 border-slate-800 text-slate-400'
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
                      Không tìm thấy bệnh viện phù hợp trong cơ sở dữ liệu.
                    </td>
                  </tr>
                ) : (
                  hospitals.map((hosp) => (
                    <tr
                      key={hosp.id}
                      className={`transition-colors ${isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-900/60'
                        }`}
                    >
                      {/* 1. Logo */}
                      <td className="py-3.5 px-4">
                        <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
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

                      {/* 2. Bệnh viện */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {hosp.name}
                          </span>
                          <span className={`text-[11px] font-normal flex items-center gap-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Hotline: {hosp.hotline}</span>
                          </span>
                        </div>
                      </td>

                      {/* 3. Loại Badge */}
                      <td className="py-3.5 px-4">
                        {((hosp.type as string) === 'Công' || (hosp.type as string) === 'PUBLIC') && (
                          <Badge variant="outline" className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-lg ${isLight ? 'bg-blue-50 text-blue-900 border-blue-300' : 'bg-blue-950/60 text-blue-300 border-blue-800'
                            }`}>
                            Bệnh viện Công
                          </Badge>
                        )}
                        {((hosp.type as string) === 'Tư nhân' || (hosp.type as string) === 'PRIVATE' || !hosp.type) && (
                          <Badge variant="outline" className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-lg ${isLight ? 'bg-purple-50 text-purple-900 border-purple-300' : 'bg-purple-950/60 text-purple-300 border-purple-800'
                            }`}>
                            Bệnh viện Tư nhân
                          </Badge>
                        )}
                        {((hosp.type as string) === 'Quốc tế' || (hosp.type as string) === 'INTERNATIONAL') && (
                          <Badge variant="outline" className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-lg ${isLight ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-800'
                            }`}>
                            Bệnh viện Quốc tế
                          </Badge>
                        )}
                      </td>

                      {/* 4. Thành phố */}
                      <td className={`py-3.5 px-4 font-bold text-xs ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                        {hosp.city || 'TP. Hồ Chí Minh'}
                      </td>

                      {/* 5. Bác sĩ */}
                      <td className={`py-3.5 px-4 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                        {hosp.doctorCount} bác sĩ
                      </td>

                      {/* 6. Chuyên khoa */}
                      <td className={`py-3.5 px-4 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                        {getHospitalSpecialtyCount(hosp)} chuyên khoa
                      </td>

                      {/* 7. Trạng thái Badge */}
                      <td className="py-3.5 px-4">
                        {((hosp.status as string) === 'Hoạt động' || (hosp.status as string) === 'ACTIVE' || !hosp.status) && (
                          <Badge variant="outline" className={`font-bold text-[11px] px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 w-fit ${isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            Hoạt động
                          </Badge>
                        )}
                        {((hosp.status as string) === 'Tạm ngưng' || (hosp.status as string) === 'PAUSED') && (
                          <Badge variant="outline" className={`font-bold text-[11px] px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 w-fit ${isLight ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-800'
                            }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Tạm ngưng
                          </Badge>
                        )}
                        {((hosp.status as string) === 'Ngừng hợp tác' || (hosp.status as string) === 'TERMINATED') && (
                          <Badge variant="outline" className={`font-bold text-[11px] px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 w-fit ${isLight ? 'bg-rose-50 text-rose-900 border-rose-300' : 'bg-rose-950/60 text-rose-300 border-rose-800'
                            }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Ngừng hợp tác
                          </Badge>
                        )}
                      </td>

                      {/* 8. Hành động */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Xem */}
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-2.5 text-xs font-medium rounded-lg ${isLight
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                          >
                            <Link href={`/admin/hospitals/${hosp.id}`}>
                              <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              Xem
                            </Link>
                          </Button>

                          {/* Chỉnh sửa */}
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-2.5 text-xs font-medium rounded-lg ${isLight
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                          >
                            <Link href={`/admin/hospitals/${hosp.id}`}>
                              <Pencil className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              Chỉnh sửa
                            </Link>
                          </Button>

                          {/* Menu More (...) */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 rounded-lg ${isLight
                                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  }`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className={`w-44 text-xs font-medium rounded-xl p-1.5 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                              }`}>
                              {/* Tạm ngưng hợp tác */}
                              <DropdownMenuItem
                                onClick={() => updateStatusMutation.mutate({ id: hosp.id, status: 'Tạm ngưng' })}
                                className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 text-amber-600 dark:text-amber-400 focus:bg-amber-50 dark:focus:bg-amber-950/40"
                              >
                                <PauseCircle className="w-3.5 h-3.5" />
                                Tạm ngưng hợp tác
                              </DropdownMenuItem>

                              {/* Khôi phục */}
                              <DropdownMenuItem
                                onClick={() => updateStatusMutation.mutate({ id: hosp.id, status: 'Hoạt động' })}
                                className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 text-emerald-600 dark:text-emerald-400 focus:bg-emerald-50 dark:focus:bg-emerald-950/40"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Khôi phục
                              </DropdownMenuItem>

                              {/* Xóa */}
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(hosp.id)}
                                className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xóa
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

        {/* Footer Pagination */}
        {hospitals.length > 0 && (
          <div className={`flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t text-xs gap-3 ${isLight
            ? 'border-slate-100 bg-slate-50/50 text-slate-600'
            : 'border-slate-800/80 bg-slate-950 text-slate-400'
            }`}>
            <span>
              Hiển thị trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Tổng {apiData?.total || hospitals.length} bệnh viện)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={`h-8 text-xs font-medium rounded-xl ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'
                  }`}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Trước
              </Button>
              <span className="font-semibold px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={`h-8 text-xs font-medium rounded-xl ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'
                  }`}
              >
                Sau
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE PARTNER HOSPITAL DIALOG / MODAL */}
      <CreateHospitalDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
