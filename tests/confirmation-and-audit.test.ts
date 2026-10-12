import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const db = vi.hoisted(() => ({ findUnique: vi.fn(), findMany: vi.fn() }));
vi.mock('../src/lib/prisma', () => ({ prisma: { order: db, adminAuditLog: db } }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
import OrderSuccessPage from '../src/app/checkout/success/page';
import { getRecentAuditLogs } from '../src/lib/audit';

describe('Confirmed order pages and audit reads', () => {
  beforeEach(() => vi.clearAllMocks());
  it('does not claim success without a real order reference', async () => {
    await expect(OrderSuccessPage({ searchParams: {} })).rejects.toThrow('NOT_FOUND');
    expect(db.findUnique).not.toHaveBeenCalled();
  });
  it('does not confirm an invented order number', async () => {
    db.findUnique.mockResolvedValue(null);
    await expect(OrderSuccessPage({ searchParams: { orderNumber: 'INVENTED' } })).rejects.toThrow('NOT_FOUND');
  });
  it('reads current status and displays cancellation instead of a preparation promise', async () => {
    db.findUnique.mockResolvedValue({ orderNumber: 'TBR-261012-ABCD', status: 'CANCELLED' });
    const markup = renderToStaticMarkup(await OrderSuccessPage({ searchParams: { orderNumber: 'TBR-261012-ABCD' } }));
    expect(markup).toContain('هذا الطلب ملغي');
    expect(markup).not.toContain('تم استلام طلبكِ بنجاح');
    expect(db.findUnique).toHaveBeenCalledWith({ where: { orderNumber: 'TBR-261012-ABCD' }, select: { orderNumber: true, status: true } });
  });
  it('does not report an empty audit history when its database read fails', async () => {
    db.findMany.mockRejectedValue(new Error('database unavailable'));
    await expect(getRecentAuditLogs(100)).rejects.toThrow('database unavailable');
  });
});
