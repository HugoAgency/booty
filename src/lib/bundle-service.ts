import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ProductInputSchema } from './validations';

export const bundleInclude = { bundleItems: { include: { product: true } } } as const;

export class ProductInputError extends Error {}

/** Validate membership within the same serializable transaction that saves the product. */
export async function validateBundleInput(tx: Prisma.TransactionClient, input: z.infer<typeof ProductInputSchema>, id?: string) {
  if (input.isBundle) {
    if (input.bundleItems.some(item => item.productId === id)) {
      throw new ProductInputError('لا يمكن إضافة البكج إلى نفسه');
    }
    const components = await tx.product.findMany({
      where: { id: { in: input.bundleItems.map(item => item.productId) }, ...(input.isActive ? { isActive: true } : {}), isBundle: false },
    });
    if (components.length !== input.bundleItems.length) {
      throw new ProductInputError('اختر منتجات منفردة ومفعلة فقط؛ لا يمكن إضافة بكج داخل بكج');
    }
    if (id && await tx.bundleItem.count({ where: { productId: id } })) {
      throw new ProductInputError('هذا المنتج مكوّن في بكجات أخرى؛ أزله منها قبل تحويله إلى بكج');
    }
  }
}
