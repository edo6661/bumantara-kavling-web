import api from '../lib/axios';
import type {
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/models/notification';

export const notificationService = {
  getList: async (page = 1, limit = 20): Promise<NotificationListResponse> => {
    const response = await api.get('/notifications', { params: { page, limit } });
    return response.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    const data: UnreadCountResponse = response.data.data;
    return data.count;
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data;
  },

  markAllAsRead: async (): Promise<number> => {
    const response = await api.patch('/notifications/read-all');
    return response.data.data.count;
  },
};
