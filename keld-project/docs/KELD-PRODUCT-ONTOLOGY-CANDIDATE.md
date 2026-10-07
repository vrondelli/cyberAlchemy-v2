# KELD product ontology

Status: candidate product/experience model, 2026-09-21. Owner for experience
and claims: KELD product owner. Scope: what a visitor, buyer, or operator can
see or do across the KELD storefront, public ARE site, checkout, and post-order
journey. It is intentionally separate from the
[business ontology](KELD-BUSINESS-ONTOLOGY-CANDIDATE.md), which owns commercial
entities and trust rules, and from code architecture. This model grants no
release, refund, access, or deployment authority.

## Product surfaces and capabilities

| ID | Kind | Surface / user purpose | Current posture and evidence |
| --- | --- | --- | --- |
| P01 | Surface | KELD storefront: discover the studio, ARE offer, price and route into checkout. | React root currently injects the [legacy prototype](../web/src/App.tsx); source copy contains stale Apache terms. |
| P02 | Surface | Public ARE page: understand and explore the engine before buying. | Separate ARE public origin in [config](../web/src/config.ts) and [ARE documentation](../are-documentation/README.md). Not the deliverable engine. |
| P03 | Capability | Public ARE chat/preferences: bounded informational interaction for anonymous visitors. | [Chat server](../are-documentation/server/chat.mjs) and [edge](../are-documentation/server/edge-server.mjs); separate from KELD account/commerce. |
| P04 | Content contract | Offer explanation: selected price, alpha status, release/rights/support terms. | [Intake](PROJECT-INTAKE.md) supplies candidate offer; active [prototype storefront](../prototype/index.html) and [checkout](../web/src/checkout/CheckoutPage.tsx) include conflicting license copy. |
| P05 | Capability | Account entry: register, sign in, renew session, return to intended checkout. | [Auth](../integrations/src/auth.mjs), [client](../web/src/checkout/client.ts), [checkout page](../web/src/checkout/CheckoutPage.tsx). Production recovery/abuse controls remain separate gates. |
| P06 | Surface | Checkout workspace: review frozen amount, choose sandbox provider, resume exact request. | Active [CheckoutPage](../web/src/checkout/CheckoutPage.tsx), [client](../web/src/checkout/client.ts), [service](../integrations/src/checkout.mjs). |
| P07 | Journey step | Provider handoff: hosted card/PayPal approval or Pix instructions. | [Adapters](../integrations/src/payments.mjs). Provider UI is external and does not decide KELD access. |
| P08 | Journey step | Outcome check: KELD verifies after return, webhook, or manual refresh. | [Checkout service](../integrations/src/checkout.mjs). Return/cancel URL is orientation, not payment truth. |
| P09 | Surface | Order shelf/history: find and restore orders after reload, closure, or session change. | [Client](../web/src/checkout/client.ts) and [repository](../integrations/src/repository.mjs). Ownership is server-enforced. |
| P10 | Capability | Protected delivery: download the exact eligible artifact. | [Ledger](../commerce/ledger.py), [delivery](../commerce/delivery.py). Staging exposes only a test fixture, not an approved ARE release. |
| P11 | Service | Supporter service: upgrades and direct maker support for qualifying first-100 buyers. | Business direction in [intake](PROJECT-INTAKE.md); exact service channels/guarantees remain open. |
| P12 | Capability | Exception resolution: explain pending, expired, late-paid, refunded, revoked, or review states and route to safe next action. | [Checkout UI](../web/src/checkout/CheckoutPage.tsx), [decision](decisions/CHECKOUT-PAYMENT-LIFECYCLE-2026-09-21.md), [recovery DAG](CHECKOUT-RECOVERY-DAG-2026-09-21.md). Automatic branches are not generally live-qualified. |
| P13 | Backstage process | Operator review: inspect provider evidence, reconciliation, refund and reversal cases. | [Event worker](../integrations/src/event-worker.mjs), [refund worker](../integrations/src/refund-worker.mjs), [bridge](../commerce/sdk_bridge.py); no dedicated operator UI is evidenced. Trusted operator identity is still a gate. |
| P14 | Cross-cutting disclosure | Distinguish sandbox testing from real sale, real release and production service. | [Staging status](STAGING-STATUS.md) and [acceptance](REACT-STAGING-ACCEPTANCE.md); must remain adjacent to payment/delivery claims. |

## Product relationships and composition

| From | Relation | To | Experience rule |
| --- | --- | --- | --- |
| P01 storefront | introduces | P02 public ARE page | Exploration does not create an account or entitlement. |
| P02 public ARE page | offers | P03 informational chat | Chat can answer/explain within its own boundary; it cannot inspect private orders or execute checkout. |
| P01 storefront | presents | P04 offer explanation | Offer copy must match the approved artifact, license and environment. |
| P04 offer explanation | opens | P06 checkout workspace | Selected price becomes server-frozen terms; a page link alone is not an order. |
| P06 checkout | requires | P05 account entry | Auth return must restore the intended checkout and its account-bound draft. |
| P06 checkout | delegates payment action to | P07 provider handoff | KELD never treats handoff/return as payment completion. |
| P07 provider handoff | returns orientation to | P08 outcome check | Buyer can verify, wait, or recover without creating a duplicate charge. |
| P08 outcome check | updates | P09 history and P12 exception state | Authoritative server result replaces local hints; uncertain stays recoverable. |
| P08 verified eligible outcome | unlocks | P10 protected delivery | Exact artifact is checked at download time; future reversal can stop future access. |
| P08 qualifying purchase | may activate | P11 supporter service | Benefit is not the same thing as the software license or test fixture. |
| P12 unresolved exception | escalates to | P13 operator review | Buyer-facing copy must not claim a refund merely from an intent/command. |
| P14 environment disclosure | qualifies | P04/P06/P07/P10 | Sandbox payment and test-artifact claims cannot be mistaken for production purchase/delivery. |

## Journey and recovery contracts

| Situation a person encounters | Product response, not implementation shortcut |
| --- | --- |
| Visitor reads ARE and chats | Keep P03 separate from private account, purchase and engine runtime. Preferences must not imply a purchased entitlement. |
| Buyer signs in from checkout | Return to P06 with the intended price/draft; if account changes, do not adopt another account's key. |
| Buyer closes tab or returns next day | P09 restores owned history; P08 rechecks provider state. Local storage is a recovery hint, not payment truth. |
| Session expires mid-checkout | P05 renews or requests sign-in, preserving the exact unresolved order/key and never leaking it to another account. |
| Provider window expires | P12 removes unusable instructions but preserves the order until terminal-unpaid proof or reviewed remedy. Do not offer an unsafe second payment. |
| Provider outcome is uncertain | P08/P09 offer recheck/restore. “Try again” must mean same attempt unless an old-to-new replacement is proven. |
| Payment arrives after local hold | P12 shows review, not delivery; selected D2 remedy waits for verified refund outcome. |
| Full refund or lost dispute verified | P10 future access ends and P09/P12 explain revoked status. Partial refund goes to review; no automatic partial policy is required now. |

## Bridge to the business ontology

P01/P02/P03 communicate about B01 KELD and B02 ARE but do not instantiate B03
release or B11 access. P04 represents B04 offer and B16 license claims. P05
establishes B05 buyer-account ownership. P06 represents B07 frozen terms and
B08 order; P07 represents B09 internal attempt and B17 provider resource;
P08 may observe B10 verified
facts; P10 projects B11 access; P11 serves B12 benefit; P12/P13 handle B13–B15
remedies and exceptions. These mappings are **representations**, not permission
for the UI to mutate business truth.

## Product simplification boundary

The smallest coherent product journey is **explore → understand the offer →
authenticate → preserve one owned attempt → pay externally → verify with KELD →
deliver or explain/recover**. P09/P12 are part of that journey, not optional
add-ons: without them, a closed tab, expiring session, ambiguous provider
response, or late settlement strands the buyer. P03 and P11 are valuable but
separate capabilities. P13 is a backstage process; it should not leak into
the buyer's vocabulary as if “reconciliation” were a consumer action.

## Open Questions

1. Which storefront implementation is the product owner for P01, and when can
   the unmounted duplicate React tree and legacy HTML/script path be retired?
2. What exact approved B03/B16 release and rights can P04/P10 claim? Current
   Apache sale copy must be reconciled with owner intent before real sales.
3. What service channel and terms make P11 support actionable, and how will
   buyers learn whether their first-100 benefit is active?
4. What safe self-service P12 action exists for provider flows without proven
   terminal nonpayment (notably PayPal), and what response time does P13 own?
5. What privacy, retention, abuse and spend policy governs P03 in production?
