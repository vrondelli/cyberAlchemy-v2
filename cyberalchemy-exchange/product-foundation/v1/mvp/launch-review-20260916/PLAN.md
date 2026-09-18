# Exchange MVP launch review

Date: 2026-09-16. Owner: Exchange product owner. Status: candidate plan.
Authority effect: none. This is not admitted Goals execution state or authorization
to deploy, send notifications, move funds or change existing product contracts.

## Outcome and scope

Deliver one Exchange application where a provider publishes inference, a customer
uses free or paid inference, and a buyer purchases one project through internal KEP.
Prove recovery when execution, payment or delivery becomes uncertain. Exchange Host
is part of the product, even while reusable host code remains under Alch.

This advances the thesis through two concrete outcomes: community members make their
inference available to others, and creators sell projects with the agreed rights.
Accounts, discovery and operations make these activities one usable Exchange.

The owner requested continuation from the four-journey MVP proposal. This document
turns that proposal into a reviewable construction sequence. It does not silently
amend the [earlier whole-product roadmap](../v1/ROADMAP.md), which includes paid
managed Alch hosting. Deferring that offering from the first launch remains a scope
decision under Q1/Q11. All accepted operational and commercial rules remain recorded
in [QUALITY-EVIDENCE](../../QUALITY-EVIDENCE.json); a small administration UI is not
permission to omit those rules from a released feature.

## Evidence and claim limits

[Evidence snapshot](evidence.json) records inspected paths, hashes and the fresh
test result. The existing [capability inventory](../../CAPABILITIES.md) remains the
broader source map. This review sampled implementation and tests in those indexed
families; it is not an exhaustive code audit or a current whole-product test run.
The four policy files already had uncommitted decisions; their working-tree bytes
are inputs, not committed history. No historical receipt was refreshed.

Fresh check: `node --test cyberalchemy-exchange/capabilities/project-purchase/v1/client/crypto.test.mjs`
passed 3/3. This checks crypto negatives, signature binding and integer/account
validation only. It does not exercise the purchase HTTP journey, database, SBF,
community inference or a live chain. Historical suite counts below retain their
original, narrower source snapshots.

## Four launch journeys: existing behavior and gaps

| Journey | Existing implementation evidence | Gap to the integrated MVP | Classification |
| --- | --- | --- | --- |
| J1: provider publishes inference; independent customer uses it | Local inference configuration, generated discovery, JSON/SSE execution, vLLM translation and a protected durable rehearsal exist. The reference product records 228 tests and two historical live requests. | Provider publication and ownership in Exchange, common identity, independent provider connectivity, unified catalog/UI, readiness/health enforcement, five versioned intent contracts and evidence-based automatic routing. | Partial prototypes; integrated journey not demonstrated |
| J2: paid inference succeeds, fails or is cancelled and settles correctly | Inference execution/custody and project-purchase escrow exist separately. | A paid-inference state machine and escrow composition for the agreed price, fee, rounded cancellation, verified delivery, provider-failure refunds, deadlines and uncertain outcomes. Project Unlock settlement cannot simply be relabeled inference settlement. | Paid inference integration not found in inspected runtime families |
| J3: buyer purchases one project and receives agreed rights | Purchase API, client signing/decryption, PostgreSQL journal, atomic KEP grant/payment, expiry refund, multiple buyers and recovery have local implementation and historical native/SBF/browser evidence. | Common Exchange identity/catalog/UI, exact saleable artifact, current integrated tests and a solution for valid envelopes containing wrong keys before real money. | Strong local purchase prototype; real-money gate unresolved |
| J4: restart/dependency failure does not duplicate work or payment | Protected inference rehearsal records restart replay and unresolved killed attempts. Purchase persists submissions and rechecks chain state. Host lifecycle has durable control requests. | Whole-Exchange restart scenarios, paid-inference reconciliation, recovery watchdog, incident/alert/inbox implementation and tested backup/restore for the selected deployment. | Component recovery exists; whole-product recovery not demonstrated |

Key inspected implementation anchors:

- [Inference configuration/runtime](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/runtime.mjs): provider rows declare `text.generate`, rank and enabled state. Configured rank is not task-quality evidence.
- [Protected rehearsal](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/protected-rehearsal/README.md): actual verifier and Rust policy bridge, fixture tokens/introspection, SQLite custody and process restart. Not live onboarding.
- [Host lifecycle](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/README.md): build/activate/invoke plus drain/resume/restart; loopback composition, not public managed hosting.
- [Purchase service](../../../../capabilities/project-purchase/v1/client/service.mjs): order operations and `expireDue()`; [store](../../../../capabilities/project-purchase/v1/client/store.mjs): PostgreSQL single-writer journal.
- [Wrong-key test](../../../../capabilities/project-purchase/v1/client/crypto.test.mjs): hashing a valid envelope does not prove correct decryption. [Purchase release limits](../../../../capabilities/project-purchase/v1/README.md) also describe wallet/identity and seller-signature limitations.
- [Intent definitions](../../INFERENCE-INTENTS.json): five selected categories are not yet distinct public task contracts. Research requires retrieval/orchestration; a model endpoint alone does not implement it.

## Minimum required capabilities

| Area | First-launch requirement | Keep out of the critical path |
| --- | --- | --- |
| Participation | Authenticated customer/provider/operator actions; explicit wallet and KEP identity bindings; access isolation | New identity system or tenant hierarchy |
| Catalog and Host | Persist offerings, versioned terms, provider ownership and host bindings; discover, pause and resume eligible offerings | Broad source relocation or a new engine adapter |
| Inference | Free/paid choice, all selected intent contracts, basic score provenance and matching, latency/availability, hard limits and idempotency | Sophisticated validator consensus or automatic intent guessing |
| Commerce | Per-request escrow, fixed quote, accepted fees/rounding, success/cancel/refund behavior and reconciliation | Wallet balances, top-ups or silent fallback |
| Projects | One exact project/version, KEP rights, verified decryptable delivery, atomic settlement and recovery | Completing every planned product edition before the first listing |
| Customer surfaces | Shared API and minimal UI; own requests, refunds, results and required inbox notices | Email/webhooks for customers, elaborate settings screens |
| Operations | Durable obligations, independent watchdog, operator dashboard/email and selected alert rules; restart and restore evidence | General incident-management platform or multi-region operation |

The five intents remain CODE_GENERATION, STRUCTURED_EXTRACTION, TEXT_SUMMARIZATION,
RESEARCH and DOMAIN_MODELING. Listing their names does not satisfy execution,
validation or score requirements. An unsupported intent must remain ineligible;
reducing the set actually offered at launch requires an explicit scope amendment.

## Construction sequence and acceptance

Current product frontier: **L0 common Exchange contracts**, with L1 the first
implementation slice. The reusable components are evidence, not a unified product.
Local fixtures and valueless settlement keep construction independent of deployment.

| Stage | Deliverable | Acceptance evidence | Dependencies |
| --- | --- | --- | --- |
| L0 | Exact participant/tenant/wallet/KEP binding; offering and host identities; immutable terms; intent and outcome examples | Positive and negative examples, owner review of material identity/rights choices, exact source bindings | Q2/Q3 and affected intent/commerce contracts |
| L1 | Exchange-owned application composition: persisted offering publication, provider ownership, catalog API/minimal UI and a free inference call using existing engine support | Two independent actors; publish/discover/call; unauthorized edits denied; state survives restart; secret redaction; repeat request avoids duplicate execution | L0 |
| L2 | Intent contracts, evaluation evidence and routing | Fixtures for all five intents, provenance/freshness display, eligibility before quality/latency/price ranking, no silent weakening of requirements | L0; integrates with L1 |
| L3 | Paid inference commitment and fulfillment | Valueless success, provider failure, 50% rounded cancellation, completion/cancel race, duplicate funding/request rejection, uncertain outcome reconciliation, retained delivery and fee arithmetic | L1/L2 and exact paid inference contract |
| L4 | Project purchase in the same Exchange | Exact version and rights, buyer/seller authorization, grant/payment rollback, byte-exact decryption, restart retrieval, expired order refund; wrong-key case must meet selected remedy/prevention before real money | L1 and purchase/identity contracts |
| L5 | Integrated recovery and operational minimum | Kill service before/after execution or chain submission; no blind resubmission; durable pending refunds; watchdog detects failure; alerts/inbox recover without duplicate logical notifications; selected suppression and acknowledgement rules | L1 onward incrementally; final proof requires L3/L4 |
| L6 | Frozen integrated candidate and controlled pilot preparation | Four journeys pass through API and representative UI; authorization negatives, unavailable dependencies, backup restore, current source hashes and operator runbook | L2–L5; exact pilot operational prerequisites |

L1 acceptance is a useful vertical slice, not a claim that free text generation
completes the five-intent MVP. L4 can proceed alongside L2/L3 once its own contracts
are bound. Add L-hosting before L6 if managed Alch hosting remains in first-launch
scope; its acceptance is submit/build/activate/invoke/usage/recover/terminate under
the chosen isolation and pricing contracts.

Each slice carries the D65 chain: candidate meaning → product capability → business
ontology → authored Alch/DomainSpec contracts → compiled graph/system ontology → exact
implementation candidate → relevant tests → product review. Preserve generic compiler
ownership. Native code supplies transport, storage, clocks, keys and chain adapters;
do not describe manually written behavior as compiler-generated. Product review
does not grant deployment authority.

### Runnable product work next

Prepare L0's small contract packet and L1's exact implementation envelope together:
two actors, one provider-owned offering, explicit tenant/host binding, versioned
terms, discovery and an idempotent free call. Reuse the protected inference composition
and Auth Foundation interfaces; do not flatten wallet identity into user identity.
Place Exchange composition under `cyberalchemy-exchange/`; retain shared imports.
Bind actual source and tests before code changes through the Implement route.

## Operational lane and causal blockers

| Task | Owner | Affected stage | Blocking basis | Current disposition |
| --- | --- | --- | --- | --- |
| Choose supported host/auth composition and identity mapping | Host and identity owners | L0/L1 | Exact access and isolation contract | Required before unified implementation |
| Paid minimum price and cost evidence; exact settlement contract | Commerce owner | L3 paid acceptance / live pilot | Accepted minimum-price rule has no selected numeric floor | Use labeled fixtures during construction; real paid launch waits |
| Wrong-key prevention/remedy | KEP/security/product owners | L4 real-money use | Fresh negative test demonstrates unresolved delivery correctness | Local valueless work proceeds; no real-money readiness claim |
| Real project package and rights/version readiness | Offering owner | L4 pilot | A real sale requires a concrete artifact and entitlements | Fixture project permits integration first |
| Provider connectivity, data terms and resource limits | Host/provider owners | L1 community proof / L6 | Remote access and request-data boundary | Local mock first; chosen topology required for community trial |
| Independent alert service, verified recipients, issuer/ingress and credentials | Platform operator | L6 exposed deployment | Actual authentication and alert reachability | Mock/local delivery tests first; no emails sent here |
| Backup/restore, keys and deployment retention | Platform operator | L6 | Durability promises need restore evidence | Test disposable stores; live custody separate |
| Chain preflight, funding, fee ceiling and deployment envelope | Deployment operator | L6 chain submission | Fresh external-state and authority boundary | Deferred; old Devnet receipts are not current |

No unrelated operational task blocks a dependency-ready local construction slice.
Exact security, access, payment and delivery correctness prerequisites do block the
stage that exposes those effects. Email administration polish is not a substitute
for proving the watchdog and recovery paths actually work.

## Open Questions and stopping rule

Product questions remain owned by [OPEN-QUESTIONS](../../OPEN-QUESTIONS.md).
Only decisions changing scope, rights, money, data exposure or supported execution
must return to the owner before the affected implementation. Schema names, database
indexes and ordinary UI layout can be engineering proposals tested in the slice.

1. Q1/Q11: confirm first-launch deferral or inclusion of paid managed Alch hosting.
2. Q2/Q3: select the exact host composition and cross-product identity binding for L0.
3. Q5: choose a concrete prevention/remedy for wrong-key project delivery before
   real-money project sales. The prior trusted-Exchange direction is relevant, but
   its executable verification/settlement boundary is not yet proven.
4. Q12/Q23: finish the numeric paid floor and testable intent/fulfillment contracts
   before accepting real paid inference. Preserve accepted quality routing requirements.
5. Q10: select the first actual project/version and pilot participants at pilot preparation.

Recipient-addition behavior proposed at the end of the interrogation remains
unapproved and deferred. Accepted operational decisions stay intact. Definition
work stops for a slice when its observable behavior, invariants and acceptance
examples are clear enough to implement and test; it does not wait for every future
operations feature. MVP completion requires the four demonstrated journeys and
explicit disposition of any changed launch scope—not a complete question register.
