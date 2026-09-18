# KELD release metadata preview

The storefront can now show the verified private bundle's version, size, contents,
tested setup and preparation status. This is a local preview projection, not a
public release or checkout implementation.

## Build and view

```sh
python3 keld-project/scripts/build-connected-preview.py
python3 -m http.server 4195 --bind 127.0.0.1 --directory keld-project/evidence/connected-preview
```

Open `http://127.0.0.1:4195/shop.html#release-preview`.
The generated output has the existing KELD visual identity and adds a release
section titled “A working package. Being prepared for you.” The six static/standalone
pages are rebuilt together. Original imported templates and configuration remain
unchanged; rebuilding replaces one generated preview directory.

## Data boundary

The builder reads the private customer-bundle manifest and verifies the actual
archive's byte size and SHA-256 before producing anything. It requires completed
installation, profile and context-projection checks and reproducible packaging.

`assets/are-release.json` is a field-by-field allowlisted projection. It contains
product/version, bundle size, contents, tested runtime and preview status. It does
not include source inventory, private paths, archive locators, credentials or
entitlement data. Checkout/download flags are always false; even a source manifest
with sale approval cannot turn this preview builder into a sales activation path.

Only generated HTML and assets enter the served directory. The full private
archive and private evidence remain outside it. The release section explicitly
marks the starter's original commercial terms as provisional while the license
question is pending. It does not silently change the starter's intended license.

## Validation

```sh
python3 keld-project/scripts/test_preview_metadata.py
KELD_PREVIEW_URL=http://127.0.0.1:4195 node keld-project/scripts/smoke.mjs
python3 keld-project/scripts/verify-import.py
```

On 2026-09-17: metadata checks passed, 27 served-browser checks passed, and all 59
imported files plus six reproducible baseline outputs retained their original
identity. Browser checks cover release rendering, omitted private fields, closed
sale gates, private archive/manifest requests returning 404, price and checkout
preview behavior, and no horizontal overflow at 320, 390, 768 and 1440 pixels.

## Open Questions

The license direction awaits the owner response. This does not block local preview
work; it does block final license wording and customer release materials. Next
commercial dependencies are merchant/provider selection, support destination,
purchase/refund policies, authenticated delivery and test-mode payment fulfillment.
Their order remains in [DELIVERY-PLAN.md](DELIVERY-PLAN.md).
