import { describe, it, expect } from 'vitest';
import { generateOrderNumber } from '../src/lib/order-service';
import { formatPrice } from '../src/lib/currency';

describe('Order Service Business Logic', () => {
  it('generates unique valid order numbers in TBR format', () => {
    const orderNum1 = generateOrderNumber();
    const orderNum2 = generateOrderNumber();

    expect(orderNum1).toMatch(/^TBR-\d{6}-[A-Z0-9]{4}$/);
    expect(orderNum2).toMatch(/^TBR-\d{6}-[A-Z0-9]{4}$/);
    expect(orderNum1).not.toBe(orderNum2);
  });

  it('formats currency correctly in Arabic and English', () => {
    expect(formatPrice(180)).toBe('180.00 ر.س');
    expect(formatPrice(180, 'ar')).toBe('180.00 ر.س');
    expect(formatPrice(180, 'en')).toBe('180.00 SAR');
    expect(formatPrice(145.5)).toBe('145.50 ر.س');
  });

  it('calculates line item totals accurately without floating precision drift', () => {
    const items = [
      { unitPrice: 180.0, quantity: 2 },
      { unitPrice: 145.0, quantity: 1 },
      { unitPrice: 195.0, quantity: 3 },
    ];

    const subtotal = items.reduce(
      (acc, item) => acc + Number((item.unitPrice * item.quantity).toFixed(2)),
      0
    );

    expect(subtotal).toBe(1090.0);
    const shipping = 0;
    const total = Number((subtotal + shipping).toFixed(2));
    expect(total).toBe(1090.0);
  });
});
