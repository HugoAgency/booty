import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProductItem } from '../src/types';

const db = vi.hoisted(() => ({ findMany: vi.fn(), findUnique: vi.fn(), groupBy: vi.fn() }));
vi.mock('../src/lib/prisma', () => ({ prisma: { product: db, orderItem: db } }));
vi.mock('next/cache', () => ({ unstable_noStore: vi.fn() }));
import { getActiveProducts, getFeaturedProduct, getProductBySlug } from '../src/lib/products';
import { selectFeaturedProduct } from '../src/lib/featured-product';
import HeroSection from '../src/components/HeroSection';

const product: ProductItem = {
  id: 'actual-database-id', slug: 'updated-gel', name: 'Updated Gel', nameAr: 'جل بسعر محدث',
  subtitle: 'Actual database subtitle', description: 'Actual description', descriptionAr: 'وصف فعلي',
  price: 41.5, sku: 'DB-GEL', image: '/images/firming-booty-lotion.jpg',
  category: 'Care', categoryAr: 'العناية', stock: 8, isActive: true, isFeatured: true, isBundle: false,
};

describe('Actual catalog data and homepage card', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns the database name and price without demo replacements', async () => {
    db.findMany.mockResolvedValue([product]);
    expect(await getActiveProducts()).toEqual([product]);
  });
  it('keeps an empty database empty and propagates connection errors', async () => {
    db.findMany.mockResolvedValue([]);
    expect(await getActiveProducts()).toEqual([]);
    db.findMany.mockRejectedValue(new Error('Database unavailable'));
    await expect(getActiveProducts()).rejects.toThrow('Database unavailable');
  });
  it('does not resurrect a missing or deactivated product from static data', async () => {
    db.findUnique.mockResolvedValue(null);
    expect(await getProductBySlug('lightening-intimate-gel')).toBeNull();
    expect(db.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'lightening-intimate-gel', isActive: true } }));
  });
  it('selects the most ordered active product from non-cancelled orders', async () => {
    const other = { ...product, id: 'other', isFeatured: false };
    db.groupBy.mockResolvedValue([{ productId: product.id, _sum: { quantity: 2 } }, { productId: other.id, _sum: { quantity: 10 } }]);
    expect(await getFeaturedProduct([product, other])).toEqual({ product: other, isBestSeller: true });
    expect(db.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ order: { status: { not: 'CANCELLED' } } }),
    }));
  });
  it('uses a featured product without making an unsupported bestseller claim', () => {
    expect(selectFeaturedProduct([product], [])).toEqual({ product, isBestSeller: false });
    expect(selectFeaturedProduct([], [])).toEqual({ product: null, isBestSeller: false });
  });
  it('renders the actual name, subtitle, image, price and detail link', () => {
    const html = renderToStaticMarkup(React.createElement(HeroSection, { featuredProduct: product, isBestSeller: true }));
    expect(html).toContain(product.nameAr);
    expect(html).toContain(product.subtitle);
    expect(html).toContain(encodeURIComponent(product.image));
    expect(html).toContain('41.50');
    expect(html).toContain(`/products/${product.slug}`);
    expect(html).not.toContain('35.00');
  });
  it('omits the product card when no actual product exists', () => {
    const html = renderToStaticMarkup(React.createElement(HeroSection, { featuredProduct: null, isBestSeller: false }));
    expect(html).not.toContain('35.00');
    expect(html).not.toContain('المنتج الأكثر طلباً');
  });
});
