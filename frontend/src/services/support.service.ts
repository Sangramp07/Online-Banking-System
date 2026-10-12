import api from './api';
import { SupportTicket, SupportMessage } from '../types';

export const SupportService = {
  async getTickets(): Promise<SupportTicket[]> {
    const res = await api.get('/support/tickets');
    return res.data.data;
  },

  async getTicketById(id: string): Promise<SupportTicket> {
    const res = await api.get(`/support/tickets/${id}`);
    return res.data.data;
  },

  async createTicket(data: {
    subject: string;
    category: string;
    priority?: string;
    message: string;
  }): Promise<SupportTicket> {
    const res = await api.post('/support/tickets', data);
    return res.data.data;
  },

  async addMessage(ticketId: string, message: string): Promise<SupportMessage> {
    const res = await api.post(`/support/tickets/${ticketId}/messages`, { message });
    return res.data.data;
  },

  async submitContactEnquiry(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    const res = await api.post('/support/contact-enquiry', data);
    return res.data;
  },
};
