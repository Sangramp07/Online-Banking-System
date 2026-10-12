import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { SupportService } from '../services/support.service.js';
import {
  createTicketSchema,
  addMessageSchema,
  contactEnquirySchema,
} from '../validators/support.validator.js';
import { Role } from '@prisma/client';

export class SupportController {
  static async createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createTicketSchema.parse(req.body);
      const ticket = await SupportService.createTicket(
        req.user!.customerId!,
        req.user!.userId,
        validatedData
      );

      return res.status(201).json({
        success: true,
        message: 'Support ticket opened successfully.',
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tickets = await SupportService.getCustomerTickets(req.user!.customerId!);
      return res.status(200).json({ success: true, data: tickets });
    } catch (error) {
      next(error);
    }
  }

  static async getTicketById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customerId = req.user?.role === Role.ADMIN ? undefined : req.user?.customerId;
      const ticket = await SupportService.getTicketById(id, customerId);

      return res.status(200).json({ success: true, data: ticket });
    } catch (error) {
      next(error);
    }
  }

  static async addMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { message } = addMessageSchema.parse(req.body);
      const isAdmin = req.user?.role === Role.ADMIN;
      const customerId = isAdmin ? undefined : req.user?.customerId;

      const newMessage = await SupportService.addMessage(
        id,
        req.user!.userId,
        message,
        isAdmin,
        customerId
      );

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully.',
        data: newMessage,
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitContactEnquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = contactEnquirySchema.parse(req.body);
      const enquiry = await SupportService.submitContactEnquiry(validatedData);

      return res.status(201).json({
        success: true,
        message: 'Thank you! Your enquiry has been received and our team will contact you shortly.',
        data: enquiry,
      });
    } catch (error) {
      next(error);
    }
  }
}
