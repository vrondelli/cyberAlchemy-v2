# Hosted commerce acceptance for KELD

Date: 2026-09-17. Candidate evaluation plan; no platform selection, launch approval
or admitted execution state. Owner: requesting product owner. No ontology-runtime
dependencies. This reconciles the imported handoff with subsequent owner direction.

## Source correction

[KELD_PROJECT.md §2](../KELD_PROJECT.md#2-confirmed-decisions-and-working-assumptions)
labels the price range and first-100 program as confirmed product direction.
Earlier local intake/research called the entire offer a proposal. That was too
broad: retain the imported requirements unless the owner changes them. The
handoff separately marks detailed service timing and operational policies as
interpretations or open decisions. These are not grounds to discard the offer.

Latest owner instructions supersede two imported directions: the custom resale
restriction replaces Apache for owner-controlled software (third-party rights
remain separate), and hosted commerce replaces building KELD account/cart/order
systems. Seller country is explicitly Brazil. See [intake](PROJECT-INTAKE.md).

## Requirements and proof

| Requirement | Origin | Evidence needed before the affected step is accepted |
| --- | --- | --- |
| Preserve KELD presentation and downloadable ARE alpha | Handoff §2, §5; owner sale objective | Existing presentation links to the actual approved software bundle; alpha disclosure before purchase |
| Keep customer access, orders and checkout with a hosted service | Latest owner clarification | Provider handles buyer identity/recovery, orders, payment administration and delivery; no parallel KELD commerce backend |
| Brazilian seller with existing Stripe, Mercado Pago and PayPal accounts; USDC later | Latest explicit owner answer | Connect existing accounts; prove Stripe cards, Mercado Pago Pix and PayPal through hosted commerce. USDC is deferred, not a launch gate |
| USD 200 initial; USD 50–1,000 inclusive with cents | Handoff §2, §6, §9 | Hosted payment subtotal equals the selected valid amount; reject invalid boundaries; approved BRL conversion policy for Pix |
| Hidden lower-price discovery and equal product rights | Handoff §2, §6 | KELD presentation preserves discovery; provider cannot silently replace price or give different software rights |
| First 100 customers receive a year of updates and maker support | Handoff §2, §7 | Provider/configured service can identify eligible customers and avoid duplicate allocation and overselling; benefits visible before payment |
| Software remains usable after the service benefit ends | Handoff §7; owner's broad usage rights | Ending support/update access does not disable the downloaded engine or invent mandatory activation |
| Distribution and custom license are ready | Owner direction; release documents | Exact archive, install evidence, dependency notices and approved terms—not a passing commerce mock |

## Open policy versus implementation mechanism

The exact calendar term/start/timezone, refund treatment, identity merging,
reservation behavior, slot reuse, post-cap offer and post-year download policy
remain unresolved under handoff §13. Preserve existing prototype interpretations
as candidates. Do not promise indefinite historical re-download or revoke it
without an adopted access policy. The one-year benefit itself remains in scope.

Local SQLite tables, bearer sessions, single-use download tokens, SDK adapters and
webhook implementation are prototype mechanisms. A platform need not reproduce
those internals. Evaluate the customer outcome and protection against unpaid or
incorrect fulfillment. Keep useful local test scenarios; do not require identical
APIs or a custom backend to make the existing tests pass.

## Task order and owners

1. **Product frontier — evaluator:** close documented provider fit using the matrix
   above and [research](ECOMMERCE-PLATFORM-RESEARCH.md). Missing Pix stays a launch
   gap; USDC is explicitly deferred. Do not build another storefront framework.
2. **Owner decision — product owner:** adopt detailed benefit policies before a
   binding offer or dependent integration. Existing-account priority is resolved
   by the latest owner answer; connection compatibility still needs proof.
3. **Operational prerequisite — merchant owner:** select an eligible service and
   supply its sandbox access through secure configuration. Seller verification
   blocks real platform testing, not the independent release review.
4. **Product validation — evaluator:** use a harmless test artifact to prove exact
   price, success/pending/failure, receipt, buyer recovery, refund access behavior,
   repeat purchase and benefit boundary. Retain provider evidence per scenario.
5. **Independent release lane — release/IP owner:** finish archive notices,
   distribution approval, custom terms, support destination and version policy.
6. **Join:** tested hosted journey + approved release/offer → launch-readiness review.
   Publication and live transactions remain later exact effects.

No hosted scenario has passed yet. The local 44-test commerce proof establishes
prototype behavior only. No account approval, paid transaction, seller payout or
customer release is inferred from documentation.

## Open Questions

Existing Stripe, Mercado Pago and PayPal accounts are owner-confirmed; USDC is
deferred. Platform connection compatibility remains untested. Policy questions are owned
by [handoff §13](../KELD_PROJECT.md#13-decisions-still-needed-before-sales), as amended
by the owner's license and hosted-commerce direction. Provider-specific questions
are collected in [the research brief](ECOMMERCE-PLATFORM-RESEARCH.md).
