import { apiClient } from '@/lib/api-client';
import { Hospital } from '@/types';

export const hospitalService = {
  async getAll(): Promise<Hospital[]> {
    const response = await apiClient.get<any>('/hospitals');
    return response.data;
  },

  async getById(id: string): Promise<Hospital> {
    const response = await apiClient.get<any>(`/hospitals/${id}`);
    return response.data;
  },

  async getDoctorsBySpecialty(hospitalId: string, specialtyId: string): Promise<any[]> {
    const response = await apiClient.get<any>(`/hospitals/${hospitalId}/specialties/${specialtyId}/doctors`);
    return response.data;
  },
};
