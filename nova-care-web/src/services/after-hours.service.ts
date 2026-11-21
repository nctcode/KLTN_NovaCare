import { apiClient } from '@/lib/api-client';

export const afterHoursService = {
  async getCatalog(hospitalId: string): Promise<any[]> {
    const response = await apiClient.get<any>(`/clinic-rooms/catalog?hospitalId=${encodeURIComponent(hospitalId)}&mode=AFTER_HOURS`);
    return response.data || [];
  },
};
