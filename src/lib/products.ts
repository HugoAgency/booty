import { prisma } from './prisma';
import { bundleInclude } from './bundle-service';
import { withAvailableStock } from './bundles';
import { ProductItem } from '@/types';

import { unstable_noStore as noStore } from 'next/cache';
import { selectFeaturedProduct } from './featured-product';

export async function getActiveProducts(): Promise<ProductItem[]> {
  noStore();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    include: bundleInclude,
  });
  return products.map(withAvailableStock) as ProductItem[];
}

export async function getProductBySlug(slug: string): Promise<ProductItem | null> {
  noStore();
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: bundleInclude,
  });
  return product ? withAvailableStock(product) as ProductItem : null;
}

export async function getFeaturedProduct(products: ProductItem[]) {
  noStore();
  if (!products.length) return { product: null, isBestSeller: false };
  const sales = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: { productId: { in: products.map(product => product.id) }, order: { status: { not: 'CANCELLED' } } },
    _sum: { quantity: true },
  });
  return selectFeaturedProduct(products, sales.map(sale => ({ productId: sale.productId, quantity: sale._sum.quantity || 0 })));
}
