import { apiClient } from '@/lib/api-client';
import { Hospital, Doctor, Specialty } from '@/types';

export const homeService = {
  async getFeaturedSpecialties(): Promise<Specialty[]> {
    const response = await apiClient.get<any>('/specialties');
    return response.data.slice(0, 8);
  },

  async getFeaturedDoctors(): Promise<Doctor[]> {
    const response = await apiClient.get<any>('/doctors');
    return response.data.slice(0, 6);
  },

  async getFeaturedHospitals(): Promise<Hospital[]> {
    const response = await apiClient.get<any>('/hospitals');
    return response.data.slice(0, 4);
  },
};
