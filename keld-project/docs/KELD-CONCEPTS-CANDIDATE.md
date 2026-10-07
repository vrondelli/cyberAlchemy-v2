# KELD concept glossary

Status: candidate domain language, 2026-09-21. Owner for acceptance: KELD
product/merchant owner; implementation and legal owners decide their respective
contracts. Consumer: product, frontend, commerce, ARE, support, and release
work. This glossary describes the observed system and selected policy; it does
not promote definitions, approve a license, or enable a payment workflow.

## Scope and source order

The [intake](PROJECT-INTAKE.md) records product intent; the
[payment-lifecycle decision](decisions/CHECKOUT-PAYMENT-LIFECYCLE-2026-09-21.md)
records the selected D1/D2/D3 policy; current code records implemented behavior;
the [recovery DAG](CHECKOUT-RECOVERY-DAG-2026-09-21.md) distinguishes local
candidates from staging. [Architecture review](KELD-ARCHITECTURE-COUPLING-REVIEW-2026-09-21.md)
records observed conflicts. Historical prototype copy is not a later policy
decision. When code, owner intent, and staging differ, retain the disagreement.

## Business and product language

| Term | Plain meaning in this context | Boundary / disposition |
| --- | --- | --- |
| KELD | The independent studio and seller-facing identity for agent tools. | Proposed context-bound meaning from [intake](PROJECT-INTAKE.md); not the ARE engine or payment provider. |
| ARE | Agent Reasoning Engine: the software KELD intends to distribute. | Specialized commercial meaning from [intake](PROJECT-INTAKE.md); distinct from the public explanatory ARE page and its chat. |
| Public ARE experience | A visitor-facing explanation and bounded chat about ARE. | Observed in [ARE server](../are-documentation/server/chat.mjs); not downloaded engine access, customer support entitlement, or payment proof. |
| Product | The identified thing offered: a particular ARE software release, with separately stated service benefits. | Proposed. Do not equate site copy, preview, test fixture, and distributable release. |
| Release artifact | Versioned distributable bytes, manifest/digest, instructions, and rights materials. | Candidate from [intake](PROJECT-INTAKE.md) and [delivery](../commerce/delivery.py); current staging delivers a test artifact, not the approved engine release. |
| Offer | Price range, selected release, rights statement, and any benefit terms presented before purchase. | [Intake](PROJECT-INTAKE.md) retains USD 200 base and accepted USD 50–1,000; exact license and real release remain open. |
| Selected price | Buyer's accepted USD amount for the same stated release and rights. | Observed in [ledger](../commerce/ledger.py); it is not a license tier. |
| Frozen terms | Server-owned snapshot of order amount, currency, release digest, provider terms, and expiry, including a quote when needed. | Observed in [checkout service](../integrations/src/checkout.mjs) and [bridge](../commerce/sdk_bridge.py); browser display cannot reprice an existing attempt. |
| BRL quote | Server-owned conversion from the selected USD price to a BRL provider amount, with source/reference and policy lifetime. | [Config](../integrations/src/config.mjs) currently supports a merchant-fixed nonexpiring quote; not a live market rate. |
| Buyer / customer | Person controlling an authenticated KELD account that owns checkout and delivery. | [Auth](../integrations/src/auth.mjs) and [ledger](../commerce/ledger.py); payer at a provider can be a separate identity. |
| Supporter benefit | First-100 purchase's time-bounded updates and direct maker support, separate from software rights/download. | [Intake](PROJECT-INTAKE.md) and [ledger](../commerce/ledger.py); detailed support promise and post-year policy still need owner approval. |
| License / software rights | Permission governing use, modification and redistribution of released software. | Open. [Owner-intent research](LICENSE-PAYMENT-RESEARCH.md) supersedes the starter's Apache direction, but final legal text is absent. Existing visible Apache copy conflicts. |

## Checkout and financial language

| Term | Plain meaning in this context | Boundary / disposition |
| --- | --- | --- |
| Checkout | Buyer's journey from selected offer through authentication, payment handoff, verification, and order outcome. | Proposed journey; a browser page is only one view of it. |
| Order | KELD ledger record for one buyer, selected price, release, reservation, and outcome. | Observed in [ledger](../commerce/ledger.py). Not the provider's order/session/capture. |
| Owned checkout attempt | Account-bound order, stable request key, frozen terms, and traceable provider payment attempt. | Proposed smallest coherent unit. A discovered duplicate provider resource is an anomaly attached to it, not permission to create another order. |
| Request key | Client-generated, account-bound idempotency identity saved before creating a checkout. | [Browser client](../web/src/checkout/client.ts), [ledger](../commerce/ledger.py). Retry means same key and terms, not a new payment. |
| Reservation / hold | Time-limited claim on one order and possibly a first-100 supporter slot. | [Ledger](../commerce/ledger.py). Local expiry does not prove provider nonpayment. |
| Provider attempt | KELD's record of a Stripe, Mercado Pago, or PayPal creation/verification path. | [Bridge](../commerce/sdk_bridge.py). It may be preparing, bound, uncertain, or anomalous; do not merge with financial truth. |
| Provider resource | External session, payment, Order, or capture ID under a specific merchant account/API. | [Adapters](../integrations/src/payments.mjs). IDs are provider/account/API scoped, not globally interchangeable. |
| Provider instructions | Redirect URL, Pix code, or approval details that let a buyer act. | [Checkout service](../integrations/src/checkout.mjs) and [presentation](../web/src/checkout/presentation.ts). Existence or disappearance is not payment proof. |
| Provider event | An inbound provider notification admitted under its provider-specific authenticity check. | [Events](../integrations/src/events.mjs). Even a signed webhook is a trigger/evidence item, not final KELD payment proof. |
| Provider observation | Fresh state retrieved from the exact provider resource and merchant account to verify payment, finality, or reversal. | [Adapters](../integrations/src/payments.mjs). Distinct from notification receipt and from a normalized ledger fact. |
| Verified payment | Provider-bound, merchant/order/amount/currency-matched evidence accepted by KELD's trusted path. | [Adapters](../integrations/src/payments.mjs) and [ledger](../commerce/ledger.py). Redirect/return alone never grants access. |
| Terminal unpaid proof | Conclusive provider-specific evidence that the old attempt cannot later collect, after bounded discovery/reconciliation. | [Decision](decisions/CHECKOUT-PAYMENT-LIFECYCLE-2026-09-21.md). Local classifiers are candidate/default-off; timeout, 404, or local expiry alone is insufficient. |
| Replacement | Atomic close of one provably unpaid order and creation/linking of a successor attempt. | Selected D1 policy; [bridge](../commerce/sdk_bridge.py) candidate. Not a generic “start over” button for unresolved payments. |
| Paid review | KELD has evidence of money, but normal entitlement cannot safely be granted (for example after reservation expiry). | [Ledger](../commerce/ledger.py). It is neither paid/fulfillable nor unpaid. |
| Reconciliation | Durable recheck of uncertain provider/ledger relationship. | [Reconcile](../integrations/src/reconcile.mjs). A review path, not a second charge. |
| Refund intent | Durable plan to remedy a verified late payment. | [Ledger](../commerce/ledger.py). Not a sent refund command, successful refund, or buyer promise. |
| Refund command | One provider-scoped request to return money, with idempotency and ambiguous-outcome handling. | [Refund worker](../integrations/src/refund-worker.mjs). Sending is not completion; default-off local candidate. |
| Verified reversal | Provider-normalized full refund, lost dispute, or partial refund confirmed for the exact payment. | [Ledger](../commerce/ledger.py). Full refund/lost dispute revoke; partial is review-only. |
| Access grant / entitlement | KELD permission to download the exact artifact after verified, eligible payment. | [Ledger](../commerce/ledger.py) and [delivery](../commerce/delivery.py). Distinct from supporter benefit and software license. |
| Revocation | Future download access removed after verified full refund or lost dispute. | Selected D3 policy, [ledger](../commerce/ledger.py); not deletion of bytes already received. |
| Operator review | Audited human handling of unresolved payment/refund/reversal cases. | [Decision](decisions/CHECKOUT-PAYMENT-LIFECYCLE-2026-09-21.md); trusted per-person operator identity remains an activation gate. |

## State distinctions that must survive simplification

- `preparing` / provider instructions ready: a payment **may** happen.
- Provider return or signed event received: an outcome **may** be checked.
- Verified payment before valid hold: eligible order **may** become paid and
  grant the matching artifact.
- Verified late payment: `paid-review`, not normal delivery; selected remedy
  is verified automatic refund, but its worker is not live-qualified.
- Full refund/lost dispute proof: access **must** be revoked in the selected
  policy; partial remains review-only.
- Unknown provider outcome: preserve the old attempt and request key; do not
  silently start a second charge path.

## Open Questions

1. What final software license, rights materials and artifact identify the
   first real offer? Until then, which public copy may remain visible?
2. Is the account holder always the contractual purchaser, even when provider
   payer details differ?
3. What precisely is promised for first-100 support, and how is that delivered?
4. Which provider finality/refund predicates have authenticated sandbox proof
   and explicit staging/production enablement?
5. What buyer-facing notice and response time apply when reconciliation or
   operator review is necessary?
