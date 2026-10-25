import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processOrderSubmission } from '@/lib/order-service';
import { checkoutPayload, savedOrder } from './fixtures/checkout-order';

const mocks = vi.hoisted(() => ({
  findOrder: vi.fn(), txFindOrder: vi.fn(), findProducts: vi.fn(), transaction: vi.fn(),
  createOrder: vi.fn(), updateProducts: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: {
  order: { findUnique: mocks.findOrder }, $transaction: mocks.transaction,
} }));

vi.mock('@/lib/shipping-service', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/shipping-service')>(),
  getShippingRules: vi.fn().mockResolvedValue({
    isFreeShippingPromo: false, freeShippingThreshold: 40,
    standardFee: 3, ammanFee: 2, outerGovernoratesFee: 3.5,
    estimatedDeliveryTime: '1 - 3 أيام عمل',
  }),
}));

function uniqueError(target: string[]) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002', clientVersion: '5.22.0', meta: { target },
  });
}

describe('Order submission and idempotent recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findOrder.mockReset().mockResolvedValue(null);
    mocks.txFindOrder.mockReset().mockResolvedValue(null);
    mocks.findProducts.mockResolvedValue(savedOrder.items.map(item => ({
      id: item.productId, name: item.productName, nameAr: item.productNameAr || '',
      sku: item.productSku, price: item.unitPrice, stock: 10, isBundle: false,
    })));
    mocks.createOrder.mockReset().mockResolvedValue(savedOrder);
    mocks.updateProducts.mockResolvedValue({ count: 1 });
    mocks.transaction.mockReset().mockImplementation(async (callback) => callback({
      order: { findUnique: mocks.txFindOrder, create: mocks.createOrder },
      product: { findMany: mocks.findProducts, updateMany: mocks.updateProducts },
    }));
  });

  it('saves server-calculated prices, shipping, and line items in a serializable transaction', async () => {
    expect(await processOrderSubmission(checkoutPayload)).toEqual({ isDuplicate: false, order: savedOrder });
    expect(mocks.createOrder).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        customerName: checkoutPayload.customerName, subtotal: 33, shippingFee: 3.5,
        totalAmount: 36.5, status: 'NEW', paymentMethod: 'CASH_ON_DELIVERY',
        items: { create: expect.arrayContaining([
          expect.objectContaining({ productId: 'product-1', unitPrice: 12.5, quantity: 2, lineTotal: 25 }),
          expect.objectContaining({ productId: 'product-2', unitPrice: 8, quantity: 1, lineTotal: 8 }),
        ]) },
      }),
    }));
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(mocks.updateProducts).toHaveBeenCalledTimes(2);
  });

  it('returns an existing order without creating it or decrementing stock again', async () => {
    mocks.txFindOrder.mockResolvedValue(savedOrder);
    expect(await processOrderSubmission(checkoutPayload)).toEqual({ isDuplicate: true, order: savedOrder });
    expect(mocks.createOrder).not.toHaveBeenCalled();
    expect(mocks.updateProducts).not.toHaveBeenCalled();
  });

  it('recovers the winning order after a concurrent idempotency-key conflict', async () => {
    mocks.findOrder.mockResolvedValue(savedOrder);
    mocks.createOrder.mockRejectedValue(uniqueError(['idempotencyKey']));
    expect(await processOrderSubmission(checkoutPayload)).toEqual({ isDuplicate: true, order: savedOrder });
    expect(mocks.findOrder).toHaveBeenCalledOnce();
    expect(mocks.findOrder).toHaveBeenCalledWith({
      where: { idempotencyKey: checkoutPayload.idempotencyKey }, include: { items: true },
    });
  });

  it.each([uniqueError(['orderNumber']), new Error('Database unavailable')])(
    'propagates unrelated database errors even if an order exists for the key', async (error) => {
      mocks.findOrder.mockResolvedValue(savedOrder);
      mocks.createOrder.mockRejectedValue(error);
      await expect(processOrderSubmission(checkoutPayload)).rejects.toBe(error);
      expect(mocks.findOrder).not.toHaveBeenCalled();
    }
  );

  it('does not recover conflicts without an idempotency key', async () => {
    const error = uniqueError(['idempotencyKey']);
    mocks.createOrder.mockRejectedValue(error);
    await expect(processOrderSubmission({ ...checkoutPayload, idempotencyKey: undefined })).rejects.toBe(error);
    expect(mocks.findOrder).not.toHaveBeenCalled();
  });

  it('preserves the conflict if the winning order cannot be retrieved', async () => {
    const error = uniqueError(['idempotencyKey']);
    mocks.createOrder.mockRejectedValue(error);
    await expect(processOrderSubmission(checkoutPayload)).rejects.toBe(error);
  });

  it('retains serialization-conflict retries before creating an order', async () => {
    mocks.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Serialization conflict', {
      code: 'P2034', clientVersion: '5.22.0',
    }));
    expect(await processOrderSubmission(checkoutPayload)).toEqual({ isDuplicate: false, order: savedOrder });
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.createOrder).toHaveBeenCalledOnce();
  });
});
