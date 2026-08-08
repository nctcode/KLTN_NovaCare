'use client';

import * as React from 'react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { hospitalService } from '@/services/hospital.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Loader2,
  Activity,
  Building2,
  Clock,
  DollarSign,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export default function AdminMedicalServicesPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [viewingService, setViewingService] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<any | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    name: '',
    hospitalId: '',
    price: 150000,
    duration: 30,
    description: '',
    isActive: true,
  });
  const [formError, setFormError] = useState('');

  // Fetch Hospitals for Filter and Form dropdowns
  const { data: hospitalsData } = useQuery({
    queryKey: ['admin-hospitals-simple'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
  });
  const hospitals = hospitalsData?.items || (Array.isArray(hospitalsData) ? hospitalsData : []);

  // Fetch Medical Services List with React Query
  const { data: servicesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-medical-services', page, search, selectedHospitalId, selectedStatus, sortBy, sortOrder],
    queryFn: () =>
      adminService.getMedicalServices({
        page,
        limit,
        search: search || undefined,
        hospitalId: selectedHospitalId || undefined,
        status: selectedStatus,
        sortBy,
        sortOrder,
      }),
  });

  const services = servicesData?.items || [];
  const stats = servicesData?.stats || {
    totalServices: 0,
    activeServices: 0,
    inactiveServices: 0,
    totalHospitalsOffering: 0,
  };
  const totalPages = servicesData?.totalPages || 1;
  const total = servicesData?.total || 0;

  // Handlers
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormState({
      name: '',
      hospitalId: hospitals[0]?.id || '',
      price: 150000,
      duration: 30,
      description: '',
      isActive: true,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (srv: any) => {
    setEditingService(srv);
    setFormState({
      name: srv.name || '',
      hospitalId: srv.hospitalId || '',
      price: Number(srv.price || 0),
      duration: srv.duration || 30,
      description: srv.description || '',
      isActive: srv.isActive ?? true,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formState.name.trim()) {
      setFormError('Vui lòng nhập tên dịch vụ y tế');
      return;
    }
    if (!formState.hospitalId) {
      setFormError('Vui lòng chọn Bệnh viện cung cấp dịch vụ');
      return;
    }
    if (formState.price < 0) {
      setFormError('Giá dịch vụ không được nhỏ hơn 0');
      return;
    }
    if (formState.duration <= 0) {
      setFormError('Thời gian thực hiện phải lớn hơn 0');
      return;
    }

    try {
      setSubmitting(true);
      if (editingService) {
        await adminService.updateMedicalService(editingService.id, formState);
      } else {
        await adminService.createMedicalService(formState);
      }
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-medical-services'] });
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Lỗi khi lưu dịch vụ y tế');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (srv: any) => {
    try {
      await adminService.toggleMedicalServiceStatus(srv.id, !srv.isActive);
      queryClient.invalidateQueries({ queryKey: ['admin-medical-services'] });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể đổi trạng thái dịch vụ');
    }
  };

  const handleDeleteService = async () => {
    if (!deletingService) return;
    try {
      setDeleting(true);
      await adminService.deleteMedicalService(deletingService.id);
      setIsDeleteOpen(false);
      setDeletingService(null);
      queryClient.invalidateQueries({ queryKey: ['admin-medical-services'] });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi xóa dịch vụ');
    } finally {
      setDeleting(false);
    }
  };

  // Helper formatting price to VNĐ e.g. 200.000 VNĐ
  const formatPriceVND = (price: number) => {
    return `${Number(price || 0).toLocaleString('vi-VN')} VNĐ`;
  };

  const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950 border-slate-800 text-white';

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Activity className="w-6 h-6 text-[#0c4b39] dark:text-[#66FF33]" />
            Quản lý Dịch vụ Y tế
          </h1>
          <p className={`text-xs font-medium mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Quản lý các mục dịch vụ khám lẻ do Bệnh viện niêm yết trên hệ thống NovaCare.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#0c4b39] hover:bg-[#083629] text-white font-medium text-xs rounded-lg px-4 py-2.5 shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Thêm Dịch vụ mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`${cardBg} rounded-xl p-4 border`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tổng số dịch vụ</p>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.totalServices}</h3>
            </div>
          </div>
        </Card>

        <Card className={`${cardBg} rounded-xl p-4 border`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Đang cung cấp</p>
              <h3 className="text-lg font-bold text-[#0c4b39] dark:text-[#66FF33]">{stats.activeServices}</h3>
            </div>
          </div>
        </Card>

        <Card className={`${cardBg} rounded-xl p-4 border`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tạm ngưng</p>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{stats.inactiveServices}</h3>
            </div>
          </div>
        </Card>

        <Card className={`${cardBg} rounded-xl p-4 border`}>
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

      {/* Main Filter & Content Section */}
      <Card className={`${cardBg} rounded-xl p-4 border space-y-4`}>
        {/* Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm dịch vụ theo tên hoặc mô tả..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`pl-9 text-xs rounded-lg ${isLight ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-400'}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hospital Filter */}
            <select
              value={selectedHospitalId}
              onChange={(e) => {
                setSelectedHospitalId(e.target.value);
                setPage(1);
              }}
              className={`text-xs h-9 px-3 rounded-lg border font-medium outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="">Tất cả Bệnh viện</option>
              {hospitals.map((h: any) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className={`text-xs h-9 px-3 rounded-lg border font-medium outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="ACTIVE">Đang cung cấp</option>
              <option value="PAUSED">Tạm ngưng</option>
            </select>

            {/* Sort Filter */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
              }}
              className={`text-xs h-9 px-3 rounded-lg border font-medium outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="updatedAt-desc">Mới cập nhật nhất</option>
              <option value="name-asc">Tên dịch vụ (A-Z)</option>
              <option value="price-asc">Giá (Thấp đến Cao)</option>
              <option value="price-desc">Giá (Cao đến Thấp)</option>
            </select>

            {(search || selectedHospitalId || selectedStatus !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedHospitalId('');
                  setSelectedStatus('ALL');
                  setPage(1);
                }}
                className="h-9 text-xs rounded-lg px-2.5 font-medium text-slate-600 hover:text-slate-900"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 text-[#0c4b39] animate-spin" />
            <p className="text-xs font-medium text-slate-500">Đang tải danh sách dịch vụ y tế...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Activity className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-xs font-medium text-slate-500">Không tìm thấy dịch vụ y tế nào phù hợp.</p>
            <Button onClick={handleOpenCreate} className="bg-[#0c4b39] text-white text-xs font-medium rounded-lg">
              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm Dịch vụ mới
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`border-b font-semibold text-xs ${
                  isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}>
                  <th className="p-3.5">Dịch vụ</th>
                  <th className="p-3.5">Bệnh viện</th>
                  <th className="p-3.5">Đơn giá (VNĐ)</th>
                  <th className="p-3.5">Thời gian</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5">Cập nhật</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {services.map((srv: any) => (
                  <tr
                    key={srv.id}
                    className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}`}
                  >
                    <td className="p-3.5 max-w-xs">
                      <div className="space-y-0.5">
                        <span className={`font-semibold text-xs line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {srv.name}
                        </span>
                        <p className={`text-[11px] line-clamp-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {srv.description || 'Chưa có mô tả chi tiết.'}
                        </p>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#0c4b39] dark:text-[#66FF33] shrink-0" />
                        <span className={`font-medium text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {srv.hospital?.name || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {formatPriceVND(srv.price)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className={`font-medium text-xs flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {srv.duration || 30} phút
                      </span>
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(srv)}
                        title="Bấm để chuyển đổi trạng thái"
                        className="cursor-pointer focus:outline-none"
                      >
                        <span className={`inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded text-[11px] ${
                          srv.isActive
                            ? isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${srv.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                          {srv.isActive ? 'Đang cung cấp' : 'Tạm ngưng'}
                        </span>
                      </button>
                    </td>

                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {srv.updatedAt ? new Date(srv.updatedAt).toLocaleDateString('vi-VN') : '—'}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewingService(srv);
                            setIsViewOpen(true);
                          }}
                          className={`h-7 px-2 text-xs font-medium rounded-lg border ${
                            isLight ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800'
                          }`}
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-[#0c4b39] dark:text-[#66FF33]" /> Xem
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(srv)}
                          className={`h-7 px-2 text-xs font-medium rounded-lg border ${
                            isLight ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800'
                          }`}
                          title="Sửa dịch vụ"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1 text-slate-500" /> Sửa
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDeletingService(srv);
                            setIsDeleteOpen(true);
                          }}
                          className={`h-7 px-2 text-xs font-medium rounded-lg border ${
                            isLight ? 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 border-slate-800 text-rose-400 hover:bg-slate-800'
                          }`}
                          title="Xóa dịch vụ"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-600" /> Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between pt-3 border-t text-xs ${
            isLight ? 'border-slate-200 text-slate-700 font-medium' : 'border-slate-800 text-slate-300'
          }`}>
            <span>
              Hiển thị <strong>{services.length}</strong> / <strong>{total}</strong> dịch vụ
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className={isLight ? 'border-slate-200 text-slate-800 rounded-lg' : 'border-slate-800 text-white rounded-lg'}
              >
                Trang trước
              </Button>
              <span className="font-semibold px-2">
                Trang {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className={isLight ? 'border-slate-200 text-slate-800 rounded-lg' : 'border-slate-800 text-white rounded-lg'}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================== */}
      {/* MODAL 1: THÊM / SỬA DỊCH VỤ Y TẾ */}
      {/* ========================================== */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className={`max-w-md p-6 rounded-2xl ${isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'}`}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
              {editingService ? 'Chỉnh sửa Dịch vụ Y tế' : 'Thêm Dịch vụ Y tế mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Nhập các thông tin niêm yết cho dịch vụ y tế lẻ của bệnh viện
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSaveService} className="space-y-3 py-1">
            <div>
              <label className="text-xs font-semibold mb-1 block">Tên dịch vụ *</label>
              <Input
                required
                placeholder="Ví dụ: Khám Nội tổng quát, Siêu âm ổ bụng..."
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className={`text-xs rounded-lg ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block">Bệnh viện cung cấp *</label>
              <select
                required
                value={formState.hospitalId}
                onChange={(e) => setFormState({ ...formState, hospitalId: e.target.value })}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block">Giá dịch vụ (VNĐ) *</label>
                <Input
                  type="number"
                  required
                  min="0"
                  placeholder="150000"
                  value={formState.price}
                  onChange={(e) => setFormState({ ...formState, price: parseFloat(e.target.value) || 0 })}
                  className={`text-xs rounded-lg font-semibold ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Thời lượng (Phút) *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  placeholder="30"
                  value={formState.duration}
                  onChange={(e) => setFormState({ ...formState, duration: parseInt(e.target.value, 10) || 30 })}
                  className={`text-xs rounded-lg ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block">Mô tả dịch vụ</label>
              <textarea
                rows={3}
                placeholder="Mô tả quy trình, lợi ích hoặc yêu cầu của dịch vụ..."
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                className={`w-full text-xs p-2.5 rounded-lg border outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActiveServiceCheck"
                checked={formState.isActive}
                onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                className="w-4 h-4 accent-[#0c4b39] rounded cursor-pointer"
              />
              <label htmlFor="isActiveServiceCheck" className="text-xs font-medium cursor-pointer">
                Đang mở cung cấp dịch vụ này
              </label>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="text-xs rounded-lg font-medium"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-semibold rounded-lg px-4"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingService ? 'Cập nhật dịch vụ' : 'Tạo Dịch vụ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================== */}
      {/* MODAL 2: XEM CHI TIẾT DỊCH VỤ */}
      {/* ========================================== */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className={`max-w-md p-6 rounded-2xl ${isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'}`}>
          {viewingService && (
            <div className="space-y-4">
              <DialogHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
                    Chi tiết Dịch vụ Y tế
                  </DialogTitle>
                  <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded text-[11px] ${
                    viewingService.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {viewingService.isActive ? 'Đang cung cấp' : 'Tạm ngưng'}
                  </span>
                </div>
              </DialogHeader>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Tên dịch vụ:</span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{viewingService.name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Bệnh viện niêm yết:</span>
                    <p className="font-semibold text-xs mt-0.5">{viewingService.hospital?.name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Đơn giá dịch vụ:</span>
                    <p className="font-semibold text-xs text-slate-900 dark:text-white mt-0.5">{formatPriceVND(viewingService.price)}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Thời gian thực hiện:</span>
                    <p className="font-semibold text-xs mt-0.5">{viewingService.duration || 30} phút</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Trạng thái:</span>
                    <p className="font-semibold text-xs mt-0.5">{viewingService.isActive ? 'Hoạt động' : 'Tạm ngưng'}</p>
                  </div>
                </div>

                {viewingService.description && (
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Mô tả dịch vụ:</span>
                    <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {viewingService.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t">
                  <div>Ngày tạo: {viewingService.createdAt ? new Date(viewingService.createdAt).toLocaleString('vi-VN') : '—'}</div>
                  <div>Cập nhật: {viewingService.updatedAt ? new Date(viewingService.updatedAt).toLocaleString('vi-VN') : '—'}</div>
                </div>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsViewOpen(false);
                    handleOpenEdit(viewingService);
                  }}
                  className="text-xs rounded-lg font-medium text-slate-800 border-slate-300 hover:bg-slate-100"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1 text-slate-500" /> Chỉnh sửa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsViewOpen(false)}
                  className="text-xs rounded-lg font-medium"
                >
                  Đóng
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================== */}
      {/* MODAL 3: XÁC NHẬN XÓA DỊCH VỤ */}
      {/* ========================================== */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className={`max-w-sm p-6 rounded-2xl ${isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'}`}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" /> Xác nhận xóa Dịch vụ
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Bạn có chắc chắn muốn xóa dịch vụ <strong className="text-slate-900 dark:text-white">{deletingService?.name}</strong> của bệnh viện {deletingService?.hospital?.name}? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="text-xs rounded-lg font-medium"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleDeleteService}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg px-4"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
