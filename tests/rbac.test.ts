import { describe, it, expect } from 'vitest';
import { hasPermission, ROLE_PERMISSIONS } from '@/lib/rbac';
import { AdminPermission } from '@/types';

describe('Role-Based Access Control (RBAC)', () => {
  it('grants SUPER_ADMIN full privileges', () => {
    const allPermissions: AdminPermission[] = [
      'orders:read',
      'orders:update',
      'orders:export',
      'products:read',
      'products:write',
      'products:delete',
      'users:manage',
      'audit:read',
      'shipping:write',
    ];

    allPermissions.forEach((perm) => {
      expect(hasPermission('SUPER_ADMIN', perm)).toBe(true);
    });
  });

  it('restricts ADMIN from user management and audit logs', () => {
    expect(hasPermission('ADMIN', 'orders:read')).toBe(true);
    expect(hasPermission('ADMIN', 'orders:update')).toBe(true);
    expect(hasPermission('ADMIN', 'orders:export')).toBe(true);
    expect(hasPermission('ADMIN', 'products:read')).toBe(true);
    expect(hasPermission('ADMIN', 'products:write')).toBe(true);
    expect(hasPermission('ADMIN', 'products:delete')).toBe(true);
    expect(hasPermission('ADMIN', 'shipping:write')).toBe(true);

    // Restricted
    expect(hasPermission('ADMIN', 'users:manage')).toBe(false);
    expect(hasPermission('ADMIN', 'audit:read')).toBe(false);
  });

  it('restricts SUPPORT to read-only products and orders updating without write/export/users access', () => {
    // Allowed
    expect(hasPermission('SUPPORT', 'orders:read')).toBe(true);
    expect(hasPermission('SUPPORT', 'orders:update')).toBe(true);
    expect(hasPermission('SUPPORT', 'products:read')).toBe(true);

    // Denied
    expect(hasPermission('SUPPORT', 'orders:export')).toBe(false);
    expect(hasPermission('SUPPORT', 'products:write')).toBe(false);
    expect(hasPermission('SUPPORT', 'products:delete')).toBe(false);
    expect(hasPermission('SUPPORT', 'users:manage')).toBe(false);
    expect(hasPermission('SUPPORT', 'audit:read')).toBe(false);
    expect(hasPermission('SUPPORT', 'shipping:write')).toBe(false);
  });

  it('denies all permissions for unknown or invalid roles', () => {
    expect(hasPermission('GUEST', 'orders:read')).toBe(false);
    expect(hasPermission('', 'products:read')).toBe(false);
    expect(hasPermission('UNKNOWN', 'users:manage')).toBe(false);
  });
});
