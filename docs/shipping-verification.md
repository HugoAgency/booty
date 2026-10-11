# Live delivery settings verification

Verified on 2026-10-12 with Node.js 24, PostgreSQL 16 and Chromium. No production
database or Vercel runtime was accessed. Existing administrator shipping rules are
preserved: this change introduces no new fee, threshold, city tier or delivery time.

Product pricing/guarantees, header, footer, FAQ and cart previously contained fixed
free-shipping and delivery-time promises. ShippingProvider and ShippingInfo now own
these public messages and fetch the saved ShippingConfig without caching. The pure
shipping calculations are separate from server-only Prisma reads. Database errors
propagate instead of silently substituting default delivery charges.

The provider revalidates on navigation, focus, visibility, reconnect, administrator
save and every minute while visible. Requests timeout and cancel superseded reads.
Checkout blocks submission while data is unavailable and rereads fees before sending
an order; changed fees require confirmation of the updated total. Totals in the cart
exclude delivery until a city is selected. Checkout and shipping-settings validation
use the existing server schemas, preserve input, associate errors and focus the
first invalid field.

Verification:

- All 58 tests passed across 12 suites, including six current-shipping regressions
  and PostgreSQL checkout/deployment integration coverage.
- `npx tsc --noEmit --incremental false` passed.
- `npm run build:vercel` passed, including schema synchronization and Next.js build.
- Eleven browser checks passed in `tests/browser/shipping.cjs`: administrator field
  validation, actual settings save and immediate shell update, product time/city rates,
  375px viewport without horizontal overflow, honest cart totals, checkout validation,
  fee-change reconfirmation, actual order/fee persistence, global free-delivery promotion,
  shared FAQ/footer policy, and server-failure recovery using keyboard retry.
- The screenshot `/tmp/booty-browser-artifacts/shipping-product-mobile.png` was inspected.
- The full strict premium audit now reports four existing findings in unrelated login,
  user and password forms. The updated checkout and delivery settings forms have no
  remaining findings. This is not a claim of whole-application accessibility compliance.
- `git diff --check` passed. DESIGN.md and its existing rose tokens remain unchanged.

Browser tests require a running app at port 3100 (or BUNDLE_TEST_BASE_URL) and equal
DATABASE_URL/BUNDLE_TEST_DATABASE_URL pointing to a database named with `bundle_test`.
They restore its original shipping configuration and delete their own product, order
and audit fixtures. Run them separately from suites that use the same database:

```sh
PLAYWRIGHT_MODULE_PATH=/tmp/booty-browser/node_modules/playwright \
  node tests/browser/shipping.cjs
```
