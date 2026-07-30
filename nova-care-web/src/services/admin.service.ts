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

const extractData = (res: any) => {
  if (res && typeof res === 'object' && res.data !== undefined) {
    return res.data;
  }
  return res;
};

export const adminService = {
  // Dashboard & Analytics
  async getOverview(): Promise<any> {
    const response = await apiClient.get<any>('/admin/dashboard/overview');
    return extractData(response);
  },

  async getAppointmentsByDay(): Promise<any> {
    const response = await apiClient.get<any>('/admin/dashboard/appointments-by-day');
    return extractData(response);
  },

  async getRevenueByMonth(): Promise<any> {
    const response = await apiClient.get<any>('/admin/dashboard/revenue-by-month');
    return extractData(response);
  },

  async getTopDoctors(): Promise<any> {
    const response = await apiClient.get<any>('/admin/dashboard/top-doctors');
    return extractData(response);
  },

  async getTopHospitals(): Promise<any> {
    const response = await apiClient.get<any>('/admin/dashboard/top-hospitals');
    return extractData(response);
  },

  async getAuditLogs(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const response = await apiClient.get<any>(`/admin/dashboard/audit-logs?${query.toString()}`);
    return extractData(response);
  },

  // Users
  async getUsers(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);

    const response = await apiClient.get<any>(`/admin/users?${query.toString()}`);
    return extractData(response);
  },

  async getUserDetail(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/users/${id}`);
    return extractData(response);
  },

  async toggleUserStatus(id: string): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/users/${id}/status`);
    return extractData(response);
  },

  async updateUserRole(id: string, role: string): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/users/${id}/role`, { role });
    return extractData(response);
  },

  async getUserAppointments(id: string, params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const response = await apiClient.get<any>(`/admin/users/${id}/appointments?${query.toString()}`);
    return extractData(response);
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
    return extractData(response);
  },

  async getAppointmentDetail(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/appointments/${id}`);
    return extractData(response);
  },

  async updateAppointmentStatus(id: string, status: string, note?: string): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/appointments/${id}/status`, { status, note });
    return extractData(response);
  },

  async cancelAppointment(id: string, reason: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/appointments/${id}`, { data: { reason } });
    return extractData(response);
  },

  // Payments
  async getPayments(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    const response = await apiClient.get<any>(`/admin/payments?${query.toString()}`);
    return extractData(response);
  },

  async refundPayment(id: string, reason: string): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/payments/${id}/refund`, { reason });
    return extractData(response);
  },

  // Doctors
  async getDoctors(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const response = await apiClient.get<any>(`/admin/doctors?${query.toString()}`);
    return extractData(response);
  },

  async createDoctor(data: any): Promise<any> {
    const response = await apiClient.post<any>('/admin/doctors', data);
    return extractData(response);
  },

  async updateDoctor(id: string, data: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/doctors/${id}`, data);
    return extractData(response);
  },

  async deleteDoctor(id: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/doctors/${id}`);
    return extractData(response);
  },

  // Hospitals
  async getHospitals(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const response = await apiClient.get<any>(`/admin/hospitals?${query.toString()}`);
    return extractData(response);
  },

  async createHospital(data: any): Promise<any> {
    const response = await apiClient.post<any>('/admin/hospitals', data);
    return extractData(response);
  },

  async updateHospital(id: string, data: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/hospitals/${id}`, data);
    return extractData(response);
  },

  async deleteHospital(id: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/hospitals/${id}`);
    return extractData(response);
  },

  // Health Packages
  async getHealthPackages(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const response = await apiClient.get<any>(`/admin/health-packages?${query.toString()}`);
    return extractData(response);
  },

  async createHealthPackage(data: any): Promise<any> {
    const response = await apiClient.post<any>('/admin/health-packages', data);
    return extractData(response);
  },

  async updateHealthPackage(id: string, data: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/health-packages/${id}`, data);
    return extractData(response);
  },

  async deleteHealthPackage(id: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/health-packages/${id}`);
    return extractData(response);
  },
};
