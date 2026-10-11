import { prisma } from './prisma';

export interface AuditEventParams {
  adminId?: string | null;
  username: string;
  action:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'LOGOUT'
    | 'PASSWORD_CHANGED'
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DEACTIVATED'
    | 'ORDER_STATUS_UPDATED'
    | 'ORDER_EXPORTED'
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'PRODUCT_DELETED'
    | 'PRODUCT_DEACTIVATED'
    | 'SHIPPING_SETTINGS_UPDATED';
  ipAddress?: string | null;
  details?: string | null;
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId || null,
        username: params.username,
        action: params.action,
        ipAddress: params.ipAddress || null,
        details: params.details || null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function getRecentAuditLogs(limit: number = 50) {
  try {
    return await prisma.adminAuditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Failed to retrieve audit logs:', err);
    return [];
  }
}
