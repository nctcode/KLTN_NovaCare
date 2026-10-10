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
  UserCheck,
  Search,
  Stethoscope,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  DollarSign,
  Power,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const DAY_NAMES: Record<number, string> = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  0: 'Chủ Nhật',
};

export default function HospitalAdminDoctorsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [specialtyId, setSpecialtyId] = useState('ALL');

  // Edit Workplace Modal
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
  const [editFee, setEditFee] = useState<number>(0);
  const [editActive, setEditActive] = useState<boolean>(true);
  const [editSpecialtyId, setEditSpecialtyId] = useState<string>('');

  // View Doctor Modal
  const [viewingDoctor, setViewingDoctor] = useState<any | null>(null);

  // Fetch specialties for filter
  const { data: specialties = [] } = useQuery({
    queryKey: ['hospital-admin-specialties-list'],
    queryFn: hospitalAdminService.getSpecialties,
  });

  // Fetch doctors
  const { data, isLoading } = useQuery({
    queryKey: ['hospital-admin-doctors', page, search, specialtyId],
    queryFn: () =>
      hospitalAdminService.getDoctors({
        page,
        limit: 10,
        search: search.trim() || undefined,
        specialtyId: specialtyId !== 'ALL' ? specialtyId : undefined,
      }),
  });

  const doctors = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Update workplace mutation
  const updateMutation = useMutation({
    mutationFn: ({
      workplaceId,
      body,
    }: {
      workplaceId: string;
      body: { consultationFee?: number; isActive?: boolean; specialtyId?: string };
    }) => hospitalAdminService.updateDoctorWorkplace(workplaceId, body),
    onSuccess: () => {
      toast.success('Cập nhật thông tin bác sĩ thành công!');
      queryClient.invalidateQueries({ queryKey: ['hospital-admin-doctors'] });
      setEditingDoctor(null);
    },
    onError: (err: any) => {
      toast.error('Lỗi cập nhật: ' + (err?.response?.data?.message || err?.message || 'Thao tác thất bại'));
    },
  });

  const handleOpenEdit = (doc: any) => {
    setEditingDoctor(doc);
    setEditFee(doc.consultationFee || 0);
    setEditActive(doc.isActive);
    setEditSpecialtyId(doc.specialtyId || '');
  };

  const handleSaveEdit = () => {
    if (!editingDoctor) return;
    updateMutation.mutate({
      workplaceId: editingDoctor.workplaceId,
      body: {
        consultationFee: Number(editFee),
        isActive: editActive,
        specialtyId: editSpecialtyId || undefined,
      },
    });
  };

  const handleQuickToggleActive = (doc: any) => {
    updateMutation.mutate({
      workplaceId: doc.workplaceId,
      body: {
        isActive: !doc.isActive,
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
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Đội ngũ Bác sĩ Bệnh viện</h1>
              <p className="text-xs text-slate-500">
                Quản lý danh sách bác sĩ công tác tại viện, điều chỉnh giá khám và trạng thái tiếp nhận bệnh nhân
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-semibold">
            Tổng cộng: {pagination.total} bác sĩ
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
                placeholder="Tìm tên bác sĩ, học vị, mã HIS..."
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
                    {spec.name} ({spec.doctorCount || 0} BS)
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Reset */}
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

      {/* Doctors Table */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                  <th className="py-3 px-4">Bác sĩ</th>
                  <th className="py-3 px-4">Chuyên khoa</th>
                  <th className="py-3 px-4">Kinh nghiệm</th>
                  <th className="py-3 px-4 text-right">Giá khám niêm yết</th>
                  <th className="py-3 px-4 text-center">Lịch trực</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        <span>Đang tải danh sách bác sĩ...</span>
                      </div>
                    </td>
                  </tr>
                ) : doctors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <UserCheck className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
                      Không tìm thấy bác sĩ nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  doctors.map((doc: any) => (
                    <tr key={doc.workplaceId} className="hover:bg-slate-50 transition-colors">
                      {/* Doctor info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-600 font-bold">
                            {doc.avatarUrl && doc.avatarUrl.trim() ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={doc.avatarUrl.trim()}
                                alt={doc.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{doc.fullName?.charAt(0) || 'D'}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>
                                {doc.title ? `${doc.title} ` : ''}
                                {doc.fullName}
                              </span>
                              {doc.source === 'HIS' && (
                                <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 px-1 py-0 font-medium">
                                  HIS
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {doc.qualification || 'Bác sĩ chuyên môn'}
                              {doc.externalId && ` • Mã: ${doc.externalId}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specialty */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-800">{doc.specialty}</span>
                        </div>
                      </td>

                      {/* Experience */}
                      <td className="py-3 px-4">
                        <span className="text-slate-600">
                          {doc.yearsOfExperience ? `${doc.yearsOfExperience} năm` : 'Chưa cập nhật'}
                        </span>
                      </td>

                      {/* Fee */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-emerald-700">
                          {doc.consultationFee
                            ? new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(doc.consultationFee)
                            : 'Miễn phí'}
                        </span>
                      </td>

                      {/* Schedule count */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant="outline"
                          className="bg-slate-50 border-slate-200 text-slate-700 text-[11px]"
                        >
                          <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                          {doc.schedules?.length || 0} ca/tuần
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {doc.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Đang hoạt động
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
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
                            onClick={() => setViewingDoctor(doc)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(doc)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                            title="Điều chỉnh giá khám & trạng thái"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickToggleActive(doc)}
                            className={`h-8 w-8 p-0 rounded-lg ${
                              doc.isActive
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={doc.isActive ? 'Tạm ngưng tiếp nhận' : 'Kích hoạt lại'}
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
                Hiển thị trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} bác sĩ)
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

      {/* Dialog: Edit Doctor Workplace */}
      {/* Dialog: Edit Doctor Workplace */}
      <Dialog open={!!editingDoctor} onOpenChange={(open) => !open && setEditingDoctor(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md shadow-xl rounded-2xl p-6">
          <DialogHeader className="border-b pb-3.5 border-slate-200">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Edit className="w-4 h-4 text-slate-600" />
              Điều chỉnh Bác sĩ tại Bệnh viện
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
              {editingDoctor && (
                <span>
                  Bác sĩ: <strong>{editingDoctor.title} {editingDoctor.fullName}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Chuyên khoa của bệnh viện */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                Chuyên khoa tại bệnh viện *
              </label>
              <select
                value={editSpecialtyId}
                onChange={(e) => setEditSpecialtyId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-2.5 outline-none focus:bg-white focus:border-slate-400"
              >
                <option value="">-- Chọn chuyên khoa của bệnh viện --</option>
                {specialties.map((spec: any) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 font-normal">
                Chọn chuyên khoa của bệnh viện để phân bổ bác sĩ tiếp nhận bệnh nhân.
              </p>
            </div>

            {/* Consultation Fee */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                Giá khám niêm yết (VNĐ)
              </label>
              <Input
                type="number"
                min={0}
                step={10000}
                value={editFee}
                onChange={(e) => setEditFee(Number(e.target.value))}
                className="bg-slate-50 border-slate-200 text-slate-900 h-9 text-xs rounded-xl focus:bg-white"
              />
              <p className="text-[11px] text-slate-500 font-normal">
                Giá khám áp dụng khi bệnh nhân đặt lịch hẹn khám trực tiếp với bác sĩ này tại viện.
              </p>
            </div>

            {/* Active Toggle */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700">Trạng thái làm việc tại viện</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditActive(true)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    editActive
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Đang hoạt động
                </button>
                <button
                  type="button"
                  onClick={() => setEditActive(false)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    !editActive
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  Tạm ngưng nhận bệnh
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingDoctor(null)}
              className="text-xs text-slate-700 hover:bg-slate-100 border-slate-200 rounded-xl px-4"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl px-4 shadow-xs"
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

      {/* Dialog: View Doctor Details */}
      <Dialog open={!!viewingDoctor} onOpenChange={(open) => !open && setViewingDoctor(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg shadow-xl rounded-2xl p-6">
          <DialogHeader className="border-b pb-3.5 border-slate-200 flex flex-row items-center justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <UserCheck className="w-4 h-4 text-slate-600" />
                Chi tiết Hồ sơ Bác sĩ
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                Xem thông tin chuyên môn và lịch trực của bác sĩ tại bệnh viện.
              </DialogDescription>
            </div>

            {viewingDoctor && (
              <div className="shrink-0">
                {viewingDoctor.isActive ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    Đang nhận đặt lịch
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Ngừng nhận lịch (Đã ẩn)
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          {viewingDoctor && (
            <div className="space-y-4 py-2 text-xs">
              {/* Header profile */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-600 font-semibold text-lg">
                  {viewingDoctor.avatarUrl && viewingDoctor.avatarUrl.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={viewingDoctor.avatarUrl.trim()}
                      alt={viewingDoctor.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{viewingDoctor.fullName?.charAt(0) || 'D'}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {viewingDoctor.title} {viewingDoctor.fullName}
                  </h3>
                  <p className="text-slate-500 text-xs font-normal mt-0.5 flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">Chuyên khoa:</span>
                    <span>{viewingDoctor.specialty || 'Chưa phân chuyên khoa'}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 text-[10px] font-normal">
                      {viewingDoctor.specialty}
                    </Badge>
                    <span className="text-[11px] text-slate-500 font-normal">
                      {viewingDoctor.yearsOfExperience ? `${viewingDoctor.yearsOfExperience} năm kinh nghiệm` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedules in week */}
              <div className="space-y-2">
                <h4 className="font-medium text-slate-800 flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Lịch trực định kỳ trong tuần ({viewingDoctor.schedules?.length || 0} ca)
                </h4>
                {viewingDoctor.schedules && viewingDoctor.schedules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {viewingDoctor.schedules.map((sch: any) => (
                      <div
                        key={sch.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            {DAY_NAMES[sch.dayOfWeek] || `Thứ ${sch.dayOfWeek}`}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {sch.startTime} - {sch.endTime}
                          </div>
                        </div>
                        {sch.isActive ? (
                          <span className="w-2 h-2 rounded-full bg-slate-900" title="Hoạt động" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300" title="Tạm dừng" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 font-normal">
                    Chưa thiết lập ca trực cho bác sĩ này tại bệnh viện.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Nút Ngừng / Mở lại nhận đặt lịch */}
            <div>
              {viewingDoctor && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    const newStatus = !viewingDoctor.isActive;
                    handleQuickToggleActive(viewingDoctor);
                    setViewingDoctor({ ...viewingDoctor, isActive: newStatus });
                  }}
                  className={`text-xs font-medium rounded-lg h-9 px-3.5 border transition ${
                    viewingDoctor.isActive
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : viewingDoctor.isActive ? (
                    <>
                      <Power className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      Ngừng nhận đặt lịch
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Mở lại nhận đặt lịch
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Nút Đóng & Chỉnh sửa thông tin */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingDoctor(null)}
                className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium rounded-lg h-9 px-4"
              >
                Đóng
              </Button>
              {viewingDoctor && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const doc = viewingDoctor;
                    setViewingDoctor(null);
                    handleOpenEdit(doc);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg h-9 px-4 shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Chỉnh sửa thông tin
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
