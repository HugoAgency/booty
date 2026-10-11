import { AdminRole, AdminPermission } from '@/types';
import { getAdminSession, AdminTokenPayload } from './auth';
import { NextResponse } from 'next/server';

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    'orders:read',
    'orders:update',
    'orders:export',
    'products:read',
    'products:write',
    'products:delete',
    'users:manage',
    'audit:read',
  ],
  ADMIN: [
    'orders:read',
    'orders:update',
    'orders:export',
    'products:read',
    'products:write',
    'products:delete',
  ],
  SUPPORT: [
    'orders:read',
    'orders:update',
    'products:read',
  ],
};

export function hasPermission(role: string, permission: AdminPermission): boolean {
  const allowed = ROLE_PERMISSIONS[role as AdminRole];
  if (!allowed) return false;
  return allowed.includes(permission);
}

export type AuthCheckResult =
  | { authorized: true; session: AdminTokenPayload }
  | { authorized: false; response: NextResponse };

export async function authorizePermission(permission: AdminPermission): Promise<AuthCheckResult> {
  const session = await getAdminSession();
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'غير مصرح / Unauthorized' },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(session.role, permission)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'صلاحيات غير كافية / Forbidden: Insufficient privileges' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}
