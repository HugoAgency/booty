import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { processOrderSubmission } from '../src/lib/order-service';
import { validateBundleInput } from '../src/lib/bundle-service';
import { ProductInputSchema } from '../src/lib/validations';
import { randomUUID } from 'node:crypto';

// Explicit opt-in: this suite writes only its own fixtures in a dedicated test database.
const enabled = Boolean(process.env.BUNDLE_TEST_DATABASE_URL);
const run = enabled ? describe : describe.skip;

run('Bundle checkout with PostgreSQL', () => {
  const prefix = `bundle-test-${randomUUID()}`;
  let firstId: string, secondId: string, bundleId: string;
  let fixturesStarted = false;
  const payload = (items: Array<{ productId: string; quantity: number }>, key = randomUUID()) => ({
    customerName: 'Bundle Test', customerPhone: '0790000000', city: 'Amman', address: 'Test address',
    items, idempotencyKey: `${prefix}-${key}`,
  });
  const input = (suffix: string, price: number) => ProductInputSchema.parse({
    name: `${prefix}-${suffix}`, nameAr: 'منتج للاختبار', description: 'Test fixture description',
    descriptionAr: 'وصف للاختبار', price, sku: `${prefix}-${suffix}`, image: '/images/logo.jpg',
    category: 'Tests', categoryAr: 'اختبارات', stock: 5,
  });
  beforeAll(async () => {
    if (process.env.DATABASE_URL !== process.env.BUNDLE_TEST_DATABASE_URL
      || !new URL(process.env.DATABASE_URL!).pathname.includes('bundle_test')) {
      throw new Error('Set DATABASE_URL and BUNDLE_TEST_DATABASE_URL to the same dedicated bundle_test database');
    }
    fixturesStarted = true;
    const { bundleItems: _a, ...first } = input('first', 20);
    const { bundleItems: _b, ...second } = input('second', 30);
    firstId = (await prisma.product.create({ data: { ...first, slug: first.name } })).id;
    secondId = (await prisma.product.create({ data: { ...second, slug: second.name } })).id;
    const { bundleItems: _c, ...bundle } = input('bundle', 39);
    bundleId = (await prisma.product.create({ data: {
      ...bundle, slug: bundle.name, stock: 0, isBundle: true,
      bundleItems: { create: [{ productId: firstId, quantity: 2 }, { productId: secondId, quantity: 1 }] },
    } })).id;
  });
  beforeEach(async () => {
    await prisma.order.deleteMany({ where: { idempotencyKey: { startsWith: prefix } } });
    await prisma.product.updateMany({ where: { id: { in: [firstId, secondId] } }, data: { stock: 5, isActive: true } });
  });
  afterAll(async () => {
    if (!fixturesStarted) { await prisma.$disconnect(); return; }
    await prisma.order.deleteMany({ where: { idempotencyKey: { startsWith: prefix } } });
    if (bundleId) await prisma.bundleItem.deleteMany({ where: { bundleId } });
    await prisma.product.deleteMany({ where: { sku: { startsWith: prefix } } });
    await prisma.$disconnect();
  });
  it('persists one bundle line and an immutable composition snapshot', async () => {
    const result = await processOrderSubmission(payload([{ productId: bundleId, quantity: 2 }]));
    expect(result.order.subtotal).toBe(78);
    expect(result.order.items).toHaveLength(1);
    expect(result.order.items[0].quantity).toBe(2);
    expect(result.order.items[0].bundleContents).toEqual(expect.arrayContaining([
      expect.objectContaining({ productId: firstId, quantity: 2 }),
    ]));
    expect((await prisma.product.findUniqueOrThrow({ where: { id: firstId } })).stock).toBe(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: secondId } })).stock).toBe(3);
    await prisma.product.update({ where: { id: firstId }, data: { nameAr: 'اسم جديد' } });
    const snapshot = await prisma.orderItem.findUniqueOrThrow({ where: { id: result.order.items[0].id } });
    expect(snapshot.bundleContents).toEqual(result.order.items[0].bundleContents);
  });
  it('rolls back an order whose bundle and standalone quantities exceed shared stock', async () => {
    await expect(processOrderSubmission(payload([
      { productId: bundleId, quantity: 2 }, { productId: firstId, quantity: 2 },
    ]))).rejects.toThrow('المخزون غير كافٍ');
    expect((await prisma.product.findUniqueOrThrow({ where: { id: firstId } })).stock).toBe(5);
    expect(await prisma.order.count({ where: { idempotencyKey: { startsWith: prefix } } })).toBe(0);
  });
  it('never oversells when two orders race for the same components', async () => {
    const results = await Promise.allSettled([
      processOrderSubmission(payload([{ productId: bundleId, quantity: 2 }])),
      processOrderSubmission(payload([{ productId: bundleId, quantity: 2 }])),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: firstId } })).stock).toBe(1);
  });
  it('keeps simultaneous retries idempotent and decrements stock once', async () => {
    const request = payload([{ productId: bundleId, quantity: 1 }]);
    const results = await Promise.all([processOrderSubmission(request), processOrderSubmission(request)]);
    expect(results[0].order.id).toBe(results[1].order.id);
    expect(results.filter(result => result.isDuplicate)).toHaveLength(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: firstId } })).stock).toBe(3);
  });
  it('refuses bundles with deactivated components', async () => {
    await prisma.product.update({ where: { id: firstId }, data: { isActive: false } });
    await expect(processOrderSubmission(payload([{ productId: bundleId, quantity: 1 }]))).rejects.toThrow('المخزون');
  });
  it('rejects nested bundles, self references and converting a referenced component', async () => {
    for (const componentId of [bundleId, 'missing-product']) {
      const data = { ...input('new', 40), isBundle: true,
        bundleItems: [{ productId: componentId, quantity: 1 }, { productId: secondId, quantity: 1 }] };
      await expect(prisma.$transaction(tx => validateBundleInput(tx, data))).rejects.toThrow('منتجات منفردة');
    }
    const data = { ...input('edit', 40), isBundle: true,
      bundleItems: [{ productId: firstId, quantity: 1 }, { productId: secondId, quantity: 1 }] };
    await expect(prisma.$transaction(tx => validateBundleInput(tx, data, firstId))).rejects.toThrow('نفسه');
    const newComponent = await prisma.product.create({ data: {
      name: `${prefix}-third`, nameAr: 'ثالث', description: 'Third fixture', descriptionAr: 'وصف ثالث',
      price: 10, sku: `${prefix}-third`, slug: `${prefix}-third`, image: '/images/logo.jpg', category: 'Tests', categoryAr: 'اختبارات',
    } });
    await expect(prisma.$transaction(tx => validateBundleInput(tx, { ...data,
      bundleItems: [{ productId: newComponent.id, quantity: 1 }, { productId: secondId, quantity: 1 }],
    }, firstId))).rejects.toThrow('بكجات أخرى');
  });
});
