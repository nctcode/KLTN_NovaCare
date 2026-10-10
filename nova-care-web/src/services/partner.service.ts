import { apiClient } from '@/lib/api-client';

const extractData = (res: any) => {
  if (res && typeof res === 'object' && res.data !== undefined) {
    return res.data;
  }
  return res;
};

export interface PartnerRequestParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
}

export interface CreatePartnerRequestInput {
  type?: 'HOSPITAL' | 'DOCTOR';
  contactName: string;
  titleOrRole?: string;
  phone: string;
  email: string;
  hospitalName: string;
  specialty?: string;
  notes?: string;
}

export interface ApprovePartnerInput {
  adminEmail?: string;
  adminFullName?: string;
  hospitalName?: string;
  adminNote?: string;
}

export const partnerService = {
  /**
   * Public: Gửi đơn đăng ký hợp tác
   */
  async submitRequest(data: CreatePartnerRequestInput): Promise<any> {
    const response = await apiClient.post<any>('/partner-requests', data);
    return extractData(response);
  },

  /**
   * Admin: Lấy danh sách đơn đăng ký hợp tác
   */
  async getRequests(params?: PartnerRequestParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.type && params.type !== 'ALL') query.append('type', params.type);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);

    const response = await apiClient.get<any>(`/admin/partner-requests?${query.toString()}`);
    return extractData(response);
  },

  /**
   * Admin: Xem chi tiết đơn đăng ký
   */
  async getRequestDetail(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/partner-requests/${id}`);
    return extractData(response);
  },

  /**
   * Admin: Cập nhật trạng thái trao đổi (CONTACTED, REJECTED)
   */
  async updateStatus(
    id: string,
    data: { status: string; adminNote?: string }
  ): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/partner-requests/${id}/status`, data);
    return extractData(response);
  },

  /**
   * Admin: Phê duyệt hợp tác, tạo Bệnh viện & Quản trị viên, gửi email kích hoạt
   */
  async approveRequest(id: string, data: ApprovePartnerInput): Promise<any> {
    const response = await apiClient.post<any>(`/admin/partner-requests/${id}/approve`, data);
    return extractData(response);
  },
};
