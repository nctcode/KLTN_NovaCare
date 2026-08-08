import { apiClient } from '@/lib/api-client';
import { Doctor, DoctorSearchParams, DoctorWorkplace } from '@/types';

export const doctorService = {
  async search(params: DoctorSearchParams): Promise<Doctor[]> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.specialtyId && params.specialtyId !== 'all') queryParams.append('specialtyId', params.specialtyId);
    if (params.hospitalId && params.hospitalId !== 'all') queryParams.append('hospitalId', params.hospitalId);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const response = await apiClient.get<any>(`/doctors?${queryParams}`);
    return response.data;
  },

  async getById(id: string): Promise<Doctor> {
    const response = await apiClient.get<any>(`/doctors/${id}`);
    return response.data;
  },

  async getAvailableSlots(doctorId: string, workplaceId: string, date: string) {
    const response = await apiClient.get<any>(
      `/doctors/${doctorId}/available-slots?workplaceId=${workplaceId}&date=${date}`
    );
    return response.data;
  },

  async getWorkplace(id: string): Promise<DoctorWorkplace> {
    const response = await apiClient.get<any>(`/doctor-workplaces/${id}`);
    return response.data;
  },

  async createWorkplace(data: { doctorId: string; hospitalId: string; specialtyId: string; branchId?: string | null; consultationFee?: number; isPrimary?: boolean }) {
    const response = await apiClient.post<any>('/doctor-workplaces', data);
    return response.data || response;
  },
};
