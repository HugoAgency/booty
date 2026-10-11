# Catalog and bundle workflow contract

Visual intent is maintained in [DESIGN.md](DESIGN.md). This records the bundle
workflow and owners; unrelated legacy screens have not been migrated by this feature.

InstagramLink owns external account navigation in both the homepage promotion and
the footer. Its destination comes from the owner's provided account link, recorded
once in `src/lib/social.ts`. It preserves the account spelling, opens a new tab with
noopener/noreferrer, announces that behavior and does not load an Instagram embed.
The homepage collage uses current catalog images without extra data requests.

ShippingProvider owns public delivery state across the persistent application shell.
ShippingInfo owns delivery text in the header, footer, FAQ, cart and product page;
checkout uses the same provider and pure fee calculation. Data is revalidated on route
changes, window focus, reconnect, visibility changes and once per minute while visible.
Successful administrator saves trigger immediate revalidation in the current tab.
In-flight reads are cancelled, timeout after ten seconds and cannot overwrite newer
responses. Missing settings data shows loading/error with retry; checkout cannot submit
until actual rules are available. It rechecks fees before submitting and asks customers
to confirm again if the total changes. The server still calculates the final amount.
Without a selected city, cart totals explicitly exclude delivery fees.

## Business evidence

| Concern | Source | UI consequence |
|---|---|---|
| Admin permissions | `src/lib/rbac.ts` | SUPPORT reads products; ADMIN and SUPER_ADMIN write them. |
| Pricing and stock | README §7 and `src/lib/order-service.ts` | Server calculates prices and atomically reserves stock. |
| Bundle purpose | User request: multiple products in one item | One named product, one administrator-set price and one cart/order line. |
| Components | `ProductInputSchema` and `validateBundleInput` | Two or more different single products, integer quantities, no nested bundles. |
| Shipping | `ShippingConfig`, `src/lib/shipping-service.ts`, `src/lib/shipping-rules.ts` | All delivery copy and calculations use administrator-saved rules; no hardcoded promise of free shipping or delivery time. |
| Lifecycle | Existing product APIs | Deactivation is soft; deactivated components make dependent bundles unavailable. |
| Historical fulfillment | `OrderItem.bundleContents` | Order details and Excel use the saved composition, not current catalog contents. |
| Homepage product | `getFeaturedProduct` and `getActiveProducts` | Current names, images and prices; popularity uses non-cancelled orders and no demo fallback. |

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Form | ProductEditor; AdminShippingTab; checkout form | ProductInputSchema, ShippingConfigSchema, CheckoutPayloadSchema | catalog / shipping settings / checkout | validation tests and browser create/edit/error/focus |
| Scrollbar | Global application stylesheet | DESIGN.md and globals.css | bounded component list / dialog | static audit and narrow viewport |
| Toast | Catalog status region in AdminProductsTab | Successful catalog mutation | persistent success or retryable error | browser success/error |
| CRUD | Product APIs and ProductEditor | ProductInputSchema, bundle-service and rbac | create / edit / activate | API and browser CRUD checks |
| Select/Listbox | Native controls in existing admin workflows | Platform keyboard/popup behavior | native | no new select is added; bundle choices use checkboxes |
| Date | Native date fields in existing order workflows | Platform calendar behavior | native | unchanged by bundles |

## Catalog operations

Create and edit open the same editor. Success closes it, returns focus to the trigger,
refreshes the list including dependent bundle availability, and announces success.
Failure stays open with an actionable error and all entered data. Submission is
blocked while pending. Validation is application-owned, labels activate inputs,
invalid fields reference visible text and the first invalid field receives focus.

Clean cancellation closes immediately. Dirty cancellation asks whether to return
or discard, using an owned dialog. Browser unload warns only for a dirty editor.
SUPPORT receives no create/edit controls and the server enforces write permissions.

Standalone products retain stock controls. Bundles show computed availability and
have no independent stock adjustment. Public catalog and detail pages show contents;
the cart keeps the existing single-product shape and stores the bundle ID and price.
Checkout rechecks all server prices, membership, component activation and stock.

Cart buttons remain disabled until persisted cart state is initialized, preventing
an early click from being overwritten by hydration. Adding an existing item refreshes
its displayed metadata and price from the product being viewed. Checkout still owns
final price verification. Quantities retain the server's existing 50-unit limit.

## Data and concurrency

Bundle stock is the minimum of floor(component stock / component quantity). Shared
demand is summed across every bundle and standalone line. Catalog reads, conditional
stock decrements and order creation run in one serializable transaction. Failed
orders leave all stock unchanged. Serialization conflicts retry up to three attempts;
idempotency keys prevent repeated orders and repeated decrements.

Order snapshots store component IDs, names, SKUs and quantities per bundle. Admin
order detail and exports multiply them by ordered bundle quantity for fulfillment.
Editing catalog contents never changes a previously placed order.

The current catalog API loads the existing full catalog. This feature keeps that
navigation contract; large-catalog server pagination remains a separate improvement.
The picker is bounded and all rows remain reachable with native scrolling.
