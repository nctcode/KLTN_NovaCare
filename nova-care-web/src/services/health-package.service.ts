import { apiClient } from '@/lib/api-client';
import { HealthPackage } from '@/types';

export const healthPackageService = {
  async getAll(hospitalId?: string): Promise<HealthPackage[]> {
    const url = hospitalId ? `/health-packages?hospitalId=${hospitalId}` : '/health-packages';
    const response = await apiClient.get<any>(url);
    return response.data;
  },

  async getById(id: string): Promise<HealthPackage> {
    const response = await apiClient.get<any>(`/health-packages/${id}`);
    return response.data;
  },
};
