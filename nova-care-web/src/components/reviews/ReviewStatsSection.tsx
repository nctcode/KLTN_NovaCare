'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reviewService } from '@/services/review.service';
import { ReviewTargetType } from '@/types/review.types';
import { ReviewCard } from './ReviewCard';
import { Star, Filter, ArrowUpDown, Loader2, Sparkles, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ReviewStatsSectionProps {
  targetType: ReviewTargetType;
  targetId: string;
  targetTitle?: string;
}

export function ReviewStatsSection({
  targetType,
  targetId,
  targetTitle,
}: ReviewStatsSectionProps) {
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [page, setPage] = useState<number>(1);
  const limit = 5;

  // 1. Fetch Stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['review-stats', targetType, targetId],
    queryFn: () => reviewService.getPublicStats(targetType, targetId),
    enabled: !!targetId,
  });

  // 2. Fetch Reviews List
  const { data: reviewsData, isLoading: loadingReviews } = useQuery({
    queryKey: ['public-reviews', targetType, targetId, page, selectedRating, sortBy],
    queryFn: () => {
      const params = {
        page,
        limit,
        rating: selectedRating,
        sortBy,
      };
      return targetType === 'DOCTOR'
        ? reviewService.getPublicDoctorReviews(targetId, params)
        : reviewService.getPublicHospitalReviews(targetId, params);
    },
    enabled: !!targetId,
  });

  const totalReviews = stats?.totalReviews || 0;
  const averageRating = stats?.averageRating || 0;
  const starDist = stats?.starDistribution || {};
  const criteriaAvg = stats?.criteriaAverages || {};

  const reviewsList = reviewsData?.items || [];
  const totalPages = reviewsData?.totalPages || 1;

  if (loadingStats) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0c4b39]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Block */}
      <Card className="border border-slate-200/90 rounded-3xl bg-white shadow-xs overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
            {/* Left: Big Score Badge */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50/80 rounded-3xl border border-slate-200/80 text-center min-w-[200px] w-full lg:w-auto shrink-0">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {averageRating > 0 ? averageRating.toFixed(1) : '---'}
              </span>

              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(averageRating)
                        ? 'fill-amber-400 text-amber-500'
                        : 'fill-slate-200 text-slate-300'
                    }`}
                  />
                ))}
              </div>

              <span className="text-xs font-bold text-slate-500">
                {totalReviews > 0 ? `Dựa trên ${totalReviews} đánh giá đã duyệt` : 'Chưa có đánh giá'}
              </span>
            </div>

            {/* Middle: Star distribution bars */}
            <div className="flex-1 space-y-2 w-full">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                Phân bố mức độ hài lòng
              </h4>

              {[5, 4, 3, 2, 1].map((s) => {
                const count = starDist[s]?.count || 0;
                const percentage = starDist[s]?.percentage || 0;
                return (
                  <div key={s} className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-slate-700 w-12 flex items-center gap-1 shrink-0">
                      {s} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    </span>

                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="font-mono text-slate-400 w-12 text-right shrink-0">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right: Detailed criteria averages */}
            {Object.keys(criteriaAvg).length > 0 && (
              <div className="w-full lg:w-64 p-4 rounded-2xl bg-[#0c4b39]/5 border border-[#0c4b39]/15 space-y-2.5 text-xs">
                <h4 className="font-extrabold text-[#0c4b39] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Tiêu chí chi tiết
                </h4>

                {targetType === 'DOCTOR' ? (
                  <>
                    <CriteriaMeter label="Thái độ tôn trọng" score={criteriaAvg.attitude} />
                    <CriteriaMeter label="Lắng nghe & tư vấn" score={criteriaAvg.explanation} />
                    <CriteriaMeter label="Sự tận tâm" score={criteriaAvg.dedication} />
                    <CriteriaMeter label="Giao tiếp an tâm" score={criteriaAvg.communication} />
                  </>
                ) : (
                  <>
                    <CriteriaMeter label="Cơ sở vật chất" score={criteriaAvg.facility} />
                    <CriteriaMeter label="Vệ sinh môi trường" score={criteriaAvg.hygiene} />
                    <CriteriaMeter label="Quy trình tiếp nhận" score={criteriaAvg.reception} />
                    <CriteriaMeter label="Thời gian chờ" score={criteriaAvg.waitingTime} />
                    <CriteriaMeter label="Thái độ phục vụ" score={criteriaAvg.staffAttitude} />
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        {/* Star filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRating(undefined);
              setPage(1);
            }}
            className={`rounded-xl text-xs font-bold transition-all ${
              selectedRating === undefined
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả ({totalReviews})
          </Button>

          {[5, 4, 3, 2, 1].map((star) => (
            <Button
              key={star}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRating(star);
                setPage(1);
              }}
              className={`rounded-xl text-xs font-bold transition-all ${
                selectedRating === star
                  ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {star}★ ({starDist[star]?.count || 0})
            </Button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-500 font-medium">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className="p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="newest">Mới nhất</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loadingReviews ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#0c4b39]" />
        </div>
      ) : reviewsList.length > 0 ? (
        <div className="space-y-4">
          {reviewsList.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Trang <strong className="text-slate-900 font-bold">{page}</strong> / {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-xl border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-xl border-slate-200"
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">Chưa có đánh giá nào</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedRating
              ? `Chưa có đánh giá nào đạt mức ${selectedRating} sao.`
              : 'Đánh giá sẽ hiển thị tại đây sau khi người bệnh hoàn tất buổi khám thực tế và được kiểm duyệt.'}
          </p>
        </div>
      )}
    </div>
  );
}

function CriteriaMeter({ label, score }: { label: string; score?: number }) {
  const val = score || 0;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-700 font-medium">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0c4b39] rounded-full"
            style={{ width: `${(val / 5) * 100}%` }}
          />
        </div>
        <span className="font-bold text-slate-900 font-mono text-[11px] w-6 text-right">
          {val > 0 ? val.toFixed(1) : '---'}
        </span>
      </div>
    </div>
  );
}
