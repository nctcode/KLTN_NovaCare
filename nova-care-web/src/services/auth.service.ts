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

  requestRegistrationOtp(phone: string): Promise<any> {
    return apiClient.post('/auth/register/request-otp', { phone });
  },

  verifyRegistrationOtp(phone: string, otpCode: string): Promise<any> {
    return apiClient.post('/auth/register/verify-otp', { phone, otpCode });
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

  async forgotPassword(data: { phone?: string; email?: string } | string): Promise<{ message: string; maskedPhone?: string }> {
    const payload = typeof data === 'string' ? (data.includes('@') ? { email: data } : { phone: data }) : data;
    return apiClient.post('/auth/forgot-password', payload);
  },

  async verifyPasswordOtp(data: { phone?: string; email?: string; otpCode: string }): Promise<any> {
    return apiClient.post('/auth/forgot-password/verify-otp', data);
  },

  async resetPassword(data: { resetToken: string; newPassword: string }): Promise<{ message: string }> {
    return apiClient.post('/auth/reset-password', data);
  },

  async verifyActivationToken(token: string): Promise<any> {
    const res = await apiClient.get<any>(`/auth/verify-activation-token?token=${encodeURIComponent(token)}`);
    return res && res.data ? res.data : res;
  },

  async activateHospitalAccount(data: { token: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<any>('/auth/activate-hospital-account', data);
    return res && res.data ? res.data : res;
  },
};
