import { apiClient } from '@/lib/api-client';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  type?: string;
  city?: string;
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
  async getAppointmentStats(): Promise<any> {
    const response = await apiClient.get<any>('/admin/appointments/stats');
    return extractData(response);
  },

  async getAppointments(params?: PaginationParams & {
    branchId?: string;
    specialtyId?: string;
    medicalServiceId?: string;
    date?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.hospitalId) query.append('hospitalId', params.hospitalId);
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.doctorId) query.append('doctorId', params.doctorId);
    if (params?.specialtyId) query.append('specialtyId', params.specialtyId);
    if (params?.medicalServiceId) query.append('medicalServiceId', params.medicalServiceId);
    if (params?.date) query.append('date', params.date);

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

  // Doctor Schedules (Lịch làm việc bác sĩ)
  async getDoctorSchedules(params?: {
    search?: string;
    hospitalId?: string;
    branchId?: string;
    specialtyId?: string;
    doctorId?: string;
    isActive?: string;
    dayOfWeek?: number;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.hospitalId) query.append('hospitalId', params.hospitalId);
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.specialtyId) query.append('specialtyId', params.specialtyId);
    if (params?.doctorId) query.append('doctorId', params.doctorId);
    if (params?.isActive !== undefined && params?.isActive !== '') query.append('isActive', params.isActive);
    if (params?.dayOfWeek !== undefined) query.append('dayOfWeek', params.dayOfWeek.toString());

    const response = await apiClient.get<any>(`/doctor-schedules?${query.toString()}`);
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
  async getDoctors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    externalId?: string;
    hospitalId?: string;
    specialtyId?: string;
    isActive?: string;
    gender?: string;
    source?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.externalId) query.append('externalId', params.externalId);
    if (params?.hospitalId) query.append('hospitalId', params.hospitalId);
    if (params?.specialtyId) query.append('specialtyId', params.specialtyId);
    if (params?.isActive !== undefined && params?.isActive !== '') query.append('isActive', params.isActive);
    if (params?.gender) query.append('gender', params.gender);
    if (params?.source) query.append('source', params.source);

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

  async getDoctorDetail(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/doctors/${id}`);
    return extractData(response);
  },

  async createDoctorWorkplace(doctorId: string, data: any): Promise<any> {
    const response = await apiClient.post<any>(`/admin/doctors/${doctorId}/workplaces`, data);
    return extractData(response);
  },

  async updateDoctorWorkplace(workplaceId: string, data: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/doctors/workplaces/${workplaceId}`, data);
    return extractData(response);
  },

  async deleteDoctorWorkplace(workplaceId: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/doctors/workplaces/${workplaceId}`);
    return extractData(response);
  },

  async createDoctorSchedule(workplaceId: string, data: any): Promise<any> {
    const response = await apiClient.post<any>(`/admin/doctors/workplaces/${workplaceId}/schedules`, data);
    return extractData(response);
  },

  async updateDoctorSchedule(scheduleId: string, data: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/doctors/schedules/${scheduleId}`, data);
    return extractData(response);
  },

  async deleteDoctorSchedule(scheduleId: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/doctors/schedules/${scheduleId}`);
    return extractData(response);
  },

  // Hospitals
  async getHospitals(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    if (params?.city) query.append('city', params.city);
    if (params?.status) query.append('status', params.status);

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
  async getHealthPackages(params?: {
    page?: number;
    limit?: number;
    search?: string;
    hospitalId?: string;
    specialtyId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.hospitalId) query.append('hospitalId', params.hospitalId);
    if (params?.specialtyId) query.append('specialtyId', params.specialtyId);
    if (params?.status) query.append('status', params.status);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<any>(`/admin/health-packages?${query.toString()}`);
    return extractData(response);
  },

  async getHealthPackageDetail(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/health-packages/${id}`);
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

  async toggleHealthPackageStatus(id: string, isActive: boolean): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/health-packages/${id}/status`, { isActive });
    return extractData(response);
  },

  async deleteHealthPackage(id: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/health-packages/${id}`);
    return extractData(response);
  },

  // Medical Services (Dịch vụ Y tế lẻ)
  async getMedicalServices(params?: {
    page?: number;
    limit?: number;
    search?: string;
    hospitalId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.hospitalId) query.append('hospitalId', params.hospitalId);
    if (params?.status) query.append('status', params.status);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<any>(`/admin/medical-services?${query.toString()}`);
    return extractData(response);
  },

  async getMedicalServiceDetail(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/medical-services/${id}`);
    return extractData(response);
  },

  async createMedicalService(data: any): Promise<any> {
    const response = await apiClient.post<any>('/admin/medical-services', data);
    return extractData(response);
  },

  async updateMedicalService(id: string, data: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/medical-services/${id}`, data);
    return extractData(response);
  },

  async toggleMedicalServiceStatus(id: string, isActive: boolean): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/medical-services/${id}/toggle-status`, { isActive });
    return extractData(response);
  },

  async deleteMedicalService(id: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/medical-services/${id}`);
    return extractData(response);
  },

  // Specialties
  async getSpecialties(params?: PaginationParams): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    const response = await apiClient.get<any>(`/admin/specialties?${query.toString()}`);
    return extractData(response);
  },

  async getSpecialtyDetail(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/specialties/${id}`);
    return extractData(response);
  },

  async createSpecialty(data: any): Promise<any> {
    const response = await apiClient.post<any>('/admin/specialties', data);
    return extractData(response);
  },

  async updateSpecialty(id: string, data: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/specialties/${id}`, data);
    return extractData(response);
  },

  async toggleSpecialtyStatus(id: string, isActive: boolean): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/specialties/${id}/status`, { isActive });
    return extractData(response);
  },

  async deleteSpecialty(id: string): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/specialties/${id}`);
    return extractData(response);
  },
};
