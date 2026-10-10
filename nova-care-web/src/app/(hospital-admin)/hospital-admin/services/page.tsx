'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalAdminService } from '@/services/hospital-admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ClipboardList,
  Search,
  Stethoscope,
  Clock,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Power,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react';

export default function HospitalAdminServicesPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [specialtyId, setSpecialtyId] = useState('ALL');

  // Edit Modal State
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editActive, setEditActive] = useState<boolean>(true);

  // Fetch specialties for filter
  const { data: specialties = [] } = useQuery({
    queryKey: ['hospital-admin-specialties-list'],
    queryFn: hospitalAdminService.getSpecialties,
  });

  // Fetch medical services
  const { data, isLoading } = useQuery({
    queryKey: ['hospital-admin-services', page, search, specialtyId],
    queryFn: () =>
      hospitalAdminService.getServices({
        page,
        limit: 10,
        search: search.trim() || undefined,
        specialtyId: specialtyId !== 'ALL' ? specialtyId : undefined,
      }),
  });

  const services = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Update Service Mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { price?: number; isActive?: boolean };
    }) => hospitalAdminService.updateService(id, body),
    onSuccess: () => {
      toast.success('Cập nhật dịch vụ y tế thành công!');
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-services'] });
      setEditingService(null);
    },
    onError: (err: any) => {
      toast.error('Lỗi cập nhật: ' + (err?.response?.data?.message || err?.message || 'Thao tác thất bại'));
    },
  });

  const handleOpenEdit = (service: any) => {
    setEditingService(service);
    setEditPrice(service.price || 0);
    setEditActive(service.isActive);
  };

  const handleSaveEdit = () => {
    if (!editingService) return;
    updateMutation.mutate({
      id: editingService.id,
      body: {
        price: Number(editPrice),
        isActive: editActive,
      },
    });
  };

  const handleQuickToggleActive = (service: any) => {
    updateMutation.mutate({
      id: service.id,
      body: {
        isActive: !service.isActive,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Dịch Vụ Y Tế & Khám Bệnh</h1>
              <p className="text-xs text-slate-500">
                Danh mục các gói xét nghiệm, thủ thuật, dịch vụ khám chữa bệnh niêm yết tại bệnh viện
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-semibold">
            Tổng cộng: {pagination.total} dịch vụ
          </Badge>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm theo tên dịch vụ..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-9 text-xs rounded-xl focus:bg-white"
              />
            </div>

            {/* Specialty Filter */}
            <div>
              <select
                value={specialtyId}
                onChange={(e) => {
                  setSpecialtyId(e.target.value);
                  setPage(1);
                }}
                aria-label="Lọc theo chuyên khoa"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Tất cả chuyên khoa</option>
                {specialties.map((spec: any) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter */}
            <div className="flex items-center">
              {(search || specialtyId !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setSpecialtyId('ALL');
                    setPage(1);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                  <th className="py-3 px-4">Tên dịch vụ</th>
                  <th className="py-3 px-4">Chuyên khoa</th>
                  <th className="py-3 px-4 text-center">Thời lượng ước tính</th>
                  <th className="py-3 px-4 text-right">Đơn giá niêm yết</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        <span>Đang tải danh sách dịch vụ y tế...</span>
                      </div>
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <ClipboardList className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
                      Không tìm thấy dịch vụ y tế nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  services.map((svc: any) => (
                    <tr key={svc.id} className="hover:bg-slate-50 transition-colors">
                      {/* Name & Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900">{svc.name}</div>
                        {svc.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {svc.description}
                          </div>
                        )}
                      </td>

                      {/* Specialty */}
                      <td className="py-3 px-4">
                        {svc.specialty ? (
                          <div className="flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-medium text-slate-800">{svc.specialty.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Toàn viện / Đa khoa</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{svc.duration || 30} phút</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-emerald-700">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(svc.price || 0)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {svc.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Khả dụng
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                            <XCircle className="w-3 h-3 mr-1" />
                            Tạm ngưng
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(svc)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                            title="Điều chỉnh giá & trạng thái"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickToggleActive(svc)}
                            className={`h-8 w-8 p-0 rounded-lg ${
                              svc.isActive
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={svc.isActive ? 'Tạm ngưng dịch vụ' : 'Kích hoạt lại'}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/60">
              <span className="text-xs text-slate-500">
                Hiển thị trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} dịch vụ)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="h-7 px-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Edit className="w-4 h-4 text-emerald-600" />
              Điều chỉnh Dịch vụ Y tế
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editingService && <span>Dịch vụ: <strong>{editingService.name}</strong></span>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Đơn giá niêm yết (VNĐ)
              </label>
              <Input
                type="number"
                min={0}
                step={10000}
                value={editPrice}
                onChange={(e) => setEditPrice(Number(e.target.value))}
                className="bg-slate-50 border-slate-200 text-slate-900 h-9 text-xs rounded-xl focus:bg-white"
              />
              <p className="text-[11px] text-slate-500">
                Giá dịch vụ sẽ hiển thị công khai cho bệnh nhân khi đặt lịch khám hoặc chỉ định cận lâm sàng.
              </p>
            </div>

            {/* Status toggle */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-700">Trạng thái dịch vụ</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditActive(true)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    editActive
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Khả dụng
                </button>
                <button
                  type="button"
                  onClick={() => setEditActive(false)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    !editActive
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Tạm ngưng
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingService(null)}
              className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 rounded-xl"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
