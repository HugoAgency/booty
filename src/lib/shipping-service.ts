import { prisma } from './prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { DEFAULT_SHIPPING_RULES, ShippingRules } from './shipping-rules';
import type { Prisma } from '@prisma/client';
import { ShippingConfigSchema } from './validations';
export * from './shipping-rules';

export async function getShippingRules(client: Pick<Prisma.TransactionClient, 'shippingConfig'> = prisma): Promise<ShippingRules> {
  noStore();
  const config = await client.shippingConfig.findUnique({ where: { id: 'default' } });
  if (!config) return { ...DEFAULT_SHIPPING_RULES };
  return ShippingConfigSchema.parse({
    isFreeShippingPromo: config.isFreeShippingPromo,
    freeShippingThreshold: Number(config.freeShippingThreshold),
    standardFee: Number(config.standardFee),
    ammanFee: Number(config.ammanFee),
    outerGovernoratesFee: Number(config.outerGovernoratesFee),
    estimatedDeliveryTime: config.estimatedDeliveryTime,
  });
}
