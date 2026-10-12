import api from './api';
import { Beneficiary } from '../types';

export const BeneficiaryService = {
  async getBeneficiaries(): Promise<Beneficiary[]> {
    const res = await api.get('/beneficiaries');
    return res.data.data;
  },

  async addBeneficiary(data: {
    name: string;
    accountNumber: string;
    bankName?: string;
    routingNumber?: string;
    nickname?: string;
  }): Promise<Beneficiary> {
    const res = await api.post('/beneficiaries', data);
    return res.data.data;
  },

  async updateBeneficiary(id: string, data: { name?: string; nickname?: string }) {
    const res = await api.patch(`/beneficiaries/${id}`, data);
    return res.data.data;
  },

  async deleteBeneficiary(id: string) {
    const res = await api.delete(`/beneficiaries/${id}`);
    return res.data;
  },
};
