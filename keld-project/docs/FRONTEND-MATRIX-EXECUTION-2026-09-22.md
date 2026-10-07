---
title: KELD and ARE frontend matrix local execution
status: partial-local-evidence
updatedAt: 2026-09-22
authorityEffect: none
---

# Frontend matrix execution — 2026-09-22

This is a **local current-source/fixture** receipt for the [27-journey
matrix](FRONTEND-JOURNEYS-TEST-MATRIX.md), executed after the [reviewed
DAG](FRONTEND-MATRIX-EXECUTION-DAG.md). It is not a staging deploy, provider
sandbox purchase, real GLM conversation, license approval, human UX study,
security containment verdict, or ARE-bundle product test.

## Candidate and environment

- Repository HEAD: `fb23addf01acc82d9ae6db99eddde9ead53e3e1a` with unrelated
  dirty work preserved. The built source is **not** represented by HEAD alone.
- Fresh KELD build `web/dist/index.html` SHA-256:
  `d8044f84e28b0f5ebd2d19bc5e42a2c4ac460a808d928020a67b132469482791`;
  entry `assets/index-C-Il5oup.js`.
- Fresh ARE build `are-documentation/dist/index.html` SHA-256:
  `268ae5422a8547a2fef16285da0f47f150702f7dbc9d47d5a57ea726630100c6`;
  entry `assets/index-OUNEdI5T.js`.
- Local preview only: KELD `http://127.0.0.1:4178/`, ARE
  `http://127.0.0.1:4193/are/`. Chromium fixture/browser version
  `153.0.8010.12`; Firefox passed the ARE explorer path. WebKit executable
  was absent. Existing user-level Chromium libraries allowed local runs
  without a system install.
- Browser snapshots/screenshots and fixture output are under
  [`output/playwright/matrix-20260922`](../output/playwright/matrix-20260922/).
  These artifacts can include synthetic contact text; do not publish the
  directory without a separate privacy review.

## Automated results

| Surface | Current-source result | Claim ceiling |
| --- | --- | --- |
| KELD web `npm test`, `typecheck`, `build` | **47/47 tests**, typecheck and build passed. | Local source/client contracts, not live identity/provider. |
| ARE `npm test`, three canvas/graph/persistence test files, `build` | **51/51 + 16/16 tests** and build passed; page/download budgets passed. | Server fixtures and local state logic, not a live GLM turn. |
| Integrations `npm test` | **165/165 tests** passed. | Synthetic handler/SDK/ledger scenarios; no sandbox merchant action. |
| KELD `test/browser-check.mjs` on fresh `web/dist` | Passed: 1440/1024/768/390/320 no horizontal overflow, one Stripe create/confirm fixture, Pix/copy/expiry, retry-key reuse, tab/account isolation, owned history, revocation, late-refund and no page errors. [Fixture screenshots](../output/playwright/matrix-20260922/keld-fixture/). | Controlled network fixture, not real Keycloak, Stripe, Pix or PayPal. |
| ARE `chat-regression-proof.mjs` | Passed 11 assertions: safe Markdown, nav/refresh persistence and server revalidation, retry-to-composer, no uncaught error. | Mocked stream; no paid model turn or backend containment proof. |
| ARE explorer browser matrix | [Chromium and Firefox passed](../output/playwright/matrix-20260922/are-explorer/browser-matrix.json) one guided-tour → full-guide → canvas-return path; WebKit unavailable. | One tour path only; not every lens, node, tour or assistive technology. |

The explorer runner was changed only to accept a trusted Playwright package,
Chromium binary and fresh output directory through environment variables;
its journey assertions are otherwise unchanged. The older live-chat scripts
were **not** run because their reload/copy expectations and evidence handling
are stale.

## Journey coverage, with missing cases explicit

`Fixture` means an automated controlled response; `local browser` means
fresh-built preview. A row marked partial is **not a journey pass**.

| ID | Current evidence | Status and next exact case |
| --- | --- | --- |
| K01 | Local root/shop/back and ARE root link visible. | **Partial:** deployed domain, legacy `/are/`, back/forward and focus matrix untested. |
| K02 | $1,000 selection, bag and checkout amount observed locally; web price tests passed. | **Partial:** browser boundary values, edit/remove and storage-disabled path remain. |
| K03 | Shop, bag/product notes and checkout still display Apache 2.0. | **Fail:** conflicts with the candidate narrower resale/share-back rule; owner-approved operative wording is missing. |
| K04 | Synthetic contact form made an inquiry draft; UI explicitly said nothing was sent. | **Partial:** invalid/overlong entry, clipboard denial and keyboard path remain. |
| K05 | Callback preservation has local tests/fixtures. | **Not live-tested:** real Keycloak signup/sign-in, different-user and expired-login cases remain. |
| K06 | Price/provider UI covered by tests and checkout fixture. | **Not live-tested:** server-vs-UI frozen terms on each current sandbox provider. |
| K07 | Fixture confirmed key reuse, lost response and blocked second tab. | **Fixture-covered;** real delayed provider creation/network timing remains. |
| K08 | Fixture confirmed provider return/cancel not paid and one verified grant. | **Fixture-covered;** current Stripe sandbox success/decline/cancel remains. |
| K09 | Fixture confirmed Pix copy/manual, expiry and recheck. | **Fixture-covered;** current Mercado Pago sandbox pending/paid/late settlement remains. |
| K10 | Local PayPal destination/server tests passed. | **Not browser-tested** on current candidate; sandbox approval/cancel remains. |
| K11 | Fixture covered reload, fresh tab, replacement and recovery. | **Fixture-covered;** actual sleep/session expiry and provider finality remain. |
| K12 | Fixture covered owned/older history and account-switch isolation. | **Fixture-covered;** second real synthetic identity and foreign URL/download remain. |
| K13 | Fixture paid download and revoked denial passed; server tests passed. | **Fixture-covered;** exact current staging artifact digest/grant accounting remains. |
| K14 | Late-refund/revocation fixtures and local copy tests passed. | **Fixture-covered;** genuine sandbox reversal and all presentation screenshots remain. |
| K15 | Static preview failed closed on absent account backend; fixture account switch/logout passed. | **Partial:** real token expiry/revocation and service recovery remain. |
| K16 | Static preview did not offer a working email recovery path. | **Blocked:** email verification/reset transport and policy not configured/tested. |
| A01 | Local intro → explorer → docs links, node deep link and reload observed. | **Partial:** deployed root, complete back/deep-link/focus matrix remain. |
| A02 | Local mobile introduction rendered; build/asset checks passed. | **Partial:** reverse scroll, reduced-motion and decorative-failure behavior remain. |
| A03 | Explanation links are present. | **Not fully tested:** each cross-link and first-time comprehension remain. |
| A04 | Search found Context Envelope; Chromium/Firefox one-tour fixture passed. | **Partial:** all tours, unknown values, keyboard node activation and WebKit remain. |
| A05 | One full guide/return path passed in two browsers; local docs opened. | **Partial:** direct articles, loading failure, scroll/focus restoration remain. |
| A06 | 16 canvas/graph/persistence unit tests passed; node URL survived local reload. | **Partial:** browser corrupt/blocked storage, two tabs, reset and migration remain. |
| A07 | Mocked streamed Markdown rendered. | **Not live-tested:** real GLM turn and `intent-output-invalid` failure. |
| A08 | Local session controls/Start fresh showed a cleared-state announcement. | **Partial:** scoped preference/routing reset and server context exclusion remain. |
| A09 | Mocked same-tab refresh revalidated and restored chat. | **Partial:** expiry, closed tab, rejected capability and two-visitor isolation remain. |
| A10 | Mocked provider outage offered retry to composer. | **Partial:** stop, offline, quota, 20-turn boundary and mobile announcements remain. |
| A11 | Mocked Markdown rendered as content; server tests passed. | **Partial:** hostile HTML/link fixture plus backend side-effect containment proof remain. |

## Findings and gates

1. **K03 — release blocker:** active shop/checkout copy still offers Apache
   2.0 rights. The candidate [ARE license](ARE-LICENSE-CANDIDATE.md) is not
   operative, so replacing the terms requires an explicit product/legal
   decision. Until then the frontend verdict is **fail**, despite passing
   mechanics.
2. **K15 wording review:** on a local preview with no account API, checkout
   correctly disables payment, but says the order remains saved in the tab
   *and authenticated history* before any order is visible. Review this
   promise against the draft-only state; it may overstate recovery in this
   branch.
3. **A05 soft UX flag:** at 390 px the two adjacent documentation links look
   visually joined (`Start guided tour →Explore the engine →`). This is not a
   deterministic route failure; review spacing. [Mobile screenshot](../output/playwright/matrix-20260922/page-2026-09-22T14-08-45-705Z.png).
4. **Browser environment:** WebKit and real 200% zoom/assistive-technology
   review remain unavailable. Static-preview console checks reported zero
   errors for the exercised pages, and KELD shop/ARE docs had no horizontal
   overflow at 390 px. [KELD screenshot](../output/playwright/matrix-20260922/page-2026-09-22T14-08-45-763Z.png).

## Next frontier

Obtain approved interim offer/license text, repair the active prototype and
checkout copy, rebuild as D0b and rerun affected KELD tests/browser lanes.
Separately prepare synthetic Keycloak identities and exact current staging
build for D8; arrange a capped/no-secret live chat probe for D9; then perform
D7b and independent L6 review. No D8/D9/D11 result can be inferred from this
local run. The actual ARE bundle remains last (D12).
