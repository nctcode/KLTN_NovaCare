import { apiClient } from '@/lib/api-client';

export interface CreateShareDto {
  allowedSections: string[];
  validDays?: number;
  sharedWith?: string;
}

export const passportService = {
  async getMyPassport(): Promise<any> {
    const response = await apiClient.get<any>('/passport');
    return response.data;
  },

  async createShare(dto: CreateShareDto): Promise<any> {
    const response = await apiClient.post<any>('/passport/share', dto);
    return response.data;
  },

  async getMyShares(): Promise<any> {
    const response = await apiClient.get<any>('/passport/shares');
    return response.data;
  },

  async revokeShare(id: string): Promise<any> {
    const response = await apiClient.patch<any>(`/passport/share/${id}/revoke`);
    return response.data;
  },

  async accessSharedPassport(token: string, pin?: string): Promise<any> {
    const response = await apiClient.get<any>(`/passport/share/${token}${pin ? `?pin=${pin}` : ''}`);
    return response.data;
  },
};
