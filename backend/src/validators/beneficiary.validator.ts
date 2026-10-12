import { z } from 'zod';

export const createBeneficiarySchema = z.object({
  name: z.string().min(2, 'Beneficiary name must be at least 2 characters').max(100),
  accountNumber: z.string().min(5, 'Account number must be at least 5 characters').max(30),
  bankName: z.string().min(2, 'Bank name must be at least 2 characters').max(100).default('NEXBANK'),
  routingNumber: z.string().min(4, 'Routing/sort code is required').max(20).default('021000021'),
  nickname: z.string().max(50).optional(),
});

export const updateBeneficiarySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  nickname: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});
