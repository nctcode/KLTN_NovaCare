'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, ShieldCheck, AlertCircle, Loader2, Sparkles, User, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { reviewService } from '@/services/review.service';
import { ReviewCriteriaScores, ReviewTargetType } from '@/types/review.types';

const ratingLabels: Record<number, { text: string; color: string }> = {
  1: { text: 'Rất không hài lòng', color: 'text-rose-600' },
  2: { text: 'Không hài lòng', color: 'text-amber-600' },
  3: { text: 'Bình thường', color: 'text-amber-500' },
  4: { text: 'Hài lòng', color: 'text-emerald-600' },
  5: { text: 'Rất hài lòng', color: 'text-emerald-700' },
};

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  appointmentId: string;
  bookingCode?: string;
  targetType: ReviewTargetType;
  targetName: string;
  targetSubtitle?: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string;
    isAnonymous?: boolean;
    criteria?: ReviewCriteriaScores;
  } | null;
}

export function ReviewModal({
  isOpen,
  onClose,
  onSuccess,
  appointmentId,
  bookingCode,
  targetType,
  targetName,
  targetSubtitle,
  existingReview,
}: ReviewModalProps) {
  const isEditing = !!existingReview;

  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(existingReview?.isAnonymous || false);
  const [showDetailedCriteria, setShowDetailedCriteria] = useState<boolean>(false);

  // Criteria states
  const [criteria, setCriteria] = useState<ReviewCriteriaScores>(
    existingReview?.criteria || {
      doctorAttitude: 5,
      doctorExplanation: 5,
      doctorDedication: 5,
      doctorCommunication: 5,
      hospitalFacility: 5,
      hospitalHygiene: 5,
      hospitalReception: 5,
      hospitalWaitingTime: 4,
      hospitalStaffAttitude: 5,
    },
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setComment(existingReview.comment || '');
      setIsAnonymous(existingReview.isAnonymous || false);
      if (existingReview.criteria) {
        setCriteria(existingReview.criteria);
        setShowDetailedCriteria(true);
      }
    } else {
      setRating(5);
      setComment('');
      setIsAnonymous(false);
      setShowDetailedCriteria(false);
    }
  }, [existingReview, isOpen]);

  const activeRating = hoverRating || rating;
  const currentLabel = ratingLabels[activeRating] || ratingLabels[5];

  const handleStarClick = (score: number) => {
    setRating(score);
  };

  const handleCriteriaChange = (key: keyof ReviewCriteriaScores, val: number) => {
    setCriteria((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      toast.error('Vui lòng chọn số sao đánh giá (1 - 5 sao)');
      return;
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 10) {
      toast.error('Nhận xét quá ngắn', {
        description: 'Vui lòng nhập tối thiểu 10 ký tự để chia sẻ trải nghiệm cụ thể.',
      });
      return;
    }

    if (trimmedComment.length > 1000) {
      toast.error('Nhận xét quá dài', {
        description: 'Vui lòng rút gọn nhận xét dưới 1000 ký tự.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && existingReview) {
        await reviewService.updateReview(existingReview.id, {
          rating,
          comment: trimmedComment,
          isAnonymous,
          criteria: showDetailedCriteria ? criteria : undefined,
        });
        toast.success('Chỉnh sửa đánh giá thành công!', {
          description: 'Nội dung cập nhật đã được chuyển sang trạng thái chờ duyệt lại.',
        });
      } else {
        await reviewService.createReview({
          appointmentId,
          targetType,
          rating,
          comment: trimmedComment,
          isAnonymous,
          criteria: showDetailedCriteria ? criteria : undefined,
        });
        toast.success('Gửi đánh giá thành công!', {
          description: 'Cảm ơn bạn! Đánh giá đang được kiểm duyệt trước khi hiển thị công khai.',
        });
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border-slate-200 p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="space-y-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Đánh giá dựa trên trải nghiệm khám thực tế</span>
          </div>

          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Chỉnh sửa đánh giá' : `Đánh giá ${targetType === 'DOCTOR' ? 'Bác sĩ' : 'Cơ sở Y tế'}`}
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500">
            Phiếu khám: <strong className="font-mono text-slate-900">{bookingCode || appointmentId.slice(0, 8)}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Target Card Header */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-4 my-2">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0 text-[#0c4b39]">
            {targetType === 'DOCTOR' ? <User className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-slate-900 truncate">{targetName}</h4>
            {targetSubtitle && <p className="text-xs text-slate-500 truncate">{targetSubtitle}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Overall Rating Section */}
          <div className="text-center space-y-2 p-4 bg-amber-50/40 rounded-2xl border border-amber-100">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              Mức độ hài lòng chung <span className="text-rose-500">*</span>
            </label>

            {/* Stars list */}
            <div className="flex justify-center items-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleStarClick(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                  title={`${star} sao`}
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-500'
                        : 'fill-slate-100 text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className={`text-sm font-extrabold transition-all ${currentLabel.color}`}>
              {currentLabel.text}
            </p>
          </div>

          {/* Toggle Detailed Criteria */}
          <div>
            <button
              type="button"
              onClick={() => setShowDetailedCriteria(!showDetailedCriteria)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0c4b39]" />
                Chấm điểm tiêu chí chi tiết (Tùy chọn)
              </span>
              {showDetailedCriteria ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetailedCriteria && (
              <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 text-xs">
                {targetType === 'DOCTOR' ? (
                  <>
                    <CriteriaRow
                      label="Thái độ & sự tôn trọng người bệnh"
                      value={criteria.doctorAttitude || 5}
                      onChange={(v) => handleCriteriaChange('doctorAttitude', v)}
                    />
                    <CriteriaRow
                      label="Khả năng lắng nghe & giải thích bệnh"
                      value={criteria.doctorExplanation || 5}
                      onChange={(v) => handleCriteriaChange('doctorExplanation', v)}
                    />
                    <CriteriaRow
                      label="Sự tận tâm trong quá trình tư vấn"
                      value={criteria.doctorDedication || 5}
                      onChange={(v) => handleCriteriaChange('doctorDedication', v)}
                    />
                    <CriteriaRow
                      label="Trải nghiệm giao tiếp tổng thể"
                      value={criteria.doctorCommunication || 5}
                      onChange={(v) => handleCriteriaChange('doctorCommunication', v)}
                    />
                  </>
                ) : (
                  <>
                    <CriteriaRow
                      label="Cơ sở vật chất & phòng khám"
                      value={criteria.hospitalFacility || 5}
                      onChange={(v) => handleCriteriaChange('hospitalFacility', v)}
                    />
                    <CriteriaRow
                      label="Vệ sinh & môi trường y tế"
                      value={criteria.hospitalHygiene || 5}
                      onChange={(v) => handleCriteriaChange('hospitalHygiene', v)}
                    />
                    <CriteriaRow
                      label="Quy trình tiếp nhận & thủ tục"
                      value={criteria.hospitalReception || 5}
                      onChange={(v) => handleCriteriaChange('hospitalReception', v)}
                    />
                    <CriteriaRow
                      label="Thời gian chờ đợi khám"
                      value={criteria.hospitalWaitingTime || 4}
                      onChange={(v) => handleCriteriaChange('hospitalWaitingTime', v)}
                    />
                    <CriteriaRow
                      label="Thái độ phục vụ của nhân viên"
                      value={criteria.hospitalStaffAttitude || 5}
                      onChange={(v) => handleCriteriaChange('hospitalStaffAttitude', v)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Comment input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-800">
                Nhận xét chi tiết <span className="text-rose-500">*</span>
              </label>
              <span className={`font-mono text-[11px] ${comment.length < 10 || comment.length > 1000 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                {comment.length}/1000 ký tự (tối thiểu 10)
              </span>
            </div>

            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cụ thể trải nghiệm của bạn trong buổi khám (thái độ, thời gian tư vấn, chất lượng dịch vụ)..."
              className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c4b39] focus:border-transparent transition"
            />
          </div>

          {/* Anonymous checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="anonymous-check"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-[#0c4b39] focus:ring-[#0c4b39] cursor-pointer"
            />
            <label htmlFor="anonymous-check" className="text-xs text-slate-700 font-medium cursor-pointer">
              Ẩn danh họ tên của tôi khi hiển thị nhận xét công khai
            </label>
          </div>

          {/* Medical disclaimer note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              Đánh giá trải nghiệm không phải là kết luận chính thức về năng lực chuyên môn hay chẩn đoán y khoa.
              Đánh giá của bạn sẽ được gửi đến ban kiểm duyệt của NovaCare trước khi hiển thị công khai.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl font-semibold text-xs border-slate-300"
            >
              Hủy
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || comment.trim().length < 10}
              className="bg-[#0c4b39] hover:bg-[#093a2c] text-white rounded-xl font-bold text-xs px-6 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Đang xử lý...
                </>
              ) : isEditing ? (
                'Lưu thay đổi'
              ) : (
                'Gửi đánh giá'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CriteriaRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-700 font-medium">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="p-0.5 focus:outline-none cursor-pointer"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                s <= value ? 'fill-amber-400 text-amber-500' : 'fill-slate-100 text-slate-300'
              }`}
            />
          </button>
        ))}
        <span className="font-bold text-slate-800 text-xs w-4 text-center ml-1">{value}</span>
      </div>
    </div>
  );
}
