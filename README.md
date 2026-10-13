# THE BOOTY REPUBLIC - Professional E-Commerce Platform

A modern, production-grade e-commerce platform and order management system built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, **PostgreSQL (Prisma ORM)**, and **Docker & Docker Compose**. 

Engineered with full Arabic language support and Right-to-Left (RTL) layout, server-side price/stock verification, idempotent checkout, a secure admin portal, and automated Excel (XLSX) order exports.

---

## 1. Project Overview & Brand Assets

The platform embodies the visual identity of **THE BOOTY REPUBLIC**:
* **Brand Colors:** Rose Blush (`#FF7B98`), Soft Pink (`#FFF0F3`), Peach Tint (`#FFB5A7`), and Deep Charcoal (`#2A1820`).
* **Authentic Imported Products:**
  1. **Lightening Intimate Gel** (60ml | 2.0 fl. oz. - SKU: `TBR-LIG-060`) - Advanced brightening & color correcting.
  2. **Clarifying Booty Cleanser** (180mL | 6.08 fl. oz. - SKU: `TBR-CBC-180`) - Pore refining & skin perfecting.
  3. **Firming Booty Lotion** (200ml | 6.7 fl. oz. - SKU: `TBR-FBL-200`) - Peptide boosting & cellulite smoothing.

---

## 2. Technology Stack

* **Frontend:** Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
* **Backend:** Next.js Server Components, Server Actions & Route Handlers (`/api/*`).
* **Database & ORM:** PostgreSQL 16, Prisma ORM with connection pooling.
* **Authentication:** Signed JWT identity via `jose`, with the current active database account and role checked on each authenticated request; `bcryptjs` password hashing and HttpOnly, SameSite cookies.
* **Validation:** Zod schemas for all client and server payloads.
* **Excel Engine:** `exceljs` generating formatted, right-to-left (RTL) worksheets with currency/date formatting.
* **Containerization:** Multi-stage `Dockerfile` with standalone Next.js output and `docker-compose.yml`.
* **Testing:** Vitest automated test suite for checkout validations, pricing calculations, and Excel exports.

---

## 3. Architecture & Directory Structure

```
├── public/
│   └── images/                     # Authentic brand logos and product photographs
│       ├── logo.jpg                # Primary brand logo
│       ├── logo-pink.jpg           # Inverted brand logo
│       ├── lightening-intimate-gel.jpg
│       ├── clarifying-booty-cleanser.jpg
│       └── firming-booty-lotion.jpg
├── prisma/
│   ├── schema.prisma               # Database models (Product, Order, OrderItem, AdminUser)
│   └── seed.js                     # Seed script for products and default admin user
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── login/route.ts  # Admin authentication
│   │   │   │   ├── logout/route.ts # Session termination
│   │   │   │   ├── orders/route.ts # Order listing & filtering
│   │   │   │   ├── orders/[id]/route.ts
│   │   │   │   ├── orders/export/route.ts # Excel XLSX export stream
│   │   │   │   ├── products/route.ts      # Product CRUD
│   │   │   │   ├── products/[id]/route.ts
│   │   │   │   └── stats/route.ts         # Dashboard analytics KPIs
│   │   │   ├── checkout/route.ts   # Secure order processing & verification
│   │   │   └── products/route.ts   # Public active products API
│   │   ├── admin/
│   │   │   ├── login/page.tsx      # Admin login interface
│   │   │   └── page.tsx            # Protected Admin Dashboard
│   │   ├── checkout/
│   │   │   ├── page.tsx            # Customer checkout form & order summary
│   │   │   └── success/page.tsx    # Order confirmation with reference number
│   │   ├── products/[slug]/
│   │   │   ├── page.tsx            # Product detail page
│   │   │   └── ProductDetailClient.tsx
│   │   ├── layout.tsx              # Root RTL layout with CartProvider
│   │   └── page.tsx                # Homepage (Hero, Catalog, Philosophy, FAQ)
│   ├── components/
│   │   ├── admin/                  # Admin dashboard sub-views (Stats, Orders, Products)
│   │   ├── CartDrawer.tsx          # Slide-over shopping cart
│   │   ├── Header.tsx              # Brand navigation & cart indicator
│   │   ├── HeroSection.tsx         # Hero banner
│   │   ├── ProductCard.tsx         # Catalog product card
│   │   ├── ProductCatalog.tsx      # Interactive search & filter catalog
│   │   ├── BrandFeatures.tsx       # Store features and current delivery policy
│   │   ├── FaqSection.tsx          # Accordion FAQ
│   │   └── Footer.tsx              # Brand footer & policy links
│   ├── context/
│   │   └── CartContext.tsx         # Shopping cart state with localStorage persistence
│   ├── lib/
│   │   ├── auth.ts                 # JWT session helpers
│   │   ├── currency.ts             # JOD currency formatting
│   │   ├── excel.ts                # Excel generator with Arabic RTL layout
│   │   ├── order-service.ts        # Order validation, pricing & transaction handling
│   │   ├── prisma.ts               # Prisma singleton client
│   │   ├── products.ts             # Products data repository
│   │   └── validations.ts          # Zod validation schemas
│   └── types/                      # TypeScript shared interfaces
├── scripts/
│   ├── backup-db.sh                # Automated database backup script
│   └── restore-db.sh               # Database restore script
├── tests/                          # Automated Vitest test suite
├── docker-compose.yml              # Multi-container orchestration
├── Dockerfile                      # Production multi-stage container
└── docker-entrypoint.sh            # Container initialization & migration hook
```

---

## 4. Quick Start with Docker (Recommended)

### Prerequisites
* Docker Engine (v20+)
* Docker Compose (v2+)

### Step 1: Clone & Configure Environment
```bash
cp .env.example .env
```

Review or modify `.env` as needed:
* `POSTGRES_USER`: Database user (default: `postgres`)
* `POSTGRES_PASSWORD`: Secure database password (default: `postgres_secure_pass`)
* `POSTGRES_DB`: Database name (default: `booty_db`)
* `JWT_SECRET`: Secret key for admin session cookies
* `ADMIN_DEFAULT_USERNAME`: Admin login (default: `admin`)
* `ADMIN_DEFAULT_PASSWORD`: Secure admin password required before seeding

### Step 2: Build & Launch Containers
```bash
docker compose up --build -d
```

The services will initialize in order:
1. `tbr_postgres`: PostgreSQL starts and runs health checks.
2. `tbr_web`: Once the database is healthy, the web container starts, applies Prisma schema sync (`prisma db push`), seeds the products and admin user, and launches the Next.js server on port `3000`.

### Step 3: Access the Application
* **Storefront:** [http://localhost:3000](http://localhost:3000)
* **Admin Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)
  * Username: value of `ADMIN_DEFAULT_USERNAME`
  * Password: value of `ADMIN_DEFAULT_PASSWORD`

---

## 5. Local Development Setup (Without Docker)

### Prerequisites
* Node.js v18+ or v20+
* PostgreSQL instance running locally

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Configure .env
cp .env.example .env

# 3. Synchronize database schema and seed products
npx prisma db push
node prisma/seed.js

# 4. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 6. Excel Order Export Specification

Administrators can export all orders or filter by order status and date range from the admin dashboard.

The exported `.xlsx` workbook features:
* **Arabic RTL Layout:** Enabled via `views: [{ state: 'normal', rightToLeft: true }]`.
* **Brand Styling:** Rose header (`#FF7B98`) with white bold text and alternating row colors.
* **15 Required Columns:**
  1. `رقم الطلب / Order ID` (e.g., `TBR-261009-A7F2`)
  2. `تاريخ وتوقيت الطلب / Order Date` (Arabic format in Asia/Amman)
  3. `اسم العميل / Customer Name`
  4. `رقم الهاتف / Phone Number`
  5. `البريد الإلكتروني / Email`
  6. `المدينة / City`
  7. `عنوان التوصيل / Delivery Address`
  8. `المنتجات / Product Names` (Multi-line bilingual product titles)
  9. `أكواد المنتجات / SKUs` (Multi-line product codes)
  10. `الكميات / Quantities`
  11. `أسعار الوحدة / Unit Prices`
  12. `إجمالي الأصناف / Line Totals`
  13. `إجمالي الطلب / Order Total (JOD)` (Formatted numeric currency)
  14. `ملاحظات العميل / Customer Notes`
  15. `حالة الطلب / Order Status` (Localized status)

---

## 7. Security & Reliability

1. **Client Trust Mitigation:**
   * Submitted item lines contain only `productId` and `quantity`; expected subtotal and shipping fee protect the customer's confirmed quote.
   * Unit prices, line totals, and stock availability are strictly verified and recalculated on the server against the database.
2. **Duplicate Order Prevention:**
   * The client generates an idempotency key during checkout.
   * If a customer submits repeatedly or network retries occur, the database prevents duplicate records and returns the existing order safely.
3. **Admin Authentication:**
   * Admin routes (`/admin`, `/api/admin/*`) require a cryptographically signed JWT stored in an `HttpOnly`, `SameSite=Lax` cookie.
   * Passwords hashed using `bcrypt` (work factor 12).
4. **Data Persistence:**
   * Orders and catalog changes are persisted inside named Docker volume `tbr_postgres_data`, surviving container stop, restart, or recreation.

---

## 8. Database Backup & Restoration

Backup and restore scripts are provided in `./scripts/`:

### Create Backup
```bash
./scripts/backup-db.sh
```
Creates a compressed snapshot in `./backups/booty_db_backup_YYYYMMDD_HHMMSS.sql.gz`.

### Restore Backup
```bash
./scripts/restore-db.sh ./backups/booty_db_backup_20261009_120000.sql.gz
```

---

## 9. Automated Testing

Execute the test suite with Vitest:
```bash
npm test
```

### Verified Test Coverage:
* `tests/validations.test.ts`: Zod schema validations for customer details, quantities, phone numbers, and admin login.
* `tests/order-service.test.ts`: Format verification for order numbers (`TBR-YYMMDD-XXXX`), currency formatting, and arithmetic precision.
* `tests/excel.test.ts`: XLSX workbook generation, Arabic RTL sheet verification, column integrity, and cell data accuracy.

## 10. Product Bundles & Live Storefront Data

Delivery messages on product pages, cart, header, footer and FAQ use the saved
ShippingConfig through one public shipping provider. Checkout uses the same rules;
changing delivery time, city fees, free-delivery minimum or promotional delivery in
the admin panel updates the display on navigation/reload, focus and periodic refresh.
The current admin tab refreshes immediately after a successful save. Delivery fees
are never advertised as universally free unless the stored rules make them free.
Failed reads show retry feedback instead of quoting default fees; checkout waits for
current rules and reconfirms a changed delivery amount before sending the order.
Initial default rules apply only when no ShippingConfig record has been created.

In **إدارة المنتجات والمخزون**, choose **إضافة منتج / بكج**, then **بكج منتجات**.
Give the bundle its own Arabic/English name, SKU, image and full price. Select at least
two different standalone products and specify 1–50 units of each. Bundles cannot
contain another bundle or themselves. ADMIN and SUPER_ADMIN can save bundles;
SUPPORT retains read-only access.

A bundle is one cart and order item. Its available stock is calculated from its
components: `min(floor(component.stock / component.quantity))`. It has no separate
stock adjustment. Checkout combines demand from all bundles and standalone products,
then creates the order and conditionally decrements component inventory in one
serializable transaction. An insufficient or concurrent order cannot leave negative
stock. Idempotent retries do not decrement inventory twice.

Order items save the original bundle composition. Order details and XLSX exports show
the component names, SKUs and total quantities to fulfill, even after a catalog edit.

The home-page card now reads the current database name, subtitle, image, price and
detail link. It selects the most ordered active item across non-cancelled orders.
Before any orders exist it uses an administrator-featured item (or the first active
item) and labels it as featured. Home and detail pages read fresh database data on
each request. An empty or unreachable database no longer displays fake purchasable
products; an empty catalog or retryable error is shown instead.

### Schema update

Use the same `DATABASE_URL` for Prisma, the application and the admin portal.
After pulling this change, synchronize the development schema and generate the client:

```bash
npm ci
npm run db:push
```

The schema adds `Product.isBundle`, `BundleItem` and nullable
`OrderItem.bundleContents`; existing standalone products default to `isBundle=false`.
Docker's existing entrypoint also runs the schema sync before startup. Review schema
changes and back up an existing production database using the existing deployment
process. No extra bundle seed or inventory reset is required.

### Vercel deployment

`vercel.json` selects `npm run build:vercel`. Before Next.js builds, it generates
the Prisma client and runs `npm run db:deploy` against the deployment's
`DATABASE_URL`. Both Production and Preview must have a reachable PostgreSQL
database configured. This applies the bundle columns/table before the new
application can query them; a successful Next.js build alone does not update a
database. The command does not seed products or reset inventory.

Schema synchronization runs without `--accept-data-loss` or `--force-reset`.
If Prisma detects a change that requires accepting data loss, or cannot connect,
the deployment fails and leaves the previous deployment serving traffic. Resolve
the reported schema or connection issue before redeploying. Do not add data-loss
flags to make the build pass.

### Verification

`npm test` runs catalog/hero and bundle validation tests. PostgreSQL integration tests
opt in through a dedicated database whose name contains `bundle_test`; both variables
must refer to that database. The seven checkout tests and two deployment tests skip
when opt-in is absent. Deployment tests use a separate temporary schema to reproduce
the pre-bundle database, preserve existing records, verify repeated synchronization,
and check that destructive changes are refused.

```bash
export DATABASE_URL='postgresql://postgres@127.0.0.1:5432/booty_bundle_test?schema=public'
export BUNDLE_TEST_DATABASE_URL="$DATABASE_URL"
npm run db:push
npm test -- --maxWorkers=2 --minWorkers=1
npx tsc --noEmit --incremental false
```

For the browser checks, start the application with the same test database on port 3100.
The test creates and deletes only its own fixtures. It verifies create/edit, validation,
failed-save recovery, pending submission, dirty cancellation, keyboard focus, a phone
viewport, cart, real checkout, permissions, and immediate homepage data changes.
It signs short-lived test sessions with the application's `JWT_SECRET`; preserve any
injected value and never print it. Playwright may be installed outside the checkout:

```bash
npm install --prefix /tmp/booty-browser playwright --no-audit --no-fund
PLAYWRIGHT_MODULE_PATH=/tmp/booty-browser/node_modules/playwright \
  node tests/browser/bundles.cjs
```

Set `CHROMIUM_PATH` if Chromium is not at `/usr/bin/chromium`, and
`BUNDLE_TEST_BASE_URL` if the test server uses another address. Stop the development
server before running `npm run build`; both commands use `.next`.

## 11. Cross-page Data Consistency Audit

For Google Drive product/bundle pictures, see [image links, sharing and preview](docs/product-images.md).
The editor now previews images and normalizes Drive file links. Existing saved links
use the same resolver across the storefront, admin, cart, checkout and metadata.

For `/api/admin/stats` failures, see [statistics diagnosis and the verified read fix](docs/statistics-read-fix.md).
The overview fetches only recent-order summary fields; diagnostic responses distinguish
missing schema from unavailable connections without exposing raw database errors.

### Editable usage, ingredients and subtitles

In **لوحة الإدارة ← المنتجات والمخزون ← تعديل**, use **تفاصيل صفحة المنتج**
to edit **طريقة الاستخدام** and **المكونات الفعالة** in Arabic and English.
The same fields are available when creating a product or bundle. The description
continues to populate **المزايا والمفعول**. Both subtitle fields are also editable
and appear consistently on the homepage, catalog and product page.

Arabic content is preferred; English is the fallback. Usage/ingredients are optional
plain text with preserved line breaks and a 5000-character limit per language.
Clearing a field removes its saved content. If both languages are empty, the product
tab explicitly says the details have not been added and refers to packaging guidance.
Existing product data is not seeded or replaced. ADMIN and SUPER_ADMIN can save;
SUPPORT remains read-only. Conflict detection and failed-save draft recovery apply.

This adds four nullable Product columns (`howToUse`, `howToUseAr`, `ingredients`,
`ingredientsAr`). Run `npm run db:push` in development. The existing Vercel
`build:vercel` and Docker schema-sync workflows apply the additive columns before
startup without accepting data loss.

See [the route-by-route audit and verification results](docs/all-pages-audit.md)
for the storefront, checkout, login and all administration tabs. Saved carts now
reconcile current product names, prices and stock before purchase. Checkout rejects
a changed price/delivery quote before reserving stock and preserves customer inputs.
Product and shipping edits detect newer versions rather than overwriting them.
Admin reads show retryable failures separately from empty datasets, order list and
Excel share Jordan calendar-day filters, and confirmation checks an actual order.

Run browser suites sequentially against the same dedicated test database and app:

```bash
export PLAYWRIGHT_MODULE_PATH=/tmp/booty-browser/node_modules/playwright
node tests/browser/bundles.cjs
node tests/browser/shipping.cjs
node tests/browser/all-pages.cjs
node tests/browser/product-content.cjs
```

The 2026-10-12 audit and product-content follow-up passed 94 Vitest tests and 50 browser checks, plus production
build and TypeScript checks. These are local results; the managed network blocked
direct verification of the public Vercel deployment.
