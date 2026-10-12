import api from './api';
import { User } from '../types';

export const AuthService = {
  async register(data: any) {
    const res = await api.post('/auth/register', data);
    if (res.data.data?.accessToken) {
      localStorage.setItem('nexbank_access_token', res.data.data.accessToken);
    }
    return res.data;
  },

  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.data?.accessToken) {
      localStorage.setItem('nexbank_access_token', res.data.data.accessToken);
    }
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('nexbank_access_token');
    }
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string, confirmNewPassword: string) {
    const res = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, password: string, confirmPassword: string) {
    const res = await api.post('/auth/reset-password', {
      token,
      password,
      confirmPassword,
    });
    return res.data;
  },
};
