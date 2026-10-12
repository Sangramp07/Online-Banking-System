import api from './api';
import { Customer, Account, Transfer, SupportTicket, AuditLog, DashboardMetrics } from '../types';

export const AdminService = {
  async getDashboard(): Promise<DashboardMetrics> {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },

  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ data: Customer[]; meta: any }> {
    const res = await api.get('/admin/customers', { params });
    return res.data;
  },

  async updateCustomerStatus(id: string, status: string, reason: string) {
    const res = await api.patch(`/admin/customers/${id}/status`, { status, reason });
    return res.data;
  },

  async getAccounts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ data: Account[]; meta: any }> {
    const res = await api.get('/admin/accounts', { params });
    return res.data;
  },

  async updateAccountStatus(id: string, status: string, reason: string) {
    const res = await api.patch(`/admin/accounts/${id}/status`, { status, reason });
    return res.data;
  },

  async getTransfers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ data: Transfer[]; meta: any }> {
    const res = await api.get('/admin/transfers', { params });
    return res.data;
  },

  async reverseTransfer(transferId: string, reason: string) {
    const res = await api.post(`/transfers/${transferId}/reverse`, { reason });
    return res.data;
  },

  async getTickets(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: SupportTicket[]; meta: any }> {
    const res = await api.get('/admin/tickets', { params });
    return res.data;
  },

  async updateTicketStatus(id: string, status: string) {
    const res = await api.patch(`/admin/tickets/${id}/status`, { status });
    return res.data;
  },

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    search?: string;
  }): Promise<{ data: AuditLog[]; meta: any }> {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },

  async exportReport(type: 'transfers' | 'customers' | 'accounts') {
    const response = await api.get('/admin/reports', {
      params: { type },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexbank-${type}-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
