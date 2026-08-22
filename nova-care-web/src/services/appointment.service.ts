import { apiClient } from '@/lib/api-client';
import { Appointment, CreateAppointmentDto, CancelAppointmentDto } from '@/types/appointment.types';

export const appointmentService = {
  async create(data: CreateAppointmentDto): Promise<Appointment> {
    const response = await apiClient.post<any>('/appointments', data);
    return response.data;
  },

  async getAll(): Promise<Appointment[]> {
    const response = await apiClient.get<any>('/appointments/me');
    return response.data;
  },

  async getUpcoming(): Promise<Appointment[]> {
    const response = await apiClient.get<any>('/appointments/upcoming');
    return response.data;
  },

  async getHistory(): Promise<Appointment[]> {
    const response = await apiClient.get<any>('/appointments/history');
    return response.data;
  },

  async getById(id: string): Promise<Appointment> {
    const response = await apiClient.get<any>(`/appointments/${id}`);
    return response.data;
  },

  async cancel(id: string, data?: CancelAppointmentDto): Promise<Appointment> {
    const response = await apiClient.patch<any>(`/appointments/${id}/cancel`, data || {});
    return response.data;
  },

  async reschedule(id: string, newSlotId: string): Promise<Appointment> {
    const response = await apiClient.patch<any>(`/appointments/${id}/reschedule`, { newSlotId });
    return response.data;
  },

  async complete(id: string): Promise<Appointment> {
    const response = await apiClient.patch<any>(`/appointments/${id}/complete`);
    return response.data;
  },

  async mockFulfill(id: string): Promise<any> {
    const response = await apiClient.post<any>(`/appointments/${id}/mock-fulfill`);
    return response.data;
  },
};
