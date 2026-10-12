import { Decimal } from '@prisma/client/runtime/library';
import { TransferStatus, EntryType, NotificationType, AccountStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';
import { createAuditLog } from '../middleware/audit.middleware.js';

export interface ExecuteTransferInput {
  customerId: string;
  userId: string;
  sourceAccountId: string;
  destinationAccountNumber: string;
  amount: number;
  description: string;
  idempotencyKey?: string;
}

export class TransferService {
  /**
   * Execute an atomic fund transfer between accounts
   */
  static async executeTransfer(input: ExecuteTransferInput) {
    const {
      customerId,
      userId,
      sourceAccountId,
      destinationAccountNumber,
      amount,
      description,
      idempotencyKey,
    } = input;

    // 1. Check idempotency if key is present
    if (idempotencyKey) {
      const existingIdempotency = await prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
      });

      if (existingIdempotency) {
        if (existingIdempotency.expiresAt > new Date()) {
          return JSON.parse(existingIdempotency.responseBody);
        }
      }
    }

    if (amount <= 0) {
      throw new AppError('Transfer amount must be greater than zero.', 400);
    }

    // 2. Execute isolated atomic transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Fetch source account
        const sourceAccount = await tx.account.findUnique({
          where: { id: sourceAccountId },
          include: { customer: true },
        });

        if (!sourceAccount) {
          throw new AppError('Source account not found.', 404);
        }

        // Verify customer ownership
        if (sourceAccount.customerId !== customerId) {
          throw new AppError(
            'Unauthorized: You can only transfer funds from your own accounts.',
            403
          );
        }

        // Verify source account status
        if (sourceAccount.status !== AccountStatus.ACTIVE) {
          throw new AppError(
            `Source account is ${sourceAccount.status.toLowerCase()} and cannot initiate transfers.`,
            400
          );
        }

        // Fetch destination account
        const destAccount = await tx.account.findUnique({
          where: { accountNumber: destinationAccountNumber.trim() },
          include: { customer: { include: { user: true } } },
        });

        if (!destAccount) {
          throw new AppError(
            `Destination account number '${destinationAccountNumber}' not found.`,
            404
          );
        }

        if (destAccount.id === sourceAccount.id) {
          throw new AppError(
            'Cannot transfer funds to the exact same account.',
            400
          );
        }

        if (destAccount.status !== AccountStatus.ACTIVE) {
          throw new AppError(
            `Destination account is ${destAccount.status.toLowerCase()} and cannot receive transfers.`,
            400
          );
        }

        // Balance Check (Strict decimal comparison)
        const currentSourceBalance = Number(sourceAccount.balance);
        if (currentSourceBalance < amount) {
          throw new AppError(
            `Insufficient funds. Available balance is $${currentSourceBalance.toFixed(2)}, requested $${amount.toFixed(2)}.`,
            400
          );
        }

        // Calculate balances after transfer
        const sourceBalanceAfter = Number((currentSourceBalance - amount).toFixed(2));
        const destCurrentBalance = Number(destAccount.balance);
        const destBalanceAfter = Number((destCurrentBalance + amount).toFixed(2));

        // Generate unique reference
        const reference = `TRX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Debit source account
        await tx.account.update({
          where: { id: sourceAccount.id },
          data: {
            balance: new Decimal(sourceBalanceAfter),
            ledgerBalance: new Decimal(sourceBalanceAfter),
          },
        });

        // Credit destination account
        await tx.account.update({
          where: { id: destAccount.id },
          data: {
            balance: new Decimal(destBalanceAfter),
            ledgerBalance: new Decimal(destBalanceAfter),
          },
        });

        // Record Transfer
        const transfer = await tx.transfer.create({
          data: {
            reference,
            sourceAccountId: sourceAccount.id,
            destinationAccountId: destAccount.id,
            amount: new Decimal(amount),
            currency: sourceAccount.currency,
            description,
            status: TransferStatus.COMPLETED,
            idempotencyKey: idempotencyKey || null,
            initiatedByUserId: userId,
            completedAt: new Date(),
          },
        });

        // Record balanced double-entry ledger entries
        // 1. Debit Entry
        const debitEntry = await tx.transactionEntry.create({
          data: {
            transferId: transfer.id,
            accountId: sourceAccount.id,
            type: EntryType.DEBIT,
            amount: new Decimal(amount),
            balanceAfter: new Decimal(sourceBalanceAfter),
            description: `Transfer to ${destAccount.accountNumber} - ${description}`,
          },
        });

        // 2. Credit Entry
        const creditEntry = await tx.transactionEntry.create({
          data: {
            transferId: transfer.id,
            accountId: destAccount.id,
            type: EntryType.CREDIT,
            amount: new Decimal(amount),
            balanceAfter: new Decimal(destBalanceAfter),
            description: `Transfer from ${sourceAccount.accountNumber} - ${description}`,
          },
        });

        // Create Notifications
        // 1. Sender notification
        await tx.notification.create({
          data: {
            userId,
            title: 'Transfer Completed',
            message: `Successfully transferred $${amount.toFixed(2)} USD to account ${destAccount.accountNumber}. Ref: ${reference}`,
            type: NotificationType.SUCCESS,
            link: `/transactions`,
          },
        });

        // 2. Recipient notification (if different user)
        if (destAccount.customer.userId !== userId) {
          await tx.notification.create({
            data: {
              userId: destAccount.customer.userId,
              title: 'Funds Received',
              message: `You received $${amount.toFixed(2)} USD from account ${sourceAccount.accountNumber}. Ref: ${reference}`,
              type: NotificationType.SUCCESS,
              link: `/transactions`,
            },
          });
        }

        return {
          transfer,
          debitEntry,
          creditEntry,
          sourceAccount: {
            id: sourceAccount.id,
            accountNumber: sourceAccount.accountNumber,
            balance: sourceBalanceAfter,
          },
          destinationAccount: {
            id: destAccount.id,
            accountNumber: destAccount.accountNumber,
            holderName: destAccount.customer.fullName,
          },
        };
      },
      {
        isolationLevel: 'Serializable', // Highest isolation to eliminate race conditions
        timeout: 10000,
      }
    );

    const responsePayload = {
      success: true,
      message: 'Transfer processed successfully.',
      data: {
        reference: result.transfer.reference,
        amount,
        currency: result.transfer.currency,
        description: result.transfer.description,
        status: result.transfer.status,
        timestamp: result.transfer.completedAt,
        sourceAccountNumber: result.sourceAccount.accountNumber,
        sourceBalanceAfter: result.sourceAccount.balance,
        destinationAccountNumber: result.destinationAccount.accountNumber,
        destinationHolderName: result.destinationAccount.holderName,
      },
    };

    // Store in idempotency store if key was provided (valid 24h)
    if (idempotencyKey) {
      await prisma.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          responseStatusCode: 200,
          responseBody: JSON.stringify(responsePayload),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    await createAuditLog({
      actorUserId: userId,
      action: 'FUND_TRANSFER',
      targetType: 'Transfer',
      targetId: result.transfer.id,
      details: {
        reference: result.transfer.reference,
        amount,
        source: result.sourceAccount.accountNumber,
        destination: result.destinationAccount.accountNumber,
      },
    });

    return responsePayload;
  }

  /**
   * Admin Reversal Workflow
   */
  static async reverseTransfer(
    transferId: string,
    adminUserId: string,
    reason: string
  ) {
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        sourceAccount: { include: { customer: true } },
        destinationAccount: { include: { customer: true } },
      },
    });

    if (!transfer) {
      throw new AppError('Transfer record not found.', 404);
    }

    if (transfer.status === TransferStatus.REVERSED) {
      throw new AppError('This transfer has already been reversed.', 400);
    }

    if (transfer.status !== TransferStatus.COMPLETED) {
      throw new AppError(
        `Only completed transfers can be reversed. Current status: ${transfer.status}`,
        400
      );
    }

    const amount = Number(transfer.amount);

    const reversalResult = await prisma.$transaction(
      async (tx) => {
        // Fetch current balances
        const currentDestAccount = await tx.account.findUnique({
          where: { id: transfer.destinationAccountId },
        });

        const currentSourceAccount = await tx.account.findUnique({
          where: { id: transfer.sourceAccountId },
        });

        if (!currentDestAccount || !currentSourceAccount) {
          throw new AppError('Account records for reversal not found.', 404);
        }

        // Verify destination account has enough balance to reverse
        const destBalance = Number(currentDestAccount.balance);
        if (destBalance < amount) {
          throw new AppError(
            `Cannot reverse transfer: Destination account balance ($${destBalance.toFixed(2)}) is insufficient for refund of $${amount.toFixed(2)}.`,
            400
          );
        }

        const newDestBalance = Number((destBalance - amount).toFixed(2));
        const newSourceBalance = Number((Number(currentSourceAccount.balance) + amount).toFixed(2));

        // Clawback from destination
        await tx.account.update({
          where: { id: currentDestAccount.id },
          data: {
            balance: new Decimal(newDestBalance),
            ledgerBalance: new Decimal(newDestBalance),
          },
        });

        // Refund to source
        await tx.account.update({
          where: { id: currentSourceAccount.id },
          data: {
            balance: new Decimal(newSourceBalance),
            ledgerBalance: new Decimal(newSourceBalance),
          },
        });

        // Mark transfer as REVERSED
        const updatedTransfer = await tx.transfer.update({
          where: { id: transfer.id },
          data: {
            status: TransferStatus.REVERSED,
            reversalReason: reason,
            reversedAt: new Date(),
          },
        });

        // Balanced ledger reversal entries
        await tx.transactionEntry.create({
          data: {
            transferId: transfer.id,
            accountId: currentDestAccount.id,
            type: EntryType.DEBIT,
            amount: new Decimal(amount),
            balanceAfter: new Decimal(newDestBalance),
            description: `Reversal Clawback for ${transfer.reference} - Reason: ${reason}`,
          },
        });

        await tx.transactionEntry.create({
          data: {
            transferId: transfer.id,
            accountId: currentSourceAccount.id,
            type: EntryType.CREDIT,
            amount: new Decimal(amount),
            balanceAfter: new Decimal(newSourceBalance),
            description: `Reversal Refund for ${transfer.reference} - Reason: ${reason}`,
          },
        });

        // Notifications
        await tx.notification.create({
          data: {
            userId: transfer.sourceAccount.customer.userId,
            title: 'Transfer Reversed (Refund Received)',
            message: `A transfer of $${amount.toFixed(2)} USD (Ref: ${transfer.reference}) has been reversed and refunded to your account.`,
            type: NotificationType.INFO,
          },
        });

        await tx.notification.create({
          data: {
            userId: transfer.destinationAccount.customer.userId,
            title: 'Transfer Reversed (Clawback)',
            message: `A transfer of $${amount.toFixed(2)} USD (Ref: ${transfer.reference}) has been reversed by administration. Reason: ${reason}`,
            type: NotificationType.WARNING,
          },
        });

        return updatedTransfer;
      },
      { isolationLevel: 'Serializable' }
    );

    await createAuditLog({
      actorUserId: adminUserId,
      action: 'ADMIN_TRANSFER_REVERSAL',
      targetType: 'Transfer',
      targetId: transfer.id,
      outcome: 'SUCCESS',
      reason,
      details: { reference: transfer.reference, amount },
    });

    return reversalResult;
  }
}
