/* Regression audit: run only against the explicitly opted-in local bundle_test database. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { SignJWT } = require('jose');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

async function main() {
  assert(process.env.BUNDLE_TEST_DATABASE_URL);
  assert.equal(process.env.DATABASE_URL, process.env.BUNDLE_TEST_DATABASE_URL);
  assert(new URL(process.env.DATABASE_URL).pathname.includes('bundle_test'));
  const db = new PrismaClient();
  const key = randomUUID().replaceAll('-', '').slice(0, 18);
  const stamp = `qa_${key}`;
  const username = `${stamp}_owner`;
  const memberUsername = `${stamp}_member`;
  const initialPassword = `QaInitial2026_${key}`;
  const changedPassword = `QaChanged2026_${key}`;
  const baseURL = process.env.BUNDLE_TEST_BASE_URL || 'http://127.0.0.1:3100';
  const artifacts = process.env.BUNDLE_TEST_ARTIFACT_DIR || '/tmp/booty-browser-artifacts';
  mkdirSync(artifacts, { recursive: true });
  const originalShipping = await db.shippingConfig.findUnique({ where: { id: 'default' } });
  const rules = { isFreeShippingPromo: false, freeShippingThreshold: 40, standardFee: 3,
    ammanFee: 2, outerGovernoratesFee: 3.5, estimatedDeliveryTime: '2 - 6 أيام عمل' };
  let browser, productA, productB, owner, checkoutOrderId, shippingChanged = false;
  const errors = [], checks = [];
  const check = async (name, action) => { await action(); checks.push(name); console.log(`PASS: ${name}`); };
  try {
    owner = await db.adminUser.create({ data: { username, name: 'مشرف من قاعدة البيانات', role: 'SUPER_ADMIN', passwordHash: await bcrypt.hash(initialPassword, 10) } });
    const fixture = (suffix, nameAr, price, isFeatured) => ({ slug: `${stamp}-${suffix}`, sku: `${stamp}-${suffix}`,
      name: `${stamp}-${suffix}`, nameAr, price, isFeatured, stock: 6, image: '/images/lightening-intimate-gel.jpg',
      description: 'Current database description', descriptionAr: 'وصف مخصص من قاعدة البيانات', category: 'Tests', categoryAr: 'اختبارات' });
    productA = await db.product.create({ data: fixture('A', 'منتج اختبار السلة', 19, false) });
    productB = await db.product.create({ data: fixture('B', 'منتج اختبار مميز', 29, true) });
    shippingChanged = true;
    await db.shippingConfig.upsert({ where: { id: 'default' }, update: rules, create: { id: 'default', ...rules } });
    for (const [suffix, product, createdAt] of [['A', productA, '2026-10-11T21:15:00Z'], ['B', productB, '2026-10-12T19:15:00Z']]) {
      await db.order.create({ data: { orderNumber: `${stamp}-${suffix}`, idempotencyKey: `${stamp}-${suffix}`,
        customerName: `${stamp} customer`, customerPhone: '0790000000', city: 'Amman', address: 'Test address',
        subtotal: product.price, totalAmount: product.price, createdAt: new Date(createdAt),
        items: { create: { productId: product.id, productName: product.name, productNameAr: product.nameAr,
          productSku: product.sku, unitPrice: product.price, quantity: 1, lineTotal: product.price } } } });
    }
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
    const context = await browser.newContext({ locale: 'ar-JO', timezoneId: 'Asia/Amman', viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const token = await new SignJWT({ adminId: owner.id, username, role: 'SUPER_ADMIN' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('20m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'tbr-secure-super-jwt-secret-key-booty-2026-republic'));
    await context.addCookies([{ name: 'tbr_admin_session', value: token, url: baseURL }]);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));

    await check('home honors featured sorting and the actual product data', async () => {
      await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      await page.locator('#products h3').getByText(productB.nameAr, { exact: true }).waitFor();
      const names = await page.locator('#products h3').allTextContents();
      const featuredIndex = names.findIndex(name => name.trim() === productB.nameAr);
      const ordinaryIndex = names.findIndex(name => name.trim() === productA.nameAr);
      assert(featuredIndex >= 0 && ordinaryIndex > featuredIndex, 'the featured fixture precedes the ordinary fixture, including in an existing catalog');
      assert((await page.locator('#products').innerText()).includes('19.00 د.أ'));
      assert.equal(await page.locator('#instagram a').getAttribute('href'), 'https://www.instagram.com/the_booty_rebublic.jo/');
    });
    await check('product descriptions and delivery use real data without invented ingredients', async () => {
      await page.goto(`${baseURL}/products/${productA.slug}`);
      await page.getByRole('heading', { name: productA.nameAr, exact: true }).waitFor();
      await page.locator('main').getByText('وصف مخصص من قاعدة البيانات', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'المكونات الفعالة', exact: true }).click();
      await page.getByText('راجعي قائمة المكونات الموضحة على عبوة هذا المنتج؛ تختلف التركيبة بين المنتجات.').waitFor();
      assert(!(await page.locator('main').innerText()).includes('Niacinamide'));
      await page.locator('main').getByText('مدة التوصيل: 2 - 6 أيام عمل', { exact: true }).waitFor();
      assert((await page.locator('meta[property="og:image"]').first().getAttribute('content')).startsWith('https://thebootyrepublic.vercel.app/'));
    });
    await check('persisted carts reconcile names, prices, images and reduced stock', async () => {
      await page.evaluate(product => localStorage.setItem('tbr_cart_v1', JSON.stringify([{ productId: product.id,
        slug: product.slug, name: product.name, nameAr: product.nameAr, price: product.price, image: product.image,
        sku: product.sku, quantity: 3, maxStock: product.stock }])), productA);
      productA = await db.product.update({ where: { id: productA.id }, data: { nameAr: 'اسم وسعر محدثان للسلة', price: 31.75,
        stock: 1, image: '/images/firming-booty-lotion.jpg' } });
      await page.reload();
      await page.waitForFunction(() => {
        const items = JSON.parse(localStorage.getItem('tbr_cart_v1') || '[]');
        return items.length === 1 && items[0].price === 31.75 && items[0].quantity === 1 && items[0].maxStock === 1;
      });
      await page.getByRole('button', { name: 'سلة المشتريات', exact: true }).click();
      await page.getByText('اسم وسعر محدثان للسلة', { exact: true }).last().waitFor();
      await page.getByText('الإجمالي قبل رسوم التوصيل:', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'إغلاق السلة', exact: true }).click();
    });
    await check('catalog failure blocks purchase, shows an honest error and recovers', async () => {
      await page.route('**/api/products', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false}' }));
      await page.goto(`${baseURL}/checkout`);
      await page.getByText('تعذر التحقق من الأسعار والمخزون. أعيدي المحاولة قبل تأكيد الطلب.').first().waitFor();
      assert(await page.locator('button[type="submit"]').isDisabled());
      await page.unroute('**/api/products');
      await page.getByRole('button', { name: 'إعادة تحميل بيانات السلة', exact: true }).click();
      await page.getByRole('button', { name: 'تأكيد وإرسال الطلب (33.75 د.أ)', exact: true }).waitFor();
    });
    await check('price changes during submission roll back and preserve customer input', async () => {
      await page.getByLabel('الاسم الكامل').fill(`${stamp} customer`);
      await page.getByLabel('رقم الهاتف / الخلوي').fill('0790000000');
      await page.getByLabel('عنوان التوصيل بالتفصيل').fill('عنوان اختبار مخصص في عمان');
      await page.route('**/api/checkout', async route => { await db.product.update({ where: { id: productA.id }, data: { price: 33 } }); await route.continue(); });
      const quoted = page.waitForResponse(response => response.url().endsWith('/api/checkout') && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'تأكيد وإرسال الطلب (33.75 د.أ)', exact: true }).click();
      assert.equal((await quoted).status(), 409);
      await page.getByRole('alert').filter({ hasText: 'تحدّثت الأسعار أو رسوم التوصيل' }).waitFor();
      assert.equal(await page.getByLabel('الاسم الكامل').inputValue(), `${stamp} customer`);
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: productA.id } })).stock, 1);
      await page.unroute('**/api/checkout');
      await page.getByRole('button', { name: 'تأكيد وإرسال الطلب (35.00 د.أ)', exact: true }).waitFor();
    });
    await check('real checkout persists the confirmed amount and verifies the success page', async () => {
      const ordered = page.waitForResponse(response => response.url().endsWith('/api/checkout') && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'تأكيد وإرسال الطلب (35.00 د.أ)', exact: true }).click();
      const response = await ordered, result = await response.json();
      assert(response.ok()); checkoutOrderId = result.orderId;
      await page.getByRole('heading', { name: 'تم استلام طلبكِ بنجاح!', exact: true }).waitFor();
      const saved = await db.order.findUniqueOrThrow({ where: { id: checkoutOrderId } });
      assert.equal(saved.totalAmount, 35); assert.equal(saved.shippingFee, 2);
      assert(!(await page.locator('main').innerText()).includes(`${stamp} customer`));
      await db.order.update({ where: { id: saved.id }, data: { status: 'CANCELLED' } });
      await page.reload();
      await page.getByRole('heading', { name: 'هذا الطلب ملغي', exact: true }).waitFor();
    });
    await check('missing orders, inactive products and unknown pages never claim success', async () => {
      for (const path of ['/checkout/success', '/checkout/success?orderNumber=INVENTED', '/products/no-such-product', '/no-such-page']) {
        const response = await page.goto(`${baseURL}${path}`);
        assert.equal(response.status(), 404);
        await page.getByRole('heading', { name: 'الصفحة أو الطلب غير موجود', exact: true }).waitFor();
      }
      await db.product.update({ where: { id: productB.id }, data: { isActive: false } });
      assert.equal((await page.goto(`${baseURL}/products/${productB.slug}`)).status(), 404);
      await db.product.update({ where: { id: productB.id }, data: { isActive: true } });
    });
    await check('corrupt saved carts cannot crash checkout', async () => {
      await page.evaluate(() => localStorage.setItem('tbr_cart_v1', '{"invalid":"shape"}'));
      await page.goto(`${baseURL}/checkout`); await page.reload();
      await page.getByRole('heading', { name: 'سلة المشتريات فارغة', exact: true }).waitFor();
    });
    await check('admin profile comes from the database and metrics fail recoverably', async () => {
      await page.route('**/api/admin/stats', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false,"error":"فشل مؤقت للمؤشرات"}' }));
      await page.goto(`${baseURL}/admin`);
      await page.getByText('مشرف من قاعدة البيانات', { exact: true }).waitFor();
      await page.getByRole('alert').filter({ hasText: 'فشل مؤقت للمؤشرات' }).waitFor();
      assert.equal(await page.getByText('جارٍ تحميل لوحة المؤشرات…', { exact: true }).count(), 0);
      await page.unroute('**/api/admin/stats');
      await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
      await page.getByText('إجمالي قيمة الطلبات غير الملغاة', { exact: true }).waitFor();
      const stats = await (await context.request.get(`${baseURL}/api/admin/stats`)).json();
      const sum = await db.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'CANCELLED' } } });
      assert.equal(stats.stats.totalRevenue, Number((sum._sum.totalAmount || 0).toFixed(2)));
    });
    await check('stale product drafts cannot overwrite later database edits', async () => {
      await page.getByRole('button', { name: 'إدارة المنتجات والمخزون', exact: true }).click();
      const row = page.getByRole('row').filter({ hasText: 'اسم وسعر محدثان للسلة' });
      await row.getByRole('button', { name: 'تعديل', exact: true }).click();
      const editor = page.getByRole('dialog', { name: 'تعديل المنتج أو البكج', exact: true });
      await editor.getByLabel('السعر (د.أ)', { exact: true }).fill('34');
      await db.product.update({ where: { id: productA.id }, data: { price: 37, stock: 5 } });
      await editor.getByRole('button', { name: 'حفظ البيانات', exact: true }).click();
      await editor.getByRole('alert').filter({ hasText: 'تحدّثت السلعة' }).waitFor();
      assert.equal(await editor.getByLabel('السعر (د.أ)', { exact: true }).inputValue(), '34');
      assert.equal((await db.product.findUniqueOrThrow({ where: { id: productA.id } })).price, 37);
      await page.keyboard.press('Escape');
      await page.getByRole('dialog', { name: 'تجاهل التعديلات؟', exact: true }).getByRole('button', { name: 'تجاهل التعديلات', exact: true }).click();
    });
    await check('order status changes refresh the filtered dataset and detail view', async () => {
      await page.getByRole('button', { name: 'إدارة وتصدير الطلبات', exact: true }).click();
      await page.getByLabel('تصفية حالة الطلبات').selectOption('NEW');
      const rowA = page.getByRole('row').filter({ hasText: `${stamp}-A` });
      await rowA.getByLabel(`حالة الطلب ${stamp}-A`, { exact: true }).selectOption('COMPLETED');
      await rowA.waitFor({ state: 'hidden' });
      const rowB = page.getByRole('row').filter({ hasText: `${stamp}-B` });
      await rowB.getByRole('button', { name: 'تفاصيل', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: new RegExp(`تفاصيل الطلب ${stamp}-B`) });
      await dialog.getByText('جديد', { exact: true }).waitFor();
      await db.order.update({ where: { orderNumber: `${stamp}-B` }, data: { status: 'PROCESSING' } });
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await dialog.getByText('قيد المعالجة', { exact: true }).waitFor();
      await page.keyboard.press('Escape');
    });
    await check('clearing date filters clears request parameters and Excel exports the displayed dataset', async () => {
      await page.getByLabel('تصفية حالة الطلبات').selectOption('');
      await page.getByLabel('من تاريخ').fill('2026-10-13'); await page.getByLabel('إلى تاريخ').fill('2026-10-13');
      await page.getByRole('button', { name: 'تطبيق الفلترة', exact: true }).click();
      await page.getByText('لا توجد طلبات مطابقة', { exact: true }).waitFor();
      const cleared = page.waitForResponse(response => response.url().includes('/api/admin/orders?') && !new URL(response.url()).searchParams.has('startDate'));
      await page.getByRole('button', { name: 'إلغاء التواريخ', exact: true }).click(); await cleared;
      await page.getByRole('row').filter({ hasText: `${stamp}-A` }).waitFor();
      await page.getByLabel('من تاريخ').fill('2026-10-12'); await page.getByLabel('إلى تاريخ').fill('2026-10-12');
      await page.getByRole('button', { name: 'تطبيق الفلترة', exact: true }).click();
      await page.getByRole('row').filter({ hasText: `${stamp}-A` }).waitFor();
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'تصدير Excel (XLSX)', exact: true }).click();
      const workbook = new ExcelJS.Workbook(); await workbook.xlsx.readFile(await (await download).path());
      const ids = workbook.worksheets[0].getColumn(1).values;
      assert(ids.includes(`${stamp}-A`)); assert(ids.includes(`${stamp}-B`));
    });
    await check('failed shipping reads expose no editable defaults and stale saves preserve newer rules', async () => {
      await page.route('**/api/admin/settings/shipping', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false,"error":"فشل مؤقت للتوصيل"}' }));
      await page.getByRole('button', { name: 'إعدادات التوصيل والرسوم', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'فشل مؤقت للتوصيل' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'حفظ إعدادات التوصيل', exact: true }).count(), 0);
      await page.unroute('**/api/admin/settings/shipping');
      await page.getByRole('button', { name: 'إعادة تحميل إعدادات التوصيل', exact: true }).click();
      await page.getByLabel('رسوم التوصيل داخل عمّان (د.أ)').fill('4');
      await context.request.put(`${baseURL}/api/admin/settings/shipping`, { data: { ...rules, ammanFee: 5 } });
      await page.getByRole('button', { name: 'حفظ إعدادات التوصيل', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'تحدّثت إعدادات التوصيل' }).waitFor();
      assert.equal((await db.shippingConfig.findUniqueOrThrow({ where: { id: 'default' } })).ammanFee, 5);
    });
    await check('internal tabs are hidden while the authorized user API remains functional', async () => {
      assert.equal(await page.getByRole('button', { name: 'فريق العمل والصلاحيات', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'سجل التدقيق الأمني', exact: true }).count(), 0);
      assert.equal((await context.request.post(`${baseURL}/api/admin/users`, { data: {} })).status(), 400);
      assert((await context.request.post(`${baseURL}/api/admin/users`, { data: {
        username: memberUsername, name: 'عضو اختبار', password: initialPassword, role: 'ADMIN',
      } })).ok());
      assert(await db.adminUser.findUnique({ where: { username: memberUsername } }));
      const response = await context.request.get(`${baseURL}/api/admin/users`);
      assert(response.ok());
      assert((await response.json()).users.some(user => user.username === memberUsername));
    });
    await check('hiding permission controls preserves authorized role changes in the API', async () => {
      const member = await db.adminUser.findUniqueOrThrow({ where: { username: memberUsername } });
      assert.equal((await context.request.patch(`${baseURL}/api/admin/users/${member.id}`, { data: { role: 'INVALID' } })).status(), 400);
      assert.equal((await db.adminUser.findUniqueOrThrow({ where: { username: memberUsername } })).role, 'ADMIN');
      for (const role of ['SUPPORT', 'ADMIN']) {
        assert((await context.request.patch(`${baseURL}/api/admin/users/${member.id}`, { data: { role } })).ok());
        assert.equal((await db.adminUser.findUniqueOrThrow({ where: { username: memberUsername } })).role, role);
      }
    });
    const memberContext = await browser.newContext({ locale: 'ar-JO', timezoneId: 'Asia/Amman', viewport: { width: 1280, height: 900 } });
    const memberPage = await memberContext.newPage(); memberPage.setDefaultTimeout(15000);
    memberPage.on('pageerror', error => errors.push(error.message));
    await check('login and password-change forms save the actual credentials including confirmation', async () => {
      await memberPage.goto(`${baseURL}/admin/login`);
      await memberPage.getByLabel('اسم المستخدم / Username').fill(memberUsername);
      await memberPage.getByLabel('كلمة المرور / Password').fill(initialPassword);
      await memberPage.getByRole('button', { name: 'تسجيل الدخول / Login', exact: true }).click();
      await memberPage.getByRole('button', { name: 'نظرة عامة والمؤشرات', exact: true }).waitFor();
      await memberPage.getByTitle('تغيير كلمة المرور').click();
      const dialog = memberPage.getByRole('dialog', { name: 'تغيير كلمة المرور', exact: true });
      await dialog.getByLabel('كلمة المرور الحالية', { exact: true }).fill(initialPassword);
      await dialog.getByLabel('كلمة المرور الجديدة', { exact: true }).fill(changedPassword);
      await dialog.getByLabel('تأكيد كلمة المرور الجديدة', { exact: true }).fill(changedPassword);
      const changed = memberPage.waitForResponse(response => response.url().endsWith('/api/admin/change-password'));
      await dialog.getByRole('button', { name: 'تحديث كلمة المرور', exact: true }).click();
      assert((await changed).ok());
      await dialog.waitFor({ state: 'hidden' });
      const member = await db.adminUser.findUniqueOrThrow({ where: { username: memberUsername } });
      assert(await bcrypt.compare(changedPassword, member.passwordHash)); assert(!await bcrypt.compare(initialPassword, member.passwordHash));
    });
    await check('changed profile and roles apply to existing sessions; SUPPORT cannot alter delivery', async () => {
      const member = await db.adminUser.findUniqueOrThrow({ where: { username: memberUsername } });
      assert((await context.request.patch(`${baseURL}/api/admin/users/${member.id}`, { data: { name: 'اسم عضو محدث', role: 'SUPPORT' } })).ok());
      await memberPage.evaluate(() => window.dispatchEvent(new Event('focus')));
      await memberPage.getByText('اسم عضو محدث', { exact: true }).waitFor();
      assert.equal((await memberContext.request.post(`${baseURL}/api/admin/products`, { data: {} })).status(), 403);
      assert.equal((await memberContext.request.put(`${baseURL}/api/admin/settings/shipping`, { data: rules })).status(), 403);
      await memberPage.getByRole('button', { name: 'إعدادات التوصيل والرسوم', exact: true }).click();
      await memberPage.getByLabel('رسوم التوصيل داخل عمّان (د.أ)').waitFor();
      assert(await memberPage.getByLabel('رسوم التوصيل داخل عمّان (د.أ)').isDisabled());
      assert.equal(await memberPage.getByRole('button', { name: 'حفظ إعدادات التوصيل', exact: true }).count(), 0);
    });
    await check('deactivation revokes an existing session without a login redirect loop', async () => {
      const member = await db.adminUser.findUniqueOrThrow({ where: { username: memberUsername } });
      assert((await context.request.patch(`${baseURL}/api/admin/users/${member.id}`, { data: { isActive: false } })).ok());
      assert.equal((await memberContext.request.get(`${baseURL}/api/admin/stats`)).status(), 401);
      await memberPage.goto(`${baseURL}/admin`);
      await memberPage.getByRole('heading', { name: 'تسجيل دخول المسؤول', exact: true }).waitFor();
      assert(new URL(memberPage.url()).pathname.endsWith('/admin/login'));
    });
    await check('audit logging and authorized reads continue with the audit tab hidden', async () => {
      const response = await context.request.get(`${baseURL}/api/admin/audit-logs`);
      assert(response.ok());
      assert((await response.json()).logs.some(log => log.username === username && log.action === 'USER_CREATED'));
      assert.equal((await memberContext.request.get(`${baseURL}/api/admin/audit-logs`)).status(), 401);
      assert.equal(await page.getByRole('button', { name: 'سجل التدقيق الأمني', exact: true }).count(), 0);
    });
    await check('public product, cart and login screens remain usable on a phone', async () => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`${baseURL}/products/${productA.slug}`);
      await page.getByRole('heading', { name: 'اسم وسعر محدثان للسلة', exact: true }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: join(artifacts, 'all-pages-product-mobile.png'), fullPage: true });
      await memberPage.setViewportSize({ width: 375, height: 812 });
      assert(await memberPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await memberPage.screenshot({ path: join(artifacts, 'all-pages-login-mobile.png'), fullPage: true });
    });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
  } finally {
    await browser?.close();
    if (checkoutOrderId) await db.order.deleteMany({ where: { id: checkoutOrderId } });
    await db.order.deleteMany({ where: { idempotencyKey: { startsWith: stamp } } });
    await db.adminAuditLog.deleteMany({ where: { username: { startsWith: stamp } } });
    await db.adminUser.deleteMany({ where: { username: { startsWith: stamp } } });
    await db.product.deleteMany({ where: { sku: { startsWith: stamp } } });
    if (shippingChanged) {
      if (originalShipping) { const { id, ...data } = originalShipping; await db.shippingConfig.upsert({ where: { id }, update: data, create: originalShipping }); }
      else await db.shippingConfig.deleteMany({ where: { id: 'default' } });
    }
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
