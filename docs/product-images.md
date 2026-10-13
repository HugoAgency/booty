# Product and bundle images — 2026-10-13

## Administrator workflow

1. For a Drive file, use Share → General access → Anyone with the link → Viewer.
   The file needs to be accessible to store visitors, without the owner's login.
2. Paste the file sharing or download link into **مسار الصورة أو رابطها** in the
   product/bundle editor. Local image paths and other full http/https image URLs
   remain supported.
3. Check **معاينة صورة المنتج أو البكج**. The preview reports loading, success or
   failure and supports retry. A successful preview shows what the browser loaded;
   it does not change Drive permissions.
4. Save normally. Drive links are normalized before persistence. Existing records
   also normalize when displayed, so no bulk database edit or schema update is needed.

## Cause and implementation

The supplied URL is a Drive download URL with an account parameter. The application
previously rendered that URL directly. Such a URL may return a login/download page,
an access-denied response or unsupported content instead of an embeddable picture.
This is not a Next.js remote-domain allowlist failure: the project already configures
images with `unoptimized: true`.

`normalizeProductImageSource` recognizes Drive file-view, open, uc, thumbnail and
usercontent download links. It resolves a file ID to Google's public image URL;
links carrying a resource key use the thumbnail endpoint and retain the key. It does
not grant access to private files. Other supported image URLs keep their query data.
ProductInputSchema normalizes saved URLs and rejects malformed/unsupported sources.

ProductImage is the shared rendering owner for hero, catalog, product and component
details, admin rows, cart, checkout and Instagram product imagery. Metadata uses the
same resolver. Images load in the browser without a new server fetch/proxy. Failed
images reserve their existing frame and show an explicit unavailable placeholder;
thumbnails use a compact icon. Invalid existing sources cannot throw a Next image or
metadata URL error. A provider outage does not block unrelated administrator edits.

ProductEditor retains the entered link and debounces preview updates. Switching
sources remounts the underlying image; late responses do not replace a newer preview.
Retry, validation, dirty cancellation, permissions and conflict behavior follow the
existing product editor contract.

## Verification and limits

The environment's proxy refused CONNECT to `drive.usercontent.google.com` with 403.
That is an environment network-policy denial, not evidence of the file's permissions,
content type or Google's response. The actual supplied file was not downloaded or
verified. Public access and final display of that particular file still need checking
in the owner's browser.

The maintained browser image suite uses controlled JPEG, delayed and denied/HTML
responses, and blocks unmocked external destinations. It verifies existing links,
all product image surfaces and metadata, administrator preview/retry, invalid-input
focus, actual save normalization, bundle contents, stale preview responses, dirty
cancellation, honest placeholders and a 375px viewport. It is not a live Google test.

Run it against the dedicated local test database and running application:

```bash
PLAYWRIGHT_MODULE_PATH=/tmp/booty-browser/node_modules/playwright \
  node tests/browser/product-images.cjs
```

The usual DATABASE_URL/BUNDLE_TEST_DATABASE_URL opt-in guards apply. Fixtures create
and remove their own administrator, products, bundle and history order. No production
database or Drive permissions are changed by these tests.

Final verification: 121 tests passed in 19 Vitest suites; production build and
TypeScript passed. Browser image checks passed 9 cases, bundle checks 9 and all-pages
checks 20 (38 total). Strict UI audit had zero findings; DESIGN lint had zero errors
and one existing unused border-token warning. Phone preview/failure screenshots were
inspected. Diff and browser script syntax checks passed. The date-filter regression
uses a future empty range so the current checkout date cannot invalidate the fixture.
