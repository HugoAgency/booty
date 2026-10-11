import { ProductItem } from '@/types';

export interface ProductSales { productId: string | null; quantity: number }

/** Popularity comes from actual non-cancelled order quantities, never static copy. */
export function selectFeaturedProduct(products: ProductItem[], sales: ProductSales[]) {
  const salesMap = new Map(sales.map(sale => [sale.productId, sale.quantity]));
  const bestSeller = products.reduce<ProductItem | null>((best, product) => {
    const quantity = salesMap.get(product.id) || 0;
    return quantity > 0 && quantity > (best ? salesMap.get(best.id) || 0 : 0) ? product : best;
  }, null);
  return {
    product: bestSeller || products.find(product => product.isFeatured) || products[0] || null,
    isBestSeller: Boolean(bestSeller),
  };
}
