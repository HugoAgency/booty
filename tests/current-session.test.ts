import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ cookie: '', findUnique: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: () => ({ get: () => state.cookie ? { value: state.cookie } : undefined }) }));
vi.mock('../src/lib/prisma', () => ({ prisma: { adminUser: { findUnique: state.findUnique } } }));
import { createAdminToken, getAdminSession } from '../src/lib/auth';

describe('Current database account instead of stale JWT roles', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    state.cookie = await createAdminToken({ adminId: 'admin-id', username: 'manager', role: 'SUPER_ADMIN' });
  });
  it('reads a changed name and downgraded role while retaining the signed identity', async () => {
    state.findUnique.mockResolvedValue({ id: 'admin-id', username: 'manager', name: 'Updated name', role: 'SUPPORT', isActive: true });
    expect(await getAdminSession()).toEqual({ adminId: 'admin-id', username: 'manager', name: 'Updated name', role: 'SUPPORT' });
  });
  it.each([null, { id: 'admin-id', username: 'manager', role: 'ADMIN', isActive: false },
    { id: 'admin-id', username: 'other', role: 'ADMIN', isActive: true },
    { id: 'admin-id', username: 'manager', role: 'UNKNOWN', isActive: true }])('rejects removed, disabled or invalid accounts', async account => {
    state.findUnique.mockResolvedValue(account);
    expect(await getAdminSession()).toBeNull();
  });
  it('fails closed when account data cannot be verified', async () => {
    state.findUnique.mockRejectedValue(new Error('database unavailable'));
    expect(await getAdminSession()).toBeNull();
  });
});
