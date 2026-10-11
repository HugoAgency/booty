/* Requires a running app using the same dedicated bundle_test database. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { SignJWT } = require('jose');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

async function main() {
  assert(process.env.BUNDLE_TEST_DATABASE_URL);
  assert.equal(process.env.DATABASE_URL, process.env.BUNDLE_TEST_DATABASE_URL);
  assert(new URL(process.env.DATABASE_URL).pathname.includes('bundle_test'));
  const db = new PrismaClient();
  const stamp = `shipping-browser-${randomUUID()}`;
  const baseURL = process.env.BUNDLE_TEST_BASE_URL || 'http://127.0.0.1:3100';
  const artifacts = process.env.BUNDLE_TEST_ARTIFACT_DIR || '/tmp/booty-browser-artifacts';
  mkdirSync(artifacts, { recursive: true });
  const original = await db.shippingConfig.findUnique({ where: { id: 'default' } });
  let browser, product, orderId, settingsChanged = false;
  const errors = [], checks = [];
  const rules = { isFreeShippingPromo: false, freeShippingThreshold: 88, standardFee: 5,
    ammanFee: 4.75, outerGovernoratesFee: 6.25, estimatedDeliveryTime: '5 - 7 أيام عمل' };
  try {
    product = await db.product.create({ data: { name: stamp, nameAr: 'منتج اختبار التوصيل',
      slug: stamp, sku: stamp, price: 19.5, stock: 20, image: '/images/logo.jpg',
      description: 'Shipping browser fixture', descriptionAr: 'وصف منتج اختبار التوصيل', category: 'Testing', categoryAr: 'اختبارات' } });
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
    const context = await browser.newContext({ locale: 'ar-JO', viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const token = await new SignJWT({ adminId: stamp, username: stamp, role: 'ADMIN' })
      .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('10m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'tbr-secure-super-jwt-secret-key-booty-2026-republic'));
    await context.addCookies([{ name: 'tbr_admin_session', value: token, url: baseURL }]);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    const stats = page.waitForResponse(response => response.url().endsWith('/api/admin/stats'));
    await page.goto(`${baseURL}/admin`);
    await stats;
    const loaded = page.waitForResponse(response => response.url().endsWith('/api/admin/settings/shipping'));
    await page.getByRole('button', { name: 'إعدادات التوصيل والرسوم' }).click();
    await loaded;
    await page.getByRole('button', { name: 'حفظ إعدادات التوصيل' }).waitFor();
    await page.getByRole('checkbox').uncheck();
    for (const [label, value] of [['الحد الأدنى للطلب للتوصيل المجاني (د.أ)', '88'],
      ['رسوم التوصيل داخل عمّان (د.أ)', '4.75'], ['رسوم التوصيل لباقي المحافظات (د.أ)', '6.25']]) {
      await page.locator('label').filter({ hasText: label }).locator('..').getByRole('spinbutton').fill(value);
    }
    await page.getByPlaceholder('مثال: 1 - 3 أيام عمل').fill('');
    await page.getByRole('button', { name: 'حفظ إعدادات التوصيل' }).click();
    await page.getByRole('alert').filter({ hasText: 'مدة التوصيل مطلوبة' }).waitFor();
    assert(await page.getByLabel('مدة التوصيل المعروضة للزبائن').evaluate(el => el === document.activeElement));
    assert.equal(await page.getByLabel('رسوم التوصيل داخل عمّان (د.أ)').inputValue(), '4.75');
    checks.push('invalid administrator settings preserve rates and focus the invalid field');
    await page.getByPlaceholder('مثال: 1 - 3 أيام عمل').fill(rules.estimatedDeliveryTime);
    settingsChanged = true;
    const saved = page.waitForResponse(response => response.url().endsWith('/api/admin/settings/shipping') && response.request().method() === 'PUT');
    await page.getByRole('button', { name: 'حفظ إعدادات التوصيل' }).click();
    assert((await saved).ok());
    await page.locator('header').getByText('توصيل مجاني للطلبات بقيمة 88.00 د.أ أو أكثر', { exact: true }).waitFor();
    checks.push('admin save updates the shared shipping display without reload');

    await page.route('**/api/shipping/rules', async route => {
      await new Promise(resolve => setTimeout(resolve, 900));
      await route.continue();
    });
    await page.goto(`${baseURL}/products/${product.slug}`, { waitUntil: 'domcontentloaded' });
    await page.getByText('جارٍ تحديث بيانات التوصيل…').first().waitFor();
    assert(!await page.getByText('السعر يشمل الضريبة والشحن المجاني').count());
    await page.locator('main').getByText(`مدة التوصيل: ${rules.estimatedDeliveryTime}`, { exact: true }).waitFor();
    await page.unroute('**/api/shipping/rules');
    await page.locator('main').getByText(/عمّان 4.75 د.أ، باقي المحافظات 6.25 د.أ/).waitFor();
    checks.push('product delivery duration and city rates reflect saved settings after loading');
    await page.setViewportSize({ width: 375, height: 812 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(artifacts, 'shipping-product-mobile.png'), fullPage: true });
    checks.push('delivery messages fit a phone viewport');

    const add = page.getByRole('button', { name: 'أضف إلى السلة', exact: true });
    await add.click();
    await page.waitForFunction(() => (JSON.parse(localStorage.getItem('tbr_cart_v1') || '[]')).length === 1);
    await page.getByText('الإجمالي قبل رسوم التوصيل:', { exact: true }).waitFor();
    assert(!await page.getByText('مجاناً / Free', { exact: true }).count());
    await page.getByRole('button', { name: 'إغلاق السلة', exact: true }).click();
    checks.push('cart does not promise free shipping before city selection');

    await page.goto(`${baseURL}/checkout`);
    const submit = page.getByRole('button', { name: 'تأكيد وإرسال الطلب (24.25 د.أ)', exact: true });
    await submit.waitFor();
    await page.getByLabel('المحافظة / المدينة').selectOption('إربد');
    await page.getByRole('button', { name: 'تأكيد وإرسال الطلب (25.75 د.أ)', exact: true }).waitFor();
    await page.getByLabel('المحافظة / المدينة').selectOption('عمّان (العاصمة)');
    await page.getByLabel('الاسم الكامل').fill('اختبار بيانات التوصيل');
    await page.getByLabel('رقم الهاتف / الخلوي').fill('0790000000');
    await page.getByLabel('عنوان التوصيل بالتفصيل').fill('عنوان اختبار التوصيل في عمان');
    await page.getByLabel('البريد الإلكتروني').fill('invalid-email');
    await submit.click();
    await page.getByRole('alert').filter({ hasText: 'البريد الإلكتروني غير صالح' }).waitFor();
    assert(await page.getByLabel('البريد الإلكتروني').evaluate(el => el === document.activeElement));
    await page.getByLabel('البريد الإلكتروني').fill('');
    checks.push('checkout validation preserves customer data and focuses invalid input');
    const changed = await context.request.put(`${baseURL}/api/admin/settings/shipping`, { data: { ...rules, ammanFee: 5.75 } });
    assert(changed.ok());
    let checkoutPosts = 0;
    page.on('request', request => { if (request.url().endsWith('/api/checkout') && request.method() === 'POST') checkoutPosts++; });
    await submit.click();
    await page.getByRole('alert').filter({ hasText: 'تحدّثت رسوم التوصيل' }).waitFor();
    assert.equal(checkoutPosts, 0);
    const updatedSubmit = page.getByRole('button', { name: 'تأكيد وإرسال الطلب (25.25 د.أ)', exact: true });
    assert(await updatedSubmit.isEnabled());
    checks.push('checkout rechecks changed city fees and asks for confirmation of the new total');
    const ordered = page.waitForResponse(response => response.url().endsWith('/api/checkout') && response.request().method() === 'POST');
    await updatedSubmit.click();
    const orderResponse = await ordered;
    const orderData = await orderResponse.json();
    orderId = orderData.orderId;
    assert(orderResponse.ok());
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    assert.equal(order.shippingFee, 5.75);
    assert.equal(order.totalAmount, 25.25);
    checks.push('saved order uses the current administrator-configured delivery fee');

    await context.request.put(`${baseURL}/api/admin/settings/shipping`, { data: { ...rules, isFreeShippingPromo: true, estimatedDeliveryTime: 'موعد توصيل محدث' } });
    await page.goto(`${baseURL}/products/${product.slug}`);
    await page.locator('header').getByText('توصيل مجاني لجميع الطلبات في الأردن', { exact: true }).waitFor();
    await page.locator('main').getByText('مدة التوصيل: موعد توصيل محدث', { exact: true }).waitFor();
    checks.push('free delivery promotion and revised delivery time update on product navigation');

    await page.goto(baseURL);
    await page.getByRole('button', { name: 'ما هي طرق الدفع المتاحة وكيف تتم عملية الشحن؟', exact: true }).click();
    await page.locator('#faq').getByText('توصيل مجاني لجميع الطلبات في الأردن', { exact: true }).waitFor();
    await page.locator('footer').getByText('مدة التوصيل: موعد توصيل محدث', { exact: true }).waitFor();
    checks.push('FAQ and footer use the same saved delivery policy');

    await page.route('**/api/shipping/rules', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false}' }));
    await page.goto(`${baseURL}/products/${product.slug}`);
    await page.locator('main').getByText('تعذر تحميل بيانات التوصيل.').first().waitFor();
    assert(!await page.locator('header').getByText('توصيل مجاني لجميع الطلبات في الأردن', { exact: true }).count());
    await page.unroute('**/api/shipping/rules');
    const retry = page.locator('main').getByRole('button', { name: 'إعادة المحاولة', exact: true }).first();
    await retry.focus();
    await page.keyboard.press('Enter');
    await page.locator('main').getByText('مدة التوصيل: موعد توصيل محدث', { exact: true }).waitFor();
    checks.push('unavailable settings show an honest error and recover by keyboard retry');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
  } finally {
    await browser?.close();
    if (orderId) await db.order.delete({ where: { id: orderId } });
    if (product) await db.product.delete({ where: { id: product.id } });
    if (settingsChanged) {
      if (original) { const { id, ...data } = original; await db.shippingConfig.upsert({ where: { id }, create: original, update: data }); }
      else await db.shippingConfig.deleteMany({ where: { id: 'default' } });
    }
    await db.adminAuditLog.deleteMany({ where: { username: stamp } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
