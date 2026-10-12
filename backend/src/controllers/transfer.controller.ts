import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { TransferService } from '../services/transfer.service.js';
import { createTransferSchema, reversalRequestSchema } from '../validators/transfer.validator.js';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';
import { Role } from '@prisma/client';

export class TransferController {
  static async createTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createTransferSchema.parse(req.body);
      const idempotencyKey =
        (req.headers['idempotency-key'] as string) || validatedData.idempotencyKey;

      const result = await TransferService.executeTransfer({
        customerId: req.user!.customerId!,
        userId: req.user!.userId,
        sourceAccountId: validatedData.sourceAccountId,
        destinationAccountNumber: validatedData.destinationAccountNumber,
        amount: validatedData.amount,
        description: validatedData.description,
        idempotencyKey,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getTransfers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.customerId!;
      const { page = '1', limit = '15', search } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Find all customer account IDs
      const accounts = await prisma.account.findMany({
        where: { customerId },
        select: { id: true },
      });
      const accountIds = accounts.map((a) => a.id);

      const whereClause: any = {
        OR: [
          { sourceAccountId: { in: accountIds } },
          { destinationAccountId: { in: accountIds } },
        ],
      };

      if (search) {
        whereClause.AND = [
          {
            OR: [
              { reference: { contains: search as string } },
              { description: { contains: search as string } },
            ],
          },
        ];
      }

      const [transfers, total] = await Promise.all([
        prisma.transfer.findMany({
          where: whereClause,
          include: {
            sourceAccount: { select: { accountNumber: true } },
            destinationAccount: {
              select: {
                accountNumber: true,
                customer: { select: { fullName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.transfer.count({ where: whereClause }),
      ]);

      return res.status(200).json({
        success: true,
        data: transfers,
        meta: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTransferById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          sourceAccount: {
            include: { customer: { select: { fullName: true, customerNumber: true } } },
          },
          destinationAccount: {
            include: { customer: { select: { fullName: true, customerNumber: true } } },
          },
          entries: true,
        },
      });

      if (!transfer) {
        throw new AppError('Transfer not found.', 404);
      }

      // Check ownership if customer
      if (req.user?.role !== Role.ADMIN) {
        const isParticipant =
          transfer.sourceAccount.customerId === req.user?.customerId ||
          transfer.destinationAccount.customerId === req.user?.customerId;

        if (!isParticipant) {
          throw new AppError('Unauthorized access to transfer details.', 403);
        }
      }

      return res.status(200).json({ success: true, data: transfer });
    } catch (error) {
      next(error);
    }
  }

  static async reverseTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = reversalRequestSchema.parse(req.body);

      const result = await TransferService.reverseTransfer(
        id,
        req.user!.userId,
        reason
      );

      return res.status(200).json({
        success: true,
        message: 'Transfer reversed and funds adjusted successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
