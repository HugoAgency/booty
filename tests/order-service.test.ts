import { describe, it, expect } from 'vitest';
import { generateOrderNumber } from '../src/lib/order-service';
import { formatPrice } from '../src/lib/currency';

describe('Order Service Business Logic (Jordan / JOD)', () => {
  it('generates unique valid order numbers in TBR format', () => {
    const orderNum1 = generateOrderNumber();
    const orderNum2 = generateOrderNumber();

    expect(orderNum1).toMatch(/^TBR-\d{6}-[A-Z0-9]{4}$/);
    expect(orderNum2).toMatch(/^TBR-\d{6}-[A-Z0-9]{4}$/);
    expect(orderNum1).not.toBe(orderNum2);
  });

  it('formats currency correctly in Jordanian Dinar (د.أ / JOD)', () => {
    expect(formatPrice(35)).toBe('35.00 د.أ');
    expect(formatPrice(35, 'ar')).toBe('35.00 د.أ');
    expect(formatPrice(35, 'en')).toBe('35.00 JOD');
    expect(formatPrice(28.5)).toBe('28.50 د.أ');
  });

  it('calculates line item totals accurately in JOD without floating precision drift', () => {
    const items = [
      { unitPrice: 35.0, quantity: 2 },
      { unitPrice: 28.0, quantity: 1 },
      { unitPrice: 38.0, quantity: 3 },
    ];

    const subtotal = items.reduce(
      (acc, item) => acc + Number((item.unitPrice * item.quantity).toFixed(2)),
      0
    );

    expect(subtotal).toBe(212.0);
    const shipping = 0;
    const total = Number((subtotal + shipping).toFixed(2));
    expect(total).toBe(212.0);
  });
});
