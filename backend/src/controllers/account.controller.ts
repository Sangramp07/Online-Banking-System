import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { AccountService } from '../services/account.service.js';
import { StatementService } from '../services/statement.service.js';
import { Role } from '@prisma/client';

export class AccountController {
  static async getAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.customerId;
      const accounts = await AccountService.getCustomerAccounts(customerId!);
      return res.status(200).json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  }

  static async getAccountById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customerId = req.user?.role === Role.ADMIN ? undefined : req.user?.customerId;
      const account = await AccountService.getAccountById(id, customerId);
      return res.status(200).json({ success: true, data: account });
    } catch (error) {
      next(error);
    }
  }

  static async getAccountTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customerId = req.user?.role === Role.ADMIN ? null : req.user?.customerId || null;
      const { page, limit, type, startDate, endDate, search } = req.query;

      const result = await AccountService.getAccountTransactions(id, customerId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15,
        type: type as any,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
      });

      return res.status(200).json({
        success: true,
        data: result.entries,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllCustomerTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.customerId!;
      const { page, limit, type, startDate, endDate, search } = req.query;

      const result = await AccountService.getAllCustomerTransactions(customerId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15,
        type: type as any,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
      });

      return res.status(200).json({
        success: true,
        data: result.entries,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async downloadStatement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { format = 'pdf', startDate, endDate } = req.query;
      const customerId = req.user?.role === Role.ADMIN ? null : req.user?.customerId || null;

      if (format === 'csv') {
        const csv = await StatementService.generateCsv(
          id,
          customerId,
          startDate as string,
          endDate as string
        );
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="statement-${id}.csv"`);
        return res.status(200).send(csv);
      }

      const pdfBuffer = await StatementService.generatePdf(
        id,
        customerId,
        startDate as string,
        endDate as string
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="statement-${id}.pdf"`);
      return res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}
