'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Star, ShieldCheck, Flag, MessageSquare, User, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { reviewService } from '@/services/review.service';
import { ReportReason, ReviewItem } from '@/types/review.types';

export function ReviewCard({ review }: { review: ReviewItem }) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('INAPPROPRIATE_LANGUAGE');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const formattedDate = review.createdAt
    ? format(new Date(review.createdAt), 'dd/MM/yyyy', { locale: vi })
    : '---';

  const handleReport = async () => {
    setIsSubmittingReport(true);
    try {
      await reviewService.reportReview(review.id, {
        reason: reportReason,
        description: reportDescription.trim() || undefined,
      });
      toast.success('Báo cáo vi phạm đã được gửi', {
        description: 'Ban Quản trị NovaCare sẽ kiểm tra nội dung này trong thời gian sớm nhất.',
      });
      setShowReportDialog(false);
      setReportDescription('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <>
      <Card className="border border-slate-200/90 rounded-2xl bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300">
        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center font-bold text-emerald-800 text-sm shrink-0">
                {review.authorName ? review.authorName.charAt(0).toUpperCase() : 'N'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-900">{review.authorName || 'Người bệnh'}</h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đã khám thực tế
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">{formattedDate}</span>
              </div>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= review.rating ? 'fill-amber-400 text-amber-500' : 'fill-slate-100 text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-xs text-slate-800 ml-1">{review.rating}.0</span>
            </div>
          </div>

          {/* Criteria tags if available */}
          {review.criteria && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {review.criteria.attitude && (
                <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                  Thái độ: <strong>{review.criteria.attitude}★</strong>
                </span>
              )}
              {review.criteria.explanation && (
                <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                  Tư vấn: <strong>{review.criteria.explanation}★</strong>
                </span>
              )}
              {review.criteria.facility && (
                <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                  Cơ sở: <strong>{review.criteria.facility}★</strong>
                </span>
              )}
              {review.criteria.waitingTime && (
                <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                  Thời gian chờ: <strong>{review.criteria.waitingTime}★</strong>
                </span>
              )}
            </div>
          )}

          {/* Comment text */}
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {review.comment}
          </p>

          {/* Official responses */}
          {review.responses && review.responses.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {review.responses.map((resp) => (
                <div
                  key={resp.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#0c4b39]" />
                      {resp.responderName}
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-[#0c4b39]/10 text-[#0c4b39] rounded">
                        Phản hồi chính thức
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {resp.createdAt ? format(new Date(resp.createdAt), 'dd/MM/yyyy') : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pl-5">
                    {resp.responseContent}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end pt-1 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setShowReportDialog(true)}
              className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition cursor-pointer"
            >
              <Flag className="w-3 h-3" />
              Báo cáo vi phạm
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Report Modal */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Báo cáo vi phạm đánh giá
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Giúp NovaCare giữ gìn môi trường phản hồi văn minh, trung thực và an toàn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Lý do báo cáo:</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as ReportReason)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="INAPPROPRIATE_LANGUAGE">Ngôn từ không phù hợp / Xúc phạm</option>
                <option value="FALSE_INFORMATION">Thông tin sai sự thật / Vu khống</option>
                <option value="SPAM_ADVERTISEMENT">Quảng cáo rác / Spam</option>
                <option value="PRIVACY_VIOLATION">Lộ thông tin cá nhân / Xâm phạm đời tư</option>
                <option value="OTHER">Lý do khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Mô tả chi tiết (tùy chọn):</label>
              <textarea
                rows={3}
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Cung cấp thêm chi tiết để hỗ trợ đội ngũ kiểm duyệt..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowReportDialog(false)}
              disabled={isSubmittingReport}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleReport}
              disabled={isSubmittingReport}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isSubmittingReport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Đang gửi...
                </>
              ) : (
                'Gửi báo cáo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
