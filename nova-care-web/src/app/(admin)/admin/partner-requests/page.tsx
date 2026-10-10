'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerService } from '@/services/partner.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Copy,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; textClass: string; dotClass: string }> = {
  PENDING: {
    label: 'Chờ xử lý',
    textClass: 'text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  CONTACTED: {
    label: 'Đang trao đổi',
    textClass: 'text-blue-600 dark:text-blue-400',
    dotClass: 'bg-blue-500',
  },
  APPROVED: {
    label: 'Đã duyệt',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Đã từ chối',
    textClass: 'text-rose-600 dark:text-rose-400',
    dotClass: 'bg-rose-500',
  },
};

export default function AdminPartnerRequestsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);

  // Approve Modal State
  const [approvingRequest, setApprovingRequest] = useState<any | null>(null);
  const [approveForm, setApproveForm] = useState({
    hospitalName: '',
    adminEmail: '',
    adminFullName: '',
    adminNote: '',
  });

  // Success Modal State
  const [approvalResult, setApprovalResult] = useState<any | null>(null);

  // Fetch Requests
  const { data, isLoading } = useQuery({
    queryKey: ['admin-partner-requests', page, search, statusFilter],
    queryFn: () =>
      partnerService.getRequests({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
  });

  const requests = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      partnerService.updateStatus(id, { status, adminNote }),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-partner-requests'] });
      if (viewingRequest) {
        setViewingRequest((prev: any) => (prev ? { ...prev, status: 'CONTACTED' } : null));
      }
    },
    onError: (err: any) => {
      toast.error('Lỗi: ' + (err?.response?.data?.message || err?.message || 'Không thể cập nhật'));
    },
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof approveForm }) =>
      partnerService.approveRequest(id, data),
    onSuccess: (res: any) => {
      toast.success('Phê duyệt hợp tác và tạo tài khoản thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-partner-requests'] });
      setApprovingRequest(null);
      setViewingRequest(null);
      setApprovalResult(res?.data || res);
    },
    onError: (err: any) => {
      toast.error('Lỗi duyệt hợp tác: ' + (err?.response?.data?.message || err?.message || 'Thao tác thất bại'));
    },
  });

  const handleOpenApprove = (req: any) => {
    setApprovingRequest(req);
    setApproveForm({
      hospitalName: req.hospitalName || '',
      adminEmail: req.email || '',
      adminFullName: req.contactName ? `${req.contactName}` : `Quản Trị Viên ${req.hospitalName}`,
      adminNote: '',
    });
  };

  const handleConfirmApprove = () => {
    if (!approvingRequest) return;
    if (!approveForm.adminEmail.trim()) {
      toast.error('Email quản trị không được để trống');
      return;
    }
    approveMutation.mutate({
      id: approvingRequest.id,
      data: approveForm,
    });
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép liên kết kích hoạt!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Duyệt Yêu Cầu Hợp Tác Cơ Sở Y Tế
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý và tiếp nhận hồ sơ đăng ký hợp tác từ các bệnh viện, phòng khám
          </p>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Tổng cộng: <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> hồ sơ
        </div>
      </div>

      {/* 2. Filters & Search (Không khung viền) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Lọc theo Trạng thái */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400 mr-1">Trạng thái:</span>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ xử lý' },
            { id: 'CONTACTED', label: 'Đang trao đổi' },
            { id: 'APPROVED', label: 'Đã duyệt' },
            { id: 'REJECTED', label: 'Đã từ chối' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm theo tên cơ sở, người liên hệ, email, SĐT..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-8 text-xs bg-transparent border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-slate-400"
          />
        </div>
      </div>

      {/* 3. Bảng danh sách phân chia rõ ràng - Bỏ khung viền */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
              <th className="py-2.5 px-3 w-10">STT</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Tên cơ sở y tế</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Người liên hệ</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Chức vụ</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Số điện thoại</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Email</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Ngày gửi</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">Trạng thái</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-500" />
                  Đang tải danh sách...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  Không tìm thấy yêu cầu hợp tác nào phù hợp.
                </td>
              </tr>
            ) : (
              requests.map((req: any, index: number) => {
                const statusCfg = STATUS_CONFIG[req.status] || {
                  label: req.status,
                  textClass: 'text-slate-500',
                  dotClass: 'bg-slate-400',
                };
                const rowNumber = (pagination.page - 1) * pagination.limit + index + 1;

                return (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    {/* 1. STT */}
                    <td className="py-3 px-3 text-slate-400">{rowNumber}</td>

                    {/* 2. Tên cơ sở y tế */}
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white whitespace-nowrap max-w-[220px] truncate" title={req.hospitalName}>
                      {req.hospitalName}
                    </td>

                    {/* 3. Người liên hệ */}
                    <td className="py-3 px-3 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {req.contactName}
                    </td>

                    {/* 4. Chức vụ */}
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {req.titleOrRole || '—'}
                    </td>

                    {/* 5. Số điện thoại */}
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                      {req.phone}
                    </td>

                    {/* 6. Email */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {req.email}
                    </td>

                    {/* 7. Ngày gửi */}
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>

                    {/* 8. Trạng thái */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 font-medium ${statusCfg.textClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* 9. Thao tác */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Xem chi tiết */}
                        <button
                          type="button"
                          onClick={() => setViewingRequest(req)}
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline-offset-2 hover:underline cursor-pointer"
                        >
                          Chi tiết
                        </button>

                        {/* Đã liên hệ */}
                        {req.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: req.id,
                                status: 'CONTACTED',
                                adminNote: 'Đã liên hệ trao đổi sơ bộ với đối tác',
                              })
                            }
                            className="text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 cursor-pointer"
                          >
                            Đã liên hệ
                          </button>
                        )}

                        {/* Duyệt hợp tác */}
                        {req.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenApprove(req)}
                            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-2.5 py-1 rounded text-[11px] font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Duyệt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Phân trang - Tối giản không viền hộp */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>
            Trang {pagination.page} / {pagination.totalPages} ({pagination.total} hồ sơ)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Trước
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="h-7 px-2 text-xs"
            >
              Sau
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* 5. MODAL XEM CHI TIẾT - CSS cơ bản, không màu mè, bỏ khung viền */}
      <Dialog open={!!viewingRequest} onOpenChange={(open) => !open && setViewingRequest(null)}>
        <DialogContent className="max-w-lg border-0 shadow-lg dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Chi tiết Đơn Đăng Ký Hợp Tác
            </DialogTitle>
          </DialogHeader>

          {viewingRequest && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs py-2">
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500 w-36 shrink-0">Mã hồ sơ:</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono select-all text-right">{viewingRequest.id}</span>
              </div>

              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500 w-36 shrink-0">Tên cơ sở y tế:</span>
                <span className="font-semibold text-slate-900 dark:text-white text-right">
                  {viewingRequest.hospitalName}
                </span>
              </div>

              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500 w-36 shrink-0">Người đại diện:</span>
                <span className="font-medium text-slate-900 dark:text-white text-right">{viewingRequest.contactName}</span>
              </div>

              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500 w-36 shrink-0">Chức vụ / Vai trò:</span>
                <span className="text-slate-700 dark:text-slate-300 text-right">{viewingRequest.titleOrRole || '—'}</span>
              </div>

              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500 w-36 shrink-0">Số điện thoại:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono text-right">{viewingRequest.phone}</span>
              </div>

              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500 w-36 shrink-0">Email liên hệ:</span>
                <span className="text-slate-800 dark:text-slate-200 text-right">{viewingRequest.email}</span>
              </div>

              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500 w-36 shrink-0">Ngày gửi đơn:</span>
                <span className="text-slate-700 dark:text-slate-300 text-right">
                  {new Date(viewingRequest.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-500 w-36 shrink-0">Trạng thái:</span>
                <span className="text-right">
                  <span className={`inline-flex items-center gap-1.5 font-medium ${STATUS_CONFIG[viewingRequest.status]?.textClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[viewingRequest.status]?.dotClass}`} />
                    {STATUS_CONFIG[viewingRequest.status]?.label}
                  </span>
                </span>
              </div>

              {viewingRequest.notes && (
                <div className="py-2.5">
                  <span className="text-slate-500 block mb-1">Ghi chú từ đối tác:</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {viewingRequest.notes}
                  </p>
                </div>
              )}

              {viewingRequest.adminNote && (
                <div className="py-2.5">
                  <span className="text-slate-500 block mb-1">Ghi chú nội bộ của Admin:</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {viewingRequest.adminNote}
                  </p>
                </div>
              )}

              {viewingRequest.approvedAt && (
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-slate-500 w-36 shrink-0">Thời gian duyệt:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium text-right">
                    {new Date(viewingRequest.approvedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewingRequest(null)}
              className="text-xs"
            >
              Đóng
            </Button>

            {viewingRequest?.status === 'PENDING' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: viewingRequest.id,
                    status: 'CONTACTED',
                    adminNote: 'Đã liên hệ trao đổi',
                  });
                }}
                className="text-xs"
              >
                Đánh dấu Đã liên hệ
              </Button>
            )}

            {viewingRequest && viewingRequest.status !== 'APPROVED' && (
              <Button
                size="sm"
                onClick={() => {
                  const req = viewingRequest;
                  setViewingRequest(null);
                  handleOpenApprove(req);
                }}
                className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-medium"
              >
                Duyệt hợp tác
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. MODAL PHÊ DUYỆT - CSS cơ bản, không màu mè, bỏ khung viền */}
      <Dialog open={!!approvingRequest} onOpenChange={(open) => !open && setApprovingRequest(null)}>
        <DialogContent className="max-w-md border-0 shadow-lg dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Phê Duyệt Hợp Tác Cơ Sở Y Tế
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống sẽ tạo cơ sở y tế, cấp quyền Hospital Admin và gửi liên kết kích hoạt qua email.
            </p>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-medium">
                Tên Cơ sở y tế chính thức:
              </label>
              <Input
                value={approveForm.hospitalName}
                onChange={(e) => setApproveForm({ ...approveForm, hospitalName: e.target.value })}
                className="h-8 text-xs border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-medium">
                Email nhận tài khoản Quản trị viên (Hospital Admin) *:
              </label>
              <Input
                type="email"
                required
                value={approveForm.adminEmail}
                onChange={(e) => setApproveForm({ ...approveForm, adminEmail: e.target.value })}
                className="h-8 text-xs border-slate-200 dark:border-slate-800"
              />
              <p className="text-[11px] text-slate-400">
                Có thể chỉnh sửa nếu đối tác dùng email quản trị khác với email liên hệ ban đầu.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-medium">
                Họ tên hiển thị của Quản trị viên:
              </label>
              <Input
                value={approveForm.adminFullName}
                onChange={(e) => setApproveForm({ ...approveForm, adminFullName: e.target.value })}
                className="h-8 text-xs border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-medium">
                Ghi chú nội bộ:
              </label>
              <Input
                placeholder="Ghi chú kết quả trao đổi, thời gian thống nhất..."
                value={approveForm.adminNote}
                onChange={(e) => setApproveForm({ ...approveForm, adminNote: e.target.value })}
                className="h-8 text-xs border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setApprovingRequest(null)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmApprove}
              disabled={approveMutation.isPending}
              className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-medium"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận Duyệt & Gửi mail'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. MODAL THÔNG BÁO DUYỆT THÀNH CÔNG & LINK KÍCH HOẠT */}
      <Dialog open={!!approvalResult} onOpenChange={(open) => !open && setApprovalResult(null)}>
        <DialogContent className="max-w-md border-0 shadow-lg dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Đã Phê Duyệt Thành Công
            </DialogTitle>
          </DialogHeader>

          {approvalResult && (
            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1 text-slate-700 dark:text-slate-300">
                <p>
                  <span className="text-slate-500">Cơ sở y tế:</span>{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">{approvalResult.hospital?.name}</span>
                </p>
                <p>
                  <span className="text-slate-500">Tài khoản Quản trị:</span>{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">{approvalResult.user?.email}</span>
                </p>
                <p className="text-slate-500 pt-1">
                  Email kích hoạt tài khoản đã được gửi đến địa chỉ trên.
                </p>
              </div>

              {approvalResult.activationUrl && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-slate-500 block">
                    Liên kết kích hoạt trực tiếp (dùng để kiểm thử nhanh):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      readOnly
                      value={approvalResult.activationUrl}
                      className="h-8 text-[11px] font-mono bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCopyLink(approvalResult.activationUrl)}
                      className="h-8 px-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <Button
              size="sm"
              onClick={() => setApprovalResult(null)}
              className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-xs font-medium"
            >
              Hoàn tất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
