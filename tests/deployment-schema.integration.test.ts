import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const run = process.env.BUNDLE_TEST_DATABASE_URL ? describe : describe.skip;

run('Vercel schema deployment with PostgreSQL', () => {
  const schema = `bundle_test_deploy_${randomUUID().replaceAll('-', '')}`;
  let database: PrismaClient;
  let isolated: PrismaClient;
  let isolatedUrl: string;
  let created = false;

  beforeAll(async () => {
    const url = process.env.BUNDLE_TEST_DATABASE_URL!;
    if (url !== process.env.DATABASE_URL || !new URL(url).pathname.includes('bundle_test')) {
      throw new Error('Use the same dedicated bundle_test database for both test variables');
    }
    database = new PrismaClient({ datasourceUrl: url });
    await database.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    created = true;
    const scopedUrl = new URL(url);
    scopedUrl.searchParams.set('schema', schema);
    isolatedUrl = scopedUrl.toString();
    isolated = new PrismaClient({ datasourceUrl: isolatedUrl });
    // Schema exported from commit 55ec935, before bundles were introduced.
    const baseline = readFileSync(new URL('./fixtures/pre-bundle-schema.sql', import.meta.url), 'utf8');
    for (const statement of baseline.split(';').filter(part => part.trim())) {
      await isolated.$executeRawUnsafe(statement);
    }
    await isolated.$executeRawUnsafe(`INSERT INTO "Product"
      (id, slug, name, "nameAr", description, "descriptionAr", price, sku, image, category, "categoryAr", stock, "updatedAt")
      VALUES ('existing-product', 'existing-product', 'Existing product', 'منتج موجود', 'Description', 'وصف', 35,
      'existing-sku', '/images/logo.jpg', 'Care', 'عناية', 17, NOW())`);
    await isolated.$executeRawUnsafe(`INSERT INTO "Order"
      (id, "orderNumber", "customerName", "customerPhone", city, address, subtotal, "totalAmount", "updatedAt")
      VALUES ('existing-order', 'EXISTING-ORDER', 'Test customer', '0790000000', 'Amman', 'Test address', 35, 35, NOW())`);
    await isolated.$executeRawUnsafe(`INSERT INTO "OrderItem"
      (id, "orderId", "productId", "productName", "unitPrice", quantity, "lineTotal")
      VALUES ('existing-line', 'existing-order', 'existing-product', 'Existing product', 35, 1, 35)`);
  }, 30000);

  afterAll(async () => {
    await isolated?.$disconnect();
    if (created) await database.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await database?.$disconnect();
  });

  it('reproduces missing bundle schema, upgrades it repeatedly and preserves existing records', async () => {
    await expect(isolated.product.findMany({ include: { bundleItems: true } })).rejects.toMatchObject({ code: 'P2022' });
    for (let attempt = 0; attempt < 2; attempt++) {
      execFileSync('npm', ['run', 'db:deploy'], {
        cwd: process.cwd(), env: { ...process.env, DATABASE_URL: isolatedUrl },
        stdio: 'pipe', timeout: 60000,
      });
    }
    const product = await isolated.product.findUniqueOrThrow({ where: { id: 'existing-product' }, include: { bundleItems: true } });
    expect(product).toMatchObject({ name: 'Existing product', price: 35, stock: 17, isBundle: false, bundleItems: [],
      howToUse: null, howToUseAr: null, ingredients: null, ingredientsAr: null });
    const order = await isolated.order.findUniqueOrThrow({ where: { id: 'existing-order' }, include: { items: true } });
    expect(order).toMatchObject({ totalAmount: 35, items: [expect.objectContaining({ bundleContents: null, quantity: 1 })] });
    expect(await isolated.product.count()).toBe(1);
    expect(await isolated.order.count()).toBe(1);
    expect(await isolated.bundleItem.count()).toBe(0);
  }, 120000);

  it('refuses destructive schema drift rather than deleting data', async () => {
    await isolated.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN "legacyNote" TEXT');
    await isolated.$executeRawUnsafe(`UPDATE "Product" SET "legacyNote" = 'preserve me' WHERE id = 'existing-product'`);
    expect(() => execFileSync('npm', ['run', 'db:deploy'], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: isolatedUrl },
      stdio: 'pipe', timeout: 60000,
    })).toThrow();
    const result = await isolated.$queryRaw<Array<{ legacyNote: string }>>`SELECT "legacyNote" FROM "Product" WHERE id = 'existing-product'`;
    expect(result).toEqual([{ legacyNote: 'preserve me' }]);
  }, 60000);
});
