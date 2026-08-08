import { apiClient } from '@/lib/api-client';
import { MedicalService } from '@/types';

export const medicalServiceService = {
  async getAll(hospitalId?: string, specialtyId?: string): Promise<MedicalService[]> {
    const params = new URLSearchParams();
    if (hospitalId) params.append('hospitalId', hospitalId);
    if (specialtyId) params.append('specialtyId', specialtyId);
    const queryString = params.toString();
    const url = queryString ? `/medical-services?${queryString}` : '/medical-services';
    const response = await apiClient.get<any>(url);
    return response.data;
  },

  async getById(id: string): Promise<MedicalService> {
    const response = await apiClient.get<any>(`/medical-services/${id}`);
    return response.data;
  },
};
