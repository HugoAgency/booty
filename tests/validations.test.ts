import { describe, it, expect } from 'vitest';
import { CheckoutPayloadSchema, AdminLoginSchema } from '../src/lib/validations';

describe('CheckoutPayloadSchema Validation', () => {
  it('validates a correct checkout payload', () => {
    const validData = {
      customerName: 'سارة أحمد',
      customerPhone: '+966501234567',
      customerEmail: 'sara@example.com',
      city: 'الرياض',
      address: 'حي النرجس، شارع أنس بن مالك',
      notes: 'يرجى الاتصال قبل الوصول',
      items: [
        { productId: 'prod_1', quantity: 2 },
        { productId: 'prod_2', quantity: 1 },
      ],
      idempotencyKey: 'test-uuid-123',
    };

    const parsed = CheckoutPayloadSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('fails if customer name is too short', () => {
    const invalid = {
      customerName: 'A',
      customerPhone: '+966501234567',
      city: 'جدة',
      address: 'طريق الملك عبد العزيز',
      items: [{ productId: 'prod_1', quantity: 1 }],
    };
    const parsed = CheckoutPayloadSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('fails if items array is empty', () => {
    const invalid = {
      customerName: 'فاطمة محمد',
      customerPhone: '+966551234567',
      city: 'الدمام',
      address: 'شارع الخليج العربي',
      items: [],
    };
    const parsed = CheckoutPayloadSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('fails if quantity is less than 1', () => {
    const invalid = {
      customerName: 'نورة خالد',
      customerPhone: '+966551234567',
      city: 'مكة المكرمة',
      address: 'حي العوالي',
      items: [{ productId: 'prod_1', quantity: 0 }],
    };
    const parsed = CheckoutPayloadSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});

describe('AdminLoginSchema Validation', () => {
  it('validates valid admin login input', () => {
    const res = AdminLoginSchema.safeParse({
      username: 'admin',
      password: 'StrongPassword123!',
    });
    expect(res.success).toBe(true);
  });

  it('fails with short password', () => {
    const res = AdminLoginSchema.safeParse({
      username: 'admin',
      password: '123',
    });
    expect(res.success).toBe(false);
  });
});
