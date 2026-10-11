# Bundle and live-catalog verification

Verified in the cloud workspace on 2026-10-11 using Node.js 24.19.0 and PostgreSQL 16.15.
Test fixtures use a dedicated `booty_bundle_test` database, are uniquely namespaced,
and are cleaned up; no production database was accessed.

- **50 tests passed in 10 suites**, including six PostgreSQL integration tests.
  Coverage includes overlapping bundle/standalone inventory, concurrent checkout,
  simultaneous idempotent retries, rollback, nested/self-referencing membership,
  historical composition exports, actual homepage data, empty catalog and database errors.
- **Type checking passed:** `npx tsc --noEmit --incremental false`.
- **Production build passed:** `npm run build`. The homepage is a dynamic route.
  Existing warnings remain for Google Font optimization and missing `metadataBase`.
- **Nine browser checks passed** with Chromium and Playwright, covering real create/edit,
  error recovery, duplicate-submit prevention, dirty cancellation, keyboard focus,
  a 375px phone viewport, single-item cart, real checkout, permissions, and fresh
  homepage name/image/price after an actual database update.
- **Design context lint passed with zero errors.** The runtime palette remains owned
  by Tailwind and CSS; DESIGN.md records the current values rather than generating new ones.
- **Whitespace checks passed:** `git diff --check`.

The strict premium static audit also scanned the full existing application. It reports
seven pre-existing findings outside the new product editor: six forms lacking an
explicit application-validation marker (`noValidate`) and a checkout textarea lacking
`resize-none`. These occur in login, checkout, shipping, users and password screens.
The new product/bundle editor does not have these findings. This change does not claim
that the whole legacy application passes the premium audit or a full accessibility audit.

The PostgreSQL schema adds bundle membership and order snapshots. Apply it through
the repository's existing schema-sync/deployment workflow before using bundles in another
environment; the local development and dedicated test schemas were synchronized successfully.

## Vercel schema-sync fix (2026-10-12)

The original build generated Prisma's client but did not apply database changes.
Vercel now runs `build:vercel`, which generates the client, safely synchronizes the
deployment database without data-loss flags, and then builds Next.js.

- All **52 tests in 11 suites passed**, including two new PostgreSQL deployment tests.
- The old schema from commit `55ec935` reproduces Prisma `P2022` on the new product
  query. Deployment synchronization repairs that schema, preserves existing product
  price/stock and order contents, and succeeds when run again.
- A populated column outside the current schema causes deployment synchronization
  to fail; its values remain intact.
- Type checking and the complete `npm run build:vercel` pipeline passed against
  the dedicated test database. Production Vercel logs and its database were not accessible
  from this workspace; the reported production symptom remains to be confirmed after
  the new deployment.
