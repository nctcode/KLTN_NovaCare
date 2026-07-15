import { apiClient } from '@/lib/api-client';
import { Specialty } from '@/types';

export const specialtyService = {
  async getAll(): Promise<Specialty[]> {
    const response = await apiClient.get<any>('/specialties');
    return response.data;
  },

  async getById(id: string): Promise<Specialty> {
    const response = await apiClient.get<any>(`/specialties/${id}`);
    return response.data;
  },
};
