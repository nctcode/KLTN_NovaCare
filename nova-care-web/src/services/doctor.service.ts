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
    return Array.isArray(response) ? response : (response?.data ?? []);
  },

  async getById(id: string): Promise<Doctor> {
    const response = await apiClient.get<any>(`/doctors/${id}`);
    return response.data;
  },

  async getAvailableSlots(doctorId: string, workplaceId: string, date: string, serviceId?: string) {
    try {
      const queryParams = new URLSearchParams({ doctorWorkplaceId: workplaceId, date });
      if (serviceId) queryParams.append('medicalServiceId', serviceId);
      const response = await apiClient.get<any>(`/booking/availability?${queryParams}`);
      if (response && response.options) {
        return response.options.map((opt: any) => ({
          id: opt.id,
          startTime: `${date}T${opt.startTime}:00+07:00`,
          endTime: `${date}T${opt.endTime}:00+07:00`,
          formattedTime: opt.formattedTime,
          isAvailable: opt.isAvailable,
          bookedCount: 0,
          capacity: opt.remainingCapacity,
        }));
      }
    } catch (e) {
      // fallback
    }

    const response = await apiClient.get<any>(
      `/doctors/${doctorId}/available-slots?workplaceId=${workplaceId}&date=${date}`
    );
    return response.data;
  },

  async getAvailabilityOptions(doctorWorkplaceId: string, date: string, medicalServiceId?: string) {
    const queryParams = new URLSearchParams({ doctorWorkplaceId, date });
    if (medicalServiceId) queryParams.append('medicalServiceId', medicalServiceId);
    const response = await apiClient.get<any>(`/booking/availability?${queryParams}`);
    return response;
  },

  async getWorkplace(id: string): Promise<DoctorWorkplace> {
    const response = await apiClient.get<any>(`/doctor-workplaces/${id}`);
    return response.data;
  },

  async createWorkplace(data: { doctorId: string; hospitalId: string; specialtyId: string; branchId?: string | null; consultationFee?: number; isPrimary?: boolean }) {
    const response = await apiClient.post<any>('/doctor-workplaces', data);
    return response.data || response;
  },

  async getWorkplaceSlots(workplaceId: string, date?: string) {
    const query = date ? `?date=${date}` : '';
    const response = await apiClient.get<any>(`/doctor-workplaces/${workplaceId}/slots${query}`);
    return response.data;
  },

  async getAvailableDates(doctorId: string, workplaceId: string, startDate: string, endDate: string) {
    const response = await apiClient.get<any>(
      `/doctors/${doctorId}/available-dates?workplaceId=${workplaceId}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data || response;
  },
};
