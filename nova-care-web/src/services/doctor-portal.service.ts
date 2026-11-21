import { apiClient } from '@/lib/api-client';
import {
  DoctorAppointmentView,
  DoctorDashboardView,
  DoctorProfileView,
  DoctorScheduleView,
  DoctorSlotView,
  DoctorWorkplaceView,
} from '@/types/doctor-portal.types';

const dataOf = <T>(response: any): T => response?.data !== undefined ? response.data : response;

export const doctorPortalService = {
  async getDashboard(): Promise<DoctorDashboardView> {
    return dataOf(await apiClient.get('/doctor-portal/dashboard'));
  },
  async getProfile(): Promise<DoctorProfileView> {
    return dataOf(await apiClient.get('/doctor-portal/me'));
  },
  async updateProfile(payload: { fullName?: string; avatarUrl?: string; bio?: string }): Promise<DoctorProfileView> {
    return dataOf(await apiClient.patch('/doctor-portal/me', payload));
  },
  async getSchedules(startDate: string, endDate: string): Promise<{
    startDate: string;
    endDate: string;
    workplaces: DoctorWorkplaceView[];
    recurringSchedules: DoctorScheduleView[];
    slots: DoctorSlotView[];
  }> {
    const params = new URLSearchParams({ startDate, endDate });
    return dataOf(await apiClient.get(`/doctor-portal/schedules?${params}`));
  },
  async getAppointments(params: {
    startDate: string;
    endDate: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: DoctorAppointmentView[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams({ startDate: params.startDate, endDate: params.endDate });
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return dataOf(await apiClient.get(`/doctor-portal/appointments?${query}`));
  },
  async getAppointment(id: string): Promise<DoctorAppointmentView> {
    return dataOf(await apiClient.get(`/doctor-portal/appointments/${id}`));
  },
};
