import { prisma } from '../config/database.js';
import { AuditOutcome } from '@prisma/client';

export interface AuditLogParams {
  actorUserId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any> | string;
  ipAddress?: string;
  userAgent?: string;
  outcome?: AuditOutcome;
  reason?: string;
}

export const createAuditLog = async (params: AuditLogParams) => {
  try {
    const detailsString =
      typeof params.details === 'object'
        ? JSON.stringify(params.details)
        : params.details;

    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId || null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: detailsString,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        outcome: params.outcome || AuditOutcome.SUCCESS,
        reason: params.reason,
      },
    });
  } catch (error) {
    console.error('[AuditLog Error] Failed to write audit record:', error);
  }
};
