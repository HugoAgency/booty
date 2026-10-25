import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/checkout/route';
import { processOrderSubmission, OrderQuoteChangedError } from '@/lib/order-service';
import { checkoutPayload, savedOrder } from './fixtures/checkout-order';

vi.mock('@/lib/order-service', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/order-service')>(),
  processOrderSubmission: vi.fn(),
}));

function request(body: unknown) {
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Checkout WhatsApp response', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each([
    { isDuplicate: false, status: 201 },
    { isDuplicate: true, status: 200 },
  ])('returns $status with the saved order and WhatsApp link', async ({ isDuplicate, status }) => {
    vi.mocked(processOrderSubmission).mockResolvedValue({ isDuplicate, order: savedOrder });
    const response = await POST(request({
      ...checkoutPayload,
      customerName: 'Client value',
      totalAmount: 0.01,
      shippingFee: 0,
    }));
    const data = await response.json();
    expect(response.status).toBe(status);
    expect(data).toMatchObject({
      success: true, isDuplicate, orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber, totalAmount: 36.5, subtotal: 33, status: 'NEW',
    });
    const message = new URL(data.whatsappUrl).searchParams.get('text');
    expect(message).toContain(savedOrder.customerName);
    expect(message).not.toContain('Client value');
    expect(message).toContain('رسوم التوصيل: 3.50 د.أ');
    expect(message).toContain('الإجمالي النهائي: 36.50 د.أ');
    expect(processOrderSubmission).toHaveBeenCalledWith({ ...checkoutPayload, customerName: 'Client value' });
  });

  it('rejects invalid forms without saving or returning a WhatsApp link', async () => {
    const response = await POST(request({ ...checkoutPayload, customerName: '' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false });
    expect(processOrderSubmission).not.toHaveBeenCalled();
    expect(await POST(request({ items: [] })).then(r => r.json())).not.toHaveProperty('whatsappUrl');
  });

  it('returns no WhatsApp link when saving fails', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      vi.mocked(processOrderSubmission).mockRejectedValue(new Error('Unable to save order'));
      const response = await POST(request(checkoutPayload));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ success: false, error: 'Unable to save order' });
    } finally {
      errorLog.mockRestore();
    }
  });

  it('preserves quote-change responses without returning a WhatsApp link', async () => {
    vi.mocked(processOrderSubmission).mockRejectedValue(new OrderQuoteChangedError());
    const response = await POST(request(checkoutPayload));
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data).toMatchObject({ success: false, code: 'QUOTE_CHANGED' });
    expect(data).not.toHaveProperty('whatsappUrl');
  });
});
