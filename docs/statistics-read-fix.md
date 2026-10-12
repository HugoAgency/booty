# Statistics read failure investigation — 2026-10-12

The owner reported HTTP 500 on `/api/admin/stats`. The browser request metadata
confirms a server failure, but does not reveal the database exception. The managed
environment cannot inspect the public Vercel deployment; production's exact error
still requires its runtime log or the diagnostic response after this update.

## Reproduced failure and correction

The previous recent-order query used `include: { items: true }`, although the
overview never displays order item details. On an actual pre-bundle PostgreSQL
schema with a saved order and item, that query fails with Prisma `P2022` because
`OrderItem.bundleContents` is missing. This made otherwise available statistics
fail for an unrelated relation column.

`getDashboardStats` now selects only the six summary fields rendered by the
overview: id, reference, customer name, city, saved amount and creation date.
The same legacy-schema fixture returns the correct order/product counts and value
without querying order items. Existing count, status and amount definitions are
unchanged. Failures do not turn into invented zero totals.

The authenticated API now returns no-store responses and diagnostic codes:

| Code | Meaning | Action |
|---|---|---|
| DATABASE_SCHEMA_MISMATCH | Prisma reports a missing table/column | Complete the deployment's schema sync against its runtime database |
| DATABASE_UNAVAILABLE | Prisma reports an unreachable/timed-out/closed or exhausted connection | Retry; if persistent, check database availability and deployment connection settings |
| STATS_READ_FAILED | Another read error occurred | Inspect the Vercel runtime log for this request |

Known database failures return 503; unknown failures remain 500. Transient
connection errors include Retry-After. Logs record diagnostic codes; responses do
not include raw database messages, connection strings or customer error details.
Authentication remains required. Hiding team/audit tabs did not change this endpoint.

## Evidence and limits

The opted-in deployment integration test reproduces the former query's P2022 before
upgrading its isolated schema, then verifies the new summary read succeeds. API tests
cover authentication, verified empty results, missing table/column errors, unavailable
connections, safe responses and recovery. The test database is separate from production.

Final local verification passed: 102 tests in 18 suites, production build,
TypeScript, 20 all-pages browser checks, strict UI audit and diff checks.

This fixes a verified repository failure path. It does not establish that the
production HTTP 500 has the same cause. All product/bundle columns are still required
for their respective workflows; this change does not replace normal schema deployment.
