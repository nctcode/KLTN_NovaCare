import { apiClient } from '@/lib/api-client';
import { LoginData, RegisterData, AuthResponse, User } from '@/types/auth.types';

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response;
  },

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    await apiClient.post(
      '/auth/logout',
      { refreshToken },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  },

  async logoutAll(accessToken: string): Promise<void> {
    await apiClient.post(
      '/auth/logout-all',
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  },

  async getProfile(accessToken: string): Promise<User> {
    const response = await apiClient.get<any>('/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  },
};
