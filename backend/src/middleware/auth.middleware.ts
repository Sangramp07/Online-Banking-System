import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { ENV } from '../config/env.js';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest, JwtUserPayload } from '../types/index.js';
import { AppError } from './error.middleware.js';

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // 1. Check HttpOnly cookies first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // 2. Fallback to Authorization Header (Bearer token)
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please sign in.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as JwtUserPayload;

    // Verify user is active in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { customer: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('Account is inactive or not found.', 401);
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id,
      customerNumber: user.customer?.customerNumber,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new AppError('Session expired. Please sign in again.', 401));
    } else if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid authentication token.', 401));
    } else {
      next(error);
    }
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized access.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'Access forbidden. You do not have permission to perform this action.',
          403
        )
      );
    }

    next();
  };
};

export const requireAdmin = requireRole([Role.ADMIN]);
export const requireCustomer = requireRole([Role.CUSTOMER]);
