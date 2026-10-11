import { prisma } from './prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { DEFAULT_SHIPPING_RULES, ShippingRules } from './shipping-rules';
export * from './shipping-rules';

export async function getShippingRules(): Promise<ShippingRules> {
  noStore();
  const config = await prisma.shippingConfig.findUnique({ where: { id: 'default' } });
  if (!config) return { ...DEFAULT_SHIPPING_RULES };
  return {
    isFreeShippingPromo: config.isFreeShippingPromo,
    freeShippingThreshold: Number(config.freeShippingThreshold),
    standardFee: Number(config.standardFee),
    ammanFee: Number(config.ammanFee),
    outerGovernoratesFee: Number(config.outerGovernoratesFee),
    estimatedDeliveryTime: config.estimatedDeliveryTime,
  };
}
