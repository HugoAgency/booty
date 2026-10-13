// Local image behavior tests use controlled provider responses, not a live Drive file.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { SignJWT } = require('jose');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

async function main() {
  assert(process.env.BUNDLE_TEST_DATABASE_URL);
  assert.equal(process.env.DATABASE_URL, process.env.BUNDLE_TEST_DATABASE_URL);
  assert(new URL(process.env.DATABASE_URL).pathname.includes('bundle_test'));
  const db = new PrismaClient();
  const stamp = `images-${randomUUID()}`;
  const id = '1yfqAXGpznIUZS_aEG5aJ-zAV0SJLiA3f';
  const download = `https://drive.usercontent.google.com/download?id=${id}&export=view&authuser=0`;
  const canonical = `https://lh3.googleusercontent.com/d/${id}`;
  const privateId = 'private_image_fixture_12345';
  const slowId = 'slow_image_fixture_12345';
  const privateLink = `https://drive.google.com/file/d/${privateId}/view`;
  const baseURL = process.env.BUNDLE_TEST_BASE_URL || 'http://127.0.0.1:3100';
  const artifacts = process.env.BUNDLE_TEST_ARTIFACT_DIR || '/tmp/booty-browser-artifacts';
  mkdirSync(artifacts, { recursive: true });
  const body = readFileSync(join(process.cwd(), 'public/images/lightening-intimate-gel.jpg'));
  const checks = [], errors = [];
  let browser, rawDownloads = 0, rejectPrivate = true;
  let finishSlow;
  const slowFinished = new Promise(resolve => { finishSlow = resolve; });
  const check = async (name, action) => { await action(); checks.push(name); console.log(`PASS: ${name}`); };
  try {
    await db.adminUser.create({ data: { id: stamp, username: stamp, name: 'Image browser admin', role: 'ADMIN', passwordHash: 'unused-test-fixture' } });
    let product = await db.product.create({ data: { name: stamp, nameAr: 'منتج اختبار صور Drive', sku: stamp, slug: stamp,
      description: 'Actual image test description', descriptionAr: 'وصف اختبار الصور', price: 35, stock: 9,
      image: download, category: 'Testing', categoryAr: 'اختبارات', createdAt: new Date(0) } });
    const companion = await db.product.create({ data: { name: `${stamp}-companion`, nameAr: 'منتج مكون للصور', sku: `${stamp}-companion`, slug: `${stamp}-companion`,
      description: 'Companion description', descriptionAr: 'وصف المنتج المكون', price: 20, stock: 8,
      image: '/images/logo.jpg', category: 'Testing', categoryAr: 'اختبارات', createdAt: new Date(1000) } });
    const sales = await db.orderItem.groupBy({ by: ['productId'], where: { order: { status: { not: 'CANCELLED' } } }, _sum: { quantity: true } });
    const quantity = Math.max(0, ...sales.map(item => item._sum.quantity || 0)) + 1;
    await db.order.create({ data: { orderNumber: `TEST-${stamp}`, idempotencyKey: stamp,
      customerName: 'Image fixture', customerPhone: '0790000000', city: 'Amman', address: 'Test address',
      subtotal: 35 * quantity, totalAmount: 35 * quantity, status: 'COMPLETED',
      items: { create: { productId: product.id, productName: product.name, productNameAr: product.nameAr,
        productSku: product.sku, unitPrice: 35, quantity, lineTotal: 35 * quantity } } } });
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
    const context = await browser.newContext({ locale: 'ar-JO', viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    // Keep this controlled test offline for every external destination.
    await context.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin
      ? route.continue() : route.abort());
    await context.route('https://lh3.googleusercontent.com/d/**', async route => {
      if (route.request().url().endsWith(slowId)) {
        await new Promise(resolve => setTimeout(resolve, 900));
        try { await route.fulfill({ status: 403, contentType: 'text/html', body: 'Superseded image fixture' }); }
        finally { finishSlow(); }
      }
      else if (rejectPrivate && route.request().url().endsWith(privateId)) await route.fulfill({ status: 403, contentType: 'text/html', body: 'Private image fixture' });
      else await route.fulfill({ status: 200, contentType: 'image/jpeg', body });
    });
    await context.route('https://drive.usercontent.google.com/**', async route => {
      rawDownloads++; await route.fulfill({ status: 403, contentType: 'text/html', body: 'Download/account page fixture' });
    });
    const token = await new SignJWT({ adminId: stamp, username: stamp, role: 'ADMIN' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('20m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'tbr-secure-super-jwt-secret-key-booty-2026-republic'));
    await context.addCookies([{ name: 'tbr_admin_session', value: token, url: baseURL }]);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    const loaded = async (locator, source) => {
      await locator.waitFor();
      await page.waitForFunction(element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0, await locator.elementHandle());
      assert.equal(await locator.getAttribute('src'), source);
    };
    const openEditor = async () => {
      await page.goto(`${baseURL}/admin`);
      await page.getByRole('button', { name: 'إدارة المنتجات والمخزون', exact: true }).click();
      await page.getByRole('row').filter({ has: page.getByRole('cell', { name: stamp, exact: true }) }).getByRole('button', { name: 'تعديل', exact: true }).click();
      return page.getByRole('dialog', { name: 'تعديل المنتج أو البكج' });
    };

    await check('existing download links render directly as images in detail and metadata', async () => {
      await page.goto(`${baseURL}/products/${product.slug}`);
      await loaded(page.locator('main').getByRole('img', { name: product.nameAr, exact: true }).first(), canonical);
      assert.equal(await page.locator('meta[property="og:image"]').first().getAttribute('content'), canonical);
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).image, download);
    });
    await check('hero, catalog and Instagram share the normalized product image', async () => {
      await page.goto(baseURL);
      await loaded(page.getByRole('link', { name: `عرض ${product.nameAr}`, exact: true }).getByRole('img'), canonical);
      await loaded(page.locator('#products').getByRole('img', { name: product.nameAr, exact: true }), canonical);
      await loaded(page.locator('#instagram').getByRole('img', { name: product.nameAr, exact: true }), canonical);
    });
    await check('cart and checkout display the same saved Drive image', async () => {
      await page.goto(`${baseURL}/products/${product.slug}`);
      await page.getByRole('button', { name: 'أضف إلى السلة', exact: true }).click();
      await loaded(page.locator('.fixed.inset-0.z-50').getByRole('img', { name: product.nameAr, exact: true }), canonical);
      await page.getByRole('button', { name: 'إغلاق السلة', exact: true }).click();
      await page.goto(`${baseURL}/checkout`);
      await loaded(page.locator('main').getByRole('img', { name: product.nameAr, exact: true }), canonical);
    });
    let dialog = await openEditor();
    await check('admin preview loads existing links and reports private-image failures', async () => {
      await dialog.getByText('تم تحميل معاينة الصورة.', { exact: true }).waitFor();
      await loaded(dialog.getByRole('img', { name: 'معاينة صورة السلعة', exact: true }), canonical);
      await dialog.getByLabel('مسار الصورة أو رابطها', { exact: true }).fill(privateLink);
      await dialog.getByText('تعذر تحميل الصورة. تحقق من أن الرابط عام ويعرض ملف صورة، ثم أعد المحاولة.', { exact: true }).waitFor();
      assert.equal(await dialog.getByLabel('مسار الصورة أو رابطها', { exact: true }).inputValue(), privateLink);
      await page.setViewportSize({ width: 375, height: 812 });
      await dialog.getByRole('button', { name: 'إعادة تحميل معاينة الصورة', exact: true }).scrollIntoViewIfNeeded();
      const bounds = await dialog.boundingBox();
      assert(bounds.width <= 375 && bounds.height <= 812);
      await page.screenshot({ path: join(artifacts, 'drive-image-preview-mobile.png') });
    });
    await check('preview retries by keyboard and validation preserves all editor values', async () => {
      rejectPrivate = false;
      await dialog.getByRole('button', { name: 'إعادة تحميل معاينة الصورة', exact: true }).focus();
      await page.keyboard.press('Enter');
      await dialog.getByText('تم تحميل معاينة الصورة.', { exact: true }).waitFor();
      await dialog.getByLabel('مسار الصورة أو رابطها', { exact: true }).fill('not-a-url');
      await dialog.getByRole('button', { name: 'حفظ البيانات', exact: true }).click();
      await dialog.getByText('أدخل مسارًا يبدأ بـ / أو رابط صورة كاملًا يبدأ بـ https:// أو http://', { exact: true }).waitFor();
      assert(await dialog.getByLabel('مسار الصورة أو رابطها', { exact: true }).evaluate(el => el === document.activeElement));
      assert.equal(await dialog.getByLabel('السعر (د.أ)', { exact: true }).inputValue(), '35');
      await dialog.getByLabel('مسار الصورة أو رابطها', { exact: true }).fill(download);
      await dialog.getByText('تم تحميل معاينة الصورة.', { exact: true }).waitFor();
      const response = page.waitForResponse(r => r.url().endsWith(`/api/admin/products/${product.id}`) && r.request().method() === 'PUT');
      await dialog.getByRole('button', { name: 'حفظ البيانات', exact: true }).click();
      const result = await response; assert(result.ok());
      product = (await result.json()).product;
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(product.image, canonical);
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).image, canonical);
    });
    await check('superseded preview failures cannot replace a newer image and dirty cancellation preserves data', async () => {
      dialog = await openEditor();
      const requested = page.waitForRequest(request => request.url().endsWith(`/d/${slowId}`));
      await dialog.getByLabel('مسار الصورة أو رابطها', { exact: true }).fill(`https://drive.google.com/file/d/${slowId}/view`);
      await requested;
      await dialog.getByLabel('مسار الصورة أو رابطها', { exact: true }).fill(download);
      await dialog.getByText('تم تحميل معاينة الصورة.', { exact: true }).waitFor();
      await slowFinished;
      await loaded(dialog.getByRole('img', { name: 'معاينة صورة السلعة', exact: true }), canonical);
      assert.equal(await dialog.getByRole('button', { name: 'إعادة تحميل معاينة الصورة', exact: true }).count(), 0);
      await dialog.getByRole('button', { name: 'إلغاء', exact: true }).click();
      const discard = page.getByRole('dialog', { name: 'تجاهل التعديلات؟', exact: true });
      await discard.getByRole('button', { name: 'العودة للتعديل', exact: true }).click();
      assert.equal(await dialog.getByLabel('مسار الصورة أو رابطها', { exact: true }).inputValue(), download);
      await dialog.getByRole('button', { name: 'إلغاء', exact: true }).click();
      await discard.getByRole('button', { name: 'تجاهل التعديلات', exact: true }).click();
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).image, canonical);
    });
    let bundle;
    await check('bundle saves normalize their picture and display component pictures', async () => {
      const response = await context.request.post(`${baseURL}/api/admin/products`, { data: { ...product,
        name: `${stamp}-bundle`, nameAr: 'بكج اختبار صور Drive', sku: `${stamp}-bundle`, image: download, isBundle: true,
        bundleItems: [{ productId: product.id, quantity: 1 }, { productId: companion.id, quantity: 1 }] } });
      assert(response.ok()); bundle = (await response.json()).product;
      assert.equal(bundle.image, canonical);
      await page.goto(`${baseURL}/products/${bundle.slug}`);
      await loaded(page.locator('main').getByRole('img', { name: bundle.nameAr, exact: true }), canonical);
      await loaded(page.locator('main').getByRole('img', { name: product.nameAr, exact: true }).first(), canonical);
    });
    await check('failed public images use an honest placeholder with stable phone layout', async () => {
      rejectPrivate = true;
      await db.product.update({ where: { id: product.id }, data: { image: privateLink } });
      await page.goto(`${baseURL}/products/${product.slug}`);
      await page.locator('main').getByRole('img', { name: `الصورة غير متاحة: ${product.nameAr}`, exact: true }).first().waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: join(artifacts, 'drive-image-unavailable-mobile.png'), fullPage: true });
    });
    await check('malformed existing image sources cannot crash a page or metadata', async () => {
      await db.product.update({ where: { id: product.id }, data: { image: 'not-a-url' } });
      const response = await page.goto(`${baseURL}/products/${product.slug}`);
      assert(response.ok());
      await page.getByRole('heading', { name: product.nameAr, exact: true }).waitFor();
      await page.locator('main').getByRole('img', { name: `الصورة غير متاحة: ${product.nameAr}`, exact: true }).first().waitFor();
    });
    assert.equal(rawDownloads, 0);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
  } finally {
    await browser?.close();
    await db.order.deleteMany({ where: { idempotencyKey: stamp } });
    await db.bundleItem.deleteMany({ where: { bundle: { sku: { startsWith: stamp } } } });
    await db.product.deleteMany({ where: { sku: { startsWith: stamp } } });
    await db.adminAuditLog.deleteMany({ where: { username: stamp } });
    await db.adminUser.deleteMany({ where: { id: stamp } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
