import { prisma } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';
import { EntryType } from '@prisma/client';

export class AccountService {
  /**
   * Get all accounts belonging to a customer
   */
  static async getCustomerAccounts(customerId: string) {
    const accounts = await prisma.account.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });

    return accounts;
  }

  /**
   * Get specific account by ID, verifying customer ownership
   */
  static async getAccountById(accountId: string, customerId?: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            customerNumber: true,
          },
        },
      },
    });

    if (!account) {
      throw new AppError('Account not found.', 404);
    }

    if (customerId && account.customerId !== customerId) {
      throw new AppError('Unauthorized: You do not have access to this account.', 403);
    }

    return account;
  }

  /**
   * Get paginated transactions for an account with filters
   */
  static async getAccountTransactions(
    accountId: string,
    customerId: string | null,
    options: {
      page?: number;
      limit?: number;
      type?: EntryType;
      startDate?: string;
      endDate?: string;
      search?: string;
    }
  ) {
    // Verify ownership if customerId provided
    if (customerId) {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      });
      if (!account || account.customerId !== customerId) {
        throw new AppError('Unauthorized access to account transactions.', 403);
      }
    }

    const page = options.page || 1;
    const limit = options.limit || 15;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      accountId,
    };

    if (options.type) {
      whereClause.type = options.type;
    }

    if (options.startDate || options.endDate) {
      whereClause.createdAt = {};
      if (options.startDate) {
        whereClause.createdAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        whereClause.createdAt.lte = new Date(options.endDate);
      }
    }

    if (options.search) {
      whereClause.OR = [
        { description: { contains: options.search } },
        { transfer: { reference: { contains: options.search } } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.transactionEntry.findMany({
        where: whereClause,
        include: {
          transfer: {
            select: {
              reference: true,
              status: true,
              completedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transactionEntry.count({
        where: whereClause,
      }),
    ]);

    return {
      entries,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all customer transactions across all accounts
   */
  static async getAllCustomerTransactions(
    customerId: string,
    options: {
      page?: number;
      limit?: number;
      type?: EntryType;
      startDate?: string;
      endDate?: string;
      search?: string;
    }
  ) {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const skip = (page - 1) * limit;

    const customerAccounts = await prisma.account.findMany({
      where: { customerId },
      select: { id: true },
    });

    const accountIds = customerAccounts.map((a) => a.id);

    const whereClause: any = {
      accountId: { in: accountIds },
    };

    if (options.type) {
      whereClause.type = options.type;
    }

    if (options.startDate || options.endDate) {
      whereClause.createdAt = {};
      if (options.startDate) {
        whereClause.createdAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        whereClause.createdAt.lte = new Date(options.endDate);
      }
    }

    if (options.search) {
      whereClause.OR = [
        { description: { contains: options.search } },
        { transfer: { reference: { contains: options.search } } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.transactionEntry.findMany({
        where: whereClause,
        include: {
          account: {
            select: {
              accountNumber: true,
              accountType: true,
            },
          },
          transfer: {
            select: {
              reference: true,
              status: true,
              completedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transactionEntry.count({
        where: whereClause,
      }),
    ]);

    return {
      entries,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
