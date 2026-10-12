import { describe, expect, it } from 'vitest';
import { calculateOrderItems, getAvailableStock, readBundleContents } from '../src/lib/bundles';
import { ProductInputSchema } from '../src/lib/validations';

const first = { id: 'first', slug: 'first', name: 'Gel', nameAr: 'جل', sku: 'GEL', image: '/gel.jpg', stock: 5, isActive: true, isBundle: false, price: 20 };
const second = { ...first, id: 'second', slug: 'second', name: 'Lotion', nameAr: 'لوشن', sku: 'LOTION', stock: 9, price: 30 };
const bundle = { ...first, id: 'bundle', name: 'Care bundle', nameAr: 'بكج العناية', sku: 'PACK', price: 39, stock: 0, isBundle: true,
  bundleItems: [{ productId: first.id, quantity: 2, product: first }, { productId: second.id, quantity: 1, product: second }] };

describe('Bundle availability and shared inventory', () => {
  it('derives availability from the limiting component quantity', () => {
    expect(getAvailableStock(bundle)).toBe(2);
    expect(getAvailableStock(first)).toBe(5);
  });
  it.each([0, -1, NaN, Infinity])('refuses invalid database prices before accepting an order (%s)', price => {
    expect(() => calculateOrderItems([{ productId: first.id, quantity: 1 }], [{ ...first, price }])).toThrow('سعر المنتج غير صالح');
  });
  it('makes empty, incomplete, inactive and nested bundles unavailable', () => {
    expect(getAvailableStock({ ...bundle, bundleItems: [] })).toBe(0);
    expect(getAvailableStock({ ...bundle, bundleItems: [bundle.bundleItems[0]] })).toBe(0);
    for (const changed of [{ isActive: false }, { isBundle: true }, { stock: 0 }]) {
      expect(getAvailableStock({ ...bundle, bundleItems: [
        { ...bundle.bundleItems[0], product: { ...first, ...changed } }, bundle.bundleItems[1],
      ] })).toBe(0);
    }
  });
  it('charges the bundle price once and reserves quantities of its components', () => {
    const plan = calculateOrderItems([{ productId: 'bundle', quantity: 2 }], [bundle]);
    expect(plan.subtotal).toBe(78);
    expect(plan.lineItems).toHaveLength(1);
    expect(plan.lineItems[0].unitPrice).toBe(39);
    expect(plan.inventory.get('first')?.quantity).toBe(4);
    expect(plan.inventory.get('second')?.quantity).toBe(2);
    expect(plan.inventory.has('bundle')).toBe(false);
    expect(plan.lineItems[0].bundleContents?.[0]).toMatchObject({ productSku: 'GEL', quantity: 2 });
  });
  it('combines demand from bundles and standalone products', () => {
    expect(() => calculateOrderItems([
      { productId: 'bundle', quantity: 2 }, { productId: 'first', quantity: 2 },
    ], [bundle, first])).toThrow('المخزون غير كافٍ');
    const plan = calculateOrderItems([
      { productId: 'bundle', quantity: 2 }, { productId: 'first', quantity: 1 },
    ], [bundle, first]);
    expect(plan.inventory.get('first')?.quantity).toBe(5);
    expect(plan.subtotal).toBe(98);
  });
  it('combines demand across different bundles sharing a product', () => {
    const another = { ...bundle, id: 'another' };
    expect(() => calculateOrderItems([
      { productId: 'bundle', quantity: 2 }, { productId: 'another', quantity: 1 },
    ], [bundle, another])).toThrow('المخزون غير كافٍ');
  });
  it('merges duplicate cart lines without undercounting stock', () => {
    const plan = calculateOrderItems([{ productId: 'first', quantity: 2 }, { productId: 'first', quantity: 3 }], [first]);
    expect(plan.lineItems).toHaveLength(1);
    expect(plan.lineItems[0].quantity).toBe(5);
    expect(plan.inventory.get('first')?.quantity).toBe(5);
    expect(() => calculateOrderItems([{ productId: 'first', quantity: 30 }, { productId: 'first', quantity: 30 }], [first])).toThrow('50');
  });
  it('rejects missing products and insufficient bundle stock', () => {
    expect(() => calculateOrderItems([{ productId: 'missing', quantity: 1 }], [first])).toThrow('غير متوفرة');
    expect(() => calculateOrderItems([{ productId: 'bundle', quantity: 3 }], [bundle])).toThrow('المخزون');
  });
});

describe('Bundle catalog validation', () => {
  const input = { ...first, nameAr: 'منتج', description: 'A product description', descriptionAr: 'وصف المنتج', category: 'Care', categoryAr: 'العناية', isFeatured: false };
  it('keeps existing standalone payloads compatible', () => {
    expect(ProductInputSchema.parse(input)).toMatchObject({ isBundle: false, bundleItems: [] });
  });
  it('requires two distinct products with positive integer quantities', () => {
    const contents = bundle.bundleItems.map(({ productId, quantity }) => ({ productId, quantity }));
    expect(ProductInputSchema.safeParse({ ...input, isBundle: true, bundleItems: contents }).success).toBe(true);
    for (const invalid of [contents.slice(0, 1), [contents[0], contents[0]], [{ ...contents[0], quantity: 0 }, contents[1]], [{ ...contents[0], quantity: 1.5 }, contents[1]]]) {
      expect(ProductInputSchema.safeParse({ ...input, isBundle: true, bundleItems: invalid }).success).toBe(false);
    }
    expect(ProductInputSchema.safeParse({ ...input, bundleItems: contents }).success).toBe(false);
  });
  it('reads historical snapshots defensively', () => {
    expect(readBundleContents(null)).toEqual([]);
    expect(readBundleContents([null, 'invalid', { quantity: 2 }])).toEqual([]);
    const contents = calculateOrderItems([{ productId: 'bundle', quantity: 1 }], [bundle]).lineItems[0].bundleContents;
    expect(readBundleContents(contents)).toEqual(contents);
  });
});
