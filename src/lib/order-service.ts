import { prisma } from './prisma';
import { CheckoutPayload } from '@/types';

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

export async function processOrderSubmission(payload: CheckoutPayload) {
  const { customerName, customerPhone, customerEmail, city, address, notes, items, idempotencyKey } = payload;

  // 1. Idempotency check: if key already submitted, return the existing order
  if (idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey },
      include: { items: true },
    });
    if (existing) {
      return {
        isDuplicate: true,
        order: existing,
      };
    }
  }

  // 2. Fetch products and strictly recalculate prices on server
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
  });

  if (products.length !== items.length) {
    throw new Error('بعض المنتجات غير متوفرة أو لم يتم العثور عليها / Some products are unavailable or discontinued');
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const lineItemsToCreate: Array<{
    productId: string;
    productName: string;
    productNameAr: string;
    productSku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`المنتج غير موجود / Product not found: ${item.productId}`);
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `الكمية المطلوبة من "${product.nameAr || product.name}" غير متوفرة في المخزون (المتبقي: ${product.stock}) / Insufficient stock for ${product.name}`
      );
    }

    const unitPrice = product.price;
    const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
    subtotal += lineTotal;

    lineItemsToCreate.push({
      productId: product.id,
      productName: product.name,
      productNameAr: product.nameAr,
      productSku: product.sku,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  const shippingFee = 0; // Free shipping promo
  const totalAmount = Number((subtotal + shippingFee).toFixed(2));
  const orderNumber = generateOrderNumber();

  // 3. Prisma transaction: create Order & OrderItems, decrement inventory
  const createdOrder = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        idempotencyKey: idempotencyKey || null,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        city,
        address,
        notes: notes || null,
        subtotal,
        shippingFee,
        totalAmount,
        status: 'NEW',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: {
          create: lineItemsToCreate.map((li) => ({
            productId: li.productId,
            productName: li.productName,
            productNameAr: li.productNameAr,
            productSku: li.productSku,
            unitPrice: li.unitPrice,
            quantity: li.quantity,
            lineTotal: li.lineTotal,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Decrement stock safely
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }

    return newOrder;
  });

  return {
    isDuplicate: false,
    order: createdOrder,
  };
}
