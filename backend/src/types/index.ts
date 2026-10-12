import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: Role;
  customerId?: string;
  customerNumber?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
  idempotencyKey?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
