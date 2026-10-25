import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { bundleInclude } from './bundle-service';
import { calculateOrderItems } from './bundles';
import { CheckoutPayload } from '@/types';
import { getShippingRules, calculateShippingFee } from './shipping-service';

export interface CalculatedOrder {
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  items: Array<{
    productId: string;
    productName: string;
    productNameAr: string;
    productSku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
}

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TBR-${dateStr}-${randomChars}`;
}

export class OrderQuoteChangedError extends Error {
  constructor() { super('تحدّثت الأسعار أو رسوم التوصيل. راجعي المبلغ الحالي ثم أكّدي الطلب مرة أخرى.'); }
}

export async function processOrderSubmission(payload: CheckoutPayload) {
  const { customerName, customerPhone, customerEmail, city, address, notes, items, idempotencyKey } = payload;

  // Catalog reads, order creation and conditional component decrements are one unit.
  // Serializable isolation also prevents edits to bundle membership during checkout.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        if (idempotencyKey) {
          const existing = await tx.order.findUnique({ where: { idempotencyKey }, include: { items: true } });
          if (existing) return { isDuplicate: true, order: existing };
        }
        const products = await tx.product.findMany({
          where: { id: { in: items.map(item => item.productId) }, isActive: true },
          include: bundleInclude,
        });
        const { lineItems, inventory, subtotal } = calculateOrderItems(items, products);
        const shippingRules = await getShippingRules(tx);
        const shippingFee = calculateShippingFee(subtotal, city, shippingRules).fee;
        if ((payload.expectedSubtotal !== undefined && payload.expectedSubtotal !== subtotal)
          || (payload.expectedShippingFee !== undefined && payload.expectedShippingFee !== shippingFee)) {
          throw new OrderQuoteChangedError();
        }

        // Aggregate shared ingredients across bundles and standalone products first.
        // Guard each decrement so no concurrent order can make stock negative.
        for (const [id, item] of Array.from(inventory).sort(([a], [b]) => a.localeCompare(b))) {
          const updated = await tx.product.updateMany({
            where: { id, isActive: true, isBundle: false, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count !== 1) throw new Error(`المخزون غير كافٍ للمنتج "${item.name}"؛ حدّث السلة وأعد المحاولة`);
        }
        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(), idempotencyKey: idempotencyKey || null,
            customerName, customerPhone, customerEmail: customerEmail || null,
            city, address, notes: notes || null,
            subtotal, shippingFee, totalAmount: Number((subtotal + shippingFee).toFixed(2)),
            status: 'NEW', paymentMethod: 'CASH_ON_DELIVERY',
            items: { create: lineItems.map(({ bundleContents, ...line }) => ({
              ...line,
              ...(bundleContents ? { bundleContents: bundleContents.map(content => ({ ...content })) } : {}),
            })) },
          },
          include: { items: true },
        });
        return { isDuplicate: false, order };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && idempotencyKey
          && Array.isArray(error.meta?.target) && error.meta.target.includes('idempotencyKey')) {
          const existing = await prisma.order.findUnique({ where: { idempotencyKey }, include: { items: true } });
          if (existing) return { isDuplicate: true, order: existing };
        }
        if (error.code === 'P2034' && attempt < 2) continue;
      }
      throw error;
    }
  }
  throw new Error('تعذر إتمام الطلب بسبب تحديث المخزون؛ أعد المحاولة');
}
