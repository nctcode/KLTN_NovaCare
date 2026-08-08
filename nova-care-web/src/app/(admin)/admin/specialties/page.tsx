'use client';

import * as React from 'react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Stethoscope,
  Search,
  Plus,
  Pencil,
  Eye,
  Power,
  CheckCircle2,
  Building2,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSpecialtiesPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);

  // Selected Specialty for Detail or Deactivation
  const [selectedSpecialty, setSelectedSpecialty] = useState<any>(null);
  const [detailTab, setDetailTab] = useState('info');
  const [isEditMode, setIsEditMode] = useState(false);

  // Add Form State
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    icon: '',
    coverImageUrl: '',
    isActive: true,
  });
  const [iconMode, setIconMode] = useState<'url' | 'file'>('url');
  const [coverMode, setCoverMode] = useState<'url' | 'file'>('url');

  // Edit Form State (Inside Detail view)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    icon: '',
    coverImageUrl: '',
    isActive: true,
  });

  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch real specialties list from NestJS database API
  const { data: rawSpecialtiesData, isLoading } = useQuery({
    queryKey: ['admin-specialties', page, searchTerm, statusFilter],
    queryFn: async () => {
      const res = await adminService.getSpecialties({
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      return res;
    },
  });

  // Fetch real detail & applied hospitals for selected specialty
  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['admin-specialty-detail', selectedSpecialty?.id],
    queryFn: async () => {
      if (!selectedSpecialty?.id) return null;
      return await adminService.getSpecialtyDetail(selectedSpecialty.id);
    },
    enabled: !!selectedSpecialty?.id && isDetailDialogOpen,
  });

  // Real items from PostgreSQL DB
  const items = rawSpecialtiesData?.items || [];
  const stats = rawSpecialtiesData?.stats || {
    totalSpecialties: items.length,
    activeSpecialties: items.filter((s: any) => s.isActive).length,
    inactiveSpecialties: items.filter((s: any) => !s.isActive).length,
    totalHospitalsUsing: items.reduce((acc: number, cur: any) => acc + (cur.hospitalCount || 0), 0),
  };

  const totalPages = rawSpecialtiesData?.totalPages || Math.ceil(items.length / limit) || 1;

  // Applied hospitals from backend DB
  const appliedHospitals = detailData?.appliedHospitals || selectedSpecialty?.appliedHospitals || [];

  // Trigger Toast Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Add Dialog
  const handleOpenAddModal = () => {
    setAddForm({
      name: '',
      description: '',
      icon: '',
      coverImageUrl: '',
      isActive: true,
    });
    setIsAddDialogOpen(true);
  };

  // Submit Add Specialty
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      alert('Vui lòng nhập tên chuyên khoa');
      return;
    }

    setSubmittingAdd(true);
    try {
      const payload = {
        name: addForm.name.trim(),
        description: addForm.description.trim() || undefined,
        icon: addForm.icon.trim() || undefined,
        coverImageUrl: addForm.coverImageUrl.trim() || undefined,
        isActive: addForm.isActive,
      };

      await adminService.createSpecialty(payload);

      queryClient.invalidateQueries({ queryKey: ['admin-specialties'] });
      setIsAddDialogOpen(false);
      showToast(`Đã tạo thành công chuyên khoa "${payload.name}" trong cơ sở dữ liệu!`);
    } catch (err: any) {
      alert('Không thể tạo chuyên khoa: ' + (err.response?.data?.message || err.message || 'Lỗi hệ thống'));
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Detail Dialog
  const handleOpenDetailModal = (spec: any, startEdit = false) => {
    setSelectedSpecialty(spec);
    setEditForm({
      name: spec.name || '',
      description: spec.description || '',
      icon: spec.icon || '',
      coverImageUrl: spec.coverImageUrl || '',
      isActive: spec.isActive !== undefined ? spec.isActive : true,
    });
    setDetailTab('info');
    setIsEditMode(startEdit);
    setIsDetailDialogOpen(true);
  };

  // Save Edit Specialty (Inside Detail Dialog)
  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecialty) return;
    if (!editForm.name.trim()) {
      alert('Tên chuyên khoa không được để trống');
      return;
    }

    setSubmittingEdit(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        icon: editForm.icon.trim() || undefined,
        coverImageUrl: editForm.coverImageUrl.trim() || undefined,
        isActive: editForm.isActive,
      };

      const updated = await adminService.updateSpecialty(selectedSpecialty.id, payload);

      setSelectedSpecialty({ ...selectedSpecialty, ...updated });
      queryClient.invalidateQueries({ queryKey: ['admin-specialties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-specialty-detail', selectedSpecialty.id] });

      setIsEditMode(false);
      showToast(`Cập nhật chuyên khoa "${payload.name}" thành công!`);
    } catch (err: any) {
      alert('Không thể cập nhật chuyên khoa: ' + (err.response?.data?.message || err.message || 'Lỗi hệ thống'));
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Open Deactivate Confirmation Dialog
  const handleOpenDeactivateModal = (spec: any) => {
    setSelectedSpecialty(spec);
    setIsDeactivateDialogOpen(true);
  };

  // Toggle or Confirm Deactivate
  const handleConfirmToggleStatus = async (targetActive: boolean) => {
    if (!selectedSpecialty) return;

    try {
      await adminService.toggleSpecialtyStatus(selectedSpecialty.id, targetActive);

      setSelectedSpecialty({ ...selectedSpecialty, isActive: targetActive });
      queryClient.invalidateQueries({ queryKey: ['admin-specialties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-specialty-detail', selectedSpecialty.id] });

      setIsDeactivateDialogOpen(false);
      showToast(
        targetActive
          ? `Đã kích hoạt lại chuyên khoa "${selectedSpecialty.name}"`
          : `Đã ngừng hoạt động chuyên khoa "${selectedSpecialty.name}"`
      );
    } catch (err: any) {
      alert('Không thể thay đổi trạng thái: ' + (err.response?.data?.message || err.message || 'Lỗi kết nối'));
    }
  };

  // Theme-aware Tailwind styles
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tableHeaderBg = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-700 font-extrabold text-xs'
    : 'bg-slate-900 border-slate-800 text-slate-300 font-extrabold text-xs';

  const tableRowBg = isLight
    ? 'border-b border-slate-100 hover:bg-slate-50/80 transition-colors'
    : 'border-b border-slate-800/60 hover:bg-slate-900/60 transition-colors';

  const inputBg = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-950 placeholder:text-slate-400'
    : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 font-bold text-xs">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================== */}
      {/* 1. HEADER TOOLBAR */}
      {/* ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <Stethoscope className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Quản lý Chuyên khoa
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Danh mục chuyên khoa hệ thống trực tiếp từ Cơ sở dữ liệu PostgreSQL (không thuộc riêng bất kỳ bệnh viện nào)
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Button */}
        <Button
          onClick={handleOpenAddModal}
          className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl px-5 py-2.5 shadow-md flex items-center gap-2 shrink-0 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Thêm chuyên khoa</span>
        </Button>
      </div>

      {/* ========================================== */}
      {/* 2. STAT CARDS (KPIS) */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <Card className={`${cardBg} rounded-3xl p-5 border shadow-sm transition hover:border-purple-500/50`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Tổng chuyên khoa</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black">{stats.totalSpecialties}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Dữ liệu CSDL PostgreSQL</p>
        </Card>

        {/* Card 2: Active */}
        <Card className={`${cardBg} rounded-3xl p-5 border shadow-sm transition hover:border-emerald-500/50`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Đang hoạt động</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.activeSpecialties}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Sẵn sàng gán cho bệnh viện</p>
        </Card>

        {/* Card 3: Inactive */}
        <Card className={`${cardBg} rounded-3xl p-5 border shadow-sm transition hover:border-amber-500/50`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Tạm ngưng</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Power className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{stats.inactiveSpecialties}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Ẩn khỏi danh mục tạo mới</p>
        </Card>

        {/* Card 4: Hospitals Using */}
        <Card className={`${cardBg} rounded-3xl p-5 border shadow-sm transition hover:border-blue-500/50`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Bệnh viện đang áp dụng</span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{stats.totalHospitalsUsing}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Lượt kết nối bệnh viện</p>
        </Card>
      </div>

      {/* ========================================== */}
      {/* 3. SEARCH & FILTERS TOOLBAR */}
      {/* ========================================== */}
      <Card className={`${cardBg} rounded-3xl p-4 sm:p-5 border space-y-4`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo tên chuyên khoa hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className={`pl-10 text-xs rounded-2xl font-semibold h-10 ${inputBg}`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Status Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 shrink-0">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={`text-xs rounded-2xl px-3.5 py-2.5 font-bold border transition ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">● Hoạt động</option>
              <option value="PAUSED">○ Tạm ngưng</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ========================================== */}
      {/* 4. SPECIALTY TABLE (REAL DATABASE RECORDS) */}
      {/* ========================================== */}
      <Card className={`${cardBg} rounded-3xl border overflow-hidden shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={tableHeaderBg}>
                <th className="py-4 px-5 min-w-[70px]">Icon</th>
                <th className="py-4 px-5 min-w-[180px]">Tên chuyên khoa</th>
                <th className="py-4 px-5 min-w-[280px]">Mô tả ngắn</th>
                <th className="py-4 px-5 min-w-[140px] text-center">Bệnh viện sử dụng</th>
                <th className="py-4 px-5 min-w-[130px]">Trạng thái</th>
                <th className="py-4 px-5 min-w-[130px]">Ngày tạo</th>
                <th className="py-4 px-5 min-w-[160px] text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                      <span>Đang kết nối CSDL và tải danh sách chuyên khoa...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Stethoscope className="w-8 h-8 text-slate-400 opacity-50" />
                      <p className="font-bold">Không tìm thấy chuyên khoa phù hợp</p>
                      <p className="text-[11px] text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Thêm chuyên khoa&quot; để tạo mới</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((spec: any) => (
                  <tr key={spec.id} className={tableRowBg}>
                    {/* Icon */}
                    <td className="py-3.5 px-5">
                      <div className="w-10 h-10 rounded-2xl overflow-hidden bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        {spec.icon && spec.icon.startsWith('http') ? (
                          <img src={spec.icon} alt={spec.name} className="w-full h-full object-cover" />
                        ) : spec.icon ? (
                          <span className="text-lg">{spec.icon}</span>
                        ) : (
                          <Stethoscope className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                    </td>

                    {/* Tên chuyên khoa */}
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => handleOpenDetailModal(spec, false)}
                        className="font-extrabold text-sm text-left hover:text-purple-600 dark:hover:text-purple-400 transition"
                      >
                        {spec.name}
                      </button>
                    </td>

                    {/* Mô tả ngắn */}
                    <td className="py-3.5 px-5">
                      <p className={`line-clamp-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {spec.description || 'Chưa có mô tả ngắn'}
                      </p>
                    </td>

                    {/* Số bệnh viện đang sử dụng */}
                    <td className="py-3.5 px-5 text-center">
                      <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-300/40 dark:border-blue-800 font-extrabold text-[11px] px-3 py-1 rounded-xl">
                        {spec.hospitalCount || 0} Bệnh viện
                      </Badge>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-5">
                      {spec.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-800 font-bold text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-bold text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Tạm ngưng
                        </Badge>
                      )}
                    </td>

                    {/* Ngày tạo */}
                    <td className="py-3.5 px-5 font-mono text-slate-500 text-[11px]">
                      {spec.createdAt ? new Date(spec.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </td>

                    {/* Hành động */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Xem chi tiết */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetailModal(spec, false)}
                          className="h-8 w-8 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Chỉnh sửa */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetailModal(spec, true)}
                          className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        {/* Ngừng hoạt động / Kích hoạt lại */}
                        {spec.isActive ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDeactivateModal(spec)}
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                            title="Ngừng hoạt động"
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleConfirmToggleStatus(true)}
                            className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors"
                            title="Kích hoạt lại"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className={`p-4 border-t ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50'} flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-500`}>
          <span>
            Hiển thị {items.length > 0 ? (page - 1) * limit + 1 : 0} -{' '}
            {Math.min(page * limit, rawSpecialtiesData?.total || items.length)} trên tổng số {rawSpecialtiesData?.total || items.length} chuyên khoa CSDL
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded-xl text-xs px-3 py-1 font-bold"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trước
            </Button>
            <span className="px-2 font-mono">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-xl text-xs px-3 py-1 font-bold"
            >
              Sau <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================== */}
      {/* 5. DIALOG: THÊM CHUYÊN KHOA */}
      {/* ========================================== */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className={`max-w-xl p-6 rounded-3xl ${isLight ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
          <DialogHeader className="border-b pb-3 border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-black flex items-center gap-2.5 text-purple-600 dark:text-purple-400">
              <Stethoscope className="w-5 h-5 stroke-[2.5]" />
              Thêm Chuyên khoa mới vào CSDL
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Chuyên khoa sau khi tạo sẽ lưu trực tiếp vào CSDL PostgreSQL và dùng chung trên toàn hệ thống NovaCare.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 py-3 max-h-[75vh] overflow-y-auto pr-1">
            {/* Tên chuyên khoa */}
            <div>
              <label className="text-xs font-extrabold mb-1 block">
                Tên chuyên khoa <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="Ví dụ: Tim mạch"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className={`text-xs rounded-xl font-bold ${inputBg}`}
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="text-xs font-extrabold mb-1 block">Mô tả chuyên khoa</label>
              <textarea
                rows={4}
                placeholder="Ví dụ: Chuyên khám và điều trị các bệnh lý tim mạch, tăng huyết áp, suy tim..."
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className={`w-full text-xs rounded-xl p-3 font-semibold border ${inputBg}`}
              />
            </div>

            {/* Icon */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold block">Icon Chuyên khoa</label>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setIconMode('url')}
                    className={`px-2 py-0.5 rounded-lg ${iconMode === 'url' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                  >
                    Đường dẫn URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setIconMode('file')}
                    className={`px-2 py-0.5 rounded-lg ${iconMode === 'file' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                  >
                    Tải ảnh lên
                  </button>
                </div>
              </div>

              {iconMode === 'file' ? (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAddForm({ ...addForm, icon: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={`text-xs rounded-xl font-medium cursor-pointer ${inputBg}`}
                />
              ) : (
                <Input
                  placeholder="Ví dụ: https://... hoặc emoji ❤️"
                  value={addForm.icon}
                  onChange={(e) => setAddForm({ ...addForm, icon: e.target.value })}
                  className={`text-xs rounded-xl font-medium ${inputBg}`}
                />
              )}

              {addForm.icon && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-500/10 border flex items-center justify-center">
                    {addForm.icon.startsWith('http') || addForm.icon.startsWith('data:') ? (
                      <img src={addForm.icon} alt="Icon Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{addForm.icon}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Xem trước Icon thành công
                  </span>
                </div>
              )}
            </div>

            {/* Ảnh Banner / Cover Image */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold block">Ảnh Banner (Cover Image) - <span className="text-slate-400 font-normal">Tùy chọn</span></label>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setCoverMode('url')}
                    className={`px-2 py-0.5 rounded-lg ${coverMode === 'url' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                  >
                    Đường dẫn URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode('file')}
                    className={`px-2 py-0.5 rounded-lg ${coverMode === 'file' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                  >
                    Tải ảnh lên
                  </button>
                </div>
              </div>

              {coverMode === 'file' ? (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAddForm({ ...addForm, coverImageUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={`text-xs rounded-xl font-medium cursor-pointer ${inputBg}`}
                />
              ) : (
                <Input
                  placeholder="Ví dụ: https://..."
                  value={addForm.coverImageUrl}
                  onChange={(e) => setAddForm({ ...addForm, coverImageUrl: e.target.value })}
                  className={`text-xs rounded-xl font-medium ${inputBg}`}
                />
              )}

              {addForm.coverImageUrl && (
                <div className="mt-2 rounded-2xl overflow-hidden h-24 border border-purple-500/30 relative">
                  <img src={addForm.coverImageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                    Xem trước Banner
                  </span>
                </div>
              )}
            </div>

            {/* Trạng thái */}
            <div>
              <label className="text-xs font-extrabold mb-2 block">Trạng thái khởi tạo</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="radio"
                    name="addStatus"
                    checked={addForm.isActive === true}
                    onChange={() => setAddForm({ ...addForm, isActive: true })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  ● Hoạt động
                </label>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="radio"
                    name="addStatus"
                    checked={addForm.isActive === false}
                    onChange={() => setAddForm({ ...addForm, isActive: false })}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  ○ Tạm ngưng
                </label>
              </div>
            </div>

            {/* Dialog Footer */}
            <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="text-xs rounded-xl font-extrabold px-5"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submittingAdd}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl px-6 shadow-md flex items-center gap-2"
              >
                {submittingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Thêm chuyên khoa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================== */}
      {/* 6. DIALOG: CHI TIẾT CHUYÊN KHOA & CHỈNH SỬA */}
      {/* ========================================== */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className={`max-w-3xl p-0 rounded-3xl overflow-hidden border ${isLight ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
          {selectedSpecialty && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Cover Banner Header */}
              <div className="relative h-44 sm:h-52 w-full bg-slate-950 overflow-hidden shrink-0">
                <img
                  src={
                    selectedSpecialty.coverImageUrl ||
                    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80'
                  }
                  alt={selectedSpecialty.name}
                  className="w-full h-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Top Close & Edit Toggle Buttons */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`text-xs font-extrabold rounded-xl px-3.5 py-1.5 shadow-md flex items-center gap-1.5 border ${
                      isEditMode
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400'
                        : 'bg-white/90 text-slate-950 hover:bg-white border-white'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{isEditMode ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}</span>
                  </Button>

                  <button
                    onClick={() => setIsDetailDialogOpen(false)}
                    className="w-8 h-8 rounded-xl bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Banner Content Info */}
                <div className="absolute bottom-4 left-6 right-6 z-10 flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white p-1 shadow-lg border border-white/30 shrink-0 flex items-center justify-center">
                    {selectedSpecialty.icon && selectedSpecialty.icon.startsWith('http') ? (
                      <img src={selectedSpecialty.icon} alt={selectedSpecialty.name} className="w-full h-full object-cover rounded-xl" />
                    ) : selectedSpecialty.icon ? (
                      <span className="text-2xl sm:text-3xl">{selectedSpecialty.icon}</span>
                    ) : (
                      <Stethoscope className="w-8 h-8 text-purple-600" />
                    )}
                  </div>

                  <div className="space-y-1 text-white flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black truncate">{selectedSpecialty.name}</h2>
                      {selectedSpecialty.isActive ? (
                        <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-lg">
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-lg">
                          Tạm ngưng
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium">
                      Mã ID: <code className="font-mono text-purple-300">{selectedSpecialty.id}</code> • Áp dụng tại{' '}
                      <strong className="text-white">{appliedHospitals.length || selectedSpecialty.hospitalCount || 0}</strong> Bệnh viện CSDL
                    </p>
                  </div>
                </div>
              </div>

              {/* 2 Tabs Content Container */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full">
                  <TabsList className={`grid grid-cols-2 w-full p-1 rounded-2xl ${isLight ? 'bg-slate-100' : 'bg-slate-900'}`}>
                    <TabsTrigger value="info" className="text-xs font-extrabold py-2 rounded-xl flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Tab 1: Thông tin chuyên khoa
                    </TabsTrigger>
                    <TabsTrigger value="hospitals" className="text-xs font-extrabold py-2 rounded-xl flex items-center justify-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Tab 2: Bệnh viện đang áp dụng ({appliedHospitals.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1: THÔNG TIN */}
                  <TabsContent value="info" className="pt-4 space-y-4">
                    {isEditMode ? (
                      /* EDITABLE FORM */
                      <form onSubmit={handleSaveEditSubmit} className="space-y-4">
                        <div>
                          <label className="text-xs font-extrabold mb-1 block">Tên chuyên khoa *</label>
                          <Input
                            required
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className={`text-xs rounded-xl font-bold ${inputBg}`}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-extrabold mb-1 block">Mô tả</label>
                          <textarea
                            rows={4}
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className={`w-full text-xs rounded-xl p-3 font-semibold border ${inputBg}`}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-extrabold mb-1 block">Icon (URL)</label>
                            <Input
                              value={editForm.icon}
                              onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                              className={`text-xs rounded-xl font-medium ${inputBg}`}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-extrabold mb-1 block">Ảnh Banner Cover (URL)</label>
                            <Input
                              value={editForm.coverImageUrl}
                              onChange={(e) => setEditForm({ ...editForm, coverImageUrl: e.target.value })}
                              className={`text-xs rounded-xl font-medium ${inputBg}`}
                            />
                          </div>
                        </div>

                        {/* Status Radio */}
                        <div>
                          <label className="text-xs font-extrabold mb-2 block">Trạng thái</label>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                              <input
                                type="radio"
                                name="editStatus"
                                checked={editForm.isActive === true}
                                onChange={() => setEditForm({ ...editForm, isActive: true })}
                                className="w-4 h-4 text-emerald-600"
                              />
                              ● Hoạt động
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                              <input
                                type="radio"
                                name="editStatus"
                                checked={editForm.isActive === false}
                                onChange={() => setEditForm({ ...editForm, isActive: false })}
                                className="w-4 h-4 text-amber-600"
                              />
                              ○ Tạm ngưng
                            </label>
                          </div>
                        </div>

                        {/* Created At - Non editable notice */}
                        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                          <span>Ngày tạo CSDL (Khóa cố định):</span>
                          <span className="font-bold">
                            {selectedSpecialty.createdAt ? new Date(selectedSpecialty.createdAt).toLocaleString('vi-VN') : '---'}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditMode(false)}
                            className="text-xs rounded-xl font-bold"
                          >
                            Hủy
                          </Button>
                          <Button
                            type="submit"
                            disabled={submittingEdit}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl px-5 shadow-md flex items-center gap-2"
                          >
                            {submittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi CSDL'}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      /* READONLY DETAILS */
                      <div className="space-y-4">
                        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'} space-y-3`}>
                          <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400">Mô tả chuyên khoa</h4>
                          <p className="text-xs leading-relaxed font-medium">
                            {selectedSpecialty.description || 'Chưa cập nhật mô tả chi tiết cho chuyên khoa này.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'} space-y-1`}>
                            <span className="text-[11px] font-bold text-slate-400">Ngày khởi tạo trong CSDL</span>
                            <p className="text-xs font-extrabold font-mono">
                              {selectedSpecialty.createdAt ? new Date(selectedSpecialty.createdAt).toLocaleString('vi-VN') : '---'}
                            </p>
                          </div>

                          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'} space-y-1`}>
                            <span className="text-[11px] font-bold text-slate-400">Cập nhật gần nhất</span>
                            <p className="text-xs font-extrabold font-mono">
                              {selectedSpecialty.updatedAt ? new Date(selectedSpecialty.updatedAt).toLocaleString('vi-VN') : '---'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 2: BỆNH VIỆN ĐANG ÁP DỤNG (LẤY TỪ CSDL CỦA BACKEND) */}
                  <TabsContent value="hospitals" className="pt-4 space-y-3">
                    <p className="text-xs text-slate-500 font-medium border-b pb-2 border-slate-200 dark:border-slate-800">
                      Danh sách thực tế các bệnh viện đang gán chuyên khoa này trong CSDL PostgreSQL. (Quản lý gán/bỏ gán được thực hiện trong Chi tiết Bệnh viện).
                    </p>

                    {isLoadingDetail ? (
                      <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span>Đang tải danh sách bệnh viện từ CSDL...</span>
                      </div>
                    ) : appliedHospitals.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 space-y-1">
                        <Building2 className="w-8 h-8 text-slate-400 opacity-40 mx-auto" />
                        <p className="text-xs font-bold">Chưa có bệnh viện nào gán chuyên khoa này</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {appliedHospitals.map((hosp: any) => (
                          <div
                            key={hosp.id || hosp.hospitalId}
                            className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'} flex items-center justify-between gap-3`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center p-0.5">
                                {hosp.hospitalLogoUrl ? (
                                  <img src={hosp.hospitalLogoUrl} alt={hosp.hospitalName} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  <Building2 className="w-5 h-5 text-purple-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-xs truncate">{hosp.hospitalName || hosp.name}</h4>
                                <p className="text-[10px] text-slate-500 truncate">{hosp.hospitalAddress || hosp.address || hosp.hospitalCity}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-lg">
                                {hosp.hospitalStatus || 'Hoạt động'}
                              </Badge>
                              <Link
                                href={`/admin/hospitals/${hosp.hospitalId || hosp.id}`}
                                target="_blank"
                                className="text-xs font-extrabold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                              >
                                <span>Xem Bệnh viện</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================== */}
      {/* 7. DIALOG: XÁC NHẬN NGỪNG HOẠT ĐỘNG */}
      {/* ========================================== */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent className={`max-w-md p-6 rounded-3xl ${isLight ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              Ngừng hoạt động Chuyên khoa?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium pt-2">
              Bạn có chắc muốn ngừng hoạt động chuyên khoa{' '}
              <strong className="text-slate-900 dark:text-white font-bold">
                &quot;{selectedSpecialty?.name}&quot;
              </strong>{' '}
              này?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1.5 my-2">
            <p className="font-bold flex items-center gap-1.5">
              <Power className="w-4 h-4 shrink-0" /> Chú ý nghiệp vụ:
            </p>
            <p className="leading-relaxed text-[11px]">
              Dữ liệu chuyên khoa sẽ được lưu giữ nguyên trong CSDL (<code className="font-mono">isActive = false</code>). Nếu chuyên khoa đang được các bệnh viện sử dụng thì dữ liệu vẫn được bảo lưu, chỉ bị ẩn khỏi danh sách khi gán mới cho bệnh viện khác.
            </p>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeactivateDialogOpen(false)}
              className="text-xs rounded-xl font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={() => handleConfirmToggleStatus(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl px-5 shadow-md"
            >
              Xác nhận ngừng hoạt động
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
