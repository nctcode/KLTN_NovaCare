import { apiClient } from '@/lib/api-client';

export const paymentService = {
  async createPayment(appointmentId: string): Promise<{ paymentUrl: string }> {
    const response = await apiClient.post<any>('/payments/create', { appointmentId });
    return response.data;
  },

  async getPaymentStatus(appointmentId: string): Promise<any> {
    const response = await apiClient.get<any>(`/payments/status/${appointmentId}`);
    return response.data;
  },
};
