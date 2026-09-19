{
  "action_id": "spawn-0001",
  "identity": "van Lamsweerde, Axel",
  "role": "contract-model-attacker",
  "mode": "attack",
  "status": "complete",
  "verdict": "BLOCK_FIRST_PRODUCTION_STABLE_CLAIM",
  "severity_counts": {
    "CRITICAL": 2,
    "MAJOR": 7,
    "MINOR": 1
  },
  "corpus_binding": {
    "manifest_schema": "domainspec.review-corpus-manifest.v1",
    "aggregate_sha256": "6d208f20bacc39e124709fd18b2fe93147ccb52bf625833c1efd92afe09afa1a",
    "files": 6188,
    "bytes": 1351008277,
    "live_sha256_check_exit": 0,
    "aggregate_recalculation": "exact match"
  },
  "mutation": {
    "files_written": [],
    "output_ref_written": false,
    "network": false,
    "product_execution": false
  }
}

## Raw findings

### CM-01 — MAJOR — Decision packet remains “pass” after its bound inputs drifted

- Current files/selectors:
  - `development/ontology-form-decisions/FORM-DECISION-MATRIX.json#/source_refs`
  - `development/ontology-form-decisions/receipts/current-validation.json#/status`
  - `development/ontology-form-decisions/receipts/PACKAGE-BUILD-RECEIPT.json`
  - `development/ontology-form-decisions/DECISION-STATE-MACHINE.json#/transitions`
- Exact evidence:
  - Matrix retains ontology `4eda2edd…`, projection `c770d54f…`, and base profile `629c977c…`.
  - Live values are ontology `6cd5a46c…`, projection `43afaa75…`, and base profile `48d0ba17…`.
  - The stale validation receipt still says `"status": "pass"` and says those paths match retained digests.
  - Its Python, Rust, and TypeScript profile refs are also stale: retained `e89a…`, `1d013…`, `4f57…`; live `148cd333…`, `f1db01c7…`, `32cf17b4…`.
  - Package receipt binds current-validation as `cb4800…`; the live receipt is `53d20d9c…`.
  - The state machine already defines `{"from":"tension-reviewed","to":"stale","gate":"review input digest drift"}`, but the affected records were not transitioned.
- Attack: a historical successful validation is named “current,” while its exact inputs and its enclosing receipt have changed. Any admission based on it bypasses the packet’s own stale transition.
- Compatibility surface: all form decisions, implementation queue admission, ontology/profile/provider selection, downstream implementation claims.
- One-line fix: mark affected decisions stale and regenerate the matrix, queue, validation, and package receipt from current inputs while retaining old receipts as historical.
- Discriminating acceptance check: the no-write decision validator must reject each stale digest; a refreshed packet must contain zero mismatches and no ready item derived from a pre-drift review.

### CM-02 — MAJOR — Minted-project formation has two incompatible authorities

- Current files/selectors:
  - `definitions/minted-project/supported-profiles.yml#/profiles/*/formation_schemas`
  - `impl/spec/minted-project/formations/*.schema.json`
  - `impl/tools/minted-project/compiler.ts::validateFormation`
  - `impl/tools/minted-project/compiler.ts::nonFormationViolations`
  - `impl/tools/minted-project/meta-type-body-adapter.ts::validateMintedNodeFormation`
- Exact evidence:
  - The profile advertises JSON formation schemas for Entity, Event, Operation, and Rule.
  - The compiler never resolves `profile.formation_schemas`; it calls the canonical YAML-criterion adapter.
  - It removes base-schema body failures through `baseViolations.filter(!path.startsWith("$.body"))`.
  - `operation-body.schema.json` is closed with `"additionalProperties": false`; the YAML criterion path only requires the operation discriminator.
- Attack: an Operation body such as `{"state_change":"yes","note":"x"}` is rejected by the advertised JSON schema but can pass compiler formation because the extra body field is discarded from base-schema failures and ignored by the criterion evaluator.
- Compatibility surface: minted source files, external schema consumers, compiler admission, generated graphs, profile versioning.
- One-line fix: declare shape and criterion as explicitly composed contracts, or generate one from the other, and make the compiler resolve the profile-bound schema.
- Discriminating acceptance check: table-driven cases for all four kinds—including missing fields, extra fields, wrong discriminators, and forward-extension fields—must return identical decisions and stable diagnostics from the declared schema and compiler.

### CM-03 — MAJOR — W3/W4 JSON boundaries cast unvalidated data into versioned contracts

- Current files/selectors:
  - `factory/registry/providers/typescript-w3-effects-connections-v1.ts::parseSet`
  - `factory/registry/providers/typescript-w4-orchestration-lifecycle-v1.ts::parseSet`
  - W3/W4 contract `schema_version` literals
- Exact evidence:
  - Both providers perform `JSON.parse`, check only that the selected member is an array, then return `items as T[]`.
  - Selector decoding checks `DomainSpecMetaTypeSelector/v1`; descriptor and observation members are not runtime-decoded.
  - The evaluators return their own version but do not reject a future member `schema_version`, unknown fields, or missing fields before semantic comparison.
- Attack: a future-version or structurally open descriptor can be accepted if the few fields used by the evaluator happen to match. TypeScript type literals supply no JSON-boundary protection.
- Compatibility surface: W3/W4 direct-proof requests, replay locks, stored descriptor/observation sets, future migrations.
- One-line fix: add closed discriminated runtime decoders for set roots and every descriptor/observation variant.
- Discriminating acceptance check: mutate root/member schema versions, remove each required field, alter kind discriminants, and add unknown fields; all must fail before evaluation with stable `FACTORY_W3_INPUT_INVALID` or `FACTORY_W4_INPUT_INVALID` pointers.

### CM-04 — CRITICAL — W3 “atomic” record-plus-outbox behavior is not representable

- Current files/selectors:
  - `families/effects-connections/contracts/w3-contracts.ts::OperationObservation`
  - `families/effects-connections/evaluator/evaluate-w3.ts::evaluateOperation`
  - `fixtures/financial-settlement/descriptors.json#/descriptors/operation.complete-settlement`
  - corresponding observation
- Exact evidence:
  - Descriptor declares writes `["settlement"]`, external effects `["outbox"]`, `"atomicity":"atomic"`, and emitted event checkpoint `"durable-outbox-append"`.
  - Observation represents writes as `{id,state}` but external effects only as `string[]`.
  - `atomicStateValid` checks only write states; it cannot inspect the outbox effect’s commit/rollback state.
- Attack: “settlement committed, outbox append failed” and “settlement plus outbox committed” can produce the same passing observation. Merely echoing `"outbox"` and the expected trace is a self-authored assertion, not evidence of atomicity.
- Compatibility surface: Operation semantics, Event durability, record/outbox consistency, retries, recovery, publication.
- One-line fix: model an atomic effect group or transaction identity with outcome states for every write and outbox checkpoint.
- Discriminating acceptance check: executable failures before and after the settlement write and outbox append must permit only all-committed or all-rolled-back; a committed settlement with absent/failed outbox must be rejected.

### CM-05 — CRITICAL — W3 persistence and W4 compensation have no coherent composition contract

- Current files/selectors:
  - W3 `operation.complete-settlement` descriptor
  - W4 financial-settlement workflow descriptor
  - TypeScript `settlement-workflow.ts`
  - Python `targets/python/w4_workflow.py`
  - Rust `targets/rust/src/w4/workflow.rs`
  - their publication-failure tests
- Exact evidence:
  - W3 makes settlement persistence and durable outbox append one atomic Operation.
  - W4 orders `validate → decide → persist → publish`.
  - W4 declares persist as compensating via `rollback-settlement`; publish has stop policy.
  - TypeScript, Python, and Rust tests all require a failed publication to compensate the completed persist step.
  - W4 step bindings are free strings plus `binding_kind`; they do not bind a W3 descriptor or transaction.
- Attack:
  1. If W4 persist invokes the W3 atomic Operation, publish failure rolls back settlement after a durable event/outbox fact exists.
  2. If W4 persist means record-only, it does not implement the W3 atomic record-plus-outbox Operation.
  Independent W3 and W4 passes cannot select or prove either interpretation.
- Compatibility surface: settlement truth, event occurrence, outbox retry, workflow failure, compensation, consumer-visible publication.
- One-line fix: choose an explicit composition—prefer atomic record-plus-outbox followed by retryable publication without state rollback—and add typed W4-step-to-W3-descriptor references.
- Discriminating acceptance check: one combined evaluator must cover publish failure, timeout-after-success, duplicate delivery, and retry; it must prove no durable event without its state and no state rollback after a durable fact.

### CM-06 — MAJOR — Live ontology/projection does not describe the implemented corpus consistently

- Current files/selectors:
  - `ontology.json#/implementation_instances`
  - `domain-meta-types.projection.json#/meta_types`
  - `README.md:92`
  - `ONTOLOGY-MAP.md:36-37`
- Exact evidence:
  - Live ontology is candidate/authority-none with 27 concept types, 99 properties, 18 relations, six implementation instances, zero supporting instances, zero relation instances, four deferred relation blueprints, and zero promotions.
  - Its six instances cover Entity, Value Object, Enum, Query, Calculation, and Policy in TypeScript/Python/Rust.
  - The corpus also contains Rule, W3 Operation/Interface/Event/Mapping, and W4 Workflow/State Machine providers and candidate receipts, but no corresponding ontology implementation instances.
  - Projection maps all 13 backend types as `candidate-mapped`, yet still labels most language protocols for the six materialized types as `"implementation_change":"provider-absent"`.
  - README says “72 property definitions, 14 typed relations”; live counts are 99 and 18.
  - ONTOLOGY-MAP still calls Calculation unmapped and Entity/Value Object/Policy unsupported.
- Attack: selection, discovery, and coverage can return mutually incompatible answers depending on whether the consumer reads the ontology, static projection payload, or prose.
- Compatibility surface: architecture discovery, provider selection, implementation-coverage claims, migration planning.
- One-line fix: regenerate coverage and prose from the live ontology/provider registry and represent every provider as an implementation instance or explicit exclusion.
- Discriminating acceptance check: derive all counts and provider states from one ontology; require every registered provider to map to exactly one candidate instance or typed exclusion, and reject any prose/projection count drift.

### CM-07 — MAJOR — Architecture-realization “v2” catalogue still binds mutable v1-era inputs

- Current files/selectors:
  - `architecture-realization-compiler/catalogues/order-status.member-bijection.v1.json`
  - `order-status.member-bijection.v2.json`
  - `receipts/SWU-ARE-003.json`
- Exact evidence:
  - Both catalogues reference live `ontology.json` as ontology schema v1 with digest `4eda2edd…`; the live file is ontology v2 at `6cd5a46c…`.
  - Both retain TypeScript profile `4f57…` and base profile `629c…`; live values are `32cf…` and `48d0…`.
  - SWU receipt remains green but correctly limits itself to an independent candidate-local Enum catalogue.
- Attack: the receipt is defensible only as historical evidence. Mutable live paths plus old digests do not form a resolvable current proof and cannot be promoted into the stable slice.
- Compatibility surface: Enum realization catalogue, replay, migration, proof lookup.
- One-line fix: move v1 inputs to immutable snapshot paths and label the lane historical, or regenerate a current v2 catalogue and receipts.
- Discriminating acceptance check: current-mode validation must reject every stale live-path ref; historical mode must resolve immutable bytes; a new v2 proof must bind current ontology/profile digests.

### CM-08 — MAJOR — The only deep relation proof is self-bound, not canonical-authority-bound

- Current files/selectors:
  - `families/enforces-relation/fixtures/.../relation-definition.json`
  - `obligations.json`
  - `contracts/enforces-contracts.ts`
  - `acceptance/relation/typescript/run-composition-proof.ts::compositionRawPaths`
  - `evaluate-enforces.ts`
- Exact evidence:
  - Local definition hardcodes `"definition_id":"DS-D2"` and `"predicate":"enforces"` with a candidate URI.
  - Its `definition_sha256` is a digest of that same local document.
  - Obligations bind only the local relation ID/digest.
  - Composition inputs do not include `definitions/relationships/relationships.yml`.
  - The evaluator compares the observation to that local definition and checks call counts/order.
- Attack: changing canonical `enforces` status, endpoints, scope, or obligations would not invalidate this proof. It proves one candidate TypeScript call trace, not conformance to the live canonical signature.
- Compatibility surface: Rule→Operation composition proof, factory provider, DS-D2/DS-D8 relationship semantics.
- One-line fix: bind the canonical relationship registry path/digest, exact signature selector, status, endpoints, scopes, and obligations into the proof.
- Discriminating acceptance check: mutate a copied canonical `enforces` endpoint/status/scope or its digest; proof must fail with a stable authority-stale diagnostic before executing the fixture.

### CM-09 — MAJOR — Generic strict validation has no stable/development maturity boundary

- Current files/selectors:
  - `definitions/meta-types/meta-types.yml#/maturity`
  - `definitions/relationships/relationships.yml#/signatures`
  - `impl/tools/validate-content.ts`
  - `impl/tools/lib/meta-type-criteria.ts::loadMetaTypeSchemas`
  - `impl/tools/lib/relationship-signatures.ts::loadRelationshipAuthority`
- Exact evidence:
  - Canonical meta-types distinguish 13 active backend members, nine candidate UI members, Adapter deferred/merge, and State Indicator deferred/split.
  - All 31 relationship signatures are active, including 14 signatures using candidate/deferred UI endpoints.
  - The generic validator recursively loads every `.schema.yml`; its test asserts 22 loaded schemas, including nine UI schemas.
  - Relationship loading excludes only relation signatures themselves marked deprecated/deferred; it does not consult endpoint maturity or an explicitly selected profile.
- Attack: default strict validation can validate candidate UI concepts and active signatures involving non-active endpoints without an explicit development-profile handle. This is unsuitable as a stable-profile gate.
- Compatibility surface: generic feature validation, UI candidate isolation, DS-D8 edge admission, future stable CLI.
- One-line fix: require a selected profile/maturity mode and cross-check relationship endpoint maturity before validation.
- Discriminating acceptance check: stable mode must reject Page/renders and Adapter/shapes with a non-active-endpoint code; explicitly bound UI-development mode may accept its selected subset.

### CM-10 — MINOR — Frozen corpus is dominated by generated cargo-target residue

- Current selector: `corpus-manifest.json#/selection_residue`
- Exact evidence: 4,825 `cargo-target` files account for 1,340,635,926 of 1,351,008,277 bytes because the confirmed exclusion covered `**/target/**`, not `**/cargo-target/**`.
- Attack: over 99% of the frozen bytes are generated build cache, making aggregate drift expensive and obscuring the semantic-source census.
- Compatibility surface: review reproducibility and future aggregate comparison only; this does not invalidate the current verified aggregate.
- One-line fix: obtain a new owner-confirmed selector excluding `**/cargo-target/**`, then refreeze and rerun; do not alter this run retrospectively.
- Discriminating acceptance check: the replacement manifest contains zero cargo-target paths while preserving every non-generated family source.

## Meta-type trace ledger

- `DS-D1.1 Entity`, `.2 Value Object`, `.3 Enum`, `.5 Query`, `.6 Calculation`, `.8 Policy`: canonical active → candidate-mapped projection → six ontology instances → TypeScript/Python/Rust realizations and factory evidence → authority-none receipts. Stable admission fails at CM-01/CM-06.
- `DS-D1.7 Rule`: canonical active → candidate mapping/provider implementations → candidate TypeScript `enforces` proof → no ontology implementation instance. Stable chain fails at CM-06/CM-08.
- `DS-D1.4 Operation`: canonical active → W3 descriptor/provider and three target languages → no ontology implementation instance. Atomicity and W4 composition fail at CM-03/CM-04/CM-05.
- `DS-D1.11 Interface`, `.12 Event`, `.13 Mapping`: canonical active → W3 descriptors/provider/replays → no ontology implementation instances. Runtime input closure fails at CM-03.
- `DS-D1.9 Workflow`, `.14 State Machine`: canonical active → W4 descriptors/provider plus TypeScript/Python/Rust targets → no ontology implementation instances. Runtime and W3 composition fail at CM-03/CM-05.
- `DS-D1.15..23`: candidate UI only; not part of the stable backend slice. Generic-validator isolation fails at CM-09.
- `DS-D1.24 Adapter`, `.25 State Indicator`: deferred; generic-validator/relationship endpoint isolation fails at CM-09.
- `DS-D1.10 Saga`: superseded tombstone; no ID reuse detected.

No active meta-type completes a current canonical-definition→decision→ontology→realization→language→evaluator→receipt→stable-admission chain.

## Relation trace ledger

Canonical active signatures attacked:

`performs`, `produces`, `produces-for`, `creates`, `triggers-cross`, `enforces`, `calculates`, `transitions`, `exposes`, `orchestrates`, `applies`, `maps`, `contains`, `queries`, `emits`, `owns`, `belongs-to`, `renders`, `wraps`, `composes`, `consumes`, `submits`, `shapes`, `protects`, `displays`, `fetches`, `mutates`, `reflects`, `derives`, `contracts`, `mirrors`.

- Canonical registry: 31 active signatures; `enforces-cross` remains deprecated. No duplicate active canonical label was found.
- Ontology: 18 architecture relation definitions, but zero materialized relation instances and four deferred blueprints.
- `enforces`: reaches a candidate-local TypeScript evaluator, denied guard, order/count checks, mutants, replay, and authority-none receipt, but does not bind canonical authority—CM-08.
- Remaining signatures: validator/schema coverage and some adjacent provider behavior exist, but no full canonical-signature→ontology relation-instance→language realization→evaluator→receipt chain was demonstrated.
- Fourteen UI/cross-layer signatures involve candidate/deferred endpoints and therefore also hit CM-09.

## Defended-zero ledger

- Canonical authority/schema family:
  - Backend/UI/deferred/Saga maturity distinctions are explicit.
  - Supported profile registry digests bind the current canonical meta-type and relationship registries.
  - No active duplicate relation verb was found.
- Ontology/profile/form family:
  - Live ontology says candidate, authority effect none, and zero promotions.
  - All 48 path/digest references embedded in its six implementation instances resolved exactly.
  - Implementation queue has no ready units; candidate receipts do not themselves claim admission.
- Architecture realization/runtime family:
  - The Enum receipt’s claim ceiling explicitly excludes conformance, promotion, publication, deployment, and release.
  - `enforces` composition checks one rule call, one operation call, rule-before-operation-before-write, a denied guard, and killed local mutants. CM-08 limits the meaning; these checks themselves were not vacuous.
- Remaining meta-types/factory family:
  - Candidate runs preserve authority effect none and candidate-local claim ceilings.
  - Replay snapshots are content-bound within their run roots.
  - No artifact claimed those candidate passes were production or canonical promotion.
- W3/W4/system-integration family:
  - The selected system-integration evidence explicitly describes a generic factory repair, not product integration.
  - No false system-integration or production claim was found; CM-04/CM-05 are missing proof/model composition, not existing claim inflation.
- Production/status family:
  - Roadmap/status sources still say DomainSpec v2 is not production and retain unresolved G0 and evidence-closure gates.
  - No selected-corpus source defensibly closes those gates.

## Cross-cutting evidence census

A bounded structured-reference scan over 438 selected JSON source/evidence files, excluding cargo-target and files over 10 MB, observed 3,653 `path`+`sha256` pairs:

- 300 pointed to live paths whose current bytes differ.
- 326 paths were unresolved from the repository root.
- 411 referenced files outside the frozen manifest.

These are not counted as 1,037 findings: many are historical snapshots, expected-red records, or artifact-root-relative references. They require role-aware classification before any stable evidence graph can be claimed. The current decision and realization examples above are confirmed actionable instances.

## Blocked checks / evidence gaps

- At the bounded-wait checkpoint, no toolchain, unit, integration, factory, compiler, or language-target suite was launched. Existing receipts were inspected, not re-endorsed by fresh execution.
- Behavioral TypeScript/Python/Rust parity was not independently rerun; only source contracts, checked-in tests, and receipts were attacked.
- Generated cargo-target contents were aggregate-hash verified but not semantically inspected.
- The broad path/digest census was not fully classified by historical/current/relative-reference role.
- The corpus’s system-integration family does not contain a product integration target/admission; product-level W3/W4 behavior therefore remains untested, not a zero finding.
- No G0 owner decision or production admission was found.
