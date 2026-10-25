import type { Prisma } from '@prisma/client';
import type { CheckoutPayload } from '@/types';

export const checkoutPayload: CheckoutPayload = {
  customerName: 'سارة أحمد',
  customerPhone: '+962790000000',
  customerEmail: 'sara+orders@example.com',
  city: 'إربد',
  address: 'شارع الجامعة & بناية 5 + الطابق 2',
  notes: 'الاتصال قبل التوصيل\nشكرًا 🌸',
  items: [
    { productId: 'product-1', quantity: 2 },
    { productId: 'product-2', quantity: 1 },
  ],
  idempotencyKey: 'checkout-test-key',
};

export const savedOrder: Prisma.OrderGetPayload<{ include: { items: true } }> = {
  id: 'order-1',
  orderNumber: 'TBR-261025-TEST',
  idempotencyKey: checkoutPayload.idempotencyKey!,
  customerName: checkoutPayload.customerName,
  customerPhone: checkoutPayload.customerPhone,
  customerEmail: checkoutPayload.customerEmail!,
  city: checkoutPayload.city,
  address: checkoutPayload.address,
  notes: checkoutPayload.notes!,
  subtotal: 33,
  shippingFee: 3.5,
  totalAmount: 36.5,
  status: 'NEW',
  paymentMethod: 'CASH_ON_DELIVERY',
  createdAt: new Date('2026-10-25T10:00:00Z'),
  updatedAt: new Date('2026-10-25T10:00:00Z'),
  items: [
    {
      id: 'item-1', orderId: 'order-1', productId: 'product-1',
      productName: 'Body Lotion', productNameAr: 'لوشن الجسم', productSku: 'LOTION-01',
      unitPrice: 12.5, quantity: 2, lineTotal: 25, bundleContents: null,
    },
    {
      id: 'item-2', orderId: 'order-1', productId: 'product-2',
      productName: 'Cleanser & Care', productNameAr: null, productSku: 'CLEAN-02',
      unitPrice: 8, quantity: 1, lineTotal: 8, bundleContents: null,
    },
  ],
};
