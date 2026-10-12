import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const runtime = vi.hoisted(() => ({ session: vi.fn(), stats: vi.fn() }));
vi.mock('../src/lib/auth', () => ({ getAdminSession: runtime.session }));
vi.mock('../src/lib/dashboard-stats', () => ({ getDashboardStats: runtime.stats }));
import { GET } from '../src/app/api/admin/stats/route';

describe('Statistics API failure and recovery contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtime.session.mockResolvedValue({ adminId: 'test-admin', username: 'test', role: 'ADMIN' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('does not query or reveal statistics without a current authenticated account', async () => {
    runtime.session.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(runtime.stats).not.toHaveBeenCalled();
  });
  it('returns verified empty data as a successful uncached response', async () => {
    const stats = { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0, totalProducts: 0, recentOrders: [] };
    runtime.stats.mockResolvedValue(stats);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ success: true, stats });
  });
  it.each(['P2021', 'P2022'])('identifies incomplete schema (%s) without claiming zero statistics', async code => {
    runtime.stats.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('internal database diagnostic', { code, clientVersion: 'test' }));
    const response = await GET();
    const result = await response.json();
    expect(response.status).toBe(503);
    expect(result).toMatchObject({ success: false, code: 'DATABASE_SCHEMA_MISMATCH' });
    expect(result).not.toHaveProperty('stats');
    expect(JSON.stringify(result)).not.toContain('internal database diagnostic');
  });
  it.each(['P1001', 'P1017', 'P2024'])('distinguishes unavailable connections (%s) and omits private diagnostics', async code => {
    runtime.stats.mockRejectedValue(code === 'P1001'
      ? new Prisma.PrismaClientInitializationError('private connection diagnostic', 'test', code)
      : new Prisma.PrismaClientKnownRequestError('private connection diagnostic', { code, clientVersion: 'test' }));
    const response = await GET();
    const result = await response.json();
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('10');
    expect(result).toMatchObject({ success: false, code: 'DATABASE_UNAVAILABLE' });
    expect(result).not.toHaveProperty('stats');
    expect(JSON.stringify(result)).not.toContain('private connection diagnostic');
  });
  it('keeps an unknown failure visible, then recovers on a later verified read', async () => {
    runtime.stats.mockRejectedValueOnce(new Error('private failure'));
    const failed = await GET();
    expect(failed.status).toBe(500);
    expect(await failed.json()).toMatchObject({ success: false, code: 'STATS_READ_FAILED' });
    runtime.stats.mockResolvedValue({ totalOrders: 3, totalRevenue: 79.5 });
    expect(await (await GET()).json()).toMatchObject({ success: true, stats: { totalOrders: 3, totalRevenue: 79.5 } });
  });
});
