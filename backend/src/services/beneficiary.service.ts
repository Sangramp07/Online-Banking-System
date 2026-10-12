import { prisma } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

export class BeneficiaryService {
  static async getBeneficiaries(customerId: string) {
    return prisma.beneficiary.findMany({
      where: { customerId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async addBeneficiary(
    customerId: string,
    data: {
      name: string;
      accountNumber: string;
      bankName?: string;
      routingNumber?: string;
      nickname?: string;
    }
  ) {
    // Check if account belongs to the customer themselves
    const ownAccount = await prisma.account.findFirst({
      where: {
        customerId,
        accountNumber: data.accountNumber.trim(),
      },
    });

    if (ownAccount) {
      throw new AppError(
        'You cannot add your own account as a third-party beneficiary.',
        400
      );
    }

    // Check if destination account exists in NEXBANK (for simulation)
    const destAccount = await prisma.account.findUnique({
      where: { accountNumber: data.accountNumber.trim() },
    });

    if (!destAccount) {
      throw new AppError(
        'Beneficiary account number not found in NEXBANK directory.',
        404
      );
    }

    // Check if duplicate beneficiary
    const existing = await prisma.beneficiary.findFirst({
      where: {
        customerId,
        accountNumber: data.accountNumber.trim(),
      },
    });

    if (existing) {
      if (!existing.isActive) {
        // reactivate
        return prisma.beneficiary.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            name: data.name,
            nickname: data.nickname,
          },
        });
      }
      throw new AppError(
        'A beneficiary with this account number already exists.',
        409
      );
    }

    return prisma.beneficiary.create({
      data: {
        customerId,
        name: data.name.trim(),
        accountNumber: data.accountNumber.trim(),
        bankName: data.bankName || 'NEXBANK',
        routingNumber: data.routingNumber || '021000021',
        nickname: data.nickname?.trim(),
        isVerified: true,
        isActive: true,
      },
    });
  }

  static async updateBeneficiary(
    beneficiaryId: string,
    customerId: string,
    data: { name?: string; nickname?: string; isActive?: boolean }
  ) {
    const ben = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
    });

    if (!ben || ben.customerId !== customerId) {
      throw new AppError('Beneficiary not found or unauthorized.', 404);
    }

    return prisma.beneficiary.update({
      where: { id: beneficiaryId },
      data,
    });
  }

  static async deleteBeneficiary(beneficiaryId: string, customerId: string) {
    const ben = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
    });

    if (!ben || ben.customerId !== customerId) {
      throw new AppError('Beneficiary not found or unauthorized.', 404);
    }

    // Soft delete
    return prisma.beneficiary.update({
      where: { id: beneficiaryId },
      data: { isActive: false },
    });
  }
}
