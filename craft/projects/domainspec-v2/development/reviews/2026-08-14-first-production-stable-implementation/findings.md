# DomainSpec v2 first production-stable implementation review

Status: verifier-feedback loop 2 of 2 applied; final coverage-auditor gate remains open

## Direct current-state answer

No current DomainSpec v2 artifact is production stable.

The frozen bytes support bounded candidate-local validation and implementation evidence. They do not contain an owner-authorized stable product contract, a clean reproducible release candidate, a current end-to-end semantic admission chain, a trustworthy externally anchored factory receipt topology, coherent W3/W4 failure semantics, or an owned compatibility/operations package.

One plausible future candidate shortlist is much narrower than the current implementation corpus:

> A private, repository-local, compiled JavaScript structural-validation CLI v1 that supports only `lint <explicit-feature-directory>` and `receipt <explicit-feature-directory>` without `--out`, over one exact owner-ratified input profile, on one explicitly supported environment, with one versioned machine-readable receipt and stable exit/error contract.

This shortlist is not proved minimum or coherent, and no current artifact implements its proposed contract. It is not selected, admitted, or releasable by this review. Exact profile, artifact/runtime form, package-manager/lock authority, supported environment, compatibility duration, support boundary, and accountable owners remain external decisions.

## Evidence and verification state

- Manifest: `corpus-manifest.json`.
- Frozen corpus: 6,188 files; 1,351,008,277 bytes.
- Aggregate SHA-256: `6d208f20bacc39e124709fd18b2fe93147ccb52bf625833c1efd92afe09afa1a`.
- Final parent drift verification: `PARENT-DRIFT-VERIFY-RECEIPT.json`; exit 0; expected/current aggregates equal; no added, removed, or changed paths.
- Strategy discovery: `strategy-inventory-packet.json`; lookup-ready but partial and explicitly non-authoritative.
- Attacker receipts: all three retry receipts say PASS for the bounded review actions. PASS is not a product verdict.
- Runtime current-state commands: focused W3/W4 suites were green, but the full factory suite was red and three executable hostile probes survived.
- Independent verifier results: Popper returned FIX with 10 KEEP / 7 FIX / 0 DROP; Meadows returned FIX with 12 KEEP / 5 FIX / 0 DROP. This loop-2 revision applies both ledgers.
- Verification ceiling: the final coverage audit has not yet run. The change requests below remain frozen-byte-supported review findings pending that audit, not implementation or release acceptance.

All direct source paths cited below are entries in the frozen manifest unless a citation is explicitly labeled a recorded absence query or review execution receipt.

## Source-family coverage

| Frozen source family | Files / bytes | Git-state census | Review result | Evidence ceiling |
| --- | ---: | --- | --- | --- |
| Canonical authority and schema | 69 / 274,817 | 69 tracked-clean | Maturity distinctions, Saga tombstone, and local authority limits survive. Stable profile selection, formation authority, endpoint-maturity isolation, and a release contract do not. | Canonical/local validation input only |
| Ontology, profile, and form decisions | 106 / 1,561,282 | 66 changed; 30 ignored-untracked; 10 clean | Candidate/authority-none posture is honest and six instance refs resolve, but decision digests, queue state, coverage prose, projections, and provider representation are not one current model. | Candidate model evidence only |
| Architecture realization and conformance runtime | 932 / 6,187,542 | 542 changed; 69 ignored-untracked; 321 clean | Useful evaluators, negative checks, and factory mechanics exist. Exact bindings, verifier topology, JSON decoding, crash recovery, compiled distribution, package authority, and parity are incomplete. | Same-host candidate mechanics |
| Remaining meta-type candidates and factory | 5,034 / 1,341,980,241 | 23 changed; 5,011 ignored-untracked | Candidate-local receipts retain authority none. Current admission is absent; stale requests remain; 4,825 files are Cargo cache residue. | Historical/candidate evidence only |
| W3/W4 and system-integration boundary | 41 / 683,466 | 35 changed; 6 ignored-untracked | Focused fixtures pass, but W3 atomicity is not observable, W4 can create a ghost event, and concrete integration closure remains blocked. | Bounded fixture evidence only |
| Production and status evidence | 6 / 318,929 | 5 clean; 1 ignored-untracked | Comparator and Craft correctly deny current production readiness and require G0/owner gates. No current release referent was found. | Gate/comparator evidence, not release authority |

No family is a defended zero-finding lane.

## Component maturity and disposition matrix

`KILL` below always means remove from a future supported source/release surface. It is not deletion authorization.

| Component or surface | Current maturity evidenced by frozen bytes | Production-stability break | Verdict for first stable slice | Reopen condition |
| --- | --- | --- | --- | --- |
| Authority model, axioms, canonical backend definitions | Tracked-clean canonical inputs | No release authority or selected product profile follows from canonical status | KEEP | Bind exact digests through owner-selected G0/R2 |
| Production comparator and Craft gate state | Current negative comparator/gate evidence | G0 and owner refs absent; stage/gate remain plan/block | KEEP | External owner receipt and exact candidate |
| Minted-project supported profile | Experimental; release admission deferred | Not an owner-ratified stable input contract | DEFER | Select exact profile/version and compatibility policy |
| Formation JSON schemas | Four persisted v1 shape contracts | Unknown-field policy differs and compiler does not use them as advertised | REPLACE/HARDEN | One composed shape/criterion authority and migration tests |
| Structural parser and pure derive core | Useful candidate TypeScript implementation | Profile binding, compiled packaging, diagnostics, and clean proof are incomplete | HARDEN | Narrow CLI acceptance suite passes from clean roots |
| `lint` command | Read-only candidate behavior | Source-run/`tsx` coupling and no stable diagnostic envelope | HARDEN | Compiled artifact, explicit paths, stable exits/errors |
| `receipt` without `--out` | Read-only stdout candidate | Receipt schema/decoder/compatibility ownership incomplete | HARDEN | Versioned schema, decoder, N-1 fixtures, stable bytes |
| `self-check` | Useful negative-control mechanism | Hardcoded/fallback feature behavior and not a supportable user contract | KEEP as internal gate | Never expose as v1 supported user API without separate decision |
| `derive --out`, `check`, `emit-tests`, `receipt --out` | Candidate write/evidence tooling | Write, migration, recovery, ownership, and compatibility surfaces expand sharply | DEFER | Separate product decision and state-safety review |
| Generic architecture factory | Same-host candidate evidence harness with useful staging/replay ideas | Fabricated run verifies; crash recovery, decoders, anchors, security, retention incomplete | KEEP/HARDEN internally; DEFER commands | CR-04, CR-07, CR-10, CR-14 close |
| Architecture-realization compiler/catalogues | Candidate historical Enum evidence | v2 catalogue points at mutable paths with v1-era digests | DEFER | Immutable historical mode or fresh current-v2 proof |
| Entity, ValueObject, Enum, Calculation, Policy, Query realizations | Candidate implementations and receipts exist | Current validators/decisions/profiles/admission do not all pass | DEFER | Current-byte admission and external conformance owner receipt |
| Rule/`enforces` proof | Non-vacuous candidate-local TypeScript trace | Self-bound relation definition does not bind canonical relationship authority | DEFER | Canonical signature/digest/status/scope binding passes mutants |
| W3 Operation/Interface/Event/Mapping | Candidate descriptors/providers/fixtures | Open decoding, syntax-only bindings, parity gaps, atomic outbox unobservable | DEFER | CR-05, CR-07, CR-10, CR-12 close |
| W4 Workflow/StateMachine | Candidate descriptors/providers/fixtures | Free-string W3 binding and rollback-after-publish ambiguity | DEFER | Owner selects composition and CR-06 closes |
| Python and Rust runtime parity | Bounded positive fixtures | Hostile behavior differs or cannot be represented | DEFER | Shared hostile corpus equivalence or explicit witness-only claim |
| System-integration contract layer | Candidate generic-factory repair evidence | Product integration target/admission and named contracts remain absent | DEFER | Evidence-closure inventory and owner decisions pass |
| Root package/build/CI | Private 0.0.0 source workspace | npm/pnpm/lock conflict, caret deps, unresolved build policy, no clean release gate | REPLACE/HARDEN | One manager/lock/runtime, compiled artifact, enforced CI |
| Ignored `dist` copies and run snapshots | Generated/historical evidence | Not a curated deterministic release artifact | REPLACE or ARCHIVE outside product scope | Reproducible release staging and retention policy |
| `cargo-target` residue | 4,825 ignored cache files | Host-specific, 99.23% of corpus bytes, no semantic value | KILL from next source/release manifest | Owner confirms exclusion, fresh freeze, all attackers rerun |
| UI, SDK, hosted/public service, runtime convergence | Outside a coherent first backend structural slice | No selected contract or acceptance evidence | DEFER | Separate G0/product route |

## Exact contract, schema, model, runtime, and receipt joins

### Join A: proposed structural CLI

| Required join | Frozen current evidence | Break |
| --- | --- | --- |
| Canonical definitions → selected input profile | `definitions/meta-types/meta-types.yml`, `definitions/relationships/relationships.yml`, and `definitions/minted-project/supported-profiles.yml` exist | The only frozen minted profile is experimental and release admission is deferred |
| Selected profile → parser/formation rules | `impl/test-derivation-engine/src/cli.ts` calls parser/derive; minted compiler separately advertises JSON formation schemas | No exact owner-ratified profile handle is required at CLI entry; formation has two authorities |
| Explicit directory → deterministic parser | `runLint` and `runReceipt` accept a path, but `resolveTarget` falls back to a sibling feature-name resolver | Stable v1 must require an explicit existing directory and reject fallback |
| Parser result → stable diagnostic/exit contract | `runLint` currently returns 0 or 4 and prints prose | No versioned diagnostic envelope, compatibility window, or operator contract |
| Graph/violations → versioned receipt | `runReceipt` emits a structural residue receipt and returns 0 or 4 | Schema, decoder, N-1 reader policy, redaction, and stable byte contract are not ratified |
| Compiled bytes → release manifest → owner receipt | Root and engine packages are private 0.0.0 and execute TypeScript through `tsx` | No self-contained compiled candidate, release manifest, G0/G1/G2 binding, or clean checkout equality |

### Join B: semantic/meta-type realization

`canonical definition → form decision → ontology implementation instance → projection/profile → language provider → evaluator → exact receipt → implementation queue/admission → external conformance owner`

The frozen chain breaks at multiple independent points:

- `development/ontology-form-decisions/FORM-DECISION-MATRIX.json` and `receipts/current-validation.json` retain stale ontology, projection, base-profile, and language-profile digests.
- `development/ontology-form-decisions/IMPLEMENTATION-QUEUE.json` has no ready units.
- `development/implementation-conformance/ontology-experiment/ontology.json` has only six implementation instances, zero relation instances, and authority effect none.
- `domain-meta-types.projection.json` maps all 13 backend types as candidates while several language overlays still say provider absent.
- Six current RMT validators do not all pass; the full factory suite fails on stale Entity and ValueObject requests.
- Candidate receipts explicitly deny admission, promotion, publication, release, and production readiness.

No active meta-type currently completes this entire join.

### Join C: W3

`canonical Operation/Interface/Event/Mapping → W3 descriptor → closed observation → exact frozen binding → evaluator → language provider → factory request/lock/run → semantic receipt`

Breaks:

- W3 set providers parse JSON and cast member arrays rather than closed-decode them.
- `evaluate-w3.ts` accepts any 64-hex digest without resolving bytes.
- `OperationObservation` cannot record the commit/rollback state of the outbox member of the claimed atomic effect.
- Python accepts a future-major compatibility observation rejected by TypeScript; Rust cannot represent that check.
- Factory verification can pass an incomplete fabricated run tree.

### Join D: W4 and the W3/W4 cross-join

`canonical Workflow/StateMachine → W4 descriptor → typed step-to-W3 operation binding → persisted state/outbox transaction → publication attempt/ack state → compensation rule → evaluator → receipt`

Breaks:

- W4 step bindings are free strings plus `binding_kind`, not exact W3 descriptor/transaction references.
- W4 orders `persist → publish` and rolls back completed persistence after a later publish exception.
- W3 calls state write plus durable outbox append one atomic commit and treats publication as a later at-least-once action.
- Timeout after external publish success produced `published=true` with `persisted=false`.

### Join E: factory evidence topology

Required topology:

`externally supplied expected request/lock or run-root anchor → request → plan → immutable lock → input/component snapshots → node/process observations → terminal index → semantic receipt → verifier result`

Current `verify-run-root.ts` trusts the run's own index and checks only a small terminal subset. A three-file fabricated tree passed without the required upstream topology. Historical/current path references also drift without a universal role-aware resolver.

## W3 versus W4 adjudication

### Current verdict

The existing W3 and W4 models are not one coherent stable runtime contract. Independent W3 PASS and W4 PASS do not establish their composition.

### Recommended semantic rule

If W3's existing contract is retained, the state record and durable outbox occurrence commit atomically. Publication is a later, idempotent, at-least-once attempt. Failure or ambiguous acknowledgement after that commit must not roll back the durable state/fact; it must retain the occurrence and retry publication with the same occurrence identity.

The alternative—reversible staging before final W3 commit—would be a materially different contract and must define when the durable fact begins, how staging is identified, and how state and unseen outbox bytes are atomically retracted.

### Disposition

- First stable structural CLI: DEFER W3 and W4 entirely.
- Any future runtime slice: owner decision required before implementation hardening.
- Existing W4 rollback semantics: REPLACE if the owner selects W3 atomic record-plus-outbox.
- Existing W3 observation contract: HARDEN/REPLACE to represent every atomic member and outcome.
- Existing focused tests: KEEP as historical candidate evidence, then add the cross-wave fault matrix.

### Required fault matrix before reopen

| Boundary | Required invariant |
| --- | --- |
| Before record write | Neither state nor durable occurrence exists |
| Between record write and outbox append | Both roll back or neither becomes visible |
| After outbox append, before publish | State and occurrence remain committed and retryable |
| Publish fails before send | State/occurrence remain; attempt is failed and retryable |
| Publish succeeds then acknowledgement times out | State/occurrence remain; retry uses the same occurrence ID and is idempotent |
| Duplicate/reordered delivery | Consumer behavior preserves at-least-once identity rules |
| Poison event | State/occurrence remain coherent; quarantine/retry ownership is explicit |
| Recovery/replay | Receipt, state, outbox, attempts, and acknowledgements cannot contradict |

## Severity-ordered candidate change requests

### CR-01 — CRITICAL — Define the stable object and accountable owner set

- Verdict: DEFER every release claim until this closes.
- Evidence class: authoritative comparator plus manifest-bounded absence observation.
- Frozen evidence: `implementation/domainspec/research/2026-07-12-first-production-release/findings.md`; `projects/domainspec-v2/.craft/ledger.yml`; `projects/domainspec-v2/definitions/minted-project/supported-profiles.yml`.
- Recorded absence: the lifecycle attacker queried the frozen manifest for `projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md` and found zero. That result is limited to the reviewed corpus; it is not proof of repository-wide absence.
- Finding: no reviewed exact G0/R2 binding establishes the proposed shortlist's release identity, artifact, commands, actors, input profile, writes, environment, compatibility/support boundaries, withdrawal, and accountable owners. Craft remains plan/block and cannot grant external implementation/release authority.
- One-line fix: bind an externally owned exact G0/R2 contract to any selected CLI candidate and every required owner and exclusion.
- Acceptance test: a fail-closed validator must bind the exact contract bytes, candidate manifest digest, profile, environment, command/output/error surface, support/compatibility/withdrawal policy, independent verifier, and pilot operator; changing any bound byte invalidates acceptance.
- Affected owner: DomainSpec product/release owner, profile owner, security/support owners, independent verifier.
- Compatibility/migration implication: this is the root compatibility decision; no interface can be promised before it.
- Claim ceiling: closes product identity only; it does not prove the candidate implements the contract.

### CR-02 — CRITICAL — Produce one clean, reconstructable release candidate

- Verdict: REPLACE the dirty host snapshot as release evidence; KEEP it as frozen review evidence.
- Evidence class: exact manifest census and stale historical acceptance.
- Frozen evidence: `projects/domainspec-v2/development/reviews/2026-08-14-first-production-stable-implementation/corpus-manifest.json#/aggregate` and `#/files[*].git_status`; `projects/domainspec-v2/development/remaining-meta-types/TERMINAL-RECEIPT.json`; `projects/domainspec-v2/development/meta-type-factory-reproducibility/PROTOTYPE-VALIDATION-REPORT.md`.
- Finding: 666 selected files are changed, 5,117 are ignored-untracked, and only 405 are tracked-clean. Exact freezing proves what was reviewed, not what a clean checkout can rebuild. Historical Repair-B cannot anchor the current candidate because 27 formerly accepted entries drift.
- One-line fix: curate one tracked candidate slice, freeze its source/dependency/generated-deliverable inventory, and independently rebuild it from two clean arbitrary paths.
- Acceptance test: run the exact `freeze-corpus.py --verify` pattern recorded in `PARENT-DRIFT-VERIFY-RECEIPT.json` against the candidate manifest; require empty added/removed/changed sets, zero unexpected porcelain inside the slice, and equal normalized artifact/receipt hashes from two clean roots.
- Affected owner: release/build owner and independent RC verifier.
- Compatibility/migration implication: historical receipts remain historical and must resolve immutable preimages or be explicitly unsupported by current mode.
- Claim ceiling: proves reproducible candidate identity on selected environments, not production fitness.

### CR-03 — CRITICAL — Reconcile current semantic admission and stale lifecycle state

- Verdict: DEFER all architecture/meta-type realizations from the first slice.
- Evidence class: current-byte validator failures, digest conflict, and empty queue.
- Frozen evidence: `projects/domainspec-v2/development/ontology-form-decisions/FORM-DECISION-MATRIX.json`; `projects/domainspec-v2/development/ontology-form-decisions/receipts/current-validation.json`; `projects/domainspec-v2/development/ontology-form-decisions/IMPLEMENTATION-QUEUE.json`; `projects/domainspec-v2/development/ontology-form-decisions/DECISION-STATE-MACHINE.json`; seven current validator routes under `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-rmt-*.mjs`, including both Enum routes; `projects/domainspec-v2/development/remaining-meta-types/TERMINAL-RECEIPT.json`.
- Finding: records still say current PASS after bound inputs drifted; the state machine already defines a stale transition, but affected records were not transitioned. Seven current validator routes covering six implemented candidate families exited 1 in the counterexample verification, and no queue unit is ready.
- One-line fix: mark drifted decisions stale, regenerate decision/queue/receipt bytes from current inputs, rerun all six validators, and obtain external conformance-owner acceptance before admission.
- Acceptance test: execute all seven current no-write routes for Calculation, Entity, both Enum routes, Policy, Query, and ValueObject; require exit 0 for all, zero stale refs, no ready unit derived from a pre-drift decision, and an external implementation-conformance receipt bound to the same aggregate.
- Affected owner: ontology/form-decision owner, meta-type owners, language-profile owners, implementation-conformance owner.
- Compatibility/migration implication: current candidate receipts remain historical; new admissions require new digests and must not reuse old acceptance.
- Claim ceiling: closes current admission for named types only, not their production release.

### CR-04 — CRITICAL — Replace self-attesting factory verification with anchored topology verification

- Verdict: HARDEN internal factory infrastructure; DEFER factory commands from the first stable API.
- Evidence class: executable false-green counterexample.
- Frozen evidence: `projects/domainspec-v2/impl/architecture-conformance/factory/evidence/verify-run-root.ts` and `projects/domainspec-v2/impl/architecture-conformance/factory/cli/index.ts`; execution receipt `projects/domainspec-v2/development/reviews/2026-08-14-first-production-stable-implementation/orchestration-runs/20260816T114834Z-production-stability-review-retry1/raw-returns/spawn-0002.md`.
- Finding: `factory verify` accepted a three-file fabricated run with no request, plan, valid lock, snapshots, nodes, or process evidence and returned an arbitrary non-digest lock identity.
- One-line fix: require a caller-supplied expected request/lock or run-root anchor, closed-decode every mandatory artifact, and verify the complete topology.
- Acceptance test: `npm --prefix projects/domainspec-v2/impl run factory -- verify --run <forged-three-file-run>` must exit nonzero with a stable topology/anchor code; the same command on a genuine externally anchored locked run must pass.
- Affected owner: factory/evidence-format owner and independent verifier.
- Compatibility/migration implication: legacy run roots need an explicit historical verifier mode or become unsupported; silently accepting incomplete v1 roots is forbidden.
- Claim ceiling: a fixed verifier proves run-tree integrity against its external anchor, not semantic correctness of the implementation.

### CR-05 — CRITICAL — Make W3 atomicity representable, then prove provider persistence independently

- Verdict: HARDEN/REPLACE the W3 observation and evaluator contract; DEFER W3 from v1.
- Evidence class: directly checked model expressiveness defect plus an unexecuted provider fault-and-restart obligation.
- Frozen evidence: `projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/contracts/w3-contracts.ts#OperationObservation`; `projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/evaluator/evaluate-w3.ts#evaluateOperation`; `projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/fixtures/financial-settlement/descriptors.json` and `observations.json`.
- Finding: writes have commit/rollback state, but external effects are only strings. The evaluator cannot distinguish “settlement committed, outbox append failed” from “settlement and outbox committed,” so the current fixture cannot represent the claimed atomic outcome. Even a corrected fixture would not prove that an independent provider/database commits and recovers atomically.
- One-line fix: first install a closed, versioned transaction/effect-group observation with state for every write and outbox checkpoint; then prove the provider boundary separately with instrumented persistence faults and restart.
- Acceptance test: (1) schema/evaluator fixtures reject missing, mixed, malformed, and future-version member outcomes and accept only representable all-committed/all-rolled-back groups; (2) an independent provider campaign faults before/after record write and outbox append, restarts the process/store, and demonstrates the same invariant against observed durable state.
- Affected owner: Operation/Event semantic owner, persistence/outbox owner, W3 contract owner.
- Compatibility/migration implication: this changes persisted observation shape; issue a new schema version and define v1 reader/migration behavior.
- Claim ceiling: evaluator fixtures may establish closed observation representability only. Database/provider atomicity and post-crash recovery require the separate provider proof.

### CR-06 — CRITICAL — Select and prove one W3/W4 persistence-publication contract

- Verdict: DEFER W3/W4 from the first slice; REPLACE current rollback semantics if atomic record-plus-outbox is retained.
- Evidence class: static contract contradiction plus executable timeout-after-success counterexample.
- Frozen evidence: `projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/fixtures/financial-settlement/descriptors.json`; `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/fixtures/financial-settlement/descriptors.json`; `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/providers/typescript/settlement-workflow.ts`; `projects/domainspec-v2/impl/architecture-conformance/targets/python/w4_workflow.py`; `projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/w4/workflow.rs`; their publication-failure tests; the runtime retry raw return.
- Finding: W3 calls state plus outbox one atomic durable commit, while W4 rolls back completed persistence after publication failure. A publish-success-then-timeout probe yielded `published=true` and `persisted=false`.
- One-line fix: owner-select the composition; recommended is atomic state-plus-outbox followed by idempotent retryable publication with no rollback after durable commit.
- Acceptance test: run the full fault matrix above across included languages and require typed W4-to-W3 descriptor/transaction bindings, no durable fact without state, no state rollback after a durable fact, stable occurrence identity, and idempotent retry.
- Affected owner: state, event, workflow, persistence, messaging, and compensation owners.
- Compatibility/migration implication: current W4 descriptors/tests encode the opposite rollback rule and require a new contract version; stored v1 workflow receipts must remain historical.
- Claim ceiling: closes composition for the selected workflow only, not general distributed exactly-once behavior.

### CR-07 — MAJOR — Partition and close versioned boundaries by owned surface

- Verdict: REPLACE casts and partial decoders; HARDEN the interface registry.
- Evidence class: directly verified W3/W4 shallow-decoder defect plus surface-specific required checks.
- Frozen evidence: `projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/typescript-w3-effects-connections-v1.ts#parseSet` and `typescript-w4-orchestration-lifecycle-v1.ts#parseSet`; `projects/domainspec-v2/impl/architecture-conformance/factory/codecs/decode-factory-run-request-v1.ts`; `decode-factory-run-lock-v1.ts`; `projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/replay-factory-run.ts`; `projects/domainspec-v2/impl/spec/minted-project/formations/*.schema.json`; `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/TRACEABILITY-AND-DRIFT.md`.
- Finding: W3/W4 providers directly parse JSON and cast members without closed decoding; that defect was independently verified. Factory lock/replay, minted formation, broader migration, and other malformed/future-version behavior remain separately owned required checks rather than one proven cross-surface defect.

| Surface | Version/format boundary | Owner gate | Effect on candidate shortlist |
| --- | --- | --- | --- |
| CLI | Selected input-profile identity, diagnostic envelope, structural authority-none receipt, stdout/stderr and exit behavior | CLI/profile/release owners | GATES the shortlist |
| Factory | Request, plan, lock, snapshot, process, index, semantic receipt, replay | Factory/evidence owner | Does not gate while factory commands remain excluded; required on reopen |
| Minted | Shape schemas, semantic criteria, source versions, migration | Minted profile/schema/compiler owners | Does not gate while minted/semantic admission remains excluded |
| W3 | Descriptor/observation set roots and members; binding versions | W3 Operation/Event owner | Direct shallow-decoder defect retained; does not gate while W3 is excluded |
| W4 | Descriptor/observation set roots and members; step/binding versions | W4 Workflow/StateMachine owner | Direct shallow-decoder defect retained; does not gate while W4 is excluded |

- One-line fix: maintain a separate owner-ratified format/version matrix for each surface; close only the selected CLI boundaries before shortlist admission and retain independent reopen gates for factory, minted, W3, and W4.
- Acceptance test: for each selected surface, run its own N-1/N/N+1, missing-field, discriminant, unknown-field, future-version, migration, and stable-diagnostic matrix. The W3/W4 shallow casts must fail before evaluation; the other campaigns remain required until directly executed.
- Affected owner: separate CLI/profile, factory/evidence, minted, W3, and W4 schema/compatibility owners.
- Compatibility/migration implication: closing a selected surface can reject stored data only for that surface; inventory and migrate it under that owner's version policy without implying profile admission or runtime semantics.
- Claim ceiling: proves registered format handling surface by surface. Only selected CLI boundaries can advance the proposed shortlist.

### CR-08 — MAJOR — Unify minted-project formation authority

- Verdict: REPLACE the dual path with one composed or generated contract.
- Evidence class: attacker-recorded compiler/schema comparison plus a verifier-required equivalence test that neither verifier reran.
- Frozen evidence: `projects/domainspec-v2/definitions/minted-project/supported-profiles.yml#/profiles/*/formation_schemas`; `projects/domainspec-v2/impl/spec/minted-project/formations/*.schema.json`; `projects/domainspec-v2/impl/tools/minted-project/compiler.ts#validateFormation` and `#nonFormationViolations`; `projects/domainspec-v2/impl/tools/minted-project/meta-type-body-adapter.ts#validateMintedNodeFormation`.
- Finding: the attacker recorded that the profile advertises JSON shape schemas while the compiler evaluates a separate semantic-criterion path and may discard body failures. Neither verifier independently reran the schema/compiler contradiction, so it remains a supported repair request whose discriminating equivalence test is still required.
- One-line fix: declare formation as an ordered composition of a shape-schema stage and a semantic-criterion stage, then require compiler acceptance to equal that declared composition.
- Acceptance test: a single table for all four kinds with missing, extra, wrong-discriminator, and forward-extension cases must show `compiler_accept = shape_accept AND criterion_accept` (or another owner-declared rule) and must emit stable stage-specific diagnostics identifying shape versus semantic rejection.
- Affected owner: minted-project profile/schema/compiler owner.
- Compatibility/migration implication: existing accepted bodies must be censused before tightening; version and migrate any newly rejected persisted form.
- Claim ceiling: aligns the declared two-stage formation decision only. Profile admission remains an external owner decision and is not implied by schema/compiler equivalence.

### CR-09 — MAJOR — Require an explicit stable maturity/profile boundary

- Verdict: HARDEN generic validation; DEFER candidate/deferred endpoints from stable mode.
- Evidence class: canonical maturity/profile boundary plus required fail-closed expansion tests.
- Frozen evidence: `projects/domainspec-v2/definitions/meta-types/meta-types.yml#/maturity`; `projects/domainspec-v2/definitions/relationships/relationships.yml#/signatures`; `projects/domainspec-v2/impl/tools/validate-content.ts`; `projects/domainspec-v2/impl/tools/lib/meta-type-criteria.ts#loadMetaTypeSchemas`; `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts#loadRelationshipAuthority`.
- Finding: the canonical corpus distinguishes maturity states, while the proposed stable validator still needs an explicit owner-ratified profile/maturity handle. The attacker recorded broader loader behavior, but neither verifier reran the exact loader-count census; no loader count is relied on here.
- One-line fix: require a profile/maturity mode and cross-check relation endpoint maturity before validation.
- Acceptance test: stable mode must fail closed for an unknown/new meta-type, a newly introduced relation, and an endpoint whose maturity changes outside the ratified profile. Any profile expansion must invalidate the prior acceptance binding and require fresh owner ratification; an explicitly bound development profile may admit only its selected subset.
- Affected owner: definition/profile owner and generic validator owner.
- Compatibility/migration implication: callers relying on implicit all-schema loading must pass an explicit profile; provide a transition error, not silent behavior change.
- Claim ceiling: isolates a stable profile; it does not promote candidate UI concepts.

### CR-10 — MAJOR — Enforce exact current/historical binding and receipt joins

- Verdict: HARDEN current mode; ARCHIVE immutable historical mode; DROP syntax-only trust.
- Evidence class: digest census, current-byte mismatch, and executable false binding.
- Frozen evidence: `projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/evaluator/evaluate-w3.ts#validateBinding`; `projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/evaluator/evaluate-w4.ts#validateBinding`; `projects/domainspec-v2/development/ontology-form-decisions/FORM-DECISION-MATRIX.json`; `projects/domainspec-v2/development/architecture-realization-compiler/catalogues/order-status.member-bijection.v1.json` and `order-status.member-bijection.v2.json`; `projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-entity.request.json`, `rmt-value-object.request.json`, and `rmt-enum.request.json`.
- Finding: exact-looking refs may be stale, unresolved, outside the manifest, or checked only for 64-hex syntax. Focused tests passed despite stale profile bindings, while the full factory suite failed on stale requests.
- One-line fix: resolve every ID through an explicit path/role registry, compare frozen bytes before evaluation, and separate immutable historical from current mode.
- Acceptance test: mutate each binding one byte; current mode must fail before semantic evaluation with a stable stale/binding code. Historical mode must resolve immutable snapshot bytes. Add a census test over every `*.request.json` reference.
- Affected owner: evidence graph, decision, realization, factory, and W3/W4 owners.
- Compatibility/migration implication: historical green receipts must not be rewritten as current; retain their original preimages or mark them unverifiable.
- Claim ceiling: establishes exact evidence identity and topology, not semantic truth.

### CR-11 — MAJOR — Rebuild authority-directed derived coverage and relationship views

- Verdict: KEEP the authority-none ontology posture; HARDEN/regenerate coverage and canonical joins.
- Evidence class: verifier-rechecked failing current validators/drift plus separately labeled attacker-recorded model details.
- Frozen evidence: `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json#/implementation_instances`; `domain-meta-types.projection.json#/meta_types`; that folder's `README.md` and `ONTOLOGY-MAP.md`; `projects/domainspec-v2/definitions/relationships/relationships.yml`; `projects/domainspec-v2/impl/architecture-conformance/families/enforces-relation/fixtures/settlement-rule-operation/relation-definition.json` and `obligations.json`; `projects/domainspec-v2/impl/architecture-conformance/families/enforces-relation/evaluator/evaluate-enforces.ts`; the architecture-realization catalogues.
- Finding: the counterexample verifier reran seven current RMT validator routes and all failed; it also confirmed 27 drifted Repair-B entries. Those checks support an incoherent current admission/evidence view. The ontology counts, zero-relation state, self-bound `enforces` proof, and `produces`/`emits` details remain attacker-recorded subclaims that were not independently rechecked in this verifier loop.
- Authority direction: canonical definitions remain owned authority inputs; an owner-ratified profile selects from them; provider registrations bind implementations; ontology, projection, counts, and prose are authority-none derived views. Provider-to-view mapping must never imply conformance, admission, or promotion.
- One-line fix: preserve those separate owners and regenerate authority-none coverage/prose from exact canonical, selected-profile, and provider inputs; independently recheck each retained relationship subclaim before using it as an acceptance gate.
- Acceptance test: every registered provider maps to exactly one authority-none candidate view or typed exclusion without changing canonical/profile authority; all mechanically derived counts agree. Separately, canonical endpoint/status/scope mutants must attack the `enforces` binding and the Operation-to-Event projection test must adjudicate `produces` versus `emits` before those subclaims are called verified.
- Affected owner: separate canonical-definition owner, profile owner, provider-registration owner, and derived ontology/projection/view owner.
- Compatibility/migration implication: regenerate IDs/digests carefully; historical catalogues need immutable versioned lookup and must not be relabeled current.
- Claim ceiling: establishes an authority-directed discovery view only. Provider mapping is not implementation conformance, admission, promotion, or production proof.

### CR-12 — MAJOR — Prove cross-language behavior or narrow the claims

- Verdict: DEFER Python/Rust from the first slice.
- Evidence class: executable cross-language counterexample plus API comparison.
- Frozen evidence: TypeScript `projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/evaluator/evaluate-w3.ts`; Python `projects/domainspec-v2/impl/architecture-conformance/targets/python/w3.py`; Rust `projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/w3.rs`; their W3/W4 tests.
- Finding: TypeScript rejected a future-major compatibility observation, Python accepted it, and Rust could not represent the check. Green native fixture suites do not establish behavioral parity.
- One-line fix: run one language-neutral positive/hostile corpus through all included evaluators, or label Python/Rust as syntax/provider witnesses and remove parity claims.
- Acceptance test: `python3 -m unittest -v test_w3.py test_w4.py` and `cargo test --locked --offline --test w3 --test w4` remain necessary but insufficient; add the same malformed, future-version, semantic-mutation, and failure fixtures to TypeScript/Python/Rust and require equivalent verdict classes/codes.
- Affected owner: language profile/provider owners and cross-language conformance owner.
- Compatibility/migration implication: narrowing claims is non-breaking for bytes but changes support promises; parity repair may require new native APIs and receipt versions.
- Claim ceiling: equivalence is only for the shared registered corpus, not byte-identical implementations.

### CR-13 — MAJOR — Select one package/build/CI authority and remove source-checkout coupling

- Verdict: REPLACE/HARDEN the release build; KEEP source tooling as development-only.
- Evidence class: frozen package/config comparison and path absence query.
- Frozen evidence: `projects/domainspec-v2/impl/package.json`; `projects/domainspec-v2/impl/package-lock.json`; `projects/domainspec-v2/impl/pnpm-workspace.yaml`; nested engine `projects/domainspec-v2/impl/test-derivation-engine/package.json`, `pnpm-lock.yaml`, and `pnpm-workspace.yaml`; `projects/domainspec-v2/impl/tsconfig.json`; `projects/domainspec-v2/impl/test-derivation-engine/src/cli.ts`.
- Finding: scripts invoke npm while `packageManager` pins pnpm; root npm lock and nested pnpm lock coexist; root pnpm lock is absent; esbuild policy is unresolved; dependencies use carets; the CLI runs TypeScript through `tsx`, has sibling fallback, and no enforced clean release workflow.
- One-line fix: owner-select one manager/lock, one explicit-path artifact/runtime form (self-contained executable or compiled JavaScript with pinned Node), and one fail-closed clean CI gate.
- Acceptance test: no release install/build command is valid until the package-manager decision is recorded. After selection, two network-disabled arbitrary-path clean checkouts must use the same frozen lock, build identical artifact hashes, run typecheck/unit/negative/golden tests, and reject lock/workspace-policy drift.
- Affected owner: package/build/CI owner and release owner.
- Compatibility/migration implication: source-run npm/tsx usage becomes unsupported development behavior; document transition to the compiled artifact.
- Claim ceiling: proves build/reproducibility on declared environment(s), not runtime semantics outside the CLI.

### CR-14 — MAJOR — Run a bounded factory resilience, security, and retention campaign

- Verdict: HARDEN internal factory; keep it outside v1 product scope.
- Evidence class: evidenced factory mechanisms and exposure surfaces plus an unexecuted resilience/security campaign.
- Frozen evidence: staging/locking/reproduction, request-decoder, process-observation, and snapshot code under `projects/domainspec-v2/impl/architecture-conformance/factory/**`; the lifecycle/runtime raw receipts under this review's `orchestration-runs/**/raw-returns/`.
- Finding: the factory has atomic rename, no-overwrite, caught-error cleanup, locks/staging, inherited child environment, snapshots, and persisted process observations. These mechanisms create concrete resilience/security/retention questions, but crash stranding, harmful ambient exposure, secret copying, sandbox escape, and retention failure were not executed in either verifier pass. The executable external-anchor defect remains solely under CR-04.
- One-line fix: run the bounded campaign first, then install owner-selected lock recovery, environment minimization, classification/redaction, permission, sandbox, and retention controls for failures or requirements the campaign establishes.
- Acceptance test: SIGKILL at every publication edge; deterministic no-overwrite recovery and orphan diagnosis; secret-canary, output-permission, child file/network/environment negatives, redacted diagnostics, and auditable expiry. Until these execute, they remain required tests, not verified failures.
- Affected owner: factory runtime owner, security/privacy owner, evidence-retention owner.
- Compatibility/migration implication: old lock/run formats need historical handling; retention changes cannot delete referenced evidence without owner-approved supersession.
- Claim ceiling: the campaign can establish bounded local behavior for tested mechanisms only, not perfect isolation or a current verified defect for every hypothesized risk.

### CR-15 — MAJOR — Bind operability, resource, diagnostics, support, and withdrawal

- Verdict: HARDEN the narrow CLI; DEFER hosted-service controls.
- Evidence class: envelope not evidenced by the frozen review corpus plus observed internal runtime constants.
- Frozen evidence: `implementation/domainspec/research/2026-07-12-first-production-release/findings.md`; timeout/output-cap mechanics under `projects/domainspec-v2/impl/architecture-conformance/factory/**`; `projects/domainspec-v2/impl/package.json` and `projects/domainspec-v2/impl/test-derivation-engine/package.json`; the lifecycle raw receipt's recorded absence census.
- Finding: a supported input-size/shape, latency, memory, output, disk, diagnostic, support, hotfix, deprecation, and withdrawal envelope for the proposed CLI is not evidenced by this frozen corpus. That is not a repository-wide absence claim. Current factory constants and a roughly 22.6-minute historical acceptance do not define the CLI product envelope.
- One-line fix: ratify a local-CLI operator contract with stable diagnostics/exits, bounded resources, recovery, redaction, support route, compatibility window, hotfix, and withdrawal.
- Acceptance test: boundary and over-bound fixtures measure wall time, RSS, output, and disk; over-bound input fails early with a stable code; a fresh pilot operator installs, runs green/red cases, gathers redacted diagnostics, recovers, upgrades/rolls back, and reaches the named owner without author assistance.
- Affected owner: operations/support owner, performance owner, release owner.
- Compatibility/migration implication: resource and support limits become part of the stable contract; later expansion requires versioned policy change.
- Claim ceiling: local operator readiness only; no hosted SLO, central telemetry, backup, or deployment claim.

### CR-16 — MAJOR — Keep product system integration blocked until exact contracts exist

- Verdict: DEFER.
- Evidence class: explicit evidence-closure block and recorded absence of product target/admission.
- Frozen evidence: `projects/domainspec-v2/development/research/2026-08-13-system-integration-contracts/receipts/evidence-closure.json` and selected `projects/domainspec-v2/development/system-integration-contract-layer/**` result/receipt/probe files.
- Finding: current evidence correctly describes a generic factory repair, not a product integration. Persistence claim limits, retry ownership, API/webhook records, consumer operations, projection query/watermark, schemas, providers, fixtures, evaluators, and receipts are not one admitted integration contract.
- One-line fix: retain the block until owners select exact contracts and the evidence-closure inventory passes with cross-boundary failure fixtures.
- Acceptance test: every closure item resolves to exact frozen bytes and owner receipts; negative integration fixtures fail; candidate factory PASS alone remains insufficient.
- Affected owner: integration, persistence, messaging, API/webhook, projection, and product owners.
- Compatibility/migration implication: no existing product integration contract should be inferred; future contracts must declare versioning and migration from the outset.
- Claim ceiling: bounded selected integrations only, not general system interoperability.

### CR-17 — MINOR — Remove generated cache residue from the next confirmed evidence boundary

- Verdict: KEEP as enumerated residue for this accepted run; KILL from the next source/release manifest.
- Evidence class: exact manifest selection census.
- Frozen evidence: `projects/domainspec-v2/development/reviews/2026-08-14-first-production-stable-implementation/corpus-manifest.json#/selection_residue`.
- Finding: 4,825 `cargo-target` files total 1,340,635,926 bytes because `**/target/**` does not match `**/cargo-target/**`. They account for 99.23% of frozen bytes and embed host/toolchain/path details.
- One-line fix: route `CARGO_TARGET_DIR` outside selected/product roots and obtain owner confirmation for a `**/cargo-target/**` exclusion before a fresh freeze.
- Acceptance test: the replacement manifest contains zero `cargo-target` paths and no absolute home path while preserving every non-generated source family; all attackers rerun over the new aggregate.
- Affected owner: review selector owner, build owner, release-evidence owner.
- Compatibility/migration implication: none for product semantics; this changes the evidence aggregate and invalidates reuse of this run's exact freeze.
- Claim ceiling: evidence hygiene only.

## Compatibility and migration implications

| Change family | Compatibility consequence | Required migration posture |
| --- | --- | --- |
| Stable CLI narrowing | Existing source-run/write/factory/language surfaces are not promised APIs | Announce only the two-command v1 contract; label all other commands development/internal |
| Explicit profile/maturity | Implicit all-schema callers may fail | Require profile argument/embedded profile ID; stable diagnostic for missing/unsupported profiles |
| Closed formation and JSON decoders | Previously tolerated unknown/malformed fields may be rejected | Inventory stored v1 data; define extension envelope or deterministic v1→v2 migration |
| External factory anchor/full topology | Incomplete/self-authored historical run roots no longer verify in current mode | Immutable historical verifier or explicit unsupported status; never rewrite old receipts as current |
| Exact current path/digest resolution | Stale mutable-path receipts fail | Preserve immutable preimages; regenerate current receipts with fresh review/acceptance |
| Ontology/projection regeneration | Counts, coverage states, IDs, and digests change | Version generated views and retain prior catalogues as historical snapshots |
| W3 atomic observation | Observation and receipt shape changes | New schema version with v1 read/rejection policy |
| W3/W4 composition | Current W4 rollback tests/descriptors become incompatible with durable-outbox rule | Issue a new W4 contract version; preserve v1 receipts as historical candidate evidence |
| Cross-language scope | Python/Rust support promise is narrowed or implementations change | State witness-only status or version native APIs/receipts when parity is added |
| Compiled distribution and one lock | npm/tsx source workflows stop being supported release paths | Keep development instructions separate; provide one owner-selected install/build/upgrade path |
| Retention/redaction | Some process/snapshot details can no longer be persisted | Version evidence formats and preserve referential integrity during redaction/supersession |
| Cache exclusion | Frozen aggregate changes | New confirmed selector, freeze, attacker rerun, and verifier/audit cycle |

## Residual-risk ledger

| Residual risk | Current evidence | Required next evidence | Current disposition |
| --- | --- | --- | --- |
| Independent finding falsification | Popper FIX 10/7/0 and Meadows FIX 12/5/0; loop-2 changes applied | Final auditor checks the revised artifacts and bindings | Await final audit |
| Coverage/claim audit | Not yet run | Final auditor ACCEPT or bounded revision | BLOCK review close |
| Owner authorization | No reviewed exact G0/R2 binding establishes the shortlist; no G1/G2 is available to this review | Exact external owner receipts | BLOCK release |
| Clean/current CI | No clean checkout or enforced workflow | Two-root build plus required status | BLOCK candidate |
| Package-manager choice | Unresolved npm/pnpm/locks | Owner decision and frozen lock | BLOCK build command |
| Cross-host/platform | Same-host only | Reproduction on every promised environment | DEFER breadth; one environment may be selected |
| Crash/lock recovery | No process-kill matrix | SIGKILL/race/recovery campaign | DEFER factory |
| Security/dependency/SBOM | No current owned audit | Threat/data-flow review and dependency evidence | Required for narrow CLI at bounded scope |
| Resource/performance | No contract or benchmark | Boundary/over-bound measurements | BLOCK operator claim |
| Operator/support | Not evidenced for the proposed CLI by this frozen corpus | Independent green/red pilot plus support handoff and withdrawal drill | BLOCK release |
| Persisted-format future handling | W3/W4 shallow decode is verified; other surface campaigns remain open | Selected CLI matrix gates shortlist; factory/minted/W3/W4 matrices gate only their reopen | BLOCK selected stable format contracts |
| W3/W4 semantics | Owner decision absent; ghost event reproduced | Selected contract and full fault matrix | DEFER runtime plane |
| Product integration | Evidence closure blocks | Exact owner-selected integration contracts | DEFER |
| Inventory completeness | Root Inventory partial; consumer index missing | Direct source remains primary; optional local index refresh | Non-authoritative discovery residue |
| Corpus cache contamination | Fully enumerated and byte-stable | New confirmed exclusion and rerun | MINOR current; required next freeze |
| Drift after attacker work | Parent recheck passes | Recheck again after any acceptance-bound source change | Closed for current synthesis bytes only |

## Candidate shortlist for a possible first stable slice

The two-command direction is a plausible shortlist, not a proved minimum and not a current coherent artifact. Current frozen behavior has four immediate defects against the shortlist:

- stdout `receipt` returns 0 before considering parser violations;
- target resolution silently falls back from a missing explicit path to a sibling feature checkout;
- execution is TypeScript source through `tsx`, not a selected release artifact; and
- the available profile is experimental with release admission denied.

### Candidate contract, not current behavior

- Artifact/runtime form: owner must choose either a self-contained executable or compiled JavaScript with an externally required, exactly pinned Node runtime. “Compiled executable” and “requires Node” may not be claimed simultaneously.
- Environment: one owner-selected OS/architecture tuple plus the selected artifact/runtime form.
- Input: one explicit existing feature directory under one exact owner-ratified structural profile.
- Supported commands:
  - `domainspec-v2 lint <explicit-feature-directory>`
  - `domainspec-v2 receipt <explicit-feature-directory>`
- Writes: none by the executable. `receipt` writes only to stdout; shell redirection remains caller-owned.
- Receipt meaning: one closed, machine-checkable, structural `authority_effect: none` receipt. It must explicitly deny ontology admission, implementation conformance, promotion, production stability, publication, release, and deployment.
- Output: exactly one closed JSON document on every declared `receipt` exit. Stdout, stderr, and partial-output behavior must be specified separately; an internal/resource failure must never leave success-looking partial JSON.
- Exit contract: at minimum 0 for structurally accepted input, 1 for CLI usage, 4 for structural/formal violations, and separately owned stable codes for profile, version, path, resource, and internal failures. The current unconditional stdout-receipt exit 0 must be replaced.
- Stability promise: command names, explicit-path behavior, input-profile identity, receipt/diagnostic schemas, stdout/stderr rules, exit classes, deterministic normalized output, compatibility window, support, and withdrawal.
- Acceptance binding: any selected profile, meta-type set, runtime, or dependency change invalidates the exact acceptance binding and requires fresh validation and owner acceptance.

### Dependency order

1. Owner issues G0 and selects whether this two-command shortlist is the target, plus exact profile, environment, support scope, compatibility duration, and exclusions.
2. Owner selects one package manager, one lock boundary, resolved build-script policy, and either a self-contained executable or compiled JavaScript with one pinned Node runtime.
3. Curate tracked source/dependency bytes and define generated release staging; exclude caches through a newly confirmed selector.
4. Remove sibling/fallback resolution, require an explicit existing directory, and make stdout `receipt` exit reflect structural violations.
5. Close/profile-bind parser inputs and version structural authority-none receipt/diagnostic schemas, including stdout/stderr/partial-output behavior and decoders.
6. Build the selected artifact/runtime form from a clean arbitrary path.
7. Run positive, negative, malformed, future-version, partial-output, security/redaction, resource, deterministic-output, and no-write tests.
8. Rebuild from a second clean arbitrary path and compare artifact and normalized receipt hashes.
9. Freeze the RC manifest and an acceptance binding that invalidates on profile, meta-type, runtime, or dependency change; independently verify and enforce both in CI.
10. Run an independent green/red operator pilot and support handoff, then obtain G1 claim acceptance and G2 authorization for the exact bits/channel/support package.

### Owner decisions still required

- Exact input profile/dialect and whether binding sidecars are part of it.
- Package manager and authoritative lock.
- Self-contained executable versus compiled JavaScript with pinned external Node, plus the exact OS/architecture support tuple.
- Binary/package name and release channel.
- Structural authority-none receipt and diagnostic schema identities, including stdout/stderr/partial-output behavior.
- Compatibility/deprecation duration and migration policy.
- Security/data classification, redaction, dependency, and support owners.
- Input/resource/performance limits.
- Hotfix, rollback, withdrawal, and evidence-retention policy.

### Candidate acceptance commands

These commands define a future acceptance contract for the shortlist. `./domainspec-v2` is a placeholder for whichever artifact/runtime form the owner selects, not a current verified binary.

| Command | Required result |
| --- | --- |
| `./domainspec-v2 lint ./acceptance/green-feature` | Exit 0; versioned clean diagnostic |
| `./domainspec-v2 lint ./acceptance/noncanonical-feature` | Exit 4; stable non-canonical code/pointers |
| `./domainspec-v2 lint ./acceptance/needs-formal-feature` | Exit 4; stable needs-formal code/pointers |
| `./domainspec-v2 receipt ./acceptance/green-feature > ./run/actual-green.json` | Exit 0; closed-schema versioned receipt |
| `./domainspec-v2 receipt ./acceptance/noncanonical-feature > ./run/actual-red.json` | Exit 4; valid receipt plus stable violation codes |
| `cmp ./acceptance/expected-green.json ./run/actual-green.json` | Exit 0 after documented normalization |
| Fault/resource-kill receipt probes with stdout and stderr captured separately | No success-looking partial JSON; exactly one closed receipt only on declared receipt exits |
| `./domainspec-v2 lint financial-settlement` | Exit nonzero; feature-name fallback is not part of stable v1 |
| `./domainspec-v2 receipt ./acceptance/green-feature --out` | Exit nonzero; write flag unsupported |
| `find ./acceptance ./run -newer ./run/start.marker -type f` plus declared-output check | No executable-created files outside caller-owned stdout capture |
| Exact command in `PARENT-DRIFT-VERIFY-RECEIPT.json` against the curated RC manifest | Exit 0; identical aggregate; no added/removed/changed |
| `sha256sum <clean-root-a-artifact> <clean-root-b-artifact>` | Equal artifact digest |
| Repeat the acceptance-binding validator after one profile, meta-type, runtime, and dependency mutation | Every mutation invalidates prior acceptance and requires fresh owner ratification |

There is intentionally no final install/build command yet. Selecting npm or pnpm would exceed the evidence and owner authority because current bytes conflict. CR-13 must close before an exact release build command can be admitted.

### Current diagnostic commands that remain evidence, not release admission

- `npm --prefix projects/domainspec-v2/impl run validate`
- `npm --prefix projects/domainspec-v2/impl run typecheck`
- `npm --prefix projects/domainspec-v2/impl run engine:test`
- `npm --prefix projects/domainspec-v2/impl run factory:test`
- `python3 -m unittest -v test_w3.py test_w4.py`
- `cargo test --locked --offline --test w3 --test w4`

The npm commands reflect current scripts, not a selected package-manager authority. The W3/W4 and factory commands concern excluded/internal surfaces.

### Explicit exclusions

- `roundtrip`, `derive`, `derive --out`, `check`, `emit-tests`, `receipt --out`, and all factory commands as supported v1 APIs.
- Architecture/meta-type realization, ontology admission/promotion, and all remaining-meta-type candidate claims.
- W3 Operation/Interface/Event/Mapping and W4 Workflow/StateMachine runtime semantics.
- Python/Rust support or cross-language parity.
- UI, accessibility, stable SDK/import API, hosted service, public distribution, deployment, central telemetry, SLOs, backup, and production operations.
- Code generation, external integration, database/event-bus/API/webhook/projection claims.
- Saturn/runtime-convergence claims and cross-repository inheritance.
- Broad formal correctness, exactly-once delivery, cross-host, or cross-platform claims unless separately selected and evidenced.
- `cargo-target`, ignored `dist` copies, and archived run snapshots from future product/source manifests.

## Overall verdict

- Current whole implementation: DEFER as a production-stable baseline.
- Canonical inputs and negative comparators: KEEP.
- Narrow TypeScript structural parser/derive core and read-only `lint`/stdout `receipt`: retain as an owner-gated candidate shortlist; no current minimum/coherent artifact is proved.
- Formation authority, decoders, exact bindings, build, diagnostics, and lifecycle projection: REPLACE/HARDEN as specified.
- Generic factory: KEEP/HARDEN as internal evidence infrastructure, not v1 product API.
- Meta-type realizations, W3/W4, Python/Rust, system integration, UI/SDK/hosted/public surfaces: DEFER.
- Generated caches from future release/evidence manifests: KILL from scope, without deleting current accepted evidence.

Review acceptance, if later granted, will mean only that these findings are sufficiently covered, evidence-bound, and claim-disciplined. It will not accept implementation bytes or establish production readiness, publication, release, or deployment.
