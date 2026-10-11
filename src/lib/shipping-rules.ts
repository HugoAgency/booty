import { formatPrice } from './currency';

export interface ShippingRules {
  isFreeShippingPromo: boolean;
  freeShippingThreshold: number;
  standardFee: number;
  ammanFee: number;
  outerGovernoratesFee: number;
  estimatedDeliveryTime: string;
}

export const DEFAULT_SHIPPING_RULES: ShippingRules = {
  isFreeShippingPromo: false,
  freeShippingThreshold: 40.0,
  standardFee: 3.0,
  ammanFee: 2.0,
  outerGovernoratesFee: 3.5,
  estimatedDeliveryTime: '1 - 3 أيام عمل',
};

export function getShippingMessage(rules: ShippingRules, subtotal?: number): string {
  if (rules.isFreeShippingPromo || rules.freeShippingThreshold === 0) return 'توصيل مجاني لجميع الطلبات في الأردن';
  if (subtotal !== undefined && subtotal >= rules.freeShippingThreshold) return 'هذا الطلب مؤهل للتوصيل المجاني';
  return `توصيل مجاني للطلبات بقيمة ${formatPrice(rules.freeShippingThreshold)} أو أكثر`;
}

export function getShippingRatesMessage(rules: ShippingRules): string {
  if (rules.isFreeShippingPromo || rules.freeShippingThreshold === 0) return '';
  return `للطلبات دون الحد الأدنى: عمّان ${formatPrice(rules.ammanFee)}، باقي المحافظات ${formatPrice(rules.outerGovernoratesFee)}`;
}

export interface ShippingCalculationResult {
  fee: number;
  isFree: boolean;
  reason: 'PROMO' | 'THRESHOLD' | 'CITY_TIER' | 'STANDARD';
  amountNeededForFreeShipping: number;
  estimatedDeliveryTime: string;
}

export function isAmmanCity(city: string): boolean {
  if (!city) return false;
  const normalized = city.trim().toLowerCase();
  return (
    normalized.includes('عمّان') ||
    normalized.includes('عمان') ||
    normalized.includes('amman')
  );
}

export function calculateShippingFee(
  subtotal: number,
  city: string,
  rules: ShippingRules = DEFAULT_SHIPPING_RULES
): ShippingCalculationResult {
  const safeSubtotal = Math.max(0, Number(subtotal || 0));

  // 1. Promotional Override: 100% Free Shipping
  if (rules.isFreeShippingPromo) {
    return {
      fee: 0,
      isFree: true,
      reason: 'PROMO',
      amountNeededForFreeShipping: 0,
      estimatedDeliveryTime: rules.estimatedDeliveryTime,
    };
  }

  // 2. Minimum Order Threshold Qualified (e.g. subtotal >= 40 JOD)
  if (safeSubtotal >= rules.freeShippingThreshold) {
    return {
      fee: 0,
      isFree: true,
      reason: 'THRESHOLD',
      amountNeededForFreeShipping: 0,
      estimatedDeliveryTime: rules.estimatedDeliveryTime,
    };
  }

  // 3. Below threshold: calculate courier rate based on Jordan city / governorate
  const amountNeeded = Number((rules.freeShippingThreshold - safeSubtotal).toFixed(2));

  let fee = rules.standardFee;
  if (isAmmanCity(city)) {
    fee = rules.ammanFee;
  } else if (city && city.trim().length > 0) {
    fee = rules.outerGovernoratesFee;
  }

  return {
    fee: Number(fee.toFixed(2)),
    isFree: fee === 0,
    reason: 'CITY_TIER',
    amountNeededForFreeShipping: amountNeeded,
    estimatedDeliveryTime: rules.estimatedDeliveryTime,
  };
}

