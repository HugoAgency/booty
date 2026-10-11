// Run against a server connected to a dedicated bundle_test PostgreSQL database.
// Playwright is intentionally installed outside the application checkout.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const { PrismaClient } = require('@prisma/client');
const { SignJWT } = require('jose');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');

async function main() {
  assert(process.env.BUNDLE_TEST_DATABASE_URL, 'BUNDLE_TEST_DATABASE_URL is required');
  assert.equal(process.env.DATABASE_URL, process.env.BUNDLE_TEST_DATABASE_URL);
  assert(new URL(process.env.DATABASE_URL).pathname.includes('bundle_test'));
  const db = new PrismaClient();
  const stamp = `browser-bundle-${randomUUID()}`;
  const artifacts = process.env.BUNDLE_TEST_ARTIFACT_DIR || '/tmp/booty-browser-artifacts';
  mkdirSync(artifacts, { recursive: true });
  const fixture = (suffix, nameAr, price, stock) => ({
    slug: `${stamp}-${suffix}`, sku: `${stamp}-${suffix}`, name: `Browser ${suffix}`,
    nameAr, price, stock, isFeatured: suffix === 'gel', description: 'A test product description',
    descriptionAr: 'وصف منتج للاختبار', image: '/images/lightening-intimate-gel.jpg',
    category: 'Testing', categoryAr: 'اختبارات',
  });
  let browser;
  const pageErrors = [];
  const checks = [];
  try {
    const first = await db.product.create({ data: fixture('gel', 'جل اختبار المتصفح', 27, 8) });
    const second = await db.product.create({ data: fixture('lotion', 'لوشن اختبار المتصفح', 30, 6) });
    const baseURL = process.env.BUNDLE_TEST_BASE_URL || 'http://127.0.0.1:3100';
    const token = await new SignJWT({ adminId: stamp, username: stamp, role: 'ADMIN' })
      .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('10m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'tbr-secure-super-jwt-secret-key-booty-2026-republic'));
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
    const context = await browser.newContext({ locale: 'ar-JO', viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await context.addCookies([{ name: 'tbr_admin_session', value: token, url: baseURL }]);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => pageErrors.push(error.message));
    const initialStats = page.waitForResponse(response => response.url().endsWith('/api/admin/stats'));
    await page.goto(`${baseURL}/admin`, { waitUntil: 'domcontentloaded' });
    await initialStats;
    await page.getByRole('button', { name: 'المنتجات والمخزون' }).click();
    await page.getByText(first.nameAr, { exact: true }).waitFor().catch(async error => {
      console.log(JSON.stringify({ pageErrors, body: (await page.locator('body').innerText()).slice(-2000) }));
      await page.screenshot({ path: join(artifacts, 'bundle-browser-failure.png') });
      throw error;
    });
    const create = page.getByRole('button', { name: 'إضافة منتج / بكج' });
    await create.click();
    const dialog = page.getByRole('dialog', { name: 'إضافة منتج أو بكج' });
    await dialog.getByRole('radio', { name: 'بكج منتجات', exact: true }).check();
    await dialog.getByLabel('الاسم بالعربية', { exact: true }).fill('بكج اختبار المتصفح');
    await dialog.getByLabel('الاسم بالإنجليزية', { exact: true }).fill(stamp);
    await dialog.getByLabel('سعر البكج كاملًا (د.أ)', { exact: true }).fill('39');
    await dialog.getByLabel('كود السلعة SKU', { exact: true }).fill(stamp);
    await dialog.getByLabel('الوصف بالعربية', { exact: true }).fill('وصف بكج الاختبار');
    await dialog.getByLabel('الوصف بالإنجليزية', { exact: true }).fill('A complete test bundle description');
    await dialog.getByRole('checkbox', { name: new RegExp(first.nameAr) }).check();
    await dialog.getByRole('button', { name: 'حفظ البيانات', exact: true }).click();
    await dialog.getByText('اختر منتجين مختلفين على الأقل لإنشاء البكج').waitFor();
    assert(await dialog.locator('[aria-invalid="true"]').first().evaluate(el => el === document.activeElement));
    checks.push('invalid composition preserves input and focuses the error');
    await dialog.getByRole('checkbox', { name: new RegExp(second.nameAr) }).check();
    await dialog.locator(`#bundle-quantity-${first.id}`).fill('2');
    await dialog.getByText('المخزون المتاح: 4 بكج').waitFor();
    await page.keyboard.press('Escape');
    const discard = page.getByRole('dialog', { name: 'تجاهل التعديلات؟' });
    await discard.waitFor();
    assert(await discard.getByRole('button', { name: 'العودة للتعديل' }).evaluate(el => el === document.activeElement));
    await discard.getByRole('button', { name: 'العودة للتعديل' }).click();
    await dialog.getByLabel('الاسم بالعربية', { exact: true }).focus();
    await page.keyboard.press('Shift+Tab');
    assert(await dialog.evaluate(el => el.contains(document.activeElement)));
    checks.push('dirty cancellation, focus restoration and keyboard containment');
    await page.setViewportSize({ width: 375, height: 812 });
    await dialog.getByRole('button', { name: 'حفظ البيانات', exact: true }).scrollIntoViewIfNeeded();
    const box = await dialog.boundingBox();
    assert(box.width <= 375 && box.height <= 812);
    await page.screenshot({ path: join(artifacts, 'bundle-editor-mobile.png') });
    checks.push('phone dialog fits viewport and save stays reachable');
    await page.route('**/api/admin/products', async route => {
      if (route.request().method() === 'POST') await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    const saved = page.waitForResponse(response => response.url().endsWith('/api/admin/products') && response.request().method() === 'POST');
    await dialog.getByRole('button', { name: 'حفظ البيانات', exact: true }).click();
    assert(await dialog.getByRole('button', { name: 'جارٍ الحفظ…' }).isDisabled());
    const response = await saved;
    assert.equal(response.status(), 201);
    const bundle = (await response.json()).product;
    assert.equal(bundle.stock, 4);
    await dialog.waitFor({ state: 'hidden' });
    await page.unroute('**/api/admin/products');
    await page.setViewportSize({ width: 1280, height: 900 });
    checks.push('real create, derived stock, pending state and list return');

    const bundleRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: stamp, exact: true }) });
    await bundleRow.getByRole('button', { name: 'تعديل', exact: true }).click();
    const edit = page.getByRole('dialog', { name: 'تعديل المنتج أو البكج' });
    await edit.getByLabel('الاسم بالعربية', { exact: true }).fill('بكج محدث من قاعدة البيانات');
    await edit.getByLabel('سعر البكج كاملًا (د.أ)', { exact: true }).fill('41.5');
    const bundlePath = `**/api/admin/products/${bundle.id}`;
    await page.route(bundlePath, route => route.request().method() === 'PUT'
      ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'فشل مؤقت للاختبار؛ أعد المحاولة' }) })
      : route.continue());
    await edit.getByRole('button', { name: 'حفظ البيانات', exact: true }).click();
    await edit.getByRole('alert').waitFor();
    assert.equal(await edit.getByLabel('سعر البكج كاملًا (د.أ)', { exact: true }).inputValue(), '41.5');
    await page.unroute(bundlePath);
    await edit.getByRole('button', { name: 'حفظ البيانات', exact: true }).click();
    await edit.waitFor({ state: 'hidden' });
    checks.push('edit failure preserves data and successful retry saves');

    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    const firstCard = page.getByRole('link', { name: `عرض ${first.nameAr}`, exact: true });
    assert((await firstCard.textContent()).includes('27.00'));
    const firstUpdate = { ...first, nameAr: 'جل بسعر فعلي محدث', price: 48.75, image: '/images/firming-booty-lotion.jpg' };
    const updated = await context.request.put(`${baseURL}/api/admin/products/${first.id}`, { data: firstUpdate });
    assert.equal(updated.status(), 200);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const updatedCard = page.getByRole('link', { name: `عرض ${firstUpdate.nameAr}`, exact: true });
    assert((await updatedCard.textContent()).includes('48.75'));
    assert((await updatedCard.getByRole('img').getAttribute('src')).includes('firming-booty-lotion'));
    checks.push('homepage reflects actual database name, image and price immediately');

    await page.goto(`${baseURL}/products/${bundle.slug}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'محتويات البكج' }).waitFor();
    await page.getByRole('button', { name: 'أضف إلى السلة', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tbr_cart_v1') || '[]').length === 1).catch(async error => {
      console.log(JSON.stringify({ pageErrors, cart: await page.evaluate(() => localStorage.getItem('tbr_cart_v1')), body: (await page.locator('body').innerText()).slice(-2000) }));
      await page.screenshot({ path: join(artifacts, 'bundle-cart-failure.png') });
      throw error;
    });
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('tbr_cart_v1') || '[]'));
    assert.equal(cart.length, 1);
    assert.equal(cart[0].productId, bundle.id);
    assert.equal(cart[0].price, 41.5);
    checks.push('bundle detail and cart use one item with current full price');

    const checkout = await context.request.post(`${baseURL}/api/checkout`, { data: {
      customerName: 'Browser Test', customerPhone: '0790000000', city: 'Amman', address: 'Browser test address',
      items: [{ productId: bundle.id, quantity: 2 }], idempotencyKey: stamp,
    } });
    assert.equal(checkout.status(), 201);
    const order = await db.order.findUniqueOrThrow({ where: { idempotencyKey: stamp }, include: { items: true } });
    assert.equal(order.subtotal, 83);
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].bundleContents.find(component => component.productId === first.id).quantity, 2);
    assert.equal((await db.product.findUniqueOrThrow({ where: { id: first.id } })).stock, 4);
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    const bestSeller = page.getByRole('link', { name: 'عرض بكج محدث من قاعدة البيانات', exact: true });
    assert((await bestSeller.textContent()).includes('المنتج الأكثر طلباً'));
    checks.push('real checkout reserves components and real orders select the homepage bestseller');

    const support = await new SignJWT({ adminId: stamp, username: stamp, role: 'SUPPORT' })
      .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('10m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'tbr-secure-super-jwt-secret-key-booty-2026-republic'));
    await context.addCookies([{ name: 'tbr_admin_session', value: support, url: baseURL }]);
    assert.equal((await context.request.post(`${baseURL}/api/admin/products`, { data: firstUpdate })).status(), 403);
    const supportStats = page.waitForResponse(response => response.url().endsWith('/api/admin/stats'));
    await page.goto(`${baseURL}/admin`, { waitUntil: 'domcontentloaded' });
    await supportStats;
    await page.getByRole('button', { name: 'المنتجات والمخزون' }).click();
    await page.getByText(firstUpdate.nameAr, { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'إضافة منتج / بكج' }).count(), 0);
    checks.push('SUPPORT cannot create bundles in the UI or API');
    assert.deepEqual(pageErrors, []);
    console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
  } finally {
    await browser?.close();
    await db.order.deleteMany({ where: { idempotencyKey: stamp } });
    await db.adminAuditLog.deleteMany({ where: { username: stamp } });
    const fixtures = await db.product.findMany({ where: { sku: { startsWith: stamp } }, select: { id: true } });
    await db.bundleItem.deleteMany({ where: { bundleId: { in: fixtures.map(item => item.id) } } });
    await db.product.deleteMany({ where: { sku: { startsWith: stamp } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
