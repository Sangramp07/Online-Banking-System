import { CustomerStatus, AccountStatus, TransferStatus, TicketStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';
import { createAuditLog } from '../middleware/audit.middleware.js';

export class AdminService {
  /**
   * Get comprehensive dashboard metrics
   */
  static async getDashboardMetrics() {
    const [
      totalCustomers,
      activeCustomers,
      totalAccounts,
      activeAccounts,
      restrictedAccounts,
      completedTransfers,
      transfersVolumeAggregate,
      failedTransfers,
      openTickets,
      recentRegistrations,
      recentTransfers,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: CustomerStatus.ACTIVE } }),
      prisma.account.count(),
      prisma.account.count({ where: { status: AccountStatus.ACTIVE } }),
      prisma.account.count({
        where: { status: { in: [AccountStatus.RESTRICTED, AccountStatus.FROZEN] } },
      }),
      prisma.transfer.count({ where: { status: TransferStatus.COMPLETED } }),
      prisma.transfer.aggregate({
        where: { status: TransferStatus.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.transfer.count({ where: { status: TransferStatus.FAILED } }),
      prisma.supportTicket.count({ where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } } }),
      prisma.customer.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, createdAt: true } } },
      }),
      prisma.transfer.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceAccount: { select: { accountNumber: true } },
          destinationAccount: { select: { accountNumber: true } },
        },
      }),
    ]);

    // Monthly simulated transaction volume (last 6 months)
    const now = new Date();
    const monthlyStats: Array<{ month: string; volume: number; count: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthName = d.toLocaleString('en-US', { month: 'short' });

      const [vol, count] = await Promise.all([
        prisma.transfer.aggregate({
          where: {
            status: TransferStatus.COMPLETED,
            createdAt: { gte: d, lt: nextD },
          },
          _sum: { amount: true },
        }),
        prisma.transfer.count({
          where: {
            status: TransferStatus.COMPLETED,
            createdAt: { gte: d, lt: nextD },
          },
        }),
      ]);

      monthlyStats.push({
        month: monthName,
        volume: Number(vol._sum.amount || 0),
        count,
      });
    }

    return {
      metrics: {
        totalCustomers,
        activeCustomers,
        totalAccounts,
        activeAccounts,
        restrictedAccounts,
        completedTransfers,
        totalSimulatedVolume: Number(transfersVolumeAggregate._sum.amount || 0),
        failedTransfers,
        openTickets,
      },
      charts: {
        monthlyVolume: monthlyStats,
      },
      recentRegistrations,
      recentTransfers,
    };
  }

  /**
   * Get all customers with search and pagination
   */
  static async getCustomers(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: CustomerStatus;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (options.status) {
      whereClause.status = options.status;
    }

    if (options.search) {
      whereClause.OR = [
        { fullName: { contains: options.search } },
        { customerNumber: { contains: options.search } },
        { user: { email: { contains: options.search } } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          user: { select: { email: true, isActive: true, lastLoginAt: true } },
          accounts: { select: { id: true, accountNumber: true, accountType: true, balance: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    return {
      customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update customer status (Activate / Suspend)
   */
  static async updateCustomerStatus(
    customerId: string,
    status: CustomerStatus,
    adminUserId: string,
    reason: string
  ) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!customer) {
      throw new AppError('Customer not found.', 404);
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { status },
    });

    // If suspended, also deactivate login user
    if (status === CustomerStatus.SUSPENDED) {
      await prisma.user.update({
        where: { id: customer.userId },
        data: { isActive: false },
      });
    } else if (status === CustomerStatus.ACTIVE) {
      await prisma.user.update({
        where: { id: customer.userId },
        data: { isActive: true },
      });
    }

    await createAuditLog({
      actorUserId: adminUserId,
      action: 'UPDATE_CUSTOMER_STATUS',
      targetType: 'Customer',
      targetId: customerId,
      reason,
      details: { previousStatus: customer.status, newStatus: status },
    });

    return updated;
  }

  /**
   * Get all accounts with filters
   */
  static async getAccounts(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: AccountStatus;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (options.status) whereClause.status = options.status;
    if (options.search) {
      whereClause.OR = [
        { accountNumber: { contains: options.search } },
        { customer: { fullName: { contains: options.search } } },
        { customer: { customerNumber: { contains: options.search } } },
      ];
    }

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              fullName: true,
              customerNumber: true,
              user: { select: { email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.account.count({ where: whereClause }),
    ]);

    return {
      accounts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update account status (ACTIVE, RESTRICTED, FROZEN, CLOSED)
   */
  static async updateAccountStatus(
    accountId: string,
    status: AccountStatus,
    adminUserId: string,
    reason: string
  ) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new AppError('Account not found.', 404);
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: { status },
    });

    await createAuditLog({
      actorUserId: adminUserId,
      action: 'UPDATE_ACCOUNT_STATUS',
      targetType: 'Account',
      targetId: accountId,
      reason,
      details: {
        accountNumber: account.accountNumber,
        previousStatus: account.status,
        newStatus: status,
      },
    });

    return updated;
  }

  /**
   * Get all transfers with search and filters
   */
  static async getTransfers(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: TransferStatus;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (options.status) whereClause.status = options.status;
    if (options.search) {
      whereClause.OR = [
        { reference: { contains: options.search } },
        { description: { contains: options.search } },
        { sourceAccount: { accountNumber: { contains: options.search } } },
        { destinationAccount: { accountNumber: { contains: options.search } } },
      ];
    }

    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({
        where: whereClause,
        include: {
          sourceAccount: {
            select: {
              accountNumber: true,
              customer: { select: { fullName: true } },
            },
          },
          destinationAccount: {
            select: {
              accountNumber: true,
              customer: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transfer.count({ where: whereClause }),
    ]);

    return {
      transfers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(options: {
    page?: number;
    limit?: number;
    action?: string;
    search?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (options.action) whereClause.action = options.action;
    if (options.search) {
      whereClause.OR = [
        { action: { contains: options.search } },
        { targetType: { contains: options.search } },
        { details: { contains: options.search } },
        { reason: { contains: options.search } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          actor: { select: { email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    return {
      logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all support tickets for admin center
   */
  static async getAllTickets(options: {
    page?: number;
    limit?: number;
    status?: TicketStatus;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (options.status) whereClause.status = options.status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where: whereClause,
        include: {
          customer: { select: { fullName: true, customerNumber: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: { select: { id: true, role: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where: whereClause }),
    ]);

    return {
      tickets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update support ticket status
   */
  static async updateTicketStatus(ticketId: string, status: TicketStatus) {
    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() },
    });
  }

  /**
   * Export reports data as CSV string
   */
  static async generateReportCsv(reportType: 'transfers' | 'customers' | 'accounts') {
    if (reportType === 'transfers') {
      const records = await prisma.transfer.findMany({
        include: {
          sourceAccount: true,
          destinationAccount: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });

      let csv = 'Reference,Source Account,Destination Account,Amount,Currency,Status,Date\n';
      for (const r of records) {
        csv += `${r.reference},${r.sourceAccount.accountNumber},${r.destinationAccount.accountNumber},${Number(r.amount).toFixed(2)},${r.currency},${r.status},${r.createdAt.toISOString()}\n`;
      }
      return csv;
    }

    if (reportType === 'customers') {
      const customers = await prisma.customer.findMany({
        include: { user: true, accounts: true },
        take: 500,
      });

      let csv = 'Customer Number,Full Name,Email,Mobile,Status,Accounts Count,Registered Date\n';
      for (const c of customers) {
        csv += `${c.customerNumber},"${c.fullName}","${c.user.email}","${c.mobileNumber}",${c.status},${c.accounts.length},${c.createdAt.toISOString()}\n`;
      }
      return csv;
    }

    const accounts = await prisma.account.findMany({
      include: { customer: true },
      take: 500,
    });
    let csv = 'Account Number,Customer,Type,Balance,Currency,Status,Created Date\n';
    for (const a of accounts) {
      csv += `${a.accountNumber},"${a.customer.fullName}",${a.accountType},${Number(a.balance).toFixed(2)},${a.currency},${a.status},${a.createdAt.toISOString()}\n`;
    }
    return csv;
  }
}
