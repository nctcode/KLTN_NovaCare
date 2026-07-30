import { apiClient } from '@/lib/api-client';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  hospitalId?: string;
  doctorId?: string;
}

export const adminService = {
  // Dashboard & Analytics
  async getOverview(): Promise<any> {
    const response = await apiClient.get<any>('/admin/dashboard/overview');
    return response.data;
  },

  async getAppointmentsByDay(): Promise<any> {
    const response = await apiClient.get<any>('/admin/dashboard/appointments-by-day');
    return response.data;
  },

  async getRevenueByMonth(): Promise<any> {
    const response = await apiClient.get<any>('/admin/dashboard/revenue-by-month');
    return response.data;
  },

  async getTopDoctors(): Promise<any> {
    const response = await apiClient.get<any>('/admin/dashboard/top-doctors');
    return response.data;
  },

  async getTopHospitals(): Promise<any> {
    const response = await apiClient.get<any>('/admin/dashboard/top-hospitals');
    return response.data;
  },

  async getAuditLogs(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const response = await apiClient.get<any>(`/admin/dashboard/audit-logs?${query.toString()}`);
    return response.data;
  },

  // Users
  async getUsers(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);

    const response = await apiClient.get<any>(`/admin/users?${query.toString()}`);
    return response.data;
  },

  async getUserDetail(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/users/${id}`);
    return response.data;
  },

  async toggleUserStatus(id: string): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/users/${id}/status`);
    return response.data;
  },

  async updateUserRole(id: string, role: string): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  async getUserAppointments(id: string, params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const response = await apiClient.get<any>(`/admin/users/${id}/appointments?${query.toString()}`);
    return response.data;
  },

  // Appointments
  async getAppointments(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.hospitalId) query.append('hospitalId', params.hospitalId);
    if (params?.doctorId) query.append('doctorId', params.doctorId);

    const response = await apiClient.get<any>(`/admin/appointments?${query.toString()}`);
    return response.data;
  },

  async getAppointmentDetail(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/appointments/${id}`);
    return response.data;
  },

  async updateAppointmentStatus(id: string, status: string, note?: string): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/appointments/${id}/status`, { status, note });
    return response.data;
  },

  async cancelAppointment(id: string, reason: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/appointments/${id}`, { data: { reason } });
    return response.data;
  },

  // Payments
  async getPayments(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    const response = await apiClient.get<any>(`/admin/payments?${query.toString()}`);
    return response.data;
  },

  async refundPayment(id: string, reason: string): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/payments/${id}/refund`, { reason });
    return response.data;
  },

  // Doctors
  async getDoctors(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const response = await apiClient.get<any>(`/admin/doctors?${query.toString()}`);
    return response.data;
  },

  async createDoctor(data: any): Promise<any> {
    const response = await apiClient.post<any>('/admin/doctors', data);
    return response.data;
  },

  async updateDoctor(id: string, data: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/doctors/${id}`, data);
    return response.data;
  },

  async deleteDoctor(id: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/doctors/${id}`);
    return response.data;
  },

  // Hospitals
  async getHospitals(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const response = await apiClient.get<any>(`/admin/hospitals?${query.toString()}`);
    return response.data;
  },

  async createHospital(data: any): Promise<any> {
    const response = await apiClient.post<any>('/admin/hospitals', data);
    return response.data;
  },

  async updateHospital(id: string, data: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/hospitals/${id}`, data);
    return response.data;
  },

  async deleteHospital(id: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/hospitals/${id}`);
    return response.data;
  },

  // Health Packages
  async getHealthPackages(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const response = await apiClient.get<any>(`/admin/health-packages?${query.toString()}`);
    return response.data;
  },

  async createHealthPackage(data: any): Promise<any> {
    const response = await apiClient.post<any>('/admin/health-packages', data);
    return response.data;
  },

  async updateHealthPackage(id: string, data: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/health-packages/${id}`, data);
    return response.data;
  },

  async deleteHealthPackage(id: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/health-packages/${id}`);
    return response.data;
  },
};
