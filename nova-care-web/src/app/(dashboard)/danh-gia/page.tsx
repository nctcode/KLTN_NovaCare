'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reviewService } from '@/services/review.service';
import { ReviewItem, ReviewStatus } from '@/types/review.types';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  EyeOff,
  AlertCircle,
  Edit3,
  MessageSquare,
  Building2,
  User,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

const statusConfig: Record<ReviewStatus, { label: string; badgeClass: string; icon: any }> = {
  PENDING: {
    label: 'Chờ kiểm duyệt',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  APPROVED: {
    label: 'Đã duyệt & Công khai',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Bị từ chối',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: XCircle,
  },
  HIDDEN: {
    label: 'Đã ẩn',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: EyeOff,
  },
};

export default function MyReviewsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-reviews', selectedStatus],
    queryFn: () =>
      reviewService.getMyReviews({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        limit: 50,
      }),
  });

  const reviews = data?.items || [];

  const formatRemainingTime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'Đã hết hạn sửa';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `Còn ${hours} giờ ${minutes} phút để sửa`;
    return `Còn ${minutes} phút để sửa`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full w-fit mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>Phản hồi & Trải nghiệm người bệnh</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Đánh giá của tôi</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Quản lý các nhận xét đã gửi sau lượt khám thực tế. Bạn có thể chỉnh sửa nội dung trong vòng 48 giờ kể từ khi gửi.
          </p>
        </div>

        <Button asChild className="bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-bold gap-2 self-start md:self-auto rounded-xl">
          <Link href="/lich-kham">
            <Calendar className="w-4 h-4" />
            Đánh giá từ lịch khám đã xong
          </Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ duyệt' },
          { key: 'APPROVED', label: 'Đã duyệt' },
          { key: 'REJECTED', label: 'Bị từ chối' },
          { key: 'HIDDEN', label: 'Đã ẩn' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedStatus === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#0c4b39]" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const config = statusConfig[rev.status] || statusConfig.PENDING;
            const StatusIcon = config.icon;
            const isDoctor = rev.targetType === 'DOCTOR';
            const targetTitle = isDoctor
              ? rev.doctor
                ? `${rev.doctor.title ? rev.doctor.title + ' ' : ''}${rev.doctor.fullName}`
                : 'Bác sĩ phụ trách'
              : rev.hospital?.name || 'Cơ sở y tế';

            return (
              <Card
                key={rev.id}
                className="border border-slate-200/90 rounded-2xl bg-white shadow-xs overflow-hidden transition hover:border-slate-300"
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Row 1: Target info & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-[#0c4b39]">
                        {isDoctor ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {isDoctor ? 'Bác sĩ' : 'Cơ sở y tế'}
                          </span>
                          <h3 className="font-bold text-sm text-slate-900">{targetTitle}</h3>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Mã phiếu: <strong className="font-mono text-slate-700">{rev.appointment?.bookingCode || '---'}</strong> · Ngày gửi: {format(new Date(rev.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.badgeClass}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars & Comment */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= rev.rating
                                ? 'fill-amber-400 text-amber-500'
                                : 'fill-slate-100 text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-extrabold text-sm text-slate-900">{rev.rating}.0 sao</span>
                      {rev.isAnonymous && (
                        <span className="text-[11px] text-slate-400 italic">
                          (Được ẩn danh khi công khai)
                        </span>
                      )}
                      {rev.isEdited && (
                        <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          Đã chỉnh sửa
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                      {rev.comment}
                    </p>
                  </div>

                  {/* Rejection / Moderation reason note if rejected */}
                  {rev.status === 'REJECTED' && rev.moderationReason && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Lý do từ chối kiểm duyệt:
                      </div>
                      <p className="text-rose-700 pl-5">{rev.moderationReason}</p>
                    </div>
                  )}

                  {/* Official Responses */}
                  {rev.responses && rev.responses.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      {rev.responses.map((resp) => (
                        <div
                          key={resp.id}
                          className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                              {resp.responderName} (Phản hồi chính thức)
                            </span>
                          </div>
                          <p className="text-xs text-emerald-900 leading-relaxed whitespace-pre-line pl-5">
                            {resp.responseContent}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer: Edit timer and action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatRemainingTime(rev.remainingEditSeconds)}</span>
                    </div>

                    {rev.canEdit && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingReview(rev)}
                        className="rounded-xl font-bold text-xs border-slate-300 hover:bg-slate-100 text-slate-800 gap-1.5 self-end sm:self-auto cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#0c4b39]" />
                        Chỉnh sửa đánh giá
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border border-slate-200/90 rounded-2xl bg-white p-12 text-center space-y-3">
          <Star className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-900">Không tìm thấy đánh giá nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedStatus !== 'ALL'
              ? 'Không có đánh giá nào phù hợp với bộ lọc đã chọn.'
              : 'Sau khi hoàn thành lượt khám tại cơ sở y tế, bạn có thể gửi phản hồi để giúp cộng đồng người bệnh có thêm thông tin tham khảo.'}
          </p>
          <Button asChild size="sm" className="bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-bold rounded-xl mt-2">
            <Link href="/lich-kham">Xem lịch khám để đánh giá</Link>
          </Button>
        </Card>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <ReviewModal
          isOpen={!!editingReview}
          onClose={() => setEditingReview(null)}
          onSuccess={() => {
            setEditingReview(null);
            refetch();
          }}
          appointmentId={editingReview.appointmentId}
          bookingCode={editingReview.appointment?.bookingCode}
          targetType={editingReview.targetType}
          targetName={
            editingReview.targetType === 'DOCTOR'
              ? editingReview.doctor
                ? `${editingReview.doctor.title ? editingReview.doctor.title + ' ' : ''}${editingReview.doctor.fullName}`
                : 'Bác sĩ'
              : editingReview.hospital?.name || 'Cơ sở y tế'
          }
          existingReview={{
            id: editingReview.id,
            rating: editingReview.rating,
            comment: editingReview.comment,
            isAnonymous: editingReview.isAnonymous,
            criteria: editingReview.criteriaScore || undefined,
          }}
        />
      )}
    </div>
  );
}
