import { apiClient } from '@/lib/api-client';
import {
  CreateReviewInput,
  CreateReviewReportInput,
  CreateReviewResponseInput,
  ModerateReviewInput,
  ReviewEligibility,
  ReviewItem,
  ReviewStats,
  ReviewTargetType,
  UpdateReviewInput,
} from '@/types/review.types';

export const reviewService = {
  // 1. Kiểm tra điều kiện đánh giá của lượt khám
  async getEligibility(appointmentId: string): Promise<ReviewEligibility> {
    const res = await apiClient.get<any>(`/reviews/eligibility/${appointmentId}`);
    return res.data?.data || res.data;
  },

  // 2. Tạo đánh giá mới cho Bác sĩ hoặc Bệnh viện
  async createReview(data: CreateReviewInput): Promise<ReviewItem> {
    const res = await apiClient.post<any>('/reviews', data);
    return res.data?.data || res.data;
  },

  // 3. Sửa đánh giá trong thời hạn 48 giờ
  async updateReview(id: string, data: UpdateReviewInput): Promise<ReviewItem> {
    const res = await apiClient.put<any>(`/reviews/${id}`, data);
    return res.data?.data || res.data;
  },

  // 4. Lấy danh sách đánh giá của chính bệnh nhân
  async getMyReviews(params?: {
    page?: number;
    limit?: number;
    status?: string;
    targetType?: string;
  }): Promise<{ items: ReviewItem[]; total: number; totalPages: number }> {
    const res = await apiClient.get<any>('/reviews/my-reviews', { params });
    return res.data?.data || res.data;
  },

  // 5. Lấy danh sách đánh giá công khai của Bác sĩ
  async getPublicDoctorReviews(
    doctorId: string,
    params?: { page?: number; limit?: number; rating?: number; sortBy?: string },
  ): Promise<{ items: ReviewItem[]; total: number; totalPages: number }> {
    const res = await apiClient.get<any>(`/reviews/public/doctor/${doctorId}`, { params });
    return res.data?.data || res.data;
  },

  // 6. Lấy danh sách đánh giá công khai của Cơ sở y tế
  async getPublicHospitalReviews(
    hospitalId: string,
    params?: { page?: number; limit?: number; rating?: number; sortBy?: string },
  ): Promise<{ items: ReviewItem[]; total: number; totalPages: number }> {
    const res = await apiClient.get<any>(`/reviews/public/hospital/${hospitalId}`, { params });
    return res.data?.data || res.data;
  },

  // 7. Lấy thống kê điểm số và phân bố sao công khai
  async getPublicStats(targetType: ReviewTargetType, targetId: string): Promise<ReviewStats> {
    const res = await apiClient.get<any>('/reviews/public/stats', {
      params: { targetType, targetId },
    });
    return res.data?.data || res.data;
  },

  // 8. Bác sĩ hoặc Cơ sở y tế phản hồi đánh giá
  async createResponse(reviewId: string, data: CreateReviewResponseInput): Promise<any> {
    const res = await apiClient.post<any>(`/reviews/${reviewId}/responses`, data);
    return res.data?.data || res.data;
  },

  // 9. Báo cáo vi phạm đánh giá
  async reportReview(reviewId: string, data: CreateReviewReportInput): Promise<any> {
    const res = await apiClient.post<any>(`/reviews/${reviewId}/report`, data);
    return res.data?.data || res.data;
  },

  // 10. Quản trị viên lấy danh sách kiểm duyệt
  async adminGetReviews(params?: {
    page?: number;
    limit?: number;
    status?: string;
    targetType?: string;
    targetId?: string;
    rating?: number;
    q?: string;
  }): Promise<{ items: ReviewItem[]; total: number; totalPages: number }> {
    const res = await apiClient.get<any>('/reviews/admin', { params });
    return res.data?.data || res.data;
  },

  // 11. Quản trị viên duyệt, từ chối, ẩn đánh giá
  async adminModerateReview(id: string, data: ModerateReviewInput): Promise<ReviewItem> {
    const res = await apiClient.patch<any>(`/reviews/admin/${id}/moderate`, data);
    return res.data?.data || res.data;
  },

  // 12. Quản trị viên xem danh sách báo cáo vi phạm
  async adminGetReports(params?: { page?: number; limit?: number; isResolved?: boolean }): Promise<{
    items: any[];
    total: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<any>('/reviews/admin/reports', { params });
    return res.data?.data || res.data;
  },

  // 13. Quản trị viên xử lý báo cáo vi phạm
  async adminResolveReport(reportId: string): Promise<any> {
    const res = await apiClient.patch<any>(`/reviews/admin/reports/${reportId}/resolve`);
    return res.data?.data || res.data;
  },
};
