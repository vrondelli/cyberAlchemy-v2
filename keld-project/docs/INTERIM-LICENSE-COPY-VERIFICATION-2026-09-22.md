---
title: Interim sandbox license-copy verification
status: local-candidate-verified-not-deployed
updatedAt: 2026-09-22
authorityEffect: none
---

# Interim sandbox license-copy verification

The owner approved this exact customer-facing interim statement on
2026-09-22: “Sandbox demonstration only. No ARE engine release is delivered.
Final license terms are under review.” This is a **sandbox disclosure**, not
adoption of the [ARE license candidate](ARE-LICENSE-CANDIDATE.md), permission
to sell an ARE engine release, or a deployment approval.

## Local change

- The canonical [storefront template](../prototype/index.template.html),
  [shop fragment](../prototype/shop.fragment.html), and
  [dialogs](../prototype/shop.dialogs.html) no longer advertise Apache 2.0.
  The generated [prototype storefront](../prototype/index.html) and all five
  other generated HTML editions were rebuilt from those sources. The offer no longer
  advertises Apache 2.0 in the hero, ribbon, product facts, FAQ, bag,
  checkout preview, privacy text, product overview, or license-status dialog.
  The dialog now explains that this page grants no ARE engine rights.
- The dynamic [shop script](../prototype/assets/shop.js) now uses pending
  license/test-artifact language in price, bag, mobile, FAQ and downloadable
  preview-summary text. The public [shop config](../prototype/assets/shop-config.js)
  has `licenseId: 'unpublished'`, an empty license URL and
  `licenseApprovedForSale: false`; its live gate additionally requires an
  approved license identifier and URL. Existing sale/fulfillment flags stay
  false.
- The [React checkout](../web/src/checkout/CheckoutPage.tsx) shows the
  approved statement even while account validation is unavailable, and calls
  the verified download a sandbox test artifact. The unmounted fallback shop
  copy in [App.tsx](../web/src/App.tsx) was also corrected so it cannot revive
  the old claim if mounted later. A [parity regression test](../web/src/parity/storefront.test.ts)
  rejects Apache claims across the active React, generator-source, and
  storefront files. Two standalone QA assertions now expect pending terms.

## Exact local validation

| Check | Result |
| --- | --- |
| KELD `npm test` | **48/48 passed**, including the new interim-copy regression. |
| KELD `npm run build` | Typecheck and Vite build passed. `web/dist/index.html` SHA-256 `69c20fab28194e785b99c05468017840c20bbb799f54a0ee6c0a925b8d3f842b`; entry `assets/index-C0_FOcVc.js`. |
| Built bytes | No `Apache 2.0` claim found in `web/dist`. |
| KELD fixture browser | Final [result](../output/playwright/matrix-20260922-license-copy/keld-fixture-final/result.json) passed: five widths, checkout recovery, Pix, account isolation, and no page errors. [320 px review screenshot](../output/playwright/matrix-20260922-license-copy/keld-fixture-final/checkout-review-320.png) shows the readable notice with no horizontal overflow. |
| Manual local preview | Shop ribbon, license dialog and bag showed pending terms; checkout displayed the approved sentence even while the local account API was unavailable. |

The first mobile preview exposed low contrast from an order-card style reused
on a light page. The final build uses a dedicated dark-text notice and passed
the rerun above. The [earlier matrix report](FRONTEND-MATRIX-EXECUTION-2026-09-22.md)
remains a dated record of the pre-fix candidate, not the current copy verdict.

## Remaining gate

The actual governing ARE license is still a drafting candidate. Covered
files, ownership, third-party notices, purchaser verification, final terms,
and the customer bundle are unresolved. This local copy has **not** been
deployed or checked on `staging.keld.studio`; no real provider or model call
was made. Historical documents, screenshots, and prior QA outputs may still
record the old wording; they are not current offer pages. The standalone QA
scripts were updated but not executed because they write to existing preview
outputs and rely on a local Chromium path.
