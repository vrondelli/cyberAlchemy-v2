Action result: **PASS**  
Agent binding: `van Lamsweerde, Axel`  
Mode: `attack`  
Normalization ready: `true`  
Target disposition: **BLOCKED for a first production-stable baseline**  
Mutation: none  
Output receipt: not written, per empty write scope.

## Corpus accounting

- Frozen manifest: 6,188 files, 1,351,008,277 bytes.
- Aggregate digest: `6d208f20bacc39e124709fd18b2fe93147ccb52bf625833c1efd92afe09afa1a`.
- Every selected file was rehashed; no missing or drifted entry was found.
- All 438 selected JSON files parsed successfully.
- 4,825 `cargo-target` entries, totaling 1,340,635,926 bytes, are frozen build residue. They represent 77.97% of file count and 99.23% of bytes. I accounted for them but did not interpret binaries as source or run Rust builds that could mutate them.
- Remaining inspected surface: 1,363 files, 10,372,351 bytes.
- Family counts:
  - production/status: 6
  - canonical/schema: 69
  - architecture/runtime: 932
  - ontology/profile/form decisions: 106
  - remaining candidates/factory: 5,034, including the 4,825 residue entries
  - W3/W4/integration: 41
- One explicitly disclosed dependency check crossed a target exclusion: the current W3/W4 validators themselves load `semantic-slices/legacy-whole-file-snapshots/enum-v1/typescript-strict.profile.json`, which the frozen corpus excludes. It was inspected only to determine whether the selected validators are self-contained.

## Findings

### CM-01 — CRITICAL — W3 atomic persistence and W4 compensation cannot currently compose

Current files:

- `projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/fixtures/financial-settlement/descriptors.json`
- `projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/providers/typescript/financial-settlement.ts`
- `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/fixtures/financial-settlement/descriptors.json`
- `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/providers/typescript/settlement-workflow.ts`
- Corresponding Python and Rust targets.

Exact selectors:

- W3 Event: `fact_checkpoint = "durable-outbox-append"`
- W3 Event: `publication_policy_id = "at-least-once/v1"`
- W3 Operation:
  - `declared_writes = ["settlement"]`
  - `declared_external_effects = ["outbox"]`
  - `atomicity = "atomic"`
  - checkpoints include `write:settlement` and `append:outbox`
- W4 Workflow:
  - `persist.failure_policy = "compensate"`
  - persist compensation is `rollback-settlement`
  - `publish.failure_policy = "stop"`
- The provider compensates completed steps in reverse after publication failure, including undoing persistence.

Attack result:

W3 establishes settlement state and durable outbox occurrence as one atomic fact. W4 separately models persist followed by publish and rolls settlement back if publish fails.

Therefore either:

1. W4 persist invokes the W3 operation, in which case publication failure can roll back settlement while leaving the durable outbox occurrence referring to rolled-back state; or
2. W4 persist writes settlement alone, in which case it violates W3’s atomic state-plus-outbox contract.

No typed resolver proves which operation a W4 `binding_id` denotes. Continuation and compensation semantics consequently remain unjoined.

One-line fix: define one exact cross-wave persistence/publication contract; under the existing W3 outbox model, publication failure should retain committed state and outbox state for idempotent delivery, not roll back settlement.

Compatibility surface: settlement state, event occurrence identity, outbox recovery, replay, retry, compensation, three language providers, W3/W4 evaluators, factory receipts.

Discriminating acceptance check: inject failure and timeout after durable outbox append; require settlement and outbox to remain atomically committed, retry to reuse the same occurrence ID, publication attempts to be separate observations, and every W4 operation binding to resolve to the exact W3 descriptor and digest.

### CM-02 — CRITICAL — Six implemented RMT candidates are not admitted by the current model/profile frontier

Current files:

- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-rmt-{calculation,entity,enum,policy,query,value-object}.mjs`
- Current ontology, projection, TypeScript/Python/Rust profiles, form decisions, and RMT admissions selected by the manifest.
- `projects/domainspec-v2/development/remaining-meta-types/TERMINAL-RECEIPT.json`

Exact selectors and live results:

- Calculation: failed, 13/27 checks; stale ontology/projection/profiles and property drift including `callable.effect_contract` and `callable.dependency_contract`.
- Entity: failed on stale decision and exact-digest bindings.
- Enum: failed on stale ontology/projection/Python/Rust profiles, ontology source binding, and TypeScript status drift.
- Policy: failed semantic checks and current exact bindings.
- Query: failed semantic checks and current exact bindings.
- ValueObject: failed relation checks involving `constructed_by`, `validated_by`, and `extends_factory`, plus stale acceptance-bound references.
- Current overlays for Entity, ValueObject, Calculation, Policy, and Query in all three languages still say:
  - `implementation_status = "provider-absent"`
  - `candidate-protocol-only`
- Python and Rust Enum overlays also remain `provider-absent`.
- The terminal RMT receipt correctly limits itself to candidate-local evidence and denies governance synchronization, admission, promotion, and production.

Across selected JSON, 2,944 exact path references matched current bytes while 298 references in 66 owner files were stale.

One-line fix: owner-gated reconciliation of ontology, projection, language profiles, form decisions, admissions, and provider digests for all six candidate types.

Compatibility surface: Entity, ValueObject, Enum, Calculation, Policy, Query; all three language profiles; ontology projections; admissions and receipts.

Discriminating acceptance check: all six current validators must pass against the frozen bytes, each provider path and digest must resolve from the active overlay, and changing any bound digest to another valid SHA-256 must fail the relevant admission.

### CM-03 — MAJOR — W3/W4 evaluators accept forged exact-content bindings

Current files:

- `.../effects-connections/evaluator/evaluate-w3.ts`
- `.../effects-connections/evaluator/evaluate-w3.test.ts`
- `.../orchestration-lifecycle/evaluator/evaluate-w4.ts`
- `.../orchestration-lifecycle/evaluator/evaluate-w4.test.ts`

Exact selector:

`validateBinding` verifies protocol shape, six reference objects, nonempty IDs, and a SHA-256 regular expression. It does not resolve IDs or recompute hashes from current bytes. Tests reuse `"a".repeat(64)` as a digest.

Executed counterexample:

- Replaced every descriptor binding digest with a syntactically valid false digest.
- W3 results: `["pass","pass","pass","pass"]`
- W4 results: `["pass","pass"]`

The higher-level current validators perform additional resolution, but factory/evaluator receipts alone do not establish the exact joins they describe.

One-line fix: make exact-reference resolution a required evaluator input or a mandatory pre-admission stage, bound to the frozen inventory.

Compatibility surface: descriptor-to-ontology/profile/provider/source/fixture traceability and semantic/factory receipts.

Discriminating acceptance check: mutate each of the six binding digests independently to another valid 64-hex value and require `ARCH_W3_BINDING_INVALID` or `ARCH_W4_BINDING_INVALID` before a semantic receipt can pass.

### CM-04 — MAJOR — Native W3 evaluators do not enforce equivalent semantics

Current files:

- TypeScript `.../effects-connections/evaluator/evaluate-w3.ts`
- Python `projects/domainspec-v2/impl/architecture-conformance/targets/python/w3.py`
- Rust `projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/w3.rs`

The TypeScript evaluator checks interface compatibility, event payload/version/publication/consumer/order contracts, and operation reads/writes/external effects/atomicity/outcome/failure/guards/events/continuation. Python and Rust check materially smaller subsets.

Executed Python counterexamples with structurally valid inputs:

- forged Interface compatibility: pass
- forged Event payload/consumer/publication: pass
- forged Operation effects/outcome: pass

One-line fix: run one language-neutral W3 positive/hostile corpus against all evaluators, or explicitly classify Python/Rust as provider witnesses rather than semantic evaluators.

Compatibility surface: cross-language parity and native semantic receipts.

Discriminating acceptance check: port every TypeScript W3 hostile mutation to Python and Rust and require equivalent rejection classes.

### CM-05 — MAJOR — Canonical `produces` is not explicitly projected to architectural `architecture.emits`

Current files:

- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/impl/spec/meta-types/behavioral/operation.schema.yml`
- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json`
- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json`

Exact selectors:

- Canonical `produces`: Operation → Event.
- Canonical `emits`: Entity → Event.
- Canonical non-example: `Operation --[emits]--> Event`.
- Operation `source_of` includes `produces`, not `emits`.
- Ontology `architecture.emits`: OperationImplementation → EventImplementation.
- `derived_relation_projection` is empty.

The namespaces may intentionally distinguish domain and implementation relations, but there is no explicit trace establishing why the architecture relation with the canonically forbidden name represents canonical production.

One-line fix: use `architecture.produces`, or add an explicit typed `canonical_relationship_ref: "produces"` while preserving Entity → Event `emits`.

Compatibility surface: ontology relation IDs, W3 emitted-event bindings, projection validators, downstream receipts.

Discriminating acceptance check: resolve every architecture relation to a canonical relation or declared implementation-only origin; reject any Operation → Event projection to canonical `emits`.

### CM-06 — MAJOR — Current W3/W4 validation depends on a profile snapshot excluded from the frozen corpus

Current files:

- `.../ontology-experiment/validate-w3-effects-connections.mjs`
- `.../ontology-experiment/validate-w4-orchestration-lifecycle.mjs`

Exact selector:

Both bind `historicalTypeScriptProfilePath` to:

`semantic-slices/legacy-whole-file-snapshots/enum-v1/typescript-strict.profile.json`

The validators explain that descriptors remain bound to a pre-Calculation snapshot while current overlays are checked separately. Both validators pass, but the referenced profile is excluded by the target corpus and no exact compatibility bridge joins it to the current profile.

One-line fix: reissue descriptors against current profile bytes or explicitly select and version the historical profile as a supported compatibility dependency.

Compatibility surface: W3/W4 profile compatibility, manifest reproducibility, descriptor admissions.

Discriminating acceptance check: execute both validators using manifest-selected bytes only and require every profile reference to resolve either to the current profile or an explicitly admitted versioned compatibility artifact.

### CM-07 — MAJOR — Persisted v1 formation schemas have inconsistent unknown-field behavior while evolution remains undefined

Current files:

- `projects/domainspec-v2/impl/spec/minted-project/formations/entity-body.schema.json`
- `.../event-body.schema.json`
- `.../rule-body.schema.json`
- `.../operation-body.schema.json`
- `.../ontology-experiment/TRACEABILITY-AND-DRIFT.md`

Exact result:

- Entity/Event/Rule with `{ "unknown": true }`: accepted.
- Operation with the same field: rejected.
- Traceability document: `Schema evolution is undefined.`

This makes a typo or undeclared extension silently durable in three source forms but invalid in the fourth, without a declared compatibility or migration policy.

One-line fix: define one v1 unknown-field policy, preferably closed bodies plus an explicit extension envelope, and specify version migration/replay.

Compatibility surface: persisted minted source formats and every reader/writer of those forms.

Discriminating acceptance check: run the same unknown-field fixture across all four schemas and assert the declared uniform policy, then exercise old/new version migration and replay.

### CM-08 — MINOR — Current-named ontology reports carry stale model counts

Current files:

- `.../ontology-experiment/VALIDATION-REPORT.md`
- `.../ontology-experiment/TRACEABILITY-AND-DRIFT.md`
- current `ontology.json`
- current `domain-meta-types.projection.json`

Exact mismatch:

- Current ontology: 27 concept types, 99 properties, 18 relations, 8 constraint operators, 3 language projections, 6 implementation instances.
- Validation report: 12 concepts, 17 properties, 4 relations, 4 operators and “5 exact pairs.”
- Traceability text says eight active meta-types lack realization types, while the current projection maps all 13 active meta-types as candidates.

One-line fix: mark the report historical/pre-W3-W4 or regenerate it from current exact inputs.

Compatibility surface: review interpretation and evidence navigation, not runtime behavior.

Discriminating acceptance check: generate report counts and source digests mechanically and fail validation when embedded counts differ.

### CM-09 — MAJOR claim-boundary constraint — Concrete system-integration contracts remain absent

Current files:

- `projects/domainspec-v2/development/system-integration-contract-layer/evidence-closure.json`
- `projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000/RESULT.json`

The current evidence correctly blocks rather than inflates claims. Outstanding contracts include persistence claim limits, retry ownership, outbound API and inbound webhook records, consumer Operations, `triggers-cross`, projection Query, watermark, schemas, providers, evaluator, receipts, and fixtures.

One-line fix: keep system integration outside the baseline until the named owner selections and exact contract/evaluator evidence exist.

Compatibility surface: databases, event bus, transactions, retry ownership, APIs, webhooks, projections, and watermarking.

Discriminating acceptance check: satisfy the evidence-closure inventory with owner-selected exact contracts, cross-boundary failure fixtures, providers, evaluator, and receipts; candidate factory PASS alone must remain insufficient.

## W3/W4 failure model

| Phase | W3 interpretation | W4 interpretation | Attack consequence |
|---|---|---|---|
| Decide | Operation establishes guarded outcome | Workflow `decide` step | Compatible in isolation |
| Persist | State and outbox append are atomic | `persist` is compensable | Binding semantics unresolved |
| Publish | At-least-once attempt follows durable occurrence | Separate `publish` step | Compatible only if state/outbox remain committed |
| Publish failure | Durable occurrence remains retryable | Completed persist is rolled back | State/event contradiction |
| Continuation | `awaited-settlement` | `awaited-completion` | No typed continuation join |
| Compensation | Requires explicit semantics after durable fact | Reverse completed steps | No compensating event/tombstone contract |

## Per-meta-type attack disposition

- Entity: implemented candidate exists; current admission validator fails.
- ValueObject: implemented candidate exists; current relation/admission validator fails.
- Enum: TypeScript overlay active; Python/Rust and current exact admission remain unresolved.
- Rule: bounded outcome-function evidence survives; no production or three-language admission inferred.
- Calculation: implemented candidate exists; current admission fails with contract property drift.
- Policy: implemented candidate exists; current semantic/admission checks fail.
- Query: implemented candidate exists; current semantic/admission checks fail.
- Mapping: current W3 candidate validation survives, subject to forged-binding and language-parity findings.
- Interface: same W3 limitation.
- Event: same W3 limitation and involved in the W3/W4 durability contradiction.
- Operation: same W3 limitation and involved in the W3/W4 durability contradiction.
- StateMachine: current W4 candidate validation survives, subject to binding and composition findings.
- Workflow: current W4 candidate validation survives, subject to binding and compensation findings.

## Defended zero-finding ledger

- Canonical/schema family:
  - Active/candidate/deferred/superseded status separation survived.
  - Saga tombstoning survived.
  - Minted-project profile explicitly remains experimental and release admission is deferred.
  - Generated/read-model artifacts do not silently claim canonical authority.
- Ontology/profile/form-decision family:
  - `authority_effect` and candidate-state limits are explicit.
  - Current W3/W4 provider paths and digests pass their dedicated top-level validators.
  - No selected receipt promotes candidate evidence to production.
- Architecture/runtime family:
  - Missing W3/W4 observations fail closed.
  - Factory receipts retain `authority_effect: none`.
  - TypeScript StateMachine returns effects rather than directly performing external I/O.
- Remaining-meta-types/factory family:
  - Terminal receipt accurately limits its 47 SWUs to candidate-local evidence.
  - Historical receipts remain interpretable as evidence for historical bytes.
  - Cargo residue was frozen and hash-accounted without treating binaries as source.
- W3/W4/integration family:
  - Dedicated W3 and W4 validators pass their bounded candidate checks.
  - Exactly-once delivery is not falsely claimed.
  - Integration evidence closure correctly returns block.
- Production/status family:
  - Production roadmap gates remain separate from candidate checks.
  - Selected status files explicitly deny release, deployment, publication, lifecycle completion, and production readiness.
- Inventory packet:
  - Packet remains discovery evidence with no authority effect; its partial/local-index limitations were not treated as proof of absence.

## Claim ceiling

The selected bytes support bounded candidate evidence and identify a plausible stabilization frontier. They do **not** support:

- an all-13-meta-type current admission;
- a compositional W3/W4 durability model;
- exact source-to-receipt binding from evaluator receipts alone;
- cross-language semantic parity;
- concrete system-integration compatibility;
- release, deployment, publication, or production readiness.

The next owner decision should select the persistence/publication semantics in CM-01 before any “first production-stable” slice is named. Any slice containing the six RMT candidates additionally requires fresh current-byte admission under CM-02.
