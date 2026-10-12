import { describe, expect, it } from 'vitest';
import { readStoredCart, reconcileCart, cartSubtotal } from '../src/lib/cart';
import { CartItem, ProductItem } from '../src/types';

const cached: CartItem = { productId: 'gel', slug: 'old-gel', name: 'Old gel', nameAr: 'اسم قديم',
  price: 35, image: '/old.jpg', sku: 'OLD', quantity: 5, maxStock: 50 };
const current: ProductItem = { id: 'gel', slug: 'gel', name: 'Current gel', nameAr: 'اسم حالي',
  price: 48.75, image: '/new.jpg', sku: 'NEW', stock: 2, isActive: true, isFeatured: false,
  description: 'Current details', descriptionAr: 'التفاصيل الحالية', category: 'Care', categoryAr: 'عناية' };

describe('Cart reconciliation against the live catalog', () => {
  it('replaces stored prices, metadata and availability while respecting the latest stock', () => {
    const result = reconcileCart([cached], [current]);
    expect(result.changed).toBe(true);
    expect(result.items[0]).toMatchObject({ nameAr: 'اسم حالي', price: 48.75, image: '/new.jpg', sku: 'NEW', quantity: 2, maxStock: 2 });
    expect(cartSubtotal(result.items)).toBe(97.5);
  });
  it.each([{ products: [] }, { products: [{ ...current, isActive: false }] }, { products: [{ ...current, stock: 0 }] }])('removes unavailable items with an explicit removed-name list', ({ products }) => {
    expect(reconcileCart([cached], products)).toMatchObject({ items: [], changed: true, removed: ['اسم قديم'] });
  });
  it('does not report another change once the cart matches the database', () => {
    const first = reconcileCart([cached], [current]);
    expect(reconcileCart(first.items, [current]).changed).toBe(false);
  });
  it('ignores corrupt storage and duplicate or invalid rows instead of crashing the page', () => {
    expect(readStoredCart({ items: [cached] })).toEqual([]);
    expect(readStoredCart([cached, cached, { ...cached, productId: 'bad', quantity: -1 }, null])).toEqual([cached]);
  });
  it('matches the server by rounding each line before adding the subtotal', () => {
    expect(cartSubtotal([{ ...cached, quantity: 1, price: 1.334 }, { ...cached, productId: 'other', quantity: 1, price: 1.334 }])).toBe(2.66);
  });
});
