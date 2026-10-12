import { CartItem, ProductItem } from '@/types';

export function readStoredCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((item): item is CartItem => {
    if (!item || typeof item.productId !== 'string' || seen.has(item.productId)
      || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50
      || !Number.isFinite(item.price) || item.price < 0
      || !['slug', 'name', 'image', 'sku'].every(key => typeof item[key] === 'string')) return false;
    seen.add(item.productId);
    return true;
  });
}

export function reconcileCart(items: CartItem[], products: ProductItem[]) {
  const current = new Map(products.map(product => [product.id, product]));
  let changed = false;
  const removed: string[] = [];
  const updated = items.flatMap(item => {
    const product = current.get(item.productId);
    if (!product || !product.isActive || product.stock <= 0) {
      removed.push(item.nameAr || item.name);
      changed = true;
      return [];
    }
    const next: CartItem = { productId: product.id, slug: product.slug, name: product.name,
      nameAr: product.nameAr, price: product.price, image: product.image, sku: product.sku,
      maxStock: product.stock, quantity: Math.min(item.quantity, product.stock, 50) };
    if ((Object.keys(next) as Array<keyof CartItem>).some(key => next[key] !== item[key])) changed = true;
    return [next];
  });
  return { items: updated, changed, removed };
}

export function cartSubtotal(items: CartItem[]) {
  return Number(items.reduce((sum, item) => sum + Number((item.price * item.quantity).toFixed(2)), 0).toFixed(2));
}
