import { describe, it, expect } from 'vitest';
import {
  calculateShippingFee,
  isAmmanCity,
  DEFAULT_SHIPPING_RULES,
  ShippingRules,
} from '@/lib/shipping-service';

describe('Shipping & Delivery Calculation Service (Jordan / JOD)', () => {
  const customRules: ShippingRules = {
    isFreeShippingPromo: false,
    freeShippingThreshold: 40.0,
    standardFee: 3.0,
    ammanFee: 2.0,
    outerGovernoratesFee: 3.5,
    estimatedDeliveryTime: '1 - 3 أيام عمل',
  };

  it('correctly detects Amman variants vs other governorates', () => {
    expect(isAmmanCity('عمّان (العاصمة)')).toBe(true);
    expect(isAmmanCity('عمان')).toBe(true);
    expect(isAmmanCity('Amman')).toBe(true);
    expect(isAmmanCity('إربد')).toBe(false);
    expect(isAmmanCity('الزرقاء')).toBe(false);
    expect(isAmmanCity('العقبة')).toBe(false);
  });

  it('returns 0 JOD when global free shipping promo is enabled regardless of subtotal', () => {
    const promoRules: ShippingRules = {
      ...customRules,
      isFreeShippingPromo: true,
    };

    const resAmman = calculateShippingFee(15.0, 'عمّان (العاصمة)', promoRules);
    expect(resAmman.isFree).toBe(true);
    expect(resAmman.fee).toBe(0);
    expect(resAmman.reason).toBe('PROMO');
    expect(resAmman.amountNeededForFreeShipping).toBe(0);

    const resOuter = calculateShippingFee(10.0, 'إربد', promoRules);
    expect(resOuter.isFree).toBe(true);
    expect(resOuter.fee).toBe(0);
  });

  it('qualifies for free shipping when order reaches or exceeds threshold (>= 40 JOD)', () => {
    const resExact = calculateShippingFee(40.0, 'عمّان (العاصمة)', customRules);
    expect(resExact.isFree).toBe(true);
    expect(resExact.fee).toBe(0);
    expect(resExact.reason).toBe('THRESHOLD');
    expect(resExact.amountNeededForFreeShipping).toBe(0);

    const resExceed = calculateShippingFee(55.0, 'العقبة', customRules);
    expect(resExceed.isFree).toBe(true);
    expect(resExceed.fee).toBe(0);
    expect(resExceed.reason).toBe('THRESHOLD');
  });

  it('charges Amman tier fee (2.00 JOD) when subtotal is below threshold', () => {
    const res = calculateShippingFee(35.0, 'عمّان (العاصمة)', customRules);
    expect(res.isFree).toBe(false);
    expect(res.fee).toBe(2.0);
    expect(res.reason).toBe('CITY_TIER');
    expect(res.amountNeededForFreeShipping).toBe(5.0);
  });

  it('charges Outer governorates tier fee (3.50 JOD) when subtotal is below threshold', () => {
    const resIrbid = calculateShippingFee(25.0, 'إربد', customRules);
    expect(resIrbid.isFree).toBe(false);
    expect(resIrbid.fee).toBe(3.5);
    expect(resIrbid.amountNeededForFreeShipping).toBe(15.0);

    const resZarqa = calculateShippingFee(38.0, 'الزرقاء', customRules);
    expect(resZarqa.isFree).toBe(false);
    expect(resZarqa.fee).toBe(3.5);
    expect(resZarqa.amountNeededForFreeShipping).toBe(2.0);
  });

  it('handles zero or negative subtotals gracefully', () => {
    const res = calculateShippingFee(0, 'عمّان (العاصمة)', customRules);
    expect(res.isFree).toBe(false);
    expect(res.fee).toBe(2.0);
    expect(res.amountNeededForFreeShipping).toBe(40.0);
  });
});
