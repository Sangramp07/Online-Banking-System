import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { AuthService } from '../services/auth.service.js';
import { AccountService } from '../services/account.service.js';
import { updateProfileSchema } from '../validators/auth.validator.js';
import { prisma } from '../config/database.js';

export class CustomerController {
  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.userId);
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const updated = await AuthService.updateProfile(req.user!.userId, validatedData);
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const accounts = await AccountService.getCustomerAccounts(req.user!.customerId!);
      return res.status(200).json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  }

  static async getMyNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: req.user!.userId, isRead: false },
      });

      return res.status(200).json({
        success: true,
        data: { notifications, unreadCount },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markNotificationRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.notification.updateMany({
        where: { id, userId: req.user!.userId },
        data: { isRead: true },
      });

      return res.status(200).json({ success: true, message: 'Notification marked as read.' });
    } catch (error) {
      next(error);
    }
  }

  static async markAllNotificationsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.userId, isRead: false },
        data: { isRead: true },
      });

      return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
      next(error);
    }
  }
}
