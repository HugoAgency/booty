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
* **Authentication:** Stateless JWT sessions via `jose`, `bcryptjs` password hashing, stored in HttpOnly, SameSite cookies.
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
│   │   ├── BrandFeatures.tsx       # Formula science highlights
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
  2. `تاريخ وتوقيت الطلب / Order Date` (Formatted in local Arabic format)
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
   * Client cart submissions contain only `productId` and `quantity`.
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
