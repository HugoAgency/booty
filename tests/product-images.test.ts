import { describe, expect, it } from 'vitest';
import { isProductImageSource, normalizeProductImageSource } from '../src/lib/product-images';
import { ProductInputSchema } from '../src/lib/validations';

const id = '1yfqAXGpznIUZS_aEG5aJ-zAV0SJLiA3f';
const publicSource = `https://lh3.googleusercontent.com/d/${id}`;
const links = [
  `https://drive.usercontent.google.com/download?id=${id}&export=view&authuser=0`,
  `https://drive.google.com/file/d/${id}/view?usp=sharing`,
  `https://drive.google.com/uc?export=view&id=${id}`,
  `https://drive.google.com/open?id=${id}`,
];
describe('Product image source handling', () => {
  it.each(links)('resolves a Drive file link without account or download parameters (%s)', source => {
    expect(normalizeProductImageSource(source)).toBe(publicSource);
    expect(normalizeProductImageSource(normalizeProductImageSource(source))).toBe(publicSource);
  });
  it.each(['/images/logo.jpg', 'https://images.example.com/image.png?signature=abc&size=200',
    'http://images.example.com/image.jpg', publicSource])('preserves other supported image sources (%s)', source => {
    expect(normalizeProductImageSource(source)).toBe(source);
    expect(isProductImageSource(source)).toBe(true);
  });
  it('retains a supplied Drive resource key in the image request', () => {
    const source = normalizeProductImageSource(`${links[1]}&resourcekey=shared-file-key`);
    const url = new URL(source);
    expect(url.pathname).toBe('/thumbnail');
    expect(url.searchParams.get('id')).toBe(id);
    expect(url.searchParams.get('resourcekey')).toBe('shared-file-key');
    expect(url.searchParams.get('sz')).toBe('w1600');
  });
  it('does not interpret a lookalike host or folder page as a Drive file', () => {
    for (const source of [`https://drive.google.com.evil.example/file/d/${id}/view`, `https://drive.google.com/drive/folders/${id}`]) {
      expect(normalizeProductImageSource(source)).toBe(source);
    }
  });
  it.each(['image.jpg', '//example.com/image.jpg', 'javascript:alert(1)', 'data:image/svg+xml,example',
    'ftp://example.com/image.jpg', 'https://user:password@example.com/image.jpg', '/images\\image.jpg', ''])('rejects unsupported or malformed sources (%s)', source => {
    expect(isProductImageSource(source)).toBe(false);
  });
  it('normalizes links in product and bundle save payloads', () => {
    const product = { name: 'Care product', nameAr: 'منتج عناية', description: 'Actual description', descriptionAr: 'وصف المنتج الحقيقي',
      price: 35, sku: 'IMAGE-TEST', image: links[0], category: 'Care', categoryAr: 'عناية', stock: 5 };
    expect(ProductInputSchema.parse(product).image).toBe(publicSource);
    expect(ProductInputSchema.parse({ ...product, isBundle: true,
      bundleItems: [{ productId: 'first', quantity: 1 }, { productId: 'second', quantity: 1 }] }).image).toBe(publicSource);
    expect(ProductInputSchema.safeParse({ ...product, image: 'not-a-url' }).success).toBe(false);
  });
});
