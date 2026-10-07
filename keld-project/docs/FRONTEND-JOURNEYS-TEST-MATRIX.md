---
title: KELD and ARE frontend journeys and test matrix
status: candidate-test-inventory
updatedAt: 2026-09-22
owner: KELD product and frontend review
authorityEffect: none
---

# KELD and ARE frontend journeys and test matrix

This is the working inventory of customer-visible journeys at
`staging.keld.studio/` and `are.keld.studio/`. It separates implemented UI,
previous observations, current local tests, and tests still to run. It is not a
new deployment receipt, accessibility certification, license approval, or
production go/no-go. **The actual ARE customer bundle, installation, and real
agent-task test are deliberately last and outside this frontend milestone.**

## Evidence cards and claim limits

| Card | Evidence | What it establishes; what it does not |
| --- | --- | --- |
| E1 — current KELD source | [`web/src/App.tsx`](../web/src/App.tsx), [`web/src/checkout/CheckoutPage.tsx`](../web/src/checkout/CheckoutPage.tsx), [`web/src/checkout/presentation.ts`](../web/src/checkout/presentation.ts), [`prototype/index.html`](../prototype/index.html) | Implemented routes, labels, controls and state mapping in this checkout. Source alone does not establish the deployed bytes or browser behavior. |
| E2 — current local KELD tests | `npm test` in `keld-project/web`: **47/47 passed on 2026-09-22**; [`client.test.ts`](../web/src/checkout/client.test.ts), [`presentation.test.ts`](../web/src/checkout/presentation.test.ts), [`actual-handler.test.ts`](../web/src/checkout/actual-handler.test.ts), [`storefront.test.ts`](../web/src/parity/storefront.test.ts) | Component/client/handler contract evidence on the current working tree. Not a real identity or provider browser run. |
| E3 — prior KELD browser evidence | [H4 staging status](STAGING-STATUS.md), [H4 browser result](../output/playwright/checkout-ui-h4/result.json), [earlier React staging acceptance](REACT-STAGING-ACCEPTANCE.md) | Dated browser and sandbox observations for named prior candidates. H4 result and screenshots are locally present; several older `output/playwright/journeys/` links in the earlier report are absent here. None automatically applies to a later build. |
| E4 — current ARE source and tests | [`are-documentation/src/main.tsx`](../are-documentation/src/main.tsx), [`LiveChat.tsx`](../are-documentation/src/LiveChat.tsx), [`package.json`](../are-documentation/package.json); `npm test` in `keld-project/are-documentation`: **51/51 passed on 2026-09-22** | Current route, chat-control and server fixture behavior. The 51 tests do not prove a current live GLM turn or browser rendering. |
| E5 — prior ARE browser evidence | [Public r23 browser receipt](../are-documentation/evidence/live-public-r23-20260920T173000Z/receipt.json), [explorer release notes](../are-documentation/EXPLORER-RELEASE-NOTES.md), [security handoff](SECURITY-REVIEW-HANDOFF.md) | Dated live-chat, navigation and explorer observations. The explorer's listed `evidence/product-explorer/` files are not in this checkout; WebKit was unavailable in that run. Re-run before claiming the current version passes. |
| E6 — known offer boundary | [Candidate license](ARE-LICENSE-CANDIDATE.md), [distribution audit](DISTRIBUTION-AUDIT.md), [release readiness](RELEASE-READINESS.md) | The owner-selected resale/share-back rule is draft only; covered files and rights remain unverified. Active KELD copy still mentions Apache 2.0. A frontend test must flag this inconsistency, not silently replace the governing terms. |

“Prior” below means evidence from a dated candidate, not a current pass.
“Local” means the 2026-09-22 source tests above, not browser observation.
“To run” is a proposed scenario. An absent receipt is **not tested**, never a
pass. For the current checkout, the staging download is explicitly the sandbox
fixture, not the ARE engine.

## KELD storefront, identity, and checkout journeys

| ID | Customer journey and expected result | Evidence already made | Test still to make on the next exact frontend candidate |
| --- | --- | --- | --- |
| K01 | Anonymous visitor opens `/`, follows primary navigation, returns from the legend, and reaches ARE on its own root domain; old storefront `/are/` must not expose ARE. | Prior browser root/legend/mobile/canonical-link checks: E3, E5. Local storefront parity: E2. | Fresh desktop and mobile route, back/forward, direct-link, 404/redirect, console/network and focus checks on both domains. |
| K02 | Shop discovery: product facts, alpha limits, hidden lower-price shelf, USD 50–1,000 selector, bag edit/remove, and same release at every accepted price. | Prior hidden-shelf/bag browser check: E3. Exact cents and bounds: E2. | Browser boundary values (`49.99`, `50`, `200`, `1000`, `1000.01`, malformed input), bag reopen, storage-disabled path, tax/total wording and mobile buy bar. |
| K03 | Visitor reads the license, delivery, first-100 and post-year-one claims before paying. No contradictory or implied final rights. | **Known failure:** active prototype and checkout source still say Apache 2.0 (E1, E6); candidate custom terms are not operative. | Text inventory across hero, product, FAQ, bag, modal, checkout, receipt and mobile; compare one approved offer/terms source. Keep this gate failed until the displayed offer is truthful. |
| K04 | Contact form validates entries, creates a local draft, copies it, and does not imply a message was sent. | Prior browser check: E3; source: E1. | Keyboard, invalid/overlong fields, clipboard denial, reload behavior, privacy copy, narrow layout. |
| K05 | Anonymous buyer begins signup or sign-in from checkout, completes the Keycloak flow, and returns to the same `/checkout?amount=…` review state. | Prior signup form and H4 auth-return browser observations: E3; return-target tests: E2. | Fresh account and returning account, cancel/back, already-authenticated/different-user case, invalid return target, expired login, disabled cookies, and no duplicate checkout on callback. Record no credentials. |
| K06 | Authenticated buyer reviews a price and chooses Stripe, Mercado Pago Pix or PayPal; frozen BRL amount/reference is visible before provider action where applicable. | Prior provider browser journeys: E3; local price/quote/client checks: E2. | Current-candidate desktop/mobile screenshots and exact server-vs-UI amount/currency comparison for all methods; no provider credential fields on KELD. |
| K07 | Creating payment saves one request key; uncertain network or slow provider preparation resumes that attempt instead of opening a second charge. | H4 `recoveryRetryKeysEqual` and fresh-tab evidence: E3; local lost-response/idempotency tests: E2. | Browser network-drop, double-click, two tabs, refresh during create, delayed Pix preparation, and request-key/server-order identity capture. |
| K08 | Stripe handoff, return/cancel and verification: provider return alone never says paid; only verified owned state enables a fixture download. | Prior Stripe sandbox path: E3; local handler/client tests: E2. | Full current-candidate Stripe sandbox purchase, cancel, decline and repeat callback; compare server order, UI state and one grant. Requires a test account and creates sandbox state. |
| K09 | Pix shows the server-frozen BRL quote, copy/manual code, countdown and pending status; expired instructions disappear while the order remains recoverable. | Prior Mercado Pago and H4 Pix checks: E3; local Pix/recovery tests: E2. | Current sandbox pending/paid/expired paths, clipboard-denied fallback, tab hidden through expiry, delayed settlement, and no duplicate order. |
| K10 | PayPal approval/cancel returns to the owned order with the frozen BRL terms; a cancelled or unverified return grants nothing. | Prior PayPal sandbox and H4 blocked-second-attempt evidence: E3; local destination/BRL checks: E2. | Current sandbox approval, cancel, unsupported/changed destination, refresh on return, and server-verification evidence. |
| K11 | Buyer closes/reopens checkout, refreshes, uses browser Back, leaves a tab idle, or opens a new tab; the same unresolved order is recoverable and a genuine terminal order can start fresh. | H4 reload, history-resume and blocked-second-tab: E3; local state/key tests: E2. | Real browser sleep/session expiry, provider-window expiry, account switch during requests, contradictory local storage, and terminal replacement against a provider-confirmed outcome. Do not infer provider finality from an expired link. |
| K12 | History lists only owned orders; an older paid order can be inspected/downloaded without replacing a newer pending one. | Prior owner-only browser check: E3; local history/download tests: E2. | Two synthetic accounts, pagination, direct foreign order URL, fresh browser, damaged storage, stale response after account switch, and download abort. |
| K13 | Verified payment shows the sandbox fixture and a digest-checked download; pending, cancelled, failed, review-required and revoked states do not offer it. | Prior three-provider fixture journeys: E3; selected local buyer/download/refund/revocation tests in [`integrations/test`](../integrations/test) passed **38/38 on 2026-09-22**. | Current-candidate state-by-state screenshot/ARIA snapshots, one-time grant accounting, inaccessible foreign download, and exact fixture digest. **Do not substitute the real ARE bundle in this milestone.** |
| K14 | Late payment, full refund or lost dispute shows accurate status; uncertainty never promises a completed refund or silently creates another payment. | Local presentation/refund-copy tests: E2. Refund/dispute work remains partly local candidate: [recovery DAG](CHECKOUT-RECOVERY-DAG-2026-09-21.md). | Browser fixture matrix for late payment, pending review, verified full refund, lost dispute, retry/return and history. Genuine provider reversal remains a separate sandbox/operational test. |
| K15 | Logout and unavailable account service fail closed without assigning an unresolved checkout to the next account. | Prior logout browser check: E3; local cross-account/expired-token tests: E2. | Real token expiry/revocation mid-checkout, account service outage/recovery, sign-out in another tab, and same-browser second account. |
| K16 | Buyer can identify the available account-recovery path and understands when email verification or password reset is unavailable. | [Earlier staging acceptance](REACT-STAGING-ACCEPTANCE.md) records both as disabled without staging SMTP (E3); this is **not** a recovery pass. | Once configured, verify email confirmation, expired/reused links, password reset, return to owned order and no cross-account disclosure. Until then, check that the UI does not imply those flows work. |

The frontend presentation-state fixture set is `review`, `creating`,
`awaiting_provider`, `awaiting_customer_action`, `verifying`, `pending`,
`replacement_pending`, `paid`, `revoked`, `failed`, `review_required`, and
`unavailable` from E1. Every state should have an accessible heading, one
truthful primary action or deliberate blocked state, a path to owned history,
and no actionable expired or unverified provider instruction.

## ARE introduction, explorer, documentation, and chat journeys

| ID | Visitor journey and expected result | Evidence already made | Test still to make on the next exact frontend candidate |
| --- | --- | --- | --- |
| A01 | Visitor opens `are.keld.studio/`, navigates Introduction → Try ARE → Explore the engine → Documentation, and uses Back/deep links without losing orientation. | Prior public root/legacy redirect/chat discovery: E5; current hash routes: E4. | Fresh cross-site entry, all nav links, refresh/back/direct hash, focus landing, broken asset and console checks. |
| A02 | Introduction explains ARE through a reversible, scroll-led hero; pause and reduced-motion alternatives retain the same information. | Historical browser/hero scripts and reports: [`README.md`](../are-documentation/README.md), E5. | Desktop/mobile/narrow-pane and reduced-motion browser checks; reverse scroll, chapter jump, keyboard focus, text readability and decorative asset failures. Screenshot review remains human judgment. |
| A03 | Task and capability explanations remain distinguishable from real runtime claims, and cross-links reach their intended sections. | Historical explanation-path proof described in [`README.md`](../are-documentation/README.md). | Follow every story/capability link on the current build; check accessible names, source/limitation copy, narrow layout and a first-time reader's explanation in their own words. |
| A04 | Explorer starts at a feature, can show all nodes, select a node, search, switch lenses and complete guided tours without replacing the graph or opening unrelated manuals. | Prior explorer candidate checks and Chromium/Firefox notes: E5; current explorer source: E4. | Re-run every tour/step on current build; unknown node/feature/tour, no-result search, pan/zoom, keyboard node activation, focus return and mobile controls. WebKit remains unproven. |
| A05 | Visitor explicitly opens a guide card or full manual, reads it, returns to the same graph/selection/viewport, and can follow a deep link. | Prior explorer/reader report: E5; current route/source: E4. | Direct guide/article/deep-link matrix, loading failure/retry, scroll restoration, history, focus return and long-document mobile reading. |
| A06 | Canvas layout/cards survive same-tab reload where intended, migrate supported stored state, reject corrupt state and reset only by visitor choice. | Prior explorer report: E5; [`workspace-persistence.test.mjs`](../are-documentation/scripts/workspace-persistence.test.mjs) exists. | Current browser storage migration, corrupt/blocked storage, two tabs, reset confirmation/visibility, rollback compatibility and no cross-visitor data leak. |
| A07 | New anonymous visitor can discover chat, send a message, see one streamed answer/activity, and never see an empty success after a protocol failure. | Prior real GLM r23 browser turn: E5; current fixture/server tests: E4. | One explicitly budgeted live turn on the current candidate, streaming interruption, invalid output (`intent-output-invalid`), malformed/empty stream, console/network receipt and truthful retry action. A fixture-only pass is not a live-model pass. |
| A08 | Visitor sees retained language/routing state, forgets language or routing separately, and starts fresh; old visible messages are excluded from new model context after a scoped reset. | Prior r23 forget/start-fresh browser receipt: E5; [`chat-regression-proof.mjs`](../are-documentation/scripts/chat-regression-proof.mjs) contains fixture navigation/retry checks. | Current live two-turn scoped-reset test with server state/context evidence; reset during a stream, reset failure, focus/announcement and allowance unchanged. Do not infer deletion at the provider. |
| A09 | Same-tab refresh/navigation restores only a valid, server-revalidated temporary chat; expiry, new browser context or rejected capability starts safely fresh. | Fixture chat regression: E4; prior live r23 receipt: E5. | Close/reopen tab, idle beyond configured retention, session expiry while composing, stale/revoked capability, browser storage denied/corrupt, two visitors and cross-session isolation. |
| A10 | Stop, retry, offline/provider outage, shared quota, turn limit and unavailable status produce actionable, accurate UI without double-sending or leaking tokens. | Current controls and error mapping: E4; fixture retry check: [`chat-regression-proof.mjs`](../are-documentation/scripts/chat-regression-proof.mjs). | Controlled response fixtures for every error; browser offline/online, stop during stream, quota reset time, 20-turn boundary, mobile composer and screen-reader announcement. Live quota exhaustion is not required merely to test copy. |
| A11 | Model text renders safely as content; no links/tools/files/commands are executed through the visitor chat. | Fixture Markdown rendering: [`chat-regression-proof.mjs`](../are-documentation/scripts/chat-regression-proof.mjs); security architecture/evidence boundaries: [security handoff](SECURITY-REVIEW-HANDOFF.md). | HTML/Markdown/link and prompt-injection fixtures with DOM/network/side-effect observation. Browser proof is necessary but not sufficient for backend isolation; pair with separate runtime containment evidence. |

## Shared validator contract and scenario shape

Use one scenario record per journey: `id`, exact source/image identity, route,
role, starting account/order/session fixture, viewport/browser, action sequence,
expected visible state, expected server truth, evidence paths, and cleanup/retention.
Capture a failure as well as a pass; avoid raw credentials, session tokens, chat
content, payer identities and full provider IDs in shared receipts. Browser tests
should prefer visible names/roles and record console/network errors, screenshots,
ARIA/focus state and trace for interactions.

| Layer | Proposed check and claim class |
| --- | --- |
| L0 — smoke | Exact route, required assets, fatal console/network failures: deterministic gate. |
| L1 — accessibility | Names/roles/states, forms, keyboard and focus/announcements: deterministic checks plus manual assistive-technology residue; no certification claim. |
| L2 — layout | Overflow, clipping and overlap at 320, 390, 768 and 1440 px, 200% zoom and reduced motion: measurements plus screenshot review. |
| L3 — interaction | State and server-truth assertions for each K/A scenario: deterministic gate only after stable fixtures. |
| L4 — attention/comprehension | Is payment status clear? Can a visitor find reset? Are source-vs-service rights understandable? Screenshot review and soft flags, not an automated score. |
| L5 — domain practice | Checkout amount/terms/recovery and chat privacy/allowance disclosure: product-specific checks; subjective conventions stay soft flags. |
| L6 — human evidence | Ask a first-time visitor to explain ARE, recover an unfinished checkout, and locate/clear a preference. Record observed task success and confusion separately from browser automation. |

Before promoting reusable hard gates, keep a known-good case, an intentionally
broken case and a false-positive trap for each relevant journey. The
`ux-evidence-validator` skill is a **seed specification**, not an installed
calibrated browser harness. Existing project-specific Playwright scripts can
produce evidence, but this document does not claim that the generic L0–L6
harness or its fixture corpus has been implemented.

## Execution order and frontend milestone

1. **No external state:** inspect exact built copy/routes, rerun local KELD and
   ARE tests, then run anonymous K01–K04 and A01–A06 browser scenarios against
   an identified build. Resolve the Apache/custom-license contradiction as a
   truthful *not-for-sale sandbox* presentation; do not advertise the draft as
   an operative license.
2. **Controlled browser fixtures:** cover K07, K11–K15 and A07–A11 failure,
   reset, accessibility and responsive states with synthetic responses; capture
   screenshots, traces, ARIA/focus and console/network summaries.
3. **Staging sandbox and budgeted model use:** with test-account/provider
   coordination, rerun K05–K10 against the same exact staging candidate and one
   A07–A09 real chat sequence. Preserve server-side payment and chat-isolation
   evidence without recording secrets. A provider return is never payment proof.
4. **Human review:** have a new visitor attempt checkout recovery and explain
   the offer; have another explore ARE, find its limits and clear a preference.
   Record confusion as findings, not as invented automated pass/fail metrics.
5. **ARE bundle last:** only after frontend copy, flow and legal/artifact gates
   are resolved, replace the sandbox fixture in a separately authorized test of
   actual bundle download, clean installation and a real customer task.

The frontend milestone passes only when all required current-candidate K/A
journeys have evidence, the offer has no materially false license/delivery
claim, payment/identity/chat failures recover safely, and the chosen browser
and viewport matrix has no unexplained deterministic failure. It remains a
**frontend/sandbox** milestone: neither that pass nor a past provider fixture
grants ARE sale, production payment, accessibility certification, or bundle
approval.

## Open Questions

- Which exact staging build/manifest and browser matrix will be the next
  frontend candidate? The dated E3/E5 reports cannot answer for a later build.
- What approved interim storefront wording should replace Apache before final
  customer terms exist? Legal/distribution decisions remain in E6.
- Which synthetic accounts and provider sandbox actions may be used for the
  next browser run, and who retains/cleans its resulting test orders?
- What idle-retention and shared spend settings should the ARE UI display on
  that exact deployed candidate? Keep the server response authoritative.
- Which human-review tasks and participants will be used for L6 evidence?
