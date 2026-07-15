import { apiClient } from '@/lib/api-client';
import { PatientProfile, CreatePatientProfileDto, UpdatePatientProfileDto } from '@/types/profile.types';

export const profileService = {
  async getAll(): Promise<PatientProfile[]> {
    const response = await apiClient.get<any>('/patient-profiles');
    return response.data;
  },

  async getById(id: string): Promise<PatientProfile> {
    const response = await apiClient.get<any>(`/patient-profiles/${id}`);
    return response.data;
  },

  async create(data: CreatePatientProfileDto): Promise<PatientProfile> {
    const response = await apiClient.post<any>('/patient-profiles', data);
    return response.data;
  },

  async update(id: string, data: UpdatePatientProfileDto): Promise<PatientProfile> {
    const response = await apiClient.put<any>(`/patient-profiles/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/patient-profiles/${id}`);
  },

  async setDefault(id: string): Promise<PatientProfile> {
    const response = await apiClient.patch<any>(`/patient-profiles/${id}/default`);
    return response.data;
  },
};
