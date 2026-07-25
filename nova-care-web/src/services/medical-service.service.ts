import { apiClient } from '@/lib/api-client';
import { MedicalService } from '@/types';

export const medicalServiceService = {
  async getAll(hospitalId?: string): Promise<MedicalService[]> {
    const url = hospitalId ? `/medical-services?hospitalId=${hospitalId}` : '/medical-services';
    const response = await apiClient.get<any>(url);
    return response.data;
  },

  async getById(id: string): Promise<MedicalService> {
    const response = await apiClient.get<any>(`/medical-services/${id}`);
    return response.data;
  },
};
