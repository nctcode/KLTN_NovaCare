'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reviewService } from '@/services/review.service';
import { ReviewItem, ReviewStatus, ReviewTargetType } from '@/types/review.types';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { useAuthStore } from '@/stores/auth.store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Star,
  CheckCircle2,
  XCircle,
  EyeOff,
  Clock,
  Flag,
  Search,
  Filter,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Loader2,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminReviewsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';
  const { user } = useAuthStore();
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';

  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Moderation modal state
  const [moderationModalOpen, setModerationModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [moderationAction, setModerationAction] = useState<'REJECTED' | 'HIDDEN'>('REJECTED');
  const [moderationReason, setModerationReason] = useState('');
  const [isSubmittingModeration, setIsSubmittingModeration] = useState(false);

  // Response modal state
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // 1. Fetch Reviews
  const {
    data: reviewsData,
    isLoading: loadingReviews,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ['admin-reviews', activeTab, targetTypeFilter, ratingFilter, searchQuery, page],
    queryFn: () => {
      if (activeTab === 'REPORTS') return null;
      return reviewService.adminGetReviews({
        page,
        limit,
        status: activeTab === 'ALL' ? undefined : (activeTab as any),
        targetType: targetTypeFilter === 'ALL' ? undefined : (targetTypeFilter as any),
        rating: ratingFilter,
        q: searchQuery.trim() || undefined,
      });
    },
    enabled: activeTab !== 'REPORTS',
  });

  // 2. Fetch Reports
  const {
    data: reportsData,
    isLoading: loadingReports,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ['admin-reports', page],
    queryFn: () => reviewService.adminGetReports({ page, limit }),
    enabled: activeTab === 'REPORTS',
  });

  const reviewsList = reviewsData?.items || [];
  const totalReviews = reviewsData?.total || 0;
  const totalPages = reviewsData?.totalPages || 1;

  const reportsList = reportsData?.items || [];
  const totalReports = reportsData?.total || 0;

  // Approve action
  const handleApprove = async (review: ReviewItem) => {
    try {
      await reviewService.adminModerateReview(review.id, {
        status: 'APPROVED',
      });
      toast.success('Phê duyệt đánh giá thành công', {
        description: 'Đánh giá đã được công khai trên hồ sơ.',
      });
      refetchReviews();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt');
    }
  };

  // Open Reject / Hide modal
  const handleOpenModerationModal = (review: ReviewItem, action: 'REJECTED' | 'HIDDEN') => {
    setSelectedReview(review);
    setModerationAction(action);
    setModerationReason(
      action === 'REJECTED'
        ? 'Nội dung chứa từ ngữ không phù hợp quy định kiểm duyệt của NovaCare'
        : 'Ẩn do có báo cáo vi phạm được xác minh hợp lệ',
    );
    setModerationModalOpen(true);
  };

  // Submit Reject / Hide
  const handleSubmitModeration = async () => {
    if (!selectedReview) return;
    if (!moderationReason.trim()) {
      toast.error('Vui lòng nhập lý do xử lý kiểm duyệt');
      return;
    }

    setIsSubmittingModeration(true);
    try {
      await reviewService.adminModerateReview(selectedReview.id, {
        status: moderationAction,
        moderationReason: moderationReason.trim(),
      });
      toast.success(
        moderationAction === 'REJECTED' ? 'Đã từ chối duyệt đánh giá' : 'Đã ẩn đánh giá',
      );
      setModerationModalOpen(false);
      refetchReviews();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi xử lý kiểm duyệt');
    } finally {
      setIsSubmittingModeration(false);
    }
  };

  // Open Response Modal
  const handleOpenResponseModal = (review: ReviewItem) => {
    setSelectedReview(review);
    const existingResp = review.responses?.[0]?.responseContent || '';
    setResponseContent(existingResp);
    setResponseModalOpen(true);
  };

  // Submit Response
  const handleSubmitResponse = async () => {
    if (!selectedReview) return;
    if (!responseContent.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    setIsSubmittingResponse(true);
    try {
      await reviewService.createResponse(selectedReview.id, {
        responseContent: responseContent.trim(),
      });
      toast.success('Gửi phản hồi chính thức thành công');
      setResponseModalOpen(false);
      refetchReviews();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi gửi phản hồi');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Resolve Report
  const handleResolveReport = async (reportId: string) => {
    try {
      await reviewService.adminResolveReport(reportId);
      toast.success('Đã giải quyết báo cáo vi phạm');
      refetchReports();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi giải quyết báo cáo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full w-fit mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kiểm soát chất lượng nội dung y tế</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Quản lý & Kiểm duyệt Đánh giá
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-xl ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Duyệt, từ chối hoặc ẩn các nhận xét của người bệnh sau lượt khám thực tế. Đảm bảo tính minh bạch, công tâm và tuân thủ quy tắc ứng xử y tế.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'PENDING', label: 'Chờ kiểm duyệt' },
          { key: 'ALL', label: 'Tất cả đánh giá' },
          { key: 'APPROVED', label: 'Đã duyệt công khai' },
          { key: 'REJECTED', label: 'Bị từ chối' },
          { key: 'HIDDEN', label: 'Đã ẩn' },
          { key: 'REPORTS', label: 'Báo cáo vi phạm' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : isLight
                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter toolbar (Only for reviews tabs) */}
      {activeTab !== 'REPORTS' && (
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung, mã phiếu khám..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-transparent text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Target Filter */}
            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              className="p-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none"
            >
              <option value="ALL">Tất cả đối tượng</option>
              <option value="DOCTOR">Đánh giá Bác sĩ</option>
              <option value="HOSPITAL">Đánh giá Cơ sở y tế</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setRatingFilter(val);
                setPage(1);
              }}
              className="p-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none"
            >
              <option value="">Tất cả số sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'REPORTS' ? (
        // REPORTS LIST
        loadingReports ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#0c4b39]" />
          </div>
        ) : reportsList.length > 0 ? (
          <div className="space-y-4">
            {reportsList.map((rep) => (
              <Card key={rep.id} className="border border-slate-200 rounded-2xl bg-white p-5 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                      <Flag className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                      {rep.reason}
                    </span>
                    <span className="text-xs text-slate-400">
                      Báo cáo lúc: {format(new Date(rep.createdAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${rep.isResolved ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                    {rep.isResolved ? 'Đã xử lý' : 'Chưa xử lý'}
                  </span>
                </div>

                {rep.description && (
                  <p className="text-xs text-slate-700">
                    <strong>Ghi chú người báo cáo:</strong> {rep.description}
                  </p>
                )}

                {/* Review info snapshot */}
                {rep.review && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Người viết: {rep.review.user?.fullName} ({rep.review.rating}★)</span>
                      <span>Trạng thái đánh giá: {rep.review.status}</span>
                    </div>
                    <p className="text-slate-600 italic">"{rep.review.comment}"</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  {!rep.isResolved && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveReport(rep.id)}
                      className="text-xs rounded-xl"
                    >
                      Đánh dấu đã giải quyết
                    </Button>
                  )}
                  {rep.review && rep.review.status !== 'HIDDEN' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenModerationModal(rep.review, 'HIDDEN')}
                      className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                      Ẩn đánh giá vi phạm này
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-900">Không có báo cáo vi phạm nào cần xử lý</p>
          </div>
        )
      ) : (
        // REVIEWS LIST
        loadingReviews ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#0c4b39]" />
          </div>
        ) : reviewsList.length > 0 ? (
          <div className="space-y-4">
            {reviewsList.map((rev) => {
              const isDoctor = rev.targetType === 'DOCTOR';
              const targetName = isDoctor
                ? rev.doctor
                  ? `${rev.doctor.title ? rev.doctor.title + ' ' : ''}${rev.doctor.fullName}`
                  : 'Bác sĩ phụ trách'
                : rev.hospital?.name || 'Cơ sở y tế';

              return (
                <Card key={rev.id} className="border border-slate-200/90 rounded-2xl bg-white shadow-xs overflow-hidden">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-3 border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                          {isDoctor ? <User className="w-5 h-5 text-[#0c4b39]" /> : <Building2 className="w-5 h-5 text-[#0c4b39]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {isDoctor ? 'Bác sĩ' : 'Cơ sở y tế'}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900">{targetName}</h3>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Người gửi: <strong className="text-slate-800">{rev.user?.fullName}</strong> ({rev.user?.phone || rev.user?.email || '---'}) · Mã phiếu: <strong className="font-mono text-slate-800">{rev.appointment?.bookingCode || '---'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Status & Date */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                          rev.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : rev.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : rev.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {rev.status === 'APPROVED' ? 'Đã duyệt' : rev.status === 'PENDING' ? 'Chờ kiểm duyệt' : rev.status === 'REJECTED' ? 'Bị từ chối' : 'Đã ẩn'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {format(new Date(rev.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </div>

                    {/* Rating & Comment */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-500' : 'fill-slate-100 text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-sm text-slate-900">{rev.rating}.0 sao</span>
                        {rev.isAnonymous && (
                          <span className="text-[11px] text-slate-400 italic">
                            (Người bệnh chọn ẩn danh)
                          </span>
                        )}
                        {rev.isEdited && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                            Đã sửa
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                        {rev.comment}
                      </p>
                    </div>

                    {/* Criteria if present */}
                    {rev.criteriaScore && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                        {rev.criteriaScore.doctorAttitude && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded">Thái độ: {rev.criteriaScore.doctorAttitude}★</span>
                        )}
                        {rev.criteriaScore.doctorExplanation && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded">Giải thích: {rev.criteriaScore.doctorExplanation}★</span>
                        )}
                        {rev.criteriaScore.hospitalFacility && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded">Cơ sở: {rev.criteriaScore.hospitalFacility}★</span>
                        )}
                        {rev.criteriaScore.hospitalHygiene && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded">Vệ sinh: {rev.criteriaScore.hospitalHygiene}★</span>
                        )}
                      </div>
                    )}

                    {/* Rejection / Moderation reason note */}
                    {rev.moderationReason && (
                      <div className="p-2.5 bg-rose-50 text-xs text-rose-800 rounded-xl border border-rose-200">
                        <strong>Lý do kiểm duyệt:</strong> {rev.moderationReason}
                      </div>
                    )}

                    {/* Responses list */}
                    {rev.responses && rev.responses.length > 0 && (
                      <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1 text-xs">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                          Phản hồi của {rev.responses[0].responderName}:
                        </span>
                        <p className="text-emerald-950 pl-5">{rev.responses[0].responseContent}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenResponseModal(rev)}
                          className="text-xs rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#0c4b39]" />
                          {rev.responses?.length ? 'Sửa phản hồi' : 'Viết phản hồi'}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        {rev.status !== 'APPROVED' && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleApprove(rev)}
                            className="bg-[#0c4b39] hover:bg-[#083629] text-white font-bold text-xs rounded-xl shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Phê duyệt công khai
                          </Button>
                        )}

                        {rev.status !== 'REJECTED' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModerationModal(rev, 'REJECTED')}
                            className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Từ chối duyệt
                          </Button>
                        )}

                        {rev.status !== 'HIDDEN' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModerationModal(rev, 'HIDDEN')}
                            className="border-slate-300 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl"
                          >
                            <EyeOff className="w-3.5 h-3.5 mr-1" />
                            Ẩn đánh giá
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
                <span className="text-slate-500">
                  Trang <strong className="text-slate-900">{page}</strong> / {totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-xl border-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Trước
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-xl border-slate-300"
                  >
                    Sau <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <Star className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">Không tìm thấy đánh giá nào</h4>
            <p className="text-xs text-slate-500">
              Không có dữ liệu đánh giá tương ứng với bộ lọc hiện tại.
            </p>
          </div>
        )
      )}

      {/* Moderation Reason Modal */}
      <Dialog open={moderationModalOpen} onOpenChange={setModerationModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {moderationAction === 'REJECTED' ? 'Xác nhận từ chối duyệt đánh giá' : 'Xác nhận ẩn đánh giá'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Vui lòng cung cấp lý do cụ thể. Lý do này sẽ được ghi nhận vào nhật ký kiểm toán và gửi thông báo đến người bệnh.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <label className="text-xs font-bold text-slate-800">Lý do xử lý kiểm duyệt:</label>
            <textarea
              rows={3}
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="Nhập lý do chi tiết..."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModerationModalOpen(false)}
              disabled={isSubmittingModeration}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitModeration}
              disabled={isSubmittingModeration || !moderationReason.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isSubmittingModeration ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Đang xử lý...
                </>
              ) : (
                'Xác nhận xử lý'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Modal */}
      <Dialog open={responseModalOpen} onOpenChange={setResponseModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Phản hồi chính thức cho người bệnh
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Phản hồi của bạn sẽ hiển thị công khai ngay dưới nhận xét của người bệnh sau khi được duyệt.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <label className="text-xs font-bold text-slate-800">Nội dung phản hồi:</label>
            <textarea
              rows={4}
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
              placeholder="Nhập lời cảm ơn hoặc giải trình rõ ràng, lịch sự..."
            />
            <p className="text-[11px] text-slate-400">
              Lưu ý: Không chia sẻ thông tin bệnh án, chẩn đoán hay dữ liệu sức khỏe nhạy cảm của người bệnh.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResponseModalOpen(false)}
              disabled={isSubmittingResponse}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitResponse}
              disabled={isSubmittingResponse || !responseContent.trim()}
              className="bg-[#0c4b39] hover:bg-[#083629] text-white font-bold"
            >
              {isSubmittingResponse ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Đang gửi...
                </>
              ) : (
                'Gửi phản hồi'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
