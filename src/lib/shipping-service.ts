import { prisma } from './prisma';

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

export async function getShippingRules(): Promise<ShippingRules> {
  try {
    const config = await prisma.shippingConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      return DEFAULT_SHIPPING_RULES;
    }

    return {
      isFreeShippingPromo: config.isFreeShippingPromo,
      freeShippingThreshold: Number(config.freeShippingThreshold),
      standardFee: Number(config.standardFee),
      ammanFee: Number(config.ammanFee),
      outerGovernoratesFee: Number(config.outerGovernoratesFee),
      estimatedDeliveryTime: config.estimatedDeliveryTime,
    };
  } catch (error) {
    console.error('Failed to retrieve shipping rules from DB, fallback to defaults:', error);
    return DEFAULT_SHIPPING_RULES;
  }
}
