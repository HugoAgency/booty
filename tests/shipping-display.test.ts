import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock('../src/lib/prisma', () => ({ prisma: { shippingConfig: db } }));
vi.mock('next/cache', () => ({ unstable_noStore: vi.fn() }));
import { getShippingRules } from '../src/lib/shipping-service';
import { DEFAULT_SHIPPING_RULES, getShippingMessage, getShippingRatesMessage } from '../src/lib/shipping-rules';

const rules = { ...DEFAULT_SHIPPING_RULES, freeShippingThreshold: 88, ammanFee: 4.75,
  outerGovernoratesFee: 6.25, estimatedDeliveryTime: '5 - 7 أيام عمل' };

describe('Current shipping settings and customer messages', () => {
  beforeEach(() => vi.clearAllMocks());
  it('reads modified database settings on each request', async () => {
    db.findUnique.mockResolvedValueOnce(rules).mockResolvedValueOnce({ ...rules, estimatedDeliveryTime: 'موعد جديد' });
    expect(await getShippingRules()).toEqual(rules);
    expect((await getShippingRules()).estimatedDeliveryTime).toBe('موعد جديد');
  });
  it('uses initial configured defaults only when no settings record exists', async () => {
    db.findUnique.mockResolvedValue(null);
    expect(await getShippingRules()).toEqual(DEFAULT_SHIPPING_RULES);
  });
  it('does not quote invented delivery fees when the database is unavailable', async () => {
    db.findUnique.mockRejectedValue(new Error('database unavailable'));
    await expect(getShippingRules()).rejects.toThrow('database unavailable');
  });
  it('shows saved city rates and qualifies free shipping at the exact saved threshold', () => {
    expect(getShippingMessage(rules, 35)).toBe('توصيل مجاني للطلبات بقيمة 88.00 د.أ أو أكثر');
    expect(getShippingMessage(rules, 88)).toBe('هذا الطلب مؤهل للتوصيل المجاني');
    expect(getShippingRatesMessage(rules)).toContain('عمّان 4.75 د.أ، باقي المحافظات 6.25 د.أ');
  });
  it('shows global free shipping only when the administrator enables it', () => {
    const promo = { ...rules, isFreeShippingPromo: true };
    expect(getShippingMessage(promo, 1)).toBe('توصيل مجاني لجميع الطلبات في الأردن');
    expect(getShippingRatesMessage(promo)).toBe('');
  });
  it('treats a saved zero threshold as free delivery for all orders', () => {
    const noMinimum = { ...rules, freeShippingThreshold: 0 };
    expect(getShippingMessage(noMinimum, 1)).toBe('توصيل مجاني لجميع الطلبات في الأردن');
    expect(getShippingRatesMessage(noMinimum)).toBe('');
  });
});
