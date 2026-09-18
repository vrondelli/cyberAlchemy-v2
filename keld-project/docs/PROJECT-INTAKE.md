# KELD project intake

Date: 2026-09-17. Candidate scope record; not a promoted Definition Pack or
construction binding. Owner for project direction: requesting product owner.
Consumer: the KELD and ARE implementation/release work in this checkout.

## Objective and intent

Bring the supplied KELD starter into CyberAlchemy v2, preserve its developed
identity and behavior, and prepare the existing private ARE engine for sale
through KELD. Analyze how the offering maps to real capabilities, a deliverable
release, customer access, updates and maker support.

User clarification: “this private it will be prepared to sell it.” Private source
is the starting point. A customer-ready distribution is the intended output.
Import, analysis and local validation are authorized now. Live sales and release
publication require their actual readiness work and exact later decisions.

## Current implementation decision

The owner subsequently requested direct SDK integrations and reuse of
`auth-foundation`. This supersedes the hosted-platform-only selection pause.
Stripe, Mercado Pago and PayPal now have locally tested sandbox adapters consuming
shared Auth Foundation sessions and the existing ledger. No new identity provider
or cart is introduced. USDC stays deferred. Real merchant/auth connectivity and
storefront wiring remain next tasks; see [SDK-INTEGRATION.md](SDK-INTEGRATION.md).

## Source and provenance

User supplied Windows location, resolved to
`C:\Users\vlad_\Downloads\keld-project-starter\keld-project`.
[Import manifest](IMPORT-MANIFEST.json) binds every imported byte. The original
[KELD_PROJECT.md](../KELD_PROJECT.md), especially sections 2, 7, 8, 9 and 13,
provides product direction and marks interpretations awaiting owner review.
This intake preserves those distinctions. No shared Define session was created.

## Concepts and handling

| Concept | Candidate handling and plain meaning | Source / decision owner |
| --- | --- | --- |
| KELD | Propose: the studio/storefront identity for agent gear; commercial presentation and customer relationship | Original handoff §2–4; product owner |
| ARE | Specialize for this commercial context: the existing Agent Reasoning Engine offered as downloadable alpha software; not the website artwork or archive | Handoff §2; ../../agent-reasoning-engine/README.md; engine/product owner |
| Customer release | Propose: a versioned, verified portable engine artifact with license materials, installation guidance, compatibility data and integrity metadata | Integration research; engine release owner |
| Offer | Retained imported product direction: USD 200 initial amount, accepted USD 50–1,000 range; same release and software rights at every accepted price | Handoff §2 and §6; product/merchant owner |
| Early-supporter entitlement | Retained imported direction: first 100 customers receive a year of updates and direct maker support. Exact 12-calendar-month timing from verified purchase and operational policies remain interpretations requiring adoption | Handoff §2, §7 and §13; commercial owner, legal merchant not yet identified |
| Runtime integration | Specialize: downloaded ARE operates with the customer's configured agent/host; its adapter is not a checkout or customer-account API | ../../implementation/agent-reasoning-engine/README.md; engine integration owner |
| License boundary | Latest owner intent: broad use, sharing and modification; resale requires a change or addition such as a connector. This supersedes the starter's proposed Apache direction; exact custom terms and included rights remain open | [License/payment research](LICENSE-PAYMENT-RESEARCH.md); release/IP owner |
| Payment methods | Brazilian seller confirms existing Stripe, Mercado Pago and PayPal accounts; working launch mapping is Stripe cards, Mercado Pago Pix and PayPal. Owner explicitly defers USDC until later. Account connections/activation remain untested | Owner clarification; [current delivery plan](DELIVERY-PLAN.md); merchant owner |

These are context-bound working meanings, not changes to canonical CyberAlchemy
vocabulary. No unpublished role appointment or legal entity is inferred.

## Open Questions

1. What exact engine closure and integration will the first buyer receive?
2. Can that closure install and run outside the private parent checkout?
3. Which files/dependencies have cleared distribution, and what exact custom resale terms apply to owner-controlled code?
4. For the confirmed Brazilian seller, which eligible providers/accounts, support channel, hosting and delivery store will be used?
5. How are customer identity, reserved supporter slots, refunds and delayed payments handled?
6. Is the 12-month interpretation and post-year-one access policy confirmed for binding terms?
7. Where will public documentation live, and which version will each release reference?

Refresh this record when the starter, release scope, or commercial decisions
change. Analysis and local prototype work may proceed while these are open;
real sale/delivery claims must wait for the affected answers and verification.
