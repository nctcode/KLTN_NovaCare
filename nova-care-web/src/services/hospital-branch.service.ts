import { apiClient } from '@/lib/api-client';
import { HospitalBranch } from '@/types';

export const hospitalBranchService = {
  async getAll(hospitalId?: string): Promise<HospitalBranch[]> {
    const url = hospitalId ? `/hospital-branches/hospital/${hospitalId}` : '/hospital-branches';
    const response = await apiClient.get<any>(url);
    return response.data;
  },

  async getById(id: string): Promise<HospitalBranch> {
    const response = await apiClient.get<any>(`/hospital-branches/${id}`);
    return response.data;
  },
};
