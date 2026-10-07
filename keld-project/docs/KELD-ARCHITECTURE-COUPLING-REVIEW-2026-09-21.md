# KELD architecture and coupling review

Status: source-linked review evidence, 2026-09-21 (America/Sao_Paulo). Scope:
KELD storefront, ARE public experience boundary, buyer checkout, provider
integration, ledger, recovery, and the documents that define the offer. This is
not a production security audit, a live-provider qualification, or a release
approval. The working tree was already dirty; this review changed no runtime.

## Bottom line

KELD has **necessary domain complexity** (three providers, ambiguous outcomes,
idempotency, late payments, refunds, disputes, and recoverable buyer sessions),
but also **avoidable representation and module coupling**. The highest-risk
problem is not the number of files: it is that the visible license claim and
some status documents disagree with newer owner intent and implementation.
The most expensive implementation seam is the Python bridge that combines
schema evolution, buyer operations, event admission, reconciliation, refund
work, replacement, and delivery in one dispatch path. The clearest removable
code is an unmounted React storefront/checkout tree alongside the active
legacy-HTML shell and routed checkout.

## Evidence and qualification

| Surface | Observation | Consequence / confidence |
| --- | --- | --- |
| Offer truth | The active root injects [prototype HTML](../prototype/index.html) with Apache 2.0 claims through [App.tsx](../web/src/App.tsx); the active [checkout page](../web/src/checkout/CheckoutPage.tsx) also says Apache. An unmounted React shop component in `App.tsx` repeats it. [Owner-intent research](LICENSE-PAYMENT-RESEARCH.md) says unchanged-copy resale should be restricted and exact custom terms need legal review; [intake](PROJECT-INTAKE.md) says this supersedes the imported Apache direction. | High-confidence source conflict. This is a product/legal-content release blocker, not a conclusion that a new license has been adopted or a real sale occurred. |
| Frontend ownership | [App.tsx](../web/src/App.tsx) renders `LegacyStorefront` from raw prototype HTML and loads four prototype scripts, while `/checkout` renders `CheckoutPage`. `Header`, `Hero`, `Gear`, `Legend`, `Studio`, `Checkout`, and `Contact` are defined in `App.tsx` but never mounted by `StorefrontApp` or the route switch. The old checkout grid is hidden with [CSS](../web/src/styles.css). | Confirmed source-level duplication/unused tree, plus fragile string replacements and DOM interception. A bundler may remove unused functions; this review does not claim their bytes ship. The live HTML/script path still needs separate parity tests. |
| Browser state | [CheckoutPage.tsx](../web/src/checkout/CheckoutPage.tsx) holds UI/auth/status orchestration while [client.ts](../web/src/checkout/client.ts) holds session storage, transport, request keys, recovery and validation; the server is authoritative for paid/revoked status. | Multiple representations are safety-motivated, but transitions and copy can drift. Keep browser drafts non-authoritative and give one named projection owner for display states. |
| Commerce bridge | [sdk_bridge.py](../commerce/sdk_bridge.py) is 1,189 lines. Its `run` handles roughly 35 operations. Four read-only paths bypass migration, but the common path constructs [Ledger](../commerce/ledger.py), performs `CREATE TABLE`/`ALTER TABLE` checks, and then dispatches buyer, event, reconciliation, refund, replacement and delivery work. The ledger constructor itself migrates tables. | High coupling between schema evolution and normal transactions/privileges. This is a testable refactor seam, not evidence of incorrect payments. Preserve existing atomic transactions and evidence checks when separating schema/bootstrap from operations. |
| Provider adapter | [payments.mjs](../integrations/src/payments.mjs) imports Stripe, Mercado Pago, and PayPal SDKs together, eagerly creates all clients and contains all provider operations. [checkout.mjs](../integrations/src/checkout.mjs) imports `keyFor` from that adapter module. [config.mjs](../integrations/src/config.mjs) requires all three provider blocks even for a worker role. | Compile/deploy/test blast radius is larger than a single provider; a pure key helper need not pull in SDK imports. Provider-specific finality must *not* be flattened into one generic state machine merely to reduce files. |
| Persistence boundaries | The [Node repository adapter](../integrations/src/repository.mjs) shells into Python; [ledger.py](../commerce/ledger.py) owns the transactional order/benefit/payment/reversal core; [sdk_bridge.py](../commerce/sdk_bridge.py) adds queues and provider attempts. | Two languages and process IPC have a real operational cost, but there is one ledger authority and useful transactional isolation. Replacing the boundary wholesale is not justified by this review. |
| Recovery policy | [Decision record](decisions/CHECKOUT-PAYMENT-LIFECYCLE-2026-09-21.md) selects terminal-evidence-gated replacement, verified late-payment refund, and revocation on full refund/lost dispute. [Recovery DAG](CHECKOUT-RECOVERY-DAG-2026-09-21.md) labels the advanced paths local/default-off and not live-qualified. | This complexity protects against double charge or wrongful access. Do not delete it as “overengineering” or advertise it as enabled. Partial refund remains review-only and is not a current automation focus. |
| Documentation | [Project README](../README.md), [commerce README](../commerce/README.md), and the [prototype contract](../prototype/CHECKOUT-CONTRACT.md) contain historical no-checkout or Apache statements that are not reliably marked as superseded. [Staging status](STAGING-STATUS.md) and the current recovery DAG give later, narrower status. | Docs have competing current-state narratives. Introduce one status owner and mark prior documents historical; do not erase provenance. |
| ARE boundary | [ARE chat server](../are-documentation/server/chat.mjs), [edge](../are-documentation/server/edge-server.mjs), and [broker](../are-documentation/server/broker-server.mjs) are separate from KELD payment routes. [Production layering](KELD-ARE-PRODUCTION-IMPLEMENTATION-LAYERING.md) treats anonymous chat and commerce as distinct security domains. | Separation is justified. Public chat must never become an account, payment, delivery, or engine-runtime entitlement by naming alone. This review did not re-run the whole ARE security suite. |

### Verification performed for this review

- `web` `npm test`: 47/47 passed; `npm run typecheck`: passed.
- Focused `commerce` `test_ledger` and `test_sdk_atomic_prepare`: 55/55 passed.
- Full `commerce` unittest discovery ran 81 tests but failed on four import/test
  errors because the local Python `stripe` package is absent; that run is not a
  full-suite pass or a reproduced application defect.
- Correction, 2026-09-21 BRT: the earlier dependency-absence claim was wrong;
  `integrations/node_modules` exists even though it has no `.bin` directory.
  The local `test` preflight and integration suite now pass 165/165 synthetic
  tests. This is current local evidence, not live-provider or staging proof.
- No authenticated provider call, buyer payment, staging mutation, deployment,
  or browser acceptance was performed in this review.

## Concept-layer reduction

**Working unit proposed:** an *owned checkout attempt* is an account-bound
order with frozen commercial terms, one stable request key, and a traceable
provider payment attempt. This is the minimum unit that can be resumed,
verified, replaced, refunded, or audited without guessing. It does not merge
the order, provider resource, verified payment, or access grant into one state.

| Round | Candidate reduction | Balance / why it stops here |
| --- | --- | --- |
| 0 — source inventory | Account, offer, quote, order, reservation, request key, provider attempt, provider resource, payment proof, benefit, access grant, artifact, reversal, refund intent, event, review. | These names recur across UI, Node, Python, and owner decisions; many are distinct only at trust or time boundaries. |
| 1 — coherent clusters | Frozen terms; owned checkout attempt; verified financial fact; fulfillment/access; exception/recovery case. | Five clusters make the journey understandable, but each keeps its own identifier and source of truth. |
| 2 — stop condition | Keep the five clusters and the trust edges between them. | Further merger would hide the differences between “provider instructions exist,” “money settled,” “buyer may download,” and “refund requested.” Those differences are required for safe recomposition. |

Recomposition test: selected offer + buyer account produce a frozen order and
provider-bound attempt; provider verification produces a financial fact; the
ledger applies it to access/supporter benefit; reversal can revoke access;
ambiguous facts enter reconciliation/review; the browser merely projects these
states. A model that cannot explain closed/reopened tabs, auth expiry, duplicate
webhooks, late settlement, and disputed payment is too small for this product.
The [concept glossary](KELD-CONCEPTS-CANDIDATE.md),
[business ontology](KELD-BUSINESS-ONTOLOGY-CANDIDATE.md), and
[product ontology](KELD-PRODUCT-ONTOLOGY-CANDIDATE.md) record these as
non-authorizing candidates.

### Standard-mode optimization trace

One proposal track and two reduction rounds were used. **Proposer claim:** an
owned checkout attempt is the smallest useful unit for recovery, while money
and access remain separate facts. **Balancer objections:** (semantic boundary)
the internal attempt can discover multiple provider resources; (trust boundary)
the merchant account and signed event are not the verified observation;
(outcome accuracy) late payment can be `paid-review`; (evidence/shape) an
operator process is not an evidenced UI, and product nodes need explicit kinds.
**Reconciliation:** accepted and revised the glossary/ontologies; no objection
requires a new runtime architecture. The stable tension is that an intuitive
“start over” UX is impossible for a provider flow that cannot prove nonpayment.
Verdict: **flag** for unresolved offer and live-provider decisions, not a block
on using the candidate model for discussion.

| Technique (hook) | Trigger and inspected state | Output / decision / readiness |
| --- | --- | --- |
| `abstraction_level_guard` (`before_accept_split`) | Always; inspected business promise, checkout journey and ledger entities. | Separated business/product/system levels; pass, unchanged. |
| `recomposition_proof` (`before_verdict`) | Always; inspected offer → order → provider fact → access/review edges. | End-to-end and exception journeys reconstruct; pass, unchanged. |
| `evolution_profile` (`before_verdict`) | Existing three-provider variants, refund policy and migrations. | Keep provider-specific ports and schema boundary; defer a universal payment framework; pass, unchanged. |
| `frame_expiry_note` (`before_verdict`) | Always; inspected staging/test-fixture and default-off status. | Revisit on approved ARE release, license, provider enablement, or new payment method; pass, unchanged. |
| `cognitive_load_check` (`after_balancer_pass`) | Triggered by duplicate UI and a 1,189-line operation bridge. | Five conceptual clusters and one current-state doc owner are more navigable; flag until refactored. |
| `requisite_variety_check` (`before_verdict`) | Triggered by three providers and late/ambiguous/reversed outcomes. | Keep distinct terminal, verified, refund, and access states; pass, unchanged. |
| `boundary_object_check` (`after_balancer_pass`) | Triggered by UI/Node/Python/provider interfaces. | Frozen terms plus IDs/proof are the shared contract; flag until documented/tested as such. |
| `concept_vs_knowledge_status` (`before_accept_split`) | Triggered by owner intent versus local/staging evidence. | Candidate ontology labels selected policy, implemented candidate and open law separately; pass, unchanged. |
| `premortem_pass` (`before_verdict`) | Standard mode and high payment/product risk. | Likely failure: outdated license copy or false terminal-unpaid assumption reaches a real buyer; guard with owner decision, exact parity and provider proof gates; flag. |
| `navigable_result_check` (`before_verdict`) | Always; inspected review, glossary, ontologies and next action. | Start with P0 product truth, then bounded UI/schema seams; pass, unchanged. |
| `set_based_tournament` (`before_pitch_off`) | Skipped: one-track Standard mode; no competing full designs requested. | Skipped with reason; unchanged. |

This optimization point expires if KELD changes from downloadable software to
hosted access, adds a materially different payment rail, adopts a new license
or entitlement model, or promotes the default-off recovery workers. Those
changes require a refreshed concept and evidence pass before implementation.

## Recommended simplification sequence

1. **P0, product truth:** resolve the license/release decision with the owner
   and qualified legal review; meanwhile remove or clearly stop serving
   contradicted Apache sales claims before any real-money offer. Also make
   staging's test-artifact boundary prominent. This is a decision plus later
   implementation, not an automatic substitution of custom terms.
2. **P1, one frontend owner:** choose the active storefront implementation.
   Remove unmounted React components after parity tests, then replace raw HTML
   string surgery/legacy script ownership incrementally. Keep a single routed
   checkout UI and typed state projection. Avoid a big-bang rewrite of payment
   recovery during this cleanup.
3. **P1, schema lifecycle:** move ledger/SDK schema initialization to an
   explicit, versioned startup/migration step; have read and write operations
   assert the expected schema version. Preserve transaction boundaries and
   prepare a rollback/backup plan before touching persisted staging state.
4. **P2, provider ports:** extract pure money/idempotency/terms helpers from
   SDK modules. Split provider-specific adapters only along actual authority
   contracts (create, verify, finality, refund proof), with contract tests per
   provider. Config should validate the capabilities a role actually runs.
5. **P2, projection/document owner:** define one status projection contract
   from authoritative server state to buyer copy; mark old plans/contracts
   historical and maintain one current staging/production status index.

No recommendation here authorizes code deletion, migration, provider writes,
license change, or deployment. Keep first-100 reservation, idempotency, event
deduplication, ambiguous-outcome review, refund command fencing, and verified
reversal/access rules unless an equivalent proof exists.

## Open Questions

1. Which exact license and distributable ARE artifact may be offered? Who signs
   off product copy and third-party rights?
2. Is the long-term storefront owner React, the prototype HTML, or a planned
   transition? What parity evidence is required before retiring either tree?
3. Which provider-specific replacement/refund paths will be activated, and
   with what authenticated sandbox evidence and operator identity?
4. What is the supported migration/rollback method for the existing staging
   SQLite state before schema lifecycle changes?
5. Which document is the single current-state index for staging versus future
   production, with what owner and refresh rule?
