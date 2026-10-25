# Catalog and bundle workflow contract

Visual intent is maintained in [DESIGN.md](DESIGN.md). This records the bundle
workflow and owners, including the cross-page data consistency audit.

ProductImage owns catalog, hero, detail/component, cart, checkout, admin-list and
Instagram product images. normalizeProductImageSource resolves Drive file links at
display time (including existing records), metadata generation and API save time.
Resource keys are preserved. Local paths and other full http/https image URLs retain
their value; unsupported sources get field errors or an honest unavailable-image
placeholder. Images load directly in the browser, without a server fetch proxy.
Private Drive files still require owner sharing changes. ProductEditor debounces its
preview, retains the entered link and reports loading/success/failure with retry.
Preview failure is advisory: it does not block unrelated edits during a provider
outage. Existing data, permission, conflict and dirty-draft behavior is retained.

The owner requested hiding team/permissions and security-audit tabs from the dashboard
UI. SHOW_INTERNAL_ADMIN_TABS controls both navigation and panel visibility for all
roles. Existing components, account/audit APIs, data and server permissions remain
available; hiding the interface does not disable audit logging or change authorization.

Dashboard statistics read order summaries only; they do not depend on OrderItem or
bundle-content columns. Summary data exposes only the fields used by the overview.
Schema/connection failures return explicit diagnostic codes and actionable admin copy,
never zero totals or raw database diagnostics. Known transient connection failures
advertise Retry-After; current authentication and retry behavior remain the owners.

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
| Admin permissions | `src/lib/rbac.ts`, `getAdminSession` and the shipping editor's read-only SUPPORT contract | Current active database accounts supply names and roles; SUPPORT reads products and shipping settings; ADMIN and SUPER_ADMIN write them. |
| Pricing and stock | README §7 and `src/lib/order-service.ts` | Server calculates prices and atomically reserves stock. |
| Bundle purpose | User request: multiple products in one item | One named product, one administrator-set price and one cart/order line. |
| Components | `ProductInputSchema` and `validateBundleInput` | Two or more different single products, integer quantities, no nested bundles. |
| Shipping | `ShippingConfig`, `src/lib/shipping-service.ts`, `src/lib/shipping-rules.ts` | All delivery copy and calculations use administrator-saved rules; no hardcoded promise of free shipping or delivery time. |
| Lifecycle | Existing product APIs | Deactivation is soft; deactivated components make dependent bundles unavailable. |
| Historical fulfillment | `OrderItem.bundleContents` | Order details and Excel use the saved composition, not current catalog contents. |
| Homepage product | `getFeaturedProduct` and `getActiveProducts` | Current names, images and prices; popularity uses non-cancelled orders and no demo fallback. |
| Product detail content | User request and nullable Product howToUse/ingredients fields, ProductInputSchema | ProductEditor owns bilingual usage/ingredients and subtitles; public tabs prefer Arabic, then English, and explicitly identify missing content. |

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Form | ProductEditor; AdminShippingTab; checkout, login and user/password forms | API schemas in validations.ts | catalog / shipping / checkout / credentials | validation tests and browser save/error/focus |
| Scrollbar | Global application stylesheet | DESIGN.md and globals.css | bounded component list / dialog | static audit and narrow viewport |
| Toast | Catalog status region in AdminProductsTab | Successful catalog mutation | persistent success or retryable error | browser success/error |
| CRUD | Product APIs and ProductEditor | ProductInputSchema, bundle-service and rbac | create / edit / activate | API and browser CRUD checks |
| Select/Listbox | Native controls in existing admin workflows | Platform keyboard/popup behavior | native | no new select is added; bundle choices use checkboxes |
| Date | Native order filter fields and buildOrderWhere | Asia/Amman calendar-day boundaries | native | unit and browser list/export boundary checks |

## Catalog operations

ProductEditor exposes names, subtitles, descriptions (the benefits tab), usage,
ingredients, price/previous price, image, SKU, category, size, stock, activation,
featured state and bundle composition. Slug, IDs and timestamps remain system-owned.
Usage and ingredients are optional plain text, at most 5000 characters per language;
multiline content is preserved and HTML is escaped. Clearing an optional content
field saves null; omitted fields in older API clients preserve existing content.
Textareas grow up to a bounded height and then scroll within the shared dialog.
No product size badge is invented when the size is absent. Homepage, catalog and
detail subtitles share Arabic-first fallback. Role and conflict behavior applies
to new content exactly as to other product fields.

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

CartProvider reconciles saved items with the current public catalog on navigation,
focus, visibility/reconnect and a visible one-minute refresh. It replaces stored
names/images/prices, clamps stock and explicitly reports removed unavailable items.
Failed verification blocks checkout and offers retry. Catalog sorting honors
isFeatured. Public pages refresh on focus so server-rendered hero/metadata/detail
content does not remain behind client-side catalog updates.

Checkout revalidates catalog and delivery, then sends expected subtotal/fee. The
serializable order transaction rereads delivery settings and rejects a changed quote
before reserving stock. Inputs survive quote conflicts; an explicit second confirmation
uses updated totals. Invalid prices/fees cannot become orders.

useRemoteData owns fresh/cancelled/timeout-bounded reads for admin metrics, products,
orders/details, users and audit. Failures are distinct from empty datasets. Filter
changes cancel older reads; clearing dates sends cleared parameters. List and Excel
export use the same committed filters and Asia/Amman calendar days. Search remains
transient within the authenticated tab, to avoid persisting customer-identifying
queries in page URLs. Existing dataset APIs retain their full-list contract.

Product and shipping editors send the version they loaded; a later database edit
causes a conflict rather than replacing newer data. Product conflicts preserve the
draft and require reopening current data; shipping reload confirms replacing an
unsaved draft. Order status changes refresh the filtered list and details from the
server. Order monetary snapshots retain the amount confirmed at creation.

The confirmation page checks a real order and current status, exposing only its
reference/status; missing references/orders do not claim success. Login redirects
check the current database account, preventing loops after deactivation. Role and
active-status changes take effect on the next request even for an existing JWT.
Permission changes and account deactivation use owned confirmations.

After checkout saves an order, CheckoutOrderConfirmation uses the shared native
Modal to explain that the customer must press Send inside WhatsApp. Navigation to
the merchant happens only after an explicit action. Closing the notice keeps the
saved reference and reopen link available, even after the cart clears. The server
generates the message from saved customer, price, delivery and bundle snapshots;
opening WhatsApp never submits another order or claims message delivery.

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
