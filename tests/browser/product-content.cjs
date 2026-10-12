// Run sequentially against the dedicated bundle_test database and a running app.
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
  const stamp = `content-${randomUUID()}`;
  const baseURL = process.env.BUNDLE_TEST_BASE_URL || 'http://127.0.0.1:3100';
  const artifacts = process.env.BUNDLE_TEST_ARTIFACT_DIR || '/tmp/booty-browser-artifacts';
  mkdirSync(artifacts, { recursive: true });
  const checks = [], errors = [];
  let browser;
  try {
    await db.adminUser.create({ data: { id: stamp, username: stamp, name: 'Content test admin', role: 'ADMIN', passwordHash: 'unused-test-fixture' } });
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
    const context = await browser.newContext({ locale: 'ar-JO', viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const token = await new SignJWT({ adminId: stamp, username: stamp, role: 'ADMIN' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('20m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'tbr-secure-super-jwt-secret-key-booty-2026-republic'));
    await context.addCookies([{ name: 'tbr_admin_session', value: token, url: baseURL }]);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    const productsTab = async () => {
      await page.goto(`${baseURL}/admin`);
      await page.getByRole('button', { name: 'إدارة المنتجات والمخزون', exact: true }).click();
    };
    const row = () => page.getByRole('row').filter({ has: page.getByRole('cell', { name: stamp, exact: true }) });
    const openEditor = async () => {
      await productsTab();
      await row().getByRole('button', { name: 'تعديل', exact: true }).click();
      return page.getByRole('dialog', { name: 'تعديل المنتج أو البكج' });
    };
    const save = async dialog => {
      const response = page.waitForResponse(r => r.url().includes('/api/admin/products') && ['POST', 'PUT'].includes(r.request().method()));
      await dialog.getByRole('button', { name: 'حفظ البيانات', exact: true }).click();
      const result = await response;
      assert(result.ok(), await result.text());
      await dialog.waitFor({ state: 'hidden' });
      return (await result.json()).product;
    };
    const detail = async (product, tab, text) => {
      await page.goto(`${baseURL}/products/${product.slug}`);
      await page.getByRole('button', { name: tab, exact: true }).click();
      await page.locator('main').getByText(text, { exact: true }).waitFor();
    };

    await productsTab();
    await page.getByRole('button', { name: 'إضافة منتج / بكج', exact: true }).click();
    let dialog = page.getByRole('dialog', { name: 'إضافة منتج أو بكج' });
    const initial = {
      'الاسم بالعربية': 'منتج اختبار تفاصيل المدير', 'الاسم بالإنجليزية': stamp, 'السعر (د.أ)': '35',
      'كود السلعة SKU': stamp, 'المخزون الحالي': '9', 'الحجم / السعة (اختياري)': '60 مل',
      'العنوان الفرعي بالعربية (اختياري)': 'عنوان فرعي عربي محفوظ', 'العنوان الفرعي بالإنجليزية (اختياري)': 'Saved English subtitle',
      'الوصف بالعربية': 'المزايا المحفوظة\nالسطر الثاني', 'الوصف بالإنجليزية': 'Actual saved benefits',
      'طريقة الاستخدام بالعربية (اختياري)': 'الخطوة الأولى\nالخطوة الثانية', 'طريقة الاستخدام بالإنجليزية (اختياري)': 'First step\nSecond step',
      'المكونات الفعالة بالعربية (اختياري)': 'مكونات الاختبار\n<script>window.contentXss=true</script>',
      'المكونات الفعالة بالإنجليزية (اختياري)': 'Ingredient A\nIngredient B',
    };
    for (const [label, value] of Object.entries(initial)) await dialog.getByLabel(label, { exact: true }).fill(value);
    let product = await save(dialog);
    const saved = await db.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.equal(saved.howToUseAr, initial['طريقة الاستخدام بالعربية (اختياري)']);
    assert.equal(saved.ingredients, initial['المكونات الفعالة بالإنجليزية (اختياري)']);
    assert.equal(saved.subtitleAr, initial['العنوان الفرعي بالعربية (اختياري)']);
    checks.push('admin creates Arabic/English content and subtitles in the actual database');

    await detail(product, 'طريقة الاستخدام', saved.howToUseAr);
    assert.equal(await page.getByText(saved.howToUseAr, { exact: true }).evaluate(el => getComputedStyle(el).whiteSpace), 'pre-wrap');
    await page.getByRole('button', { name: 'المكونات الفعالة', exact: true }).click();
    await page.getByText(saved.ingredientsAr, { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.contentXss), undefined);
    await page.getByText(saved.subtitleAr, { exact: true }).waitFor();
    checks.push('product tabs show saved multiline Arabic, subtitle and safe literal text');

    const legacy = { ...product, price: 36 };
    for (const key of ['howToUse', 'howToUseAr', 'ingredients', 'ingredientsAr']) delete legacy[key];
    const legacySave = await context.request.put(`${baseURL}/api/admin/products/${product.id}`, { data: legacy });
    assert(legacySave.ok());
    assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).howToUseAr, saved.howToUseAr);
    checks.push('legacy full-product edits preserve omitted content fields');

    dialog = await openEditor();
    assert.equal(await dialog.getByLabel('طريقة الاستخدام بالعربية (اختياري)', { exact: true }).inputValue(), saved.howToUseAr);
    const updatedUsage = 'طريقة استخدام محدثة من المدير\nمع سطر إضافي';
    await dialog.getByLabel('طريقة الاستخدام بالعربية (اختياري)', { exact: true }).fill(updatedUsage);
    await page.route(`**/api/admin/products/${product.id}`, route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false,"error":"تعذر حفظ محتوى الاختبار"}' }));
    await dialog.getByRole('button', { name: 'حفظ البيانات', exact: true }).click();
    await dialog.getByRole('alert').getByText('تعذر حفظ محتوى الاختبار', { exact: true }).waitFor();
    assert.equal(await dialog.getByLabel('طريقة الاستخدام بالعربية (اختياري)', { exact: true }).inputValue(), updatedUsage);
    await page.unroute(`**/api/admin/products/${product.id}`);
    await dialog.getByLabel('المكونات الفعالة بالعربية (اختياري)', { exact: true }).fill('x'.repeat(5001));
    await dialog.getByRole('button', { name: 'حفظ البيانات', exact: true }).click();
    await dialog.getByText('النص يجب ألا يتجاوز 5000 حرف', { exact: true }).waitFor();
    assert(await dialog.getByLabel('المكونات الفعالة بالعربية (اختياري)', { exact: true }).evaluate(el => el === document.activeElement && el.getAttribute('aria-invalid') === 'true'));
    await dialog.getByLabel('المكونات الفعالة بالعربية (اختياري)', { exact: true }).fill('مكونات محدثة');
    product = await save(dialog);
    await detail(product, 'طريقة الاستخدام', updatedUsage);
    checks.push('failed saves and invalid content retain drafts, focus errors and recover');

    dialog = await openEditor();
    await dialog.getByLabel('طريقة الاستخدام بالعربية (اختياري)', { exact: true }).fill('   ');
    await dialog.getByLabel('المكونات الفعالة بالعربية (اختياري)', { exact: true }).fill('');
    product = await save(dialog);
    assert.equal(product.howToUseAr, null);
    assert.equal(product.ingredientsAr, null);
    await detail(product, 'طريقة الاستخدام', saved.howToUse);
    await detail(product, 'المكونات الفعالة', saved.ingredients);
    checks.push('clearing Arabic saves null and displays the saved English fallback');

    dialog = await openEditor();
    await page.setViewportSize({ width: 375, height: 812 });
    const longText = 'طريقة طويلة للاختبار\n' + 'word'.repeat(400);
    await dialog.getByLabel('طريقة الاستخدام بالعربية (اختياري)', { exact: true }).fill(longText);
    assert.equal(await dialog.getByLabel('طريقة الاستخدام بالعربية (اختياري)', { exact: true }).evaluate(el => getComputedStyle(el).resize), 'none');
    await dialog.getByRole('button', { name: 'حفظ البيانات', exact: true }).scrollIntoViewIfNeeded();
    const bounds = await dialog.boundingBox();
    assert(bounds.width <= 375 && bounds.height <= 812);
    await page.screenshot({ path: join(artifacts, 'product-content-editor-mobile.png') });
    product = await save(dialog);
    await detail(product, 'طريقة الاستخدام', longText);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(artifacts, 'product-content-detail-mobile.png'), fullPage: true });
    checks.push('long text and the complete editor remain usable at a phone viewport');

    dialog = await openEditor();
    for (const label of ['طريقة الاستخدام بالعربية (اختياري)', 'طريقة الاستخدام بالإنجليزية (اختياري)', 'المكونات الفعالة بالعربية (اختياري)', 'المكونات الفعالة بالإنجليزية (اختياري)', 'الحجم / السعة (اختياري)']) {
      await dialog.getByLabel(label, { exact: true }).fill('');
    }
    product = await save(dialog);
    await detail(product, 'طريقة الاستخدام', 'لم تُضف طريقة الاستخدام لهذا المنتج بعد.');
    await detail(product, 'المكونات الفعالة', 'لم تُضف المكونات الفعالة لهذا المنتج بعد.');
    assert.equal(await page.getByText('الحجم القياسي', { exact: true }).count(), 0);
    assert.equal(await page.getByText('60 مل', { exact: true }).count(), 0);
    checks.push('empty content is explicitly missing and absent size is not invented');

    await page.getByRole('button', { name: 'طريقة الاستخدام', exact: true }).click();
    const liveUpdate = await context.request.put(`${baseURL}/api/admin/products/${product.id}`, { data: { ...product, howToUseAr: 'محتوى جديد لصفحة مفتوحة' } });
    assert(liveUpdate.ok());
    product = (await liveUpdate.json()).product;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.getByText('محتوى جديد لصفحة مفتوحة', { exact: true }).waitFor();
    checks.push('an already open product page revalidates newly saved content on focus');

    const companion = await db.product.create({ data: { name: `${stamp}-component`, nameAr: 'منتج مكون للاختبار', slug: `${stamp}-component`, sku: `${stamp}-component`,
      description: 'Companion description', descriptionAr: 'وصف المنتج المكون', price: 19, stock: 5, image: '/images/logo.jpg', category: 'Testing', categoryAr: 'اختبارات' } });
    const bundleResponse = await context.request.post(`${baseURL}/api/admin/products`, { data: { ...product, name: `${stamp}-bundle`, sku: `${stamp}-bundle`, isBundle: true,
      howToUseAr: 'تعليمات خاصة بالبكج', ingredientsAr: 'مكونات كل سلعة موضحة على عبوتها',
      bundleItems: [{ productId: product.id, quantity: 1 }, { productId: companion.id, quantity: 1 }] } });
    assert(bundleResponse.ok());
    const bundle = (await bundleResponse.json()).product;
    await detail(bundle, 'طريقة الاستخدام', 'تعليمات خاصة بالبكج');
    await detail(bundle, 'المكونات الفعالة', 'مكونات كل سلعة موضحة على عبوتها');
    checks.push('bundle content is independently saved and displayed through the same product contract');

    await db.adminUser.update({ where: { id: stamp }, data: { role: 'SUPPORT' } });
    const forbidden = await context.request.put(`${baseURL}/api/admin/products/${product.id}`, { data: { ...product, ingredientsAr: 'Unauthorized content' } });
    assert.equal(forbidden.status(), 403);
    await productsTab();
    await row().waitFor();
    assert.equal(await page.getByRole('button', { name: 'تعديل', exact: true }).count(), 0);
    assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).ingredientsAr, null);
    checks.push('SUPPORT cannot modify content using UI or direct API with an existing JWT');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
  } finally {
    await browser?.close();
    await db.bundleItem.deleteMany({ where: { bundle: { sku: { startsWith: stamp } } } });
    await db.product.deleteMany({ where: { sku: { startsWith: stamp } } });
    await db.adminAuditLog.deleteMany({ where: { username: stamp } });
    await db.adminUser.deleteMany({ where: { id: stamp } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
