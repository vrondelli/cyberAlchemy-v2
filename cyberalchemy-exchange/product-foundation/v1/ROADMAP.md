# Exchange consolidation and construction roadmap

Status: historical planning candidate; superseded for current MVP sequencing.
Owner: Exchange product owner.

Use the [Exchange MVP roadmap](mvp/v1/ROADMAP.md), which includes the selected
commercial offerings, paid managed Alch hosting and capability-to-thesis traceability.
The original plan below is retained as prior planning context.
Inputs: [thesis](PRODUCT-THESIS.md), [capabilities](CAPABILITIES.md),
[ontology models](ONTOLOGIES.md), [source inventory](SOURCE-MAP.md).
Machine dependency and operational lanes: [roadmap.json](roadmap.json).
This is not an admitted Goals execution record or implementation authorization.

## Current product frontier

The candidate thesis, business/system maps and inventory are now assembled.
The next product frontier is selecting the exact Exchange Host composition and
common offering/identity contracts, then constructing one integrated local journey.
Existing native/SBF/inference tests remain slice evidence. No combined product
acceptance test exists merely because those tests passed separately.

| Step | Product result | Reuse | Acceptance evidence |
| --- | --- | --- | --- |
| R0 — Consolidate meaning | One reviewable product packet, host included | Existing decisions and all inventoried slices | Source hashes, links, ontology endpoints and capability coverage checked; completed in this packet |
| R1 — Select host and boundaries | Exact host successor, supported profiles, source ownership and package boundary | Lifecycle controller, semantic host, inference launcher | Every supported host action maps to one implementation and version; shared compiler dependencies stay explicit |
| R2 — Define common contracts | Offering/type/terms identifiers and explicit principal/tenant/wallet/KEP bindings | Approved inference auth structure, purchase definitions, KEP definitions | Positive and conflicting examples; version and identity distinctions preserved; no generic success-as-settlement rule |
| R3 — Package Exchange Host | One discoverable operator entrypoint over supported components | Existing build/prepare/activate/client/lifecycle and engine setup | Clean local install/build; supported control flow; shutdown/restart; exact manifest; mock engine usable without an LLM |
| R4 — Integrate offering discovery | Caller can distinguish inference and project-version offerings and their terms | Generated inference discovery and purchase API | API/UI identify type, version, access and commercial status; credentials and private bindings remain absent |
| R5 — Complete integrated local journey | A provider publishes/configures; an authorized caller invokes or purchases and recovers | Protected inference, purchase, KEP, local host | Independent participants; negative access; idempotency; restart; refund-before-commit; recovery-after-commit; API and client parity |
| R6 — Review tested product | Freeze one exact candidate with repeatable end-to-end evidence | Existing manifests and compiler receipts | Product-owner review over exact sources, binaries, configurations and failures; no automatic deployment from approval |
| R7 — Controlled live acceptance | Prove selected deployed flows in the selected environment | vLLM binding and Devnet deployment preparation | Fresh engine checks; Devnet purchase/refund/recovery signatures and finality; no production or real-money claim |

R1 and R2 can be prepared independently after this packet. R3 depends on R1 and
the relevant identity decisions in R2. R4 depends on R2. R5 joins R3 and R4;
R6 follows its evidence. R7 also requires the exact operational prerequisites below.
If the first release excludes a capability, retain it in the inventory with an
explicit later milestone rather than deleting its history.

## Construction discipline for each selected slice

Carry the D65 chain: bounded prototype definitions → product capability → business
ontology → authored Alch/DomainSpec source → generated graph and system ontology →
implementation → exact candidate → product tests → product review. Existing receipts
may be reused only within their exact source scope. This packet has no new admitted
construction binding. Repair any selected-source drift before claiming conformance.

The host extraction should start with a dependency manifest and compatibility
entrypoints. Move only Exchange-specific controllers, adapters and product surfaces
after their relative imports, generated-source bindings, tooling and tests have
been mapped. Retain the compiler and generic language/runtime capabilities under
their existing owners. Physical relocation is later implementation work.

## Runnable product work

Prepare R1's host-selection sheet and R2's concrete contract examples next. Neither
requires a paid engine, a Devnet-funded wallet, DNS or a public deployment. Use the
existing deterministic engine and local ledger fixtures for integration design.
The proposed default is to expose host lifecycle plus inference and project trading
as explicit capability families under one Exchange product, not to invent one
universal fulfillment state machine.

## Operational tasks and causal blockers

| Task | Owner | Exact affected stage | Dependency |
| --- | --- | --- | --- |
| Refresh runtime dependencies and isolated build tooling | Host/implementation owner | R3/R5 test execution | Only blockers actually demonstrated for the chosen test environment |
| Select supported live engine and tokenization contract | Inference operator | R7 live inference | Current endpoint, model, limits and authorized test budget |
| Configure issuer/client and scoped policies | Identity operator | R7 protected live access | Production identity bindings selected in R2; fixtures support R5 |
| Fund Devnet fee payer, set fee ceiling and verify executor | Deployment operator | R7 Solana submission | Fresh preflight and exact authorized deployment envelope |
| Configure keys, backup, database retention and recovery | Service/security operator | R7 availability/recovery claims | Chosen deployment and storage configuration |
| Review public ingress, resource isolation and observability | Platform operator | Any public release after R6 | Exact exposed host, quotas and security boundary |

The September 8 rent estimate and zero balance are historical evidence, not a
current funding instruction. No remote service is contacted by this roadmap.

## Deferred operational and product residue

Multi-host coordination, public service guarantees, fees/sponsorship, paid-inference
settlement, network validators/reputation/disputes, further offering types and
real-money project correctness retain explicit future scope. Real-money correctness
blocks real-money sales, not local valueless-token testing. A standalone repository
or distribution should be decided from the selected dependency boundary in R1.

## Open Questions

[OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) owns nine decisions. R1 primarily resolves
Q2/Q9; R2 resolves Q3 and the required part of Q4; release review resolves Q1.
Q5 blocks real-money expansion. Q6/Q7 govern the affected operational stages.
Q8 remains network-product work unless chosen for the first release.
