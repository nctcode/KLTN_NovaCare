'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Search,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Building2,
  Stethoscope,
  Filter,
  ArrowUpDown,
  Eye,
  Pencil,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  DollarSign,
  Tag,
  FileText,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AdminHealthPackagesPage() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [hospitalIdFilter, setHospitalIdFilter] = useState('ALL');
  const [specialtyIdFilter, setSpecialtyIdFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'price'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<any>(null);

  // Future feature info modal
  const [infoModal, setInfoModal] = useState<{ open: boolean; title: string; desc: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    hospitalId: string;
    specialtyId: string;
    name: string;
    thumbnailUrl: string;
    price: number;
    originalPrice: number | undefined;
    description: string;
    duration: number;
    services: string[];
    preparationNote: string;
    estimatedResultTime: string;
    isActive: boolean;
  }>({
    hospitalId: '',
    specialtyId: '',
    name: '',
    thumbnailUrl: '',
    price: 1500000,
    originalPrice: 1800000,
    description: '',
    duration: 60,
    services: ['Khám Nội tổng quát', 'Xét nghiệm máu', 'Điện tâm đồ', 'Siêu âm ổ bụng tổng quát'],
    preparationNote: 'Nhịn ăn ít nhất 8 giờ trước khi xét nghiệm. Mang theo CCCD.',
    estimatedResultTime: 'Trong ngày',
    isActive: true,
  });

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tableHeaderStyle = isLight
    ? 'bg-slate-100 border-b border-slate-200 text-slate-800 font-semibold text-xs'
    : 'bg-slate-900 border-b border-slate-800 text-slate-300 font-semibold text-xs';

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['admin-health-packages', page, search, hospitalIdFilter, specialtyIdFilter, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      adminService.getHealthPackages({
        page,
        limit: 10,
        search: search || undefined,
        hospitalId: hospitalIdFilter !== 'ALL' ? hospitalIdFilter : undefined,
        specialtyId: specialtyIdFilter !== 'ALL' ? specialtyIdFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        sortBy,
        sortOrder,
      }),
  });

  const { data: rawHospitals } = useQuery({
    queryKey: ['admin-hospitals-all-simple'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
  });
  const hospitals = rawHospitals?.items || rawHospitals?.data || (Array.isArray(rawHospitals) ? rawHospitals : []);

  const { data: rawSpecialties } = useQuery({
    queryKey: ['admin-specialties-all-simple'],
    queryFn: () => adminService.getSpecialties({ limit: 100 }),
  });
  const specialties = rawSpecialties?.items || rawSpecialties?.data || (Array.isArray(rawSpecialties) ? rawSpecialties : []);

  const { data: rawHospitalServices } = useQuery({
    queryKey: ['admin-hospital-medical-services', formData.hospitalId],
    queryFn: () => adminService.getMedicalServices({ hospitalId: formData.hospitalId, limit: 100 }),
    enabled: !!formData.hospitalId,
  });
  const hospitalMedicalServices = rawHospitalServices?.items || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newPkg: any) => adminService.createHealthPackage(newPkg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-health-packages'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateHealthPackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-health-packages'] });
      setIsFormOpen(false);
      setEditingPackage(null);
      resetForm();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.toggleHealthPackageStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-health-packages'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteHealthPackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-health-packages'] });
      if (isViewDetailOpen) setIsViewDetailOpen(false);
    },
  });

  const resetForm = () => {
    setFormData({
      hospitalId: hospitals[0]?.id || '',
      specialtyId: specialties[0]?.id || '',
      name: '',
      thumbnailUrl: '',
      price: 1500000,
      originalPrice: 1800000,
      description: '',
      duration: 60,
      services: ['Khám Nội tổng quát', 'Xét nghiệm máu', 'Điện tâm đồ', 'Siêu âm ổ bụng tổng quát'],
      preparationNote: 'Nhịn ăn ít nhất 8 giờ trước khi xét nghiệm. Mang theo CCCD.',
      estimatedResultTime: 'Trong ngày',
      isActive: true,
    });
  };

  const handleOpenAdd = () => {
    setEditingPackage(null);
    setFormData({
      hospitalId: hospitals[0]?.id || '',
      specialtyId: specialties[0]?.id || '',
      name: '',
      thumbnailUrl: '',
      price: 1500000,
      originalPrice: 1800000,
      description: '',
      duration: 60,
      services: ['Khám Nội tổng quát', 'Xét nghiệm máu', 'Điện tâm đồ'],
      preparationNote: 'Nhịn ăn 8 tiếng trước khi làm xét nghiệm.',
      estimatedResultTime: 'Trong ngày',
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (pkg: any) => {
    setEditingPackage(pkg);
    const parsedServices = Array.isArray(pkg.services)
      ? pkg.services
      : typeof pkg.services === 'string'
      ? JSON.parse(pkg.services)
      : [];

    setFormData({
      hospitalId: pkg.hospitalId || '',
      specialtyId: pkg.specialtyId || '',
      name: pkg.name || '',
      thumbnailUrl: pkg.thumbnailUrl || '',
      price: Number(pkg.price || 0),
      originalPrice: pkg.originalPrice ? Number(pkg.originalPrice) : undefined,
      description: pkg.description || '',
      duration: pkg.duration || 60,
      services: parsedServices.length > 0 ? parsedServices : ['Khám tổng quát'],
      preparationNote: pkg.preparationNote || '',
      estimatedResultTime: pkg.estimatedResultTime || '',
      isActive: pkg.isActive ?? true,
    });
    setIsFormOpen(true);
  };

  const handleOpenView = (pkg: any) => {
    setViewingPackage(pkg);
    setIsViewDetailOpen(true);
  };

  const handleAddServiceItem = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, ''],
    }));
  };

  const handleServiceChange = (index: number, val: string) => {
    const updated = [...formData.services];
    updated[index] = val;
    setFormData((prev) => ({ ...prev, services: updated }));
  };

  const handleRemoveServiceItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleMoveServiceUp = (index: number) => {
    if (index === 0) return;
    setFormData((prev) => {
      const updated = [...prev.services];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return { ...prev, services: updated };
    });
  };

  const handleMoveServiceDown = (index: number) => {
    if (index === formData.services.length - 1) return;
    setFormData((prev) => {
      const updated = [...prev.services];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return { ...prev, services: updated };
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên gói khám');
      return;
    }
    if (!formData.hospitalId) {
      alert('Vui lòng chọn Bệnh viện cho gói khám');
      return;
    }
    if (formData.price < 0) {
      alert('Giá gói khám phải lớn hơn hoặc bằng 0');
      return;
    }
    if (formData.duration && formData.duration <= 0) {
      alert('Thời gian thực hiện phải lớn hơn 0');
      return;
    }

    const payload = {
      ...formData,
      services: formData.services.filter((s) => s.trim() !== ''),
    };

    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const stats = data?.stats || {
    totalPackages: data?.total || 0,
    activePackages: data?.items?.filter((i: any) => i.isActive).length || 0,
    inactivePackages: data?.items?.filter((i: any) => !i.isActive).length || 0,
    totalHospitalsOffering: 0,
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Header & Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold flex items-center gap-2.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Package className="w-6 h-6 text-[#0c4b39] dark:text-[#66FF33]" />
            Quản Lý Gói Khám Sức Khỏe
          </h1>
          <p className={`text-xs font-medium mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Danh mục gói khám dùng chung trên toàn hệ thống NovaCare, chuẩn kết nối các nền tảng Medpro, YouMed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={() =>
              setInfoModal({
                open: true,
                title: 'Import Excel Danh Mục Gói Khám',
                desc: 'Tính năng cho phép tải lên tập tin Excel (.xlsx) chứa hàng loạt gói khám từ cơ sở y tế đang ở trạng thái Sắp phát triển.',
              })
            }
            variant="outline"
            className={`text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 ${
              isLight ? 'border-slate-300 text-slate-800 hover:bg-slate-50' : 'border-slate-800 text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0c4b39] dark:text-[#66FF33]" /> Import Excel
          </Button>

          <Button
            onClick={() =>
              setInfoModal({
                open: true,
                title: 'Đồng bộ API với Hệ thống Bệnh viện',
                desc: 'Tính năng tự động đồng bộ giá gói khám, thời lượng và danh mục dịch vụ trực tiếp từ phần mềm quản lý Bệnh viện (HIS/LIS) đang ở trạng thái Sắp phát triển.',
              })
            }
            variant="outline"
            className={`text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 ${
              isLight ? 'border-slate-300 text-slate-800 hover:bg-slate-50' : 'border-slate-800 text-slate-200 hover:bg-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Đồng bộ API
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#0c4b39] hover:bg-[#083629] text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm Gói Khám Mới
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${cardStyle} rounded-xl p-4 border shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tổng số gói khám</p>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.totalPackages}</h3>
            </div>
          </div>
        </Card>

        <Card className={`${cardStyle} rounded-xl p-4 border shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Đang hoạt động</p>
              <h3 className="text-lg font-bold text-[#0c4b39] dark:text-[#66FF33]">{stats.activePackages}</h3>
            </div>
          </div>
        </Card>

        <Card className={`${cardStyle} rounded-xl p-4 border shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tạm ngưng</p>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{stats.inactivePackages}</h3>
            </div>
          </div>
        </Card>

        <Card className={`${cardStyle} rounded-xl p-4 border shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Bệnh viện niêm yết</p>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.totalHospitalsOffering}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Search & Toolbar Filters */}
      <Card className={`${cardStyle} p-4 rounded-xl space-y-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo Tên gói khám hoặc Nội dung mô tả..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`pl-9 text-xs rounded-lg ${
                isLight ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Hospital Filter */}
          <div className="w-full">
            <select
              value={hospitalIdFilter}
              onChange={(e) => {
                setHospitalIdFilter(e.target.value);
                setPage(1);
              }}
              className={`w-full text-xs h-9 px-3 rounded-lg border font-medium outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="ALL">Tất cả Bệnh viện ({hospitals.length})</option>
              {hospitals.map((h: any) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Specialty Filter */}
          <div className="w-full">
            <select
              value={specialtyIdFilter}
              onChange={(e) => {
                setSpecialtyIdFilter(e.target.value);
                setPage(1);
              }}
              className={`w-full text-xs h-9 px-3 rounded-lg border font-medium outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="ALL">Tất cả Chuyên khoa ({specialties.length})</option>
              {specialties.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort & Status dropdown */}
          <div className="w-full flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={`w-1/2 text-xs h-9 px-2.5 rounded-lg border font-medium outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="PAUSED">Tạm ngưng</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className={`w-1/2 text-xs h-9 px-2.5 rounded-lg border font-medium outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="updatedAt-desc">Mới cập nhật</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 4. Packages Table */}
      <Card className={`${cardStyle} rounded-xl overflow-hidden shadow-sm`}>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-[#0c4b39] dark:text-[#66FF33] animate-spin" />
              <p className="text-xs font-medium text-slate-500">Đang tải danh sách Gói khám NovaCare...</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className={tableHeaderStyle}>
                <tr>
                  <th className="p-3.5">Gói khám</th>
                  <th className="p-3.5">Bệnh viện</th>
                  <th className="p-3.5">Chuyên khoa</th>
                  <th className="p-3.5">Đơn giá (VNĐ)</th>
                  <th className="p-3.5">Thời gian</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5">Cập nhật</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      Không tìm thấy gói khám phù hợp với tiêu chí lọc
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((pkg: any) => {
                    const parsedServices = Array.isArray(pkg.services)
                      ? pkg.services
                      : typeof pkg.services === 'string'
                      ? JSON.parse(pkg.services)
                      : [];

                    return (
                      <tr key={pkg.id} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}`}>
                        {/* Ảnh & Tên */}
                        <td className="p-3.5 font-medium max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-100 dark:bg-slate-900`}>
                              {pkg.thumbnailUrl ? (
                                <img src={pkg.thumbnailUrl} alt={pkg.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <p className={`font-semibold text-xs line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {pkg.name}
                              </p>
                              <span className={`inline-block text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                {parsedServices.length} dịch vụ đi kèm
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Bệnh viện */}
                        <td className="p-3.5 font-medium">
                          {pkg.hospital ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#0c4b39] dark:text-[#66FF33] shrink-0" />
                              <span className={`truncate max-w-[160px] font-medium text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                {pkg.hospital.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Chuyên khoa */}
                        <td className="p-3.5 font-medium">
                          <span className={`text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                            {pkg.specialty?.name || 'Nội tổng quát'}
                          </span>
                        </td>

                        {/* Đơn giá */}
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <span className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {Number(pkg.price || 0).toLocaleString('vi-VN')} VNĐ
                            </span>
                            {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
                              <div className="text-[11px] text-slate-400 line-through">
                                {Number(pkg.originalPrice).toLocaleString('vi-VN')} VNĐ
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Thời gian */}
                        <td className="p-3.5">
                          <span className={`font-medium text-xs flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {pkg.duration || 60} phút
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td className="p-3.5">
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })
                            }
                            title="Bấm để bật/tắt trạng thái"
                            className="focus:outline-none cursor-pointer"
                          >
                            <span className={`inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded text-[11px] ${
                              pkg.isActive
                                ? isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                                : isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pkg.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                              {pkg.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                            </span>
                          </button>
                        </td>

                        {/* Cập nhật */}
                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {pkg.updatedAt ? new Date(pkg.updatedAt).toLocaleDateString('vi-VN') : '—'}
                        </td>

                        {/* Thao tác */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenView(pkg)}
                              className={`h-7 px-2 text-xs font-medium rounded-lg border ${
                                isLight ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800'
                              }`}
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-[#0c4b39] dark:text-[#66FF33]" /> Xem
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(pkg)}
                              className={`h-7 px-2 text-xs font-medium rounded-lg border ${
                                isLight ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800'
                              }`}
                              title="Chỉnh sửa"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1 text-slate-500" /> Sửa
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (confirm(`Bạn có chắc chắn muốn xóa gói khám "${pkg.name}"?`)) {
                                  deleteMutation.mutate(pkg.id);
                                }
                              }}
                              className={`h-7 px-2 text-xs font-medium rounded-lg border ${
                                isLight ? 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 border-slate-800 text-rose-400 hover:bg-slate-800'
                              }`}
                              title="Xóa gói khám"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-600" /> Xóa
                            </Button>
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

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className={`flex items-center justify-between pt-3 border-t text-xs ${
          isLight ? 'border-slate-200 text-slate-700 font-medium' : 'border-slate-800 text-slate-300'
        }`}>
          <span>
            Hiển thị <strong>{data.items?.length || 0}</strong> / <strong>{data.total || 0}</strong> gói khám
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className={isLight ? 'border-slate-200 text-slate-800 rounded-lg' : 'border-slate-800 text-white rounded-lg'}
            >
              Trang trước
            </Button>
            <span className="font-semibold px-2">
              Trang {page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
              className={isLight ? 'border-slate-200 text-slate-800 rounded-lg' : 'border-slate-800 text-white rounded-lg'}
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}

      {/* ==================================================
          5. MODAL THÊM / SỬA GÓI KHÁM SỨC KHỎE
         ================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl p-6 shadow-xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          >
            <div className={`flex justify-between items-center border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
                {editingPackage ? 'Chỉnh Sửa Gói Khám Sức Khỏe' : 'Thêm Gói Khám Sức Khỏe Mới'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1 mt-3">
              {/* Row 1: Hospital & Specialty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Bệnh viện sở hữu *
                  </label>
                  <select
                    required
                    value={formData.hospitalId}
                    onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                    className={`w-full text-xs p-2.5 rounded-lg border font-medium outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="">-- Chọn Bệnh viện --</option>
                    {hospitals.map((h: any) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Chuyên khoa thuộc về *
                  </label>
                  <select
                    required
                    value={formData.specialtyId}
                    onChange={(e) => setFormData({ ...formData, specialtyId: e.target.value })}
                    className={`w-full text-xs p-2.5 rounded-lg border font-medium outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="">-- Chọn Chuyên khoa --</option>
                    {specialties.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Name & Thumbnail */}
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Tên Gói Khám Sức Khỏe *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Gói tầm soát tim mạch chuyên sâu"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`text-xs rounded-lg ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
                />
              </div>

              <div>
                <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  URL Ảnh đại diện Gói khám
                </label>
                <Input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className={`text-xs rounded-lg ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
                />
              </div>

              {/* Row 3: Prices & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Giá bán hiện tại (VNĐ) *
                  </label>
                  <Input
                    type="number"
                    required
                    placeholder="1500000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className={`text-xs rounded-lg font-semibold ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Giá gốc (Hiển thị gạch giá)
                  </label>
                  <Input
                    type="number"
                    placeholder="1800000"
                    value={formData.originalPrice || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        originalPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className={`text-xs rounded-lg ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Thời gian thực hiện (Phút)
                  </label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 60 })}
                    className={`text-xs rounded-lg ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
                  />
                </div>
              </div>

              {/* Row 4: Dynamic Services List (JSON) */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    <Tag className="w-3.5 h-3.5 text-[#0c4b39] dark:text-[#66FF33]" />
                    Danh mục Dịch vụ đi kèm
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddServiceItem}
                    className="text-[11px] font-medium rounded-lg text-slate-800 border-slate-300 hover:bg-slate-100"
                  >
                    + Thêm hạng mục
                  </Button>
                </div>

                {hospitalMedicalServices.length > 0 && (
                  <div className="mb-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0c4b39] dark:text-[#66FF33]" /> Dịch vụ lẻ của Bệnh viện (Chọn nhanh vào gói):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {hospitalMedicalServices.map((ms: any) => {
                        const isSelected = formData.services.includes(ms.name);
                        return (
                          <Badge
                            key={ms.id}
                            onClick={() => {
                              if (isSelected) {
                                setFormData((prev) => ({
                                  ...prev,
                                  services: prev.services.filter((s) => s !== ms.name),
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  services: [...prev.services.filter((s) => s.trim() !== ''), ms.name],
                                }));
                              }
                            }}
                            className={`cursor-pointer transition text-[11px] font-medium px-2 py-0.5 rounded ${
                              isSelected
                                ? 'bg-[#0c4b39] text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-400'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {ms.name} ({Number(ms.price || 0).toLocaleString('vi-VN')} VNĐ)
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formData.services.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-400 w-5">{idx + 1}.</span>
                      <Input
                        type="text"
                        placeholder="Tên dịch vụ / xét nghiệm..."
                        value={item}
                        onChange={(e) => handleServiceChange(idx, e.target.value)}
                        className={`text-xs rounded-lg ${isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-800 text-white'}`}
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={idx === 0}
                          onClick={() => handleMoveServiceUp(idx)}
                          className="text-slate-500 border-slate-200 hover:bg-slate-100 rounded-lg p-1.5 h-7 w-7 flex items-center justify-center disabled:opacity-30"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={idx === formData.services.length - 1}
                          onClick={() => handleMoveServiceDown(idx)}
                          className="text-slate-500 border-slate-200 hover:bg-slate-100 rounded-lg p-1.5 h-7 w-7 flex items-center justify-center disabled:opacity-30"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveServiceItem(idx)}
                          className="text-rose-600 border-slate-200 hover:bg-rose-50 rounded-lg p-1.5 h-7 w-7 flex items-center justify-center shrink-0"
                          title="Xóa dịch vụ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 5: Notes & Estimated Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Chuẩn bị trước khi khám
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Nhịn ăn 8 tiếng, mang theo CCCD..."
                    value={formData.preparationNote}
                    onChange={(e) => setFormData({ ...formData, preparationNote: e.target.value })}
                    className={`w-full text-xs p-2.5 rounded-lg border outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Thời gian trả kết quả
                  </label>
                  <Input
                    type="text"
                    placeholder="Ví dụ: Trong ngày, 24 giờ, 03 ngày..."
                    value={formData.estimatedResultTime}
                    onChange={(e) => setFormData({ ...formData, estimatedResultTime: e.target.value })}
                    className={`text-xs rounded-lg ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
                  />
                </div>
              </div>

              {/* Row 6: Description */}
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Mô tả chi tiết gói khám
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả thông tin chi tiết về gói khám..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full text-xs p-2.5 rounded-lg border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                />
              </div>

              {/* Row 7: Status */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#0c4b39] rounded cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className={`text-xs font-medium cursor-pointer ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Trạng thái hoạt động (Cho phép bệnh nhân đặt khám)
                </label>
              </div>

              <div className={`flex justify-end gap-2 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="border-slate-300 text-slate-700 text-xs font-medium rounded-lg"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-semibold rounded-lg px-5"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : editingPackage ? 'Cập nhật Gói khám' : 'Lưu Gói khám'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          6. MODAL CHI TIẾT GÓI KHÁM
         ================================================== */}
      {isViewDetailOpen && viewingPackage && (
        <Dialog open={isViewDetailOpen} onOpenChange={setIsViewDetailOpen}>
          <DialogContent className={`max-w-2xl rounded-2xl p-6 ${isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'}`}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
                Chi Tiết Gói Khám Sức Khỏe
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Thông tin đầy đủ niêm yết trên nền tảng NovaCare
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex flex-col sm:flex-row gap-4 items-start border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100 flex items-center justify-center">
                  {viewingPackage.thumbnailUrl ? (
                    <img src={viewingPackage.thumbnailUrl} alt={viewingPackage.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{viewingPackage.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      🏥 {viewingPackage.hospital?.name || 'Áp dụng chung'}
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      • 🩺 {viewingPackage.specialty?.name || 'Chuyên khoa Nội'}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded text-[11px] ${
                      viewingPackage.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {viewingPackage.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {Number(viewingPackage.price || 0).toLocaleString('vi-VN')} VNĐ
                    </span>
                    {viewingPackage.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        {Number(viewingPackage.originalPrice).toLocaleString('vi-VN')} VNĐ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô tả gói khám</h4>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {viewingPackage.description || 'Chưa có mô tả chi tiết.'}
                </p>
              </div>

              {/* Services List */}
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#0c4b39] dark:text-[#66FF33]" /> Các dịch vụ đi kèm trong gói:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                  {(Array.isArray(viewingPackage.services)
                    ? viewingPackage.services
                    : typeof viewingPackage.services === 'string'
                    ? JSON.parse(viewingPackage.services)
                    : []
                  ).map((item: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0c4b39] dark:text-[#66FF33] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preparation & Result Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
                  <span className="font-semibold block mb-1">📋 Hướng dẫn trước khi khám:</span>
                  <p className="text-slate-600 dark:text-slate-300">{viewingPackage.preparationNote || 'Không có yêu cầu đặc biệt.'}</p>
                </div>

                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
                  <span className="font-semibold block mb-1">⏱️ Thời gian trả kết quả:</span>
                  <p className="text-slate-600 dark:text-slate-300">{viewingPackage.estimatedResultTime || 'Thời lượng khám: ' + (viewingPackage.duration || 60) + ' phút'}</p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t pt-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewDetailOpen(false);
                  handleOpenEdit(viewingPackage);
                }}
                className="text-xs font-medium rounded-lg text-slate-800 border-slate-300 hover:bg-slate-100"
              >
                <Pencil className="w-3.5 h-3.5 mr-1 text-slate-500" /> Chỉnh sửa gói
              </Button>
              <Button onClick={() => setIsViewDetailOpen(false)} className="bg-[#0c4b39] text-white text-xs font-semibold rounded-lg">
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================
          7. MODAL THÔNG TIN TÍNH NĂNG TƯƠNG LAI
         ================================================== */}
      {infoModal && infoModal.open && (
        <Dialog open={infoModal.open} onOpenChange={() => setInfoModal(null)}>
          <DialogContent className={`max-w-md rounded-2xl p-6 ${isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'}`}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Sparkles className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" /> {infoModal.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 my-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>{infoModal.desc}</p>
              <div className={`p-3 rounded-lg border text-[11px] font-medium ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                📌 Trạng thái: Sắp phát triển trong phiên bản nâng cấp mở rộng NovaCare Platform.
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setInfoModal(null)} className="bg-[#0c4b39] text-white text-xs font-bold rounded-xl w-full">
                Đã hiểu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
