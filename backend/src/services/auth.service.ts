import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Role, KycStatus, CustomerStatus, AccountType, AccountStatus, EntryType, NotificationType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { ENV } from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';
import { createAuditLog } from '../middleware/audit.middleware.js';
import { JwtUserPayload } from '../types/index.js';

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Register a new customer
   */
  static async register(data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    dateOfBirth: string;
    address: string;
    password: string;
  }) {
    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Generate unique customer number and account number
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const customerNumber = `CUST-${randomSuffix}`;
    const accountNumber = `NEX-100${randomSuffix}`;

    // Execute atomic transaction for User + Customer + Default Account + Initial Bonus Deposit
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          passwordHash,
          role: Role.CUSTOMER,
        },
      });

      // 2. Create Customer
      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          customerNumber,
          fullName: data.fullName,
          mobileNumber: data.mobileNumber,
          dateOfBirth: data.dateOfBirth,
          address: data.address,
          kycStatus: KycStatus.VERIFIED, // verified for simulation
          status: CustomerStatus.ACTIVE,
        },
      });

      // 3. Create Default Savings Account with demo initial balance $1,000.00
      const initialBalance = 1000.00;
      const account = await tx.account.create({
        data: {
          accountNumber,
          customerId: customer.id,
          accountType: AccountType.SAVINGS,
          balance: initialBalance,
          ledgerBalance: initialBalance,
          currency: 'USD',
          status: AccountStatus.ACTIVE,
        },
      });

      // 4. Create initial demo deposit record
      const transfer = await tx.transfer.create({
        data: {
          reference: `TRX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          sourceAccountId: account.id,
          destinationAccountId: account.id,
          amount: initialBalance,
          description: 'Demo Welcome Account Opening Deposit',
          status: 'COMPLETED',
          initiatedByUserId: user.id,
          completedAt: new Date(),
        },
      });

      await tx.transactionEntry.create({
        data: {
          transferId: transfer.id,
          accountId: account.id,
          type: EntryType.CREDIT,
          amount: initialBalance,
          balanceAfter: initialBalance,
          description: 'Initial Opening Balance Deposit',
        },
      });

      // 5. Welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to NEXBANK!',
          message: `Your account ${accountNumber} has been successfully opened with a demo balance of $1,000.00 USD.`,
          type: NotificationType.SUCCESS,
        },
      });

      return { user, customer, account };
    });

    // Generate tokens
    const tokenPayload: JwtUserPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      customerId: result.customer.id,
      customerNumber: result.customer.customerNumber,
    };

    const accessToken = jwt.sign(tokenPayload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
    const refreshToken = jwt.sign(tokenPayload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    await createAuditLog({
      actorUserId: result.user.id,
      action: 'CUSTOMER_REGISTRATION',
      targetType: 'Customer',
      targetId: result.customer.id,
      details: { email: result.user.email, customerNumber },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        fullName: result.customer.fullName,
        customerNumber: result.customer.customerNumber,
      },
      account: {
        id: result.account.id,
        accountNumber: result.account.accountNumber,
        accountType: result.account.accountType,
        balance: result.account.balance,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  static async login(
    email: string,
    pass: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        customer: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid email address or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError(
        'Your account has been deactivated. Please contact support.',
        403
      );
    }

    if (user.customer && user.customer.status === CustomerStatus.SUSPENDED) {
      throw new AppError(
        'Your banking profile has been suspended by administration.',
        403
      );
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      await createAuditLog({
        actorUserId: user.id,
        action: 'FAILED_LOGIN',
        targetType: 'User',
        targetId: user.id,
        ipAddress,
        userAgent,
        outcome: 'FAILURE',
        reason: 'Password mismatch',
      });
      throw new AppError('Invalid email address or password.', 401);
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokenPayload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id,
      customerNumber: user.customer?.customerNumber,
    };

    const accessToken = jwt.sign(tokenPayload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
    const refreshToken = jwt.sign(tokenPayload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    await createAuditLog({
      actorUserId: user.id,
      action: 'USER_LOGIN',
      targetType: 'User',
      targetId: user.id,
      ipAddress,
      userAgent,
      outcome: 'SUCCESS',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.customer?.fullName || 'NEXBANK Administrator',
        customerNumber: user.customer?.customerNumber,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Get authenticated user profile
   */
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        customer: {
          include: {
            accounts: {
              where: { status: { not: AccountStatus.CLOSED } },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User profile not found.', 404);
    }

    return user;
  }

  /**
   * Update profile details
   */
  static async updateProfile(
    userId: string,
    data: { fullName?: string; mobileNumber?: string; address?: string }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user || !user.customer) {
      throw new AppError('Customer profile not found.', 404);
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: user.customer.id },
      data: {
        fullName: data.fullName ?? user.customer.fullName,
        mobileNumber: data.mobileNumber ?? user.customer.mobileNumber,
        address: data.address ?? user.customer.address,
      },
    });

    return updatedCustomer;
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new AppError('The current password entered is incorrect.', 400);
    }

    const newHash = await bcrypt.hash(newPass, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await createAuditLog({
      actorUserId: userId,
      action: 'PASSWORD_CHANGED',
      targetType: 'User',
      targetId: userId,
    });

    return { message: 'Password changed successfully.' };
  }

  /**
   * Initiate forgot password flow
   */
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Return generic message to prevent account enumeration
      return {
        message: 'If the email exists, a password reset instruction has been sent.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Return the reset token in response for simulation/demo convenience
    return {
      message: 'Password reset token generated.',
      demoResetToken: token,
    };
  }

  /**
   * Complete password reset
   */
  static async resetPassword(token: string, newPass: string) {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new AppError('Password reset link has expired or is invalid.', 400);
    }

    const newHash = await bcrypt.hash(newPass, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await createAuditLog({
      actorUserId: resetRecord.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      targetType: 'User',
      targetId: resetRecord.userId,
    });

    return { message: 'Password has been successfully reset. Please log in.' };
  }
}
