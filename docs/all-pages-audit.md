# Cross-page data consistency audit — 2026-10-12

The audit covers every current page route and administration tab, with emphasis on
saved changes appearing correctly, failures being visible, and displayed amounts
matching the database. Fixtures use a dedicated local PostgreSQL database and a
production Next.js build. No production database or customer orders were modified.

## Findings and changes

| Page or workflow | Corrected behavior | Verification |
|---|---|---|
| `/` and shared header/footer/FAQ | Current featured-product sorting and descriptions; one saved delivery policy; no invented product ingredients or universal results timeline | Catalog tests, browser home/shipping checks |
| `/products/[slug]` | Current name, image, price, available stock and delivery; unavailable items cannot be purchased; description comes from the product; usage/ingredients refer to its actual packaging | Browser product, disabled-product and narrow viewport checks |
| Cart drawer and persisted cart | Validate stored shape; refresh names/images/prices; clamp quantities to stock; remove unavailable items with notice; block purchase while verification fails | Seven cart tests; browser stale/corrupt cart and recovery checks |
| `/checkout` | Recheck catalog and delivery before sending; a price/fee race returns a conflict before stock reservation; keep entered customer details for reconfirmation | Serializable database integration and browser race/checkout/shipping checks |
| `/checkout/success` | Read an actual order and its current status; missing reference/order is a localized 404; cancelled order does not claim preparation | Confirmation tests; real checkout, status and missing-order browser checks |
| `/admin/login` | Application-owned validation and field focus; redirect only a current active database account; no redirect loop after deactivation | Browser actual login and deactivated-session checks |
| `/admin` identity and permissions | Name, active state and role come from the current account even with an existing JWT; restricted tabs close after a role change; SUPPORT cannot save shipping | Six current-session tests, permission and browser checks |
| Admin overview | Loading/failure/retry are distinct; non-cancelled order value has an accurate label | Browser failed statistics read and recovery |
| Admin products/bundles | Refresh actual saved state; compare loaded version for edits and stock controls; a conflict preserves the draft and newer database values | Bundle browser suite; all-pages stale-editor check |
| Admin orders/details | Refresh filtered rows and current details after a status save; show saved subtotal/fee/total; clear date filters correctly | Browser filtered status change, fresh detail and date reset |
| Admin XLSX export | Shared list/export filters, inclusive Jordan calendar days, explicit Asia/Amman timestamps, visible download failure | Six date-filter tests; browser workbook contents including UTC/Jordan boundary orders |
| Admin shipping settings | Failed load does not expose editable default fees; load/save version prevents replacing newer settings; confirm discarding a dirty draft | Browser failed-read/conflict and eleven delivery checks |
| Admin users | Validate and save actual records; preserve failed form values; confirm role/deactivation changes; refetch saved data | Browser user creation, invalid input, cancellation, role and active-state checks |
| Change/reset password | Current-password change sends the confirmation field required by the API; shared validation and visible field errors | Browser actual login/password change and database hash verification |
| Admin audit | A failed read shows error/retry rather than an empty log; event labels match LOGIN_SUCCESS/LOGIN_FAILURE; search describes the latest 100 events | Audit tests; browser failed read/recovery/search |
| Unknown routes and global failures | Localized 404 with store navigation; existing application error recovery retained; missing data never becomes a fake success | Browser unknown route, missing order and API-failure checks |

Public catalog and delivery state refresh on navigation, focus, reconnect, visibility
and every visible minute. Server-rendered product content refreshes on navigation
and focus. Shared administration reads cancel superseded requests and time out after
ten seconds. Successful saves refresh from the server. Historical order prices and
bundle composition deliberately remain the snapshot confirmed at order creation.

## Executed verification

- Vitest: **87 passed in 16 suites**, including the opted-in PostgreSQL integration
  and schema deployment tests; no skipped integration suites in this run.
- Production build, Vercel build/schema workflow and `tsc --noEmit --incremental false`: passed.
- `tests/browser/all-pages.cjs`: **20 passed**.
- `tests/browser/bundles.cjs`: **9 passed**.
- `tests/browser/shipping.cjs`: **11 passed** in the final regression.
- Strict UI source audit: **zero findings**. Design lint: zero errors and one existing
  unused border-token warning. `git diff --check`: passed.
- Product and login screenshots inspected at a 375px phone viewport; browser checks
  found no horizontal overflow or uncaught page errors in the exercised scenarios.

Browser scripts require the same dedicated `bundle_test` database for
`DATABASE_URL` and `BUNDLE_TEST_DATABASE_URL`, Chromium and Playwright, and a running
app (default port 3100). Run them sequentially because they temporarily change
shipping settings. They create real test accounts for session checks, delete their
own orders/products/accounts and restore the original shipping record. Preserve
injected secrets; never run these fixtures against production.

## Limits and deployment

Direct access to `https://thebootyrepublic.vercel.app/` returned a proxy CONNECT
403 under this environment's outbound policy. Production credentials, deployed
database contents and Vercel deployment completion were therefore not inspected.
Local checks validate the repository implementation, not every production condition
or every possible future failure. Deployment uses the existing Vercel main-branch
integration and schema-sync workflow. The initial audit required no schema change;
the content follow-up below adds nullable columns through the same workflow.

The audit retains existing brand/contact/payment content, full-list API contracts
and historical order snapshots. It does not constitute a complete security,
accessibility or performance certification.

## Follow-up: editable product details

The initial audit replaced invented usage/ingredients with packaging guidance, but
did not provide product-specific content controls. The follow-up adds nullable
Arabic/English usage and ingredient columns and exposes them in the shared product
editor for both standalone products and bundles. The description still supplies
the benefits tab. Existing records keep their descriptions, prices, stock and orders.

Two related gaps were corrected: subtitle values already persisted but lacked editor
controls, and the product detail displayed a made-up standard size when no size was
saved. Subtitles now have Arabic/English controls and the same fallback order in the
hero, catalog and details. Absent size has no badge.

The complete product-field review follows this mapping:

| Public or business value | Stored source | Administrator control |
|---|---|---|
| Name | name/nameAr | Arabic/English name inputs |
| Subtitle | subtitle/subtitleAr | Arabic/English subtitle inputs |
| Benefits | description/descriptionAr | Arabic/English description textareas |
| Usage | howToUse/howToUseAr | Arabic/English usage textareas |
| Ingredients | ingredients/ingredientsAr | Arabic/English ingredient textareas |
| Price and discount | price/compareAtPrice | Current and previous price inputs |
| Image, SKU, size and category | image/sku/size/category/categoryAr | Existing metadata inputs |
| Availability | stock/isActive and bundle components | Stock or computed component availability; active toggle |
| Featured selection | isFeatured and non-cancelled order quantities | Featured toggle; popularity derived from orders |
| Bundle contents | BundleItem productId/quantity | Existing component and quantity controls |
| Delivery | ShippingConfig | Existing shipping settings panel |

IDs, slug and timestamps are system-owned. Brand/contact/policy copy is general store
content; it is not represented as an editable product attribute.

Content is plain text with line breaks preserved and markup escaped. Empty Arabic
falls back to saved English; when both are empty, the tab explicitly identifies
missing details before packaging guidance. Clearing saves null. Older API payloads
that omit these optional fields preserve existing content. The same permissions,
optimistic version checks and failed-save draft behavior protect the new fields.

Final follow-up verification: 94 tests passed in 17 Vitest suites, production and
Vercel schema-sync builds passed, TypeScript passed, and strict UI audit reported
zero findings. The schema deployment test verifies that all four new columns are
nullable after upgrading a pre-feature schema and that existing records remain intact.
The new product-content browser suite checks actual creation, edits, multiline/escaped
display, failure/validation recovery, clearing/English fallback, long mobile content,
empty states, focus revalidation, bundle content and SUPPORT write denial. Production
network limitations above still apply.

All four browser suites passed on the final production build: product-content **10**,
bundles **9**, all-pages **20**, shipping **11** — **50 checks** total. The home
fixtures now verify popularity and featured ordering without assuming an empty
catalog. Narrow editor/detail screenshots were inspected. The working changes passed
`git diff --check` and the browser scripts passed Node syntax checks.
