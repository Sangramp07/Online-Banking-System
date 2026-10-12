import { z } from 'zod';

export const createTransferSchema = z.object({
  sourceAccountId: z.string().uuid('Invalid source account identifier'),
  destinationAccountNumber: z
    .string()
    .min(5, 'Destination account number must be at least 5 characters')
    .max(30),
  amount: z
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .positive('Transfer amount must be greater than zero')
    .max(100000, 'Single transfer limit is $100,000.00')
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      'Amount cannot have more than 2 decimal places'
    ),
  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(120, 'Description cannot exceed 120 characters'),
  idempotencyKey: z.string().optional(),
});

export const reversalRequestSchema = z.object({
  reason: z
    .string()
    .min(5, 'Reversal reason must be at least 5 characters')
    .max(255),
});
