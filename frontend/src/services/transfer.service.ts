import api from './api';
import { Transfer } from '../types';

export const TransferService = {
  async executeTransfer(data: {
    sourceAccountId: string;
    destinationAccountNumber: string;
    amount: number;
    description: string;
    idempotencyKey?: string;
  }) {
    const headers: Record<string, string> = {};
    if (data.idempotencyKey) {
      headers['Idempotency-Key'] = data.idempotencyKey;
    }
    const res = await api.post('/transfers', data, { headers });
    return res.data;
  },

  async getTransfers(params?: { page?: number; limit?: number; search?: string }): Promise<{
    data: Transfer[];
    meta: any;
  }> {
    const res = await api.get('/transfers', { params });
    return res.data;
  },

  async getTransferById(id: string): Promise<Transfer> {
    const res = await api.get(`/transfers/${id}`);
    return res.data.data;
  },
};
