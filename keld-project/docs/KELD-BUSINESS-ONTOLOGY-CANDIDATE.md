# KELD business ontology

Status: candidate business-domain model, 2026-09-21. Owner for meaning:
KELD product/merchant owner. Scope: selling an ARE software release and its
separate supporter benefit through a recoverable, three-provider checkout.
This is **not** the CyberAlchemy canonical ontology, a legal contract, a
runtime schema, or permission to release or charge. Terms are defined in the
[concept glossary](KELD-CONCEPTS-CANDIDATE.md); implementation evidence and
drift are in the [architecture review](KELD-ARCHITECTURE-COUPLING-REVIEW-2026-09-21.md).

## Nodes: what the business recognizes

| ID | Concept / meaning | Current knowledge status |
| --- | --- | --- |
| B01 | KELD studio — maker/seller identity and customer relationship. | Owner-intent candidate, [intake](PROJECT-INTAKE.md). Merchant legal entity not inferred. |
| B02 | ARE software — product family distinct from web explanation and chat. | Owner-intent candidate, [intake](PROJECT-INTAKE.md). |
| B03 | ARE release — exact versioned distribution package and rights materials. | Intended; production artifact/distribution closure open. Staging [test artifact](STAGING-STATUS.md) is not B03. |
| B04 | Offer — release, price range, rights and service promises exposed before commitment. | Partial: [intake](PROJECT-INTAKE.md) gives pricing; exact license/support contract open. |
| B05 | Buyer account — KELD-authenticated order/access owner. | Implemented boundary, [auth](../integrations/src/auth.mjs), [ledger](../commerce/ledger.py). |
| B06 | Payer — identity funding a provider transaction. | Distinct from B05; actual payer/account relationship needs policy. |
| B07 | Frozen purchase terms — selected amount, presentment currency/quote, release digest, provider, and time window. | Implemented candidate, [checkout](../integrations/src/checkout.mjs), [config](../integrations/src/config.mjs). |
| B08 | KELD order — buyer-owned record of one attempted purchase, identified for retries by an account-bound request key. | Implemented, [ledger](../commerce/ledger.py) and [browser client](../web/src/checkout/client.ts). |
| B09 | KELD provider attempt — internal record of preparing/binding/verifying payment for B08. | Implemented candidate, [bridge](../commerce/sdk_bridge.py). Not an external provider object. |
| B10 | Verified financial fact — payment or reversal proven against B08/B09/B07. | Implemented trust boundary, [ledger](../commerce/ledger.py). |
| B11 | Access grant — permission to download the identified release/artifact. | Implemented for staging fixture, [ledger](../commerce/ledger.py), [delivery](../commerce/delivery.py). |
| B12 | Supporter benefit — first-100, time-limited upgrades and direct maker support. | [Intake](PROJECT-INTAKE.md) intent; reservation/activation implemented in [ledger](../commerce/ledger.py), full service policy open. |
| B13 | Refund remedy — return of a bound verified payment after an exception. | D2 selected; provider command/verification candidate and not live-qualified, [decision](decisions/CHECKOUT-PAYMENT-LIFECYCLE-2026-09-21.md). |
| B14 | Review case — unresolved or contradictory financial/access evidence requiring investigation. | Implemented queue/review patterns, [bridge](../commerce/sdk_bridge.py), [recovery DAG](CHECKOUT-RECOVERY-DAG-2026-09-21.md). |
| B15 | Access revocation — future access stopped after a verified full refund or lost dispute. | D3 selected/local candidate, [ledger](../commerce/ledger.py). Partial is review-only. |
| B16 | Software license — rights in distributed bytes, independently of payment/access and supporter service. | Open; [owner-intent research](LICENSE-PAYMENT-RESEARCH.md) conflicts with current visible Apache copy. |
| B17 | Provider resource — external session, payment, Order, or capture ID; multiple observed IDs are an anomaly requiring review. | [Adapters](../integrations/src/payments.mjs), [bridge](../commerce/sdk_bridge.py). One B09 normally binds one B17. |
| B18 | Provider merchant account — the configured Stripe, Mercado Pago, or PayPal account against which proof is checked. | [Config](../integrations/src/config.mjs), [adapters](../integrations/src/payments.mjs). Not identical to the KELD brand or an inferred legal entity. |

## Typed relationships

| Subject | Relation | Object | Business invariant |
| --- | --- | --- | --- |
| B01 KELD | presents | B04 offer | Marketing is not authority to charge before accepted terms. |
| B04 offer | identifies | B03 release | Same stated release and rights for every accepted price; price is not a license tier. |
| B03 release | belongs to | B02 ARE software | Public chat/page is not the release. |
| B03 release | carries | B16 license | Exact terms must be decided before real distribution. |
| B05 buyer account | owns | B08 order | Restoration, verification and download require this ownership. |
| B08 order | is retry-identified by | stable request key scoped to B05 | The key is saved before dispatch; same-key retry preserves the order's frozen terms. |
| B08 order | freezes | B07 purchase terms | A retry cannot silently alter amount, currency, digest or provider. |
| B08 order | binds | B09 KELD provider attempt | Together with buyer ownership, key and B07, this composes the *owned checkout attempt*. A replacement is a linked successor, not mutation of the old evidence. |
| B09 KELD provider attempt | discovers/binds | B17 provider resource | Cardinality is 0..many *observed* resources, normally one bound resource; duplicates lock the attempt for review. |
| B17 provider resource | belongs to | B18 provider merchant account | Provider, merchant account and API are proof dimensions; an ID alone is not enough. |
| B06 payer | pays through | B17 provider resource | Payer data does not by itself prove buyer ownership or fulfillment eligibility. |
| B17 provider resource | may yield | B10 verified financial fact | Provider instructions, redirect, signed notice, and absence of response are not themselves B10. |
| B10 verified payment | is recorded against | B08 order | Exact merchant, resource, amount/currency and order terms must match. A late payment can become `paid-review`, not settled/fulfillable access. |
| B08 eligible paid order | permits | B11 access grant | One qualifying payment may create one grant; late `paid-review` does not. |
| B08 qualifying order | activates | B12 supporter benefit | Benefit is separately reserved and time-bounded; its promise is not the software license. |
| B10 verified late payment | initiates | B13 refund remedy | Intent and command are not verified refund success. |
| B10 full refund or lost dispute | causes | B15 access revocation | This is selected policy; already-downloaded bytes cannot be recalled by revocation. |
| B10 partial refund | enters | B14 review case | No automated partial-access policy is selected. |
| B09 uncertain or contradictory attempt | enters | B14 review case | No fresh charge path opens from timeout/local expiry alone. |
| B14 resolved terminal-unpaid case | can authorize | successor B08 order | Must carry provider-specific finality and atomic old-to-new linkage. |

## Boundary rules

1. **Commercial promise:** B04 is a customer-facing assertion; B03/B16 and
   B12 must have approved content before a real-money sale. The existing
   staging fixture and local tests do not establish that promise.
2. **Money versus access:** B09 is an internal attempt, B17 is provider state,
   B10 is KELD-verified fact, and B11 is KELD authorization. None entails the
   next without its own check.
3. **Time:** an expired B08 hold does not make B09 terminal unpaid. A late B10
   can require remedy without granting the original B12 slot.
4. **Cardinality:** one buyer can own many historical orders, but an unresolved
   provider-bound attempt blocks an unsafe new one. One B09 may discover
   multiple B17 resources in an anomaly; that is review evidence, not normal
   parallel-checkout authorization.
5. **Authority:** the buyer controls choices and owns a session; the provider
   controls external payment facts; KELD's trusted ledger controls B08/B11/B12;
   owner/legal decisions control B04/B16 policy. Public ARE chat controls none.

## Knowledge and decision boundaries

- **Selected policy:** D1 terminal-evidence-gated replacement; D2 automatic
  refund only after verified late payment and verifiable refund outcome; D3
  revoke on full refund or lost dispute. See [decision](decisions/CHECKOUT-PAYMENT-LIFECYCLE-2026-09-21.md).
- **Implemented locally, not proven live:** parts of replacement, refund and
  reversal are default-off candidates; [recovery DAG](CHECKOUT-RECOVERY-DAG-2026-09-21.md)
  owns exact qualification state.
- **Unresolved product law/offer:** final license, actual ARE release, supporter
  service terms, merchant legal entity, operator identity and some provider
  finality paths. This model deliberately does not infer their answers.

## Open Questions

1. What legal entity and approved rights terms stand behind B01/B16?
2. What exact B03 artifact and install/support promise can B04 name?
3. How do B05 buyer and B06 payer differ in disputes, gifts, and account
   recovery? No gift policy is modeled here.
4. How are partial refunds settled by review, and who may change access? This
   is deferred, not silently treated as full-refund policy.
5. Which provider-specific B17 terminal/refund proofs have passed an
   authenticated sandbox and an explicit activation gate?
