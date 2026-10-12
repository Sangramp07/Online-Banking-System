import api from './api';
import { Account, TransactionEntry } from '../types';

export const AccountService = {
  async getAccounts(): Promise<Account[]> {
    const res = await api.get('/accounts');
    return res.data.data;
  },

  async getAccountById(id: string): Promise<Account> {
    const res = await api.get(`/accounts/${id}`);
    return res.data.data;
  },

  async getAccountTransactions(
    accountId: string,
    params?: {
      page?: number;
      limit?: number;
      type?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    }
  ): Promise<{ data: TransactionEntry[]; meta: any }> {
    const res = await api.get(`/accounts/${accountId}/transactions`, { params });
    return res.data;
  },

  async getAllTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{ data: TransactionEntry[]; meta: any }> {
    const res = await api.get('/accounts/transactions/all', { params });
    return res.data;
  },

  async downloadStatement(
    accountId: string,
    format: 'pdf' | 'csv' = 'pdf',
    startDate?: string,
    endDate?: string
  ) {
    const response = await api.get(`/accounts/${accountId}/statement`, {
      params: { format, startDate, endDate },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'text/csv',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexbank-statement-${accountId}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
