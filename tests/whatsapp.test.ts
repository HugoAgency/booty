import { describe, expect, it } from 'vitest';
import { buildOrderWhatsAppUrl } from '@/lib/whatsapp';
import { savedOrder } from './fixtures/checkout-order';

describe('Saved-order WhatsApp message', () => {
  it('targets the merchant and includes every customer field and saved order total', () => {
    const url = new URL(buildOrderWhatsAppUrl(savedOrder));
    expect(url.origin + url.pathname).toBe('https://wa.me/962790385333');
    const message = url.searchParams.get('text')!;
    for (const field of [
      'THE BOOTY REPUBLIC', savedOrder.orderNumber, savedOrder.customerName,
      savedOrder.customerPhone, savedOrder.customerEmail!, savedOrder.city,
      savedOrder.address, savedOrder.notes!, 'مجموع المنتجات: 33.00 د.أ',
      'رسوم التوصيل: 3.50 د.أ', 'الإجمالي النهائي: 36.50 د.أ',
      'طريقة الدفع: الدفع عند الاستلام',
    ]) expect(message).toContain(field);
  });

  it('includes multiple line items, quantities, saved prices, and the English name fallback', () => {
    const message = new URL(buildOrderWhatsAppUrl(savedOrder)).searchParams.get('text')!;
    expect(message).toContain('1. لوشن الجسم\nكود المنتج: LOTION-01\nالكمية: 2\nسعر الوحدة: 12.50 د.أ\nإجمالي الصنف: 25.00 د.أ');
    expect(message).toContain('2. Cleanser & Care\nكود المنتج: CLEAN-02\nالكمية: 1\nسعر الوحدة: 8.00 د.أ\nإجمالي الصنف: 8.00 د.أ');
  });

  it('round-trips Arabic, newlines, emoji, plus signs, ampersands, and URL delimiters', () => {
    const notes = 'سطر أول 🌸\nA+B & C? # نعم / 100%';
    const url = buildOrderWhatsAppUrl({ ...savedOrder, notes });
    expect(url).not.toContain('\n');
    const parsed = new URL(url);
    expect(Array.from(parsed.searchParams.keys())).toEqual(['text']);
    expect(parsed.hash).toBe('');
    expect(parsed.searchParams.get('text')).toContain(`الملاحظات: ${notes}`);
    expect(parsed.searchParams.get('text')).toContain(savedOrder.customerEmail!);
  });

  it('uses Arabic placeholders for optional fields and formats free shipping', () => {
    const order = {
      ...savedOrder, customerEmail: null, notes: '', shippingFee: 0, totalAmount: 33,
      items: [{ ...savedOrder.items[0], productSku: null }],
    };
    const message = new URL(buildOrderWhatsAppUrl(order)).searchParams.get('text')!;
    expect(message).toContain('البريد الإلكتروني: غير مذكور');
    expect(message).toContain('الملاحظات: لا توجد');
    expect(message).toContain('كود المنتج: غير مذكور');
    expect(message).toContain('رسوم التوصيل: 0.00 د.أ');
  });

  it('includes historical bundle contents with the total quantities for fulfillment', () => {
    const order = { ...savedOrder, items: [{ ...savedOrder.items[0], bundleContents: [{
      productId: 'component-1', productName: 'Original gel', productNameAr: 'جل وقت الطلب',
      productSku: 'GEL-01', quantity: 3,
    }] }] };
    const message = new URL(buildOrderWhatsAppUrl(order)).searchParams.get('text')!;
    expect(message).toContain('محتويات البكج: جل وقت الطلب [GEL-01] × 6');
  });
});
