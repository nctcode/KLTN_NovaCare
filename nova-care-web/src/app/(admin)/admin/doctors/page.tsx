'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { hospitalService } from '@/services/hospital.service';
import { specialtyService } from '@/services/specialty.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { DoctorDetailDialog } from '@/components/admin/DoctorDetailDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Edit,
  Star,
  RotateCcw,
  MoreHorizontal,
  Building2,
  Calendar,
  Power,
} from 'lucide-react';

export default function AdminDoctorsPage() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [hospitalIdFilter, setHospitalIdFilter] = useState('ALL');
  const [specialtyIdFilter, setSpecialtyIdFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal dialog states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<'INFO' | 'WORKPLACE' | 'SCHEDULE' | 'STATS'>('INFO');
  const [dialogEditing, setDialogEditing] = useState(false);

  // Form State for creating new Doctor
  const [createForm, setCreateForm] = useState({
    fullName: '',
    title: 'BS.CKI',
    gender: 'MALE',
    avatarUrl: '',
    qualification: '',
    yearsOfExperience: 5,
    bio: '',
    externalId: '',
    source: 'MANUAL',
  });

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm rounded-xl';

  const tableHeaderStyle = isLight
    ? 'bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold text-xs'
    : 'bg-slate-900 border-b border-slate-800 text-slate-300 font-semibold text-xs';

  const selectBg = isLight
    ? 'bg-white border-slate-300 text-slate-800 text-xs font-medium rounded-lg px-3 py-2 focus:ring-[#0c4b39] outline-none border'
    : 'bg-slate-900 border-slate-700 text-white text-xs font-medium rounded-lg px-3 py-2 focus:ring-[#66FF33] outline-none border';

  // Fetch Hospitals and Specialties for Filter Selects
  const { data: rawHospitals } = useQuery({
    queryKey: ['admin-hospitals-all'],
    queryFn: async () => {
      try {
        const res = await hospitalService.getAll();
        return Array.isArray(res) ? res : (res as any)?.data || [];
      } catch {
        return [];
      }
    },
  });
  const hospitals = Array.isArray(rawHospitals) ? rawHospitals : [];

  const { data: rawSpecialties } = useQuery({
    queryKey: ['specialties-all'],
    queryFn: async () => {
      try {
        const res = await specialtyService.getAll();
        return Array.isArray(res) ? res : (res as any)?.data || [];
      } catch {
        return [];
      }
    },
  });
  const specialties = Array.isArray(rawSpecialties) ? rawSpecialties : [];

  // Fetch Doctors with Filters
  const { data, isLoading } = useQuery({
    queryKey: [
      'admin-doctors',
      page,
      search,
      hospitalIdFilter,
      specialtyIdFilter,
      statusFilter,
    ],
    queryFn: () =>
      adminService.getDoctors({
        page,
        limit: 10,
        search: search.trim() || undefined,
        hospitalId: hospitalIdFilter !== 'ALL' ? hospitalIdFilter : undefined,
        specialtyId: specialtyIdFilter !== 'ALL' ? specialtyIdFilter : undefined,
        isActive: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
  });

  // Create Doctor Mutation
  const createMutation = useMutation({
    mutationFn: (newDoc: any) => adminService.createDoctor(newDoc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      setShowCreateModal(false);
      setCreateForm({
        fullName: '',
        title: 'BS.CKI',
        gender: 'MALE',
        avatarUrl: '',
        qualification: '',
        yearsOfExperience: 5,
        bio: '',
        externalId: '',
        source: 'MANUAL',
      });
    },
    onError: (err: any) => {
      alert('Lỗi tạo bác sĩ: ' + (err.message || 'Vui lòng kiểm tra dữ liệu đầu vào'));
    },
  });

  // Toggle Doctor Active Status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateDoctor(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
    },
  });

  // Delete Doctor Mutation (Soft Delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName.trim()) {
      alert('Vui lòng nhập Họ và Tên bác sĩ');
      return;
    }

    createMutation.mutate({
      fullName: createForm.fullName.trim(),
      title: createForm.title,
      gender: createForm.gender,
      avatarUrl: createForm.avatarUrl.trim() || undefined,
      qualification: createForm.qualification.trim() || 'Bác sĩ chuyên khoa',
      yearsOfExperience: Number(createForm.yearsOfExperience) || 0,
      bio: createForm.bio.trim() || undefined,
      externalId: createForm.externalId.trim() || undefined,
      source: createForm.source || 'MANUAL',
      rating: 0,
      reviewCount: 0,
      consultationCount: 0,
      isActive: true,
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setHospitalIdFilter('ALL');
    setSpecialtyIdFilter('ALL');
    setStatusFilter('ALL');
    setPage(1);
  };

  const openDetailDialog = (docId: string, tab: 'INFO' | 'WORKPLACE' | 'SCHEDULE' | 'STATS' = 'INFO', editing = false) => {
    setSelectedDoctorId(docId);
    setDialogTab(tab);
    setDialogEditing(editing);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. BỐ CỤC PHẦN ĐẦU: TIÊU ĐỀ & NÚT THÊM */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Quản lý bác sĩ
          </h1>
          <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Quản lý danh sách bác sĩ và thông tin công tác trên hệ thống NovaCare.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0c4b39] hover:bg-[#083629] text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Thêm bác sĩ
        </Button>
      </div>

      {/* 2. BỘ LỌC TÌM KIẾM TỐI GIẢN */}
      <Card className={`${cardStyle} p-3.5`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Name */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm tên bác sĩ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`pl-9 text-xs font-medium rounded-lg ${
                isLight ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Hospital Filter */}
          <select
            value={hospitalIdFilter}
            onChange={(e) => {
              setHospitalIdFilter(e.target.value);
              setPage(1);
            }}
            className={selectBg}
          >
            <option value="ALL">Tất cả Bệnh viện</option>
            {hospitals.map((h: any) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>

          {/* Specialty Filter */}
          <select
            value={specialtyIdFilter}
            onChange={(e) => {
              setSpecialtyIdFilter(e.target.value);
              setPage(1);
            }}
            className={selectBg}
          >
            <option value="ALL">Tất cả Chuyên khoa</option>
            {specialties.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={selectBg}
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Tạm ngưng</option>
          </select>

          {/* Reset Filters */}
          {(search || hospitalIdFilter !== 'ALL' || specialtyIdFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-2"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Xóa bộ lọc
            </Button>
          )}
        </div>
      </Card>

      {/* 3. BẢNG DANH SÁCH BÁC SĨ (8 CỘT CHUẨN) */}
      <Card className={`${cardStyle} overflow-hidden border`}>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-[#0c4b39] animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className={tableHeaderStyle}>
                <tr>
                  <th className="p-3.5">Bác sĩ</th>
                  <th className="p-3.5">Chức danh</th>
                  <th className="p-3.5">Chuyên khoa</th>
                  <th className="p-3.5">Nơi công tác</th>
                  <th className="p-3.5">Kinh nghiệm</th>
                  <th className="p-3.5">Đánh giá</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      Không tìm thấy bác sĩ nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((doc: any) => {
                    // Resolve primary workplace and hospital/specialty
                    const primaryWp = doc.workPlaces?.find((w: any) => w.isPrimary) || doc.workPlaces?.[0];
                    const specialtyName = primaryWp?.specialty?.name || '—';

                    let hospitalText = '—';
                    if (doc.workPlaces && doc.workPlaces.length > 0) {
                      const primaryHospName = primaryWp?.hospital?.name || 'Cơ sở y tế';
                      const branchName = primaryWp?.branch?.name ? ` (${primaryWp.branch.name})` : '';
                      if (doc.workPlaces.length === 1) {
                        hospitalText = `${primaryHospName}${branchName}`;
                      } else {
                        hospitalText = `${primaryHospName} (+${doc.workPlaces.length - 1} nơi khác)`;
                      }
                    }

                    return (
                      <tr
                        key={doc.id}
                        className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}`}
                      >
                        {/* 1. Bác sĩ (Avatar + fullName ONLY) */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border overflow-hidden ${
                              isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}>
                              {doc.avatarUrl ? (
                                <img src={doc.avatarUrl} alt={doc.fullName} className="w-full h-full object-cover" />
                              ) : (
                                doc.fullName.charAt(0)
                              )}
                            </div>
                            <span className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {doc.fullName}
                            </span>
                          </div>
                        </td>

                        {/* 2. Chức danh */}
                        <td className="p-3.5 text-xs whitespace-nowrap">
                          {doc.title ? (
                            <Badge variant="outline" className={`text-[11px] font-medium px-2 py-0.5 ${
                              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                            }`}>
                              {doc.title}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* 3. Chuyên khoa */}
                        <td className={`p-3.5 text-xs font-medium whitespace-nowrap ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                          {specialtyName}
                        </td>

                        {/* 4. Nơi công tác */}
                        <td className={`p-3.5 text-xs font-medium max-w-[240px] truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`} title={hospitalText}>
                          {hospitalText}
                        </td>

                        {/* 5. Kinh nghiệm */}
                        <td className={`p-3.5 text-xs font-medium whitespace-nowrap ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {doc.yearsOfExperience ? `${doc.yearsOfExperience} năm` : '—'}
                        </td>

                        {/* 6. Đánh giá */}
                        <td className="p-3.5 text-xs font-medium whitespace-nowrap">
                          {doc.rating > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-amber-400'}`}>{Number(doc.rating).toFixed(1)}</span>
                              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>({doc.reviewCount || 0})</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* 7. Trạng thái */}
                        <td className="p-3.5 text-xs whitespace-nowrap">
                          {doc.isActive ? (
                            <span className={`inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded text-[11px] ${
                              isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Đang hoạt động
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded text-[11px] ${
                              isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Tạm ngưng
                            </span>
                          )}
                        </td>

                        {/* 8. Thao tác */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailDialog(doc.id, 'INFO', false)}
                              className={`h-7 text-xs font-medium px-2.5 rounded-lg border ${
                                isLight ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-[#0c4b39] dark:text-[#66FF33]" /> Xem
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailDialog(doc.id, 'INFO', true)}
                              className={`h-7 text-xs font-medium px-2.5 rounded-lg border ${
                                isLight ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800'
                              }`}
                            >
                              <Edit className="w-3.5 h-3.5 mr-1 text-slate-500" /> Sửa
                            </Button>

                            {/* Dropdown Menu ... */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 w-7 p-0 rounded-lg border ${
                                    isLight ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800'
                                  }`}
                                >
                                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 text-xs font-medium">
                                <DropdownMenuItem onClick={() => openDetailDialog(doc.id, 'INFO', false)}>
                                  <Eye className="w-3.5 h-3.5 mr-2 text-slate-500" /> Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDetailDialog(doc.id, 'WORKPLACE', false)}>
                                  <Building2 className="w-3.5 h-3.5 mr-2 text-slate-500" /> Quản lý nơi công tác
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDetailDialog(doc.id, 'SCHEDULE', false)}>
                                  <Calendar className="w-3.5 h-3.5 mr-2 text-slate-500" /> Quản lý lịch làm việc
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    toggleStatusMutation.mutate({ id: doc.id, isActive: !doc.isActive })
                                  }
                                >
                                  <Power className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                  {doc.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc chắn muốn xóa mềm bác sĩ ${doc.fullName}?`)) {
                                      deleteMutation.mutate(doc.id);
                                    }
                                  }}
                                  className="text-rose-600 dark:text-rose-400 focus:text-rose-600 font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* 4. PHÂN TRANG */}
      {data?.totalPages > 1 && (
        <div className={`flex items-center justify-between p-3.5 rounded-lg border text-xs ${
          isLight ? 'bg-white border-slate-200 text-slate-700 font-medium' : 'bg-slate-950 border-slate-800 text-slate-300'
        }`}>
          <span>
            Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng {data.total} bác sĩ)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className={isLight ? 'border-slate-200 text-slate-800 rounded-lg' : 'border-slate-800 text-white rounded-lg'}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
              className={isLight ? 'border-slate-200 text-slate-800 rounded-lg' : 'border-slate-800 text-white rounded-lg'}
            >
              Trang sau <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* 5. MODAL: THÊM BÁC SĨ MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className="font-bold text-sm">Thêm Bác Sĩ Mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium block">Họ và Tên Bác sĩ *</label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className={isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium block">Chức danh</label>
                  <select
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className={`w-full text-xs font-medium rounded-lg p-2 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="BS.">BS.</option>
                    <option value="BS.CKI">BS.CKI</option>
                    <option value="BS.CKII">BS.CKII</option>
                    <option value="ThS.BS">ThS.BS</option>
                    <option value="TS.BS">TS.BS</option>
                    <option value="PGS.TS">PGS.TS</option>
                    <option value="GS.TS">GS.TS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium block">Số năm kinh nghiệm</label>
                  <Input
                    type="number"
                    min={0}
                    required
                    value={createForm.yearsOfExperience}
                    onChange={(e) => setCreateForm({ ...createForm, yearsOfExperience: parseInt(e.target.value) || 0 })}
                    className={isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium block">URL Ảnh đại diện (Avatar)</label>
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={createForm.avatarUrl}
                  onChange={(e) => setCreateForm({ ...createForm, avatarUrl: e.target.value })}
                  className={isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}
                />
              </div>

              <div className={`flex justify-end gap-2 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-slate-300 text-slate-600 text-xs font-medium rounded-lg"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-medium rounded-lg px-4"
                >
                  {createMutation.isPending ? 'Đang lưu...' : 'Lưu bác sĩ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL CHI TIẾT BÁC SĨ (ĐẦY ĐỦ THÔNG TIN, NƠI CÔNG TÁC & LỊCH LÀM VIỆC) */}
      {selectedDoctorId && (
        <DoctorDetailDialog
          doctorId={selectedDoctorId}
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          initialTab={dialogTab}
          initialIsEditing={dialogEditing}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
          }}
        />
      )}
    </div>
  );
}
