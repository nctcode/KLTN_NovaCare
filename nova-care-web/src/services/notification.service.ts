import { apiClient } from '@/lib/api-client';
import { Notification } from '@/types/notification.types';

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    try {
      const response = await apiClient.get<any>('/notifications');
      return response.data || [];
    } catch {
      return [];
    }
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.patch<any>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<any>('/notifications/unread-count');
      return response.data || 0;
    } catch {
      return 0;
    }
  },
};
