import type { Prisma } from '@prisma/client';
import { formatPrice } from './currency';
import { readBundleContents } from './bundles';

// Used only by the server-side checkout endpoint.
const WHATSAPP_ORDER_NUMBER = '962790385333';

type SavedOrder = Prisma.OrderGetPayload<{ include: { items: true } }>;

export function buildOrderWhatsAppUrl(order: SavedOrder): string {
  const products = order.items.map((item, index) => [
    `${index + 1}. ${item.productNameAr || item.productName}`,
    `كود المنتج: ${item.productSku || 'غير مذكور'}`,
    `الكمية: ${item.quantity}`,
    `سعر الوحدة: ${formatPrice(item.unitPrice)}`,
    `إجمالي الصنف: ${formatPrice(item.lineTotal)}`,
    ...readBundleContents(item.bundleContents).map(component =>
      `محتويات البكج: ${component.productNameAr || component.productName} [${component.productSku}] × ${component.quantity * item.quantity}`
    ),
  ].join('\n')).join('\n\n');

  const message = [
    'مرحبًا، أود تأكيد طلبي من THE BOOTY REPUBLIC',
    '',
    `رقم الطلب: ${order.orderNumber}`,
    '',
    `الاسم: ${order.customerName}`,
    `رقم الهاتف: ${order.customerPhone}`,
    `البريد الإلكتروني: ${order.customerEmail || 'غير مذكور'}`,
    `المدينة: ${order.city}`,
    `عنوان التوصيل: ${order.address}`,
    `الملاحظات: ${order.notes || 'لا توجد'}`,
    '',
    'المنتجات:',
    products,
    '',
    `مجموع المنتجات: ${formatPrice(order.subtotal)}`,
    `رسوم التوصيل: ${formatPrice(order.shippingFee)}`,
    `الإجمالي النهائي: ${formatPrice(order.totalAmount)}`,
    `طريقة الدفع: ${order.paymentMethod === 'CASH_ON_DELIVERY' ? 'الدفع عند الاستلام' : order.paymentMethod}`,
  ].join('\n');

  return `https://wa.me/${WHATSAPP_ORDER_NUMBER}?text=${encodeURIComponent(message)}`;
}
