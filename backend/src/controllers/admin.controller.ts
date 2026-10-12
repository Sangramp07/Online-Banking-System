import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { AdminService } from '../services/admin.service.js';
import { CustomerStatus, AccountStatus, TicketStatus, TransferStatus } from '@prisma/client';

export class AdminController {
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getDashboardMetrics();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status } = req.query;
      const result = await AdminService.getCustomers({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15,
        search: search as string,
        status: status as CustomerStatus,
      });

      return res.status(200).json({
        success: true,
        data: result.customers,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomerStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const updated = await AdminService.updateCustomerStatus(
        id,
        status as CustomerStatus,
        req.user!.userId,
        reason || 'Administrative status adjustment'
      );

      return res.status(200).json({
        success: true,
        message: `Customer status updated to ${status}.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status } = req.query;
      const result = await AdminService.getAccounts({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15,
        search: search as string,
        status: status as AccountStatus,
      });

      return res.status(200).json({
        success: true,
        data: result.accounts,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAccountStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const updated = await AdminService.updateAccountStatus(
        id,
        status as AccountStatus,
        req.user!.userId,
        reason || 'Administrative status adjustment'
      );

      return res.status(200).json({
        success: true,
        message: `Account status updated to ${status}.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTransfers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status } = req.query;
      const result = await AdminService.getTransfers({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15,
        search: search as string,
        status: status as TransferStatus,
      });

      return res.status(200).json({
        success: true,
        data: result.transfers,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, action, search } = req.query;
      const result = await AdminService.getAuditLogs({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        action: action as string,
        search: search as string,
      });

      return res.status(200).json({
        success: true,
        data: result.logs,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status } = req.query;
      const result = await AdminService.getAllTickets({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15,
        status: status as TicketStatus,
      });

      return res.status(200).json({
        success: true,
        data: result.tickets,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTicketStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await AdminService.updateTicketStatus(
        id,
        status as TicketStatus
      );

      return res.status(200).json({
        success: true,
        message: 'Ticket status updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type = 'transfers' } = req.query;
      const csv = await AdminService.generateReportCsv(
        type as 'transfers' | 'customers' | 'accounts'
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="nexbank-report-${type}-${Date.now()}.csv"`
      );
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
