import api from './api';
import { Account, Notification } from '../types';

export const CustomerService = {
  async getMyAccounts(): Promise<Account[]> {
    const res = await api.get('/customers/me/accounts');
    return res.data.data;
  },

  async updateProfile(data: { fullName?: string; mobileNumber?: string; address?: string }) {
    const res = await api.patch('/customers/me', data);
    return res.data;
  },

  async getMyNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const res = await api.get('/customers/me/notifications');
    return res.data.data;
  },

  async markNotificationRead(id: string) {
    const res = await api.patch(`/customers/me/notifications/${id}/read`);
    return res.data;
  },

  async markAllNotificationsRead() {
    const res = await api.post('/customers/me/notifications/read-all');
    return res.data;
  },
};
