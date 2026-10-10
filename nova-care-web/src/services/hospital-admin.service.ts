import { apiClient } from '@/lib/api-client';

const extractData = (res: any) => {
  if (res && typeof res === 'object' && res.data !== undefined) {
    return res.data;
  }
  return res;
};

export interface HospitalPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  specialtyId?: string;
}

export const hospitalAdminService = {
  /**
   * 1. Thống kê tổng quan viện
   */
  async getDashboard(): Promise<any> {
    const response = await apiClient.get<any>('/hospital-admin/dashboard');
    return extractData(response);
  },

  /**
   * 2. Xem thông tin cơ sở y tế của tôi
   */
  async getMyHospital(): Promise<any> {
    const response = await apiClient.get<any>('/hospital-admin/my-hospital');
    return extractData(response);
  },

  /**
   * 3. Cập nhật thông tin cơ sở y tế của tôi
   */
  async updateMyHospital(data: any): Promise<any> {
    const response = await apiClient.put<any>('/hospital-admin/my-hospital', data);
    return extractData(response);
  },

  /**
   * 4. Danh sách bác sĩ thuộc bệnh viện
   */
  async getDoctors(params?: HospitalPaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.specialtyId) query.append('specialtyId', params.specialtyId);

    const response = await apiClient.get<any>(`/hospital-admin/doctors?${query.toString()}`);
    return extractData(response);
  },

  /**
   * 5. Cập nhật thông tin bác sĩ tại viện (giá khám / trạng thái)
   */
  async updateDoctorWorkplace(
    workplaceId: string,
    data: { consultationFee?: number; isActive?: boolean; specialtyId?: string }
  ): Promise<any> {
    const response = await apiClient.patch<any>(
      `/hospital-admin/doctors/${workplaceId}`,
      data
    );
    return extractData(response);
  },

  /**
   * 6. Danh sách lịch hẹn thuộc bệnh viện
   */
  async getAppointments(params?: HospitalPaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    const response = await apiClient.get<any>(`/hospital-admin/appointments?${query.toString()}`);
    return extractData(response);
  },

  /**
   * 7. Cập nhật trạng thái lịch hẹn
   */
  async updateAppointmentStatus(
    id: string,
    status: string,
    note?: string
  ): Promise<any> {
    const response = await apiClient.patch<any>(
      `/hospital-admin/appointments/${id}/status`,
      { status, note }
    );
    return extractData(response);
  },

  /**
   * 8. Danh mục chuyên khoa viện cung cấp
   */
  async getSpecialties(): Promise<any> {
    const response = await apiClient.get<any>('/hospital-admin/specialties');
    return extractData(response);
  },

  /**
   * 9. Lịch trực bác sĩ trong bệnh viện
   */
  async getSchedules(): Promise<any> {
    const response = await apiClient.get<any>('/hospital-admin/schedules');
    return extractData(response);
  },

  /**
   * 10. Danh mục dịch vụ y tế của viện
   */
  async getServices(params?: HospitalPaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.specialtyId) query.append('specialtyId', params.specialtyId);

    const response = await apiClient.get<any>(`/hospital-admin/services?${query.toString()}`);
    return extractData(response);
  },

  /**
   * 11. Cập nhật dịch vụ y tế
   */
  async updateService(
    id: string,
    data: { price?: number; isActive?: boolean }
  ): Promise<any> {
    const response = await apiClient.patch<any>(
      `/hospital-admin/services/${id}`,
      data
    );
    return extractData(response);
  },

  /**
   * 12. Kiểm tra bắt tay (Handshake) với HIS của bệnh viện
   */
  async testHandshake(data: { endpointUrl?: string; authType?: string; authToken?: string } | string): Promise<any> {
    const payload = typeof data === 'string' ? { endpointUrl: data } : data;
    const response = await apiClient.post<any>(
      '/hospital-admin/integration/test-handshake',
      payload
    );
    return extractData(response);
  },

  /**
   * 13. Đồng bộ Catalog từ HIS vào Bệnh viện
   */
  async syncCatalog(data: {
    endpointUrl?: string;
    authType?: string;
    authToken?: string;
    specialtyMappings?: Record<string, string>;
    selectedDoctorIds?: string[];
  }): Promise<any> {
    const response = await apiClient.post<any>(
      '/hospital-admin/integration/sync-catalog',
      data
    );
    return extractData(response);
  },

  /**
   * 14. Lấy trạng thái tích hợp HIS hiện tại
   */
  async getIntegrationStatus(): Promise<any> {
    const response = await apiClient.get<any>(
      '/hospital-admin/integration/status'
    );
    return extractData(response);
  },
};
