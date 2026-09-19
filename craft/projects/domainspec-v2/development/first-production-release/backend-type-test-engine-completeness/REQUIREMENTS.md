---
artifact: invoke-requirements
status: candidate-complete-plan-traced
updatedAt: 2026-07-23
owner: DomainSpec-v2 backend-type-test-engine-completeness
semanticAuthority: none
sourceDefine: DEFINE.md
---

# Requirements: Backend Graph Composability And Test Derivation

## Status Vocabulary

| Status | Meaning |
| --- | --- |
| `required` | accepted proof requirement; implementation/evidence may still be missing |
| `decision-blocked` | requirement is known, but its contract cannot be designed until a named human decision exists |
| `decision-resolved` | the human choice is recorded; downstream design/proof requirements remain open |
| `admission-blocked` | proof may be planned, but its exact profile scope is not yet admitted by the owning authority |
| `deferred` | explicitly outside this bounded backend structural claim |
| `satisfied-narrowly` | existing evidence proves only the stated narrow behavior and cannot close the broader requirement |

This file is a planning contract, not a machine semantic source. `Status` never
means implemented unless the evidence column names a current receipt.

## Acceptance Equation

For each required proof catalogue, acceptance requires a nonempty exact
coverage-key set:

```text
Set(O_spec.coverage_key)
  = Set(O_gen.coverage_key)
  = Set(TestCase.coverage_key)
  = Set(ExecutionResult.coverage_key)
  = Set(primary MutationResult.coverage_key)
```

Every required key occurs exactly once in the TestCase, ExecutionResult, and
primary MutationResult projections; positive, negative, and mutation roles
remain internal to their one TestCase bundle. ProofReceipt and ReplayResult
scopes may partition a catalogue only when the scopes are explicit,
non-overlapping, and their exact recomposition equals the required coverage-key
set. Counts are diagnostic only. The comparator must reject missing, extra,
duplicate, stale, empty, overlapping, incompatible, orphan, unrunnable,
skipped, todo, unsupported-without-typed-residue, and surviving-mutant entries.

## Authority And Versioning

| ID | Requirement | Status | Audit link | Future evidence/owner |
| --- | --- | --- | --- | --- |
| `DSV2-BTE-R-AUTH-001` | Machine claims must resolve to versioned YAML/JSON/code, an owner decision, or a receipt. Markdown, research, audit, Inventory, generated views, and literal pass fields cannot supply semantic authority. | required | claim boundary; `GAP-026`, `GAP-027` | source map plus authority-boundary tests; DomainSpec owners |
| `DSV2-BTE-R-AUTH-002` | Keep `D_kind=13`, `D_form=16`, and candidate `D_rel=16` as separate named sets with independent owners, versions, admissions, and receipts. | required | `GAP-002`, `GAP-004`, `GAP-020` | denominator manifests and exact-set tests; profile/relationship/validation owners |
| `DSV2-BTE-R-AUTH-003` | Apply accepted `DEC-BTE-FORMATION-AUTHORITY-001`: Design a distinct versioned YAML-owned replacement with explicit JSON retirement and compatibility/migration proof; do not change current v1 in place. | decision-resolved | `GAP-029` | accepted decision record; formation-contract owner |
| `DSV2-BTE-R-AUTH-004` | Current-v1 and any successor profile must have distinct IDs, versions, source layouts, contracts, fixtures, digests, receipts, and admission states. | required | `GAP-002`, `GAP-029` | profile schemas, migration/compatibility fixtures, receipts; profile owner |
| `DSV2-BTE-R-AUTH-005` | Profile, kind registry, relationship registry, formation schema, criterion, kernel, and adapter identities/versions/digests must propagate through compiler output, graph, obligations, tests, bindings, results, receipts, and replay. | required | `GAP-005` | digest-chain negative controls; compiler/evidence owners |
| `DSV2-BTE-R-AUTH-006` | A source or governing-contract byte change must invalidate all stale downstream bindings and receipts and reopen the affected denominator. | required | `GAP-005`, `GAP-018`, `GAP-022` | mutation/replay tests; evidence owner |
| `DSV2-BTE-R-AUTH-007` | The L0 machine contract set and closed diagnostic registry must be published with exact digests before the independent validation owner authors or freezes red cases. Contract publication emits no `ValidationReceipt`; semantic execution starts only from the unchanged publication receipt plus a matching validation-owner freeze. | required | `GATE-BTE-L0-BOOTSTRAP`, `GATE-BTE-L0-FREEZE` | L0A contract-publication receipt, independent red manifest/freeze, then L0B ValidationReceipt; BTE contract and validation owners |

## Formation And Compiler Parity

The exact current criterion catalogue is:

| Kind | Criterion IDs |
| --- | --- |
| Entity | `identity`, `typedness` |
| Value Object | `no_identity`, `typedness`, `equality` |
| Enum | `value_table` |
| Operation | `writes_state` |
| Query | `read_only` |
| Calculation | `returns_value` |
| Rule | `boolean_predicate` |
| Policy | `selects_strategy` |
| Workflow | `admitted_scope` |
| Interface | `declares_boundary` |
| Event | `past_tense` |
| Mapping | `has_direction` |
| State Machine | `has_transitions` |

`typedness` occurs in two governing schema contexts. Exact obligation IDs must
therefore include kind/schema identity rather than deduplicating by display
name.

| ID | Requirement | Status | Audit link | Future evidence/owner |
| --- | --- | --- | --- | --- |
| `DSV2-BTE-R-FORM-001` | The admitted profile kind set must equal the exact 13 active backend member IDs/terms, exclude UI and superseded IDs, and bind every member to one existing criterion schema digest. | required | `GAP-002`, `GAP-030` | successor profile contract and exact-set fixture; profile owner |
| `DSV2-BTE-R-FORM-002` | The compiler must execute a positive and a discriminating negative for every one of the exact 16 kind-scoped criterion identities, not merely one example per rule form. | required | `GAP-030` | compiler-path catalogue, executions, receipts; compiler/test owners |
| `DSV2-BTE-R-FORM-003` | The admitted replacement path must reject `{"fields":[{"type":7,"identity":"yes"}]}` as Entity and record the governing YAML contract, retired JSON constraint mapping, migration disposition, and digests. | required | `GAP-029` | compiler negative fixture, migration map, and receipt; formation/compiler owners |
| `DSV2-BTE-R-FORM-004` | Every schema's literal `required_structure` must be evaluated at the compiler path and preserved as a stable obligation with missing-column/section negative controls. | required | `GAP-006` | exact 13-schema structure executions; kernel/compiler owners |
| `DSV2-BTE-R-FORM-005` | Interface `interface_kind` must accept only the owner-admitted closed domain, including at least the declared `external`/`internal` distinction, and reject other nonempty values. | required | `GAP-007` | criterion revision/decision plus compiler negatives; definitions/compiler owners |
| `DSV2-BTE-R-FORM-006` | Mapping `direction` must accept only the owner-admitted closed domain and reject other nonempty values. | required | `GAP-007` | criterion revision/decision plus compiler negatives; definitions/compiler owners |
| `DSV2-BTE-R-FORM-007` | Value Object equality must be a structural declaration with a decidable contract; substring presence of `equal` is insufficient. | required | `GAP-008` | versioned criterion and discriminating negatives; definitions/compiler owners |
| `DSV2-BTE-R-FORM-008` | The current shared criterion kernel and minted body adapter receipts remain valid only for their proven rule-form/adapter behavior; they do not close current-v1 JSON compatibility or exact-16 compiler parity. | satisfied-narrowly | fixed old `GAP-009`; `GAP-029`, `GAP-030` | preserved `SWU-BTE-001` and `SWU-BTE-003` receipts |

## Graph And Relationship Formation

| ID | Requirement | Status | Audit link | Future evidence/owner |
| --- | --- | --- | --- | --- |
| `DSV2-BTE-R-GRAPH-001` | A successor profile may claim the 16 selected backend relationship families only after the profile and relationship owners record exact admission. | admission-blocked | `GAP-004` | admission decision and profile digest; owners |
| `DSV2-BTE-R-GRAPH-002` | Authored edge sources must have a versioned machine schema and source layout independent of generated graph rows; exact same-feature and cross-feature roots remain explicit. | required | `GAP-012` | edge/source-root schemas and resolver tests; source-contract owner |
| `DSV2-BTE-R-GRAPH-003` | Edge admission must reject absent endpoints, wrong endpoint kinds, unadmitted root/scope/direction, duplicate IDs, and stale source digests. | required | `GAP-013` | typed resolver/compiler negatives; graph owner |
| `DSV2-BTE-R-GRAPH-004` | For every admitted family, proof must show positive composition plus removal or typed negative evidence that demonstrates the family has a causal, non-collapsed effect. | admission-blocked | `GAP-004`, `GAP-013`, `GAP-024` | selected family catalogue, positives, removals, receipts; relationship/test owners |
| `DSV2-BTE-R-GRAPH-005` | `orchestrates` must preserve and replay target order/ordinal; set equality alone is insufficient. | required | `GAP-014` | ordered-edge fixtures and replay; graph owner |
| `DSV2-BTE-R-GRAPH-006` | Multiplicity and inverse obligations enter the proof set only when the relationship owner explicitly selects them; the 21/29 derived expansions cannot silently enlarge `D_rel`. | admission-blocked | `GAP-004`, `GAP-013`, `GAP-024` | admission disposition; relationship owner |
| `DSV2-BTE-R-GRAPH-007` | The canonical minted graph and source manifest must feed the BTE derivation entrypoint. A parallel feature-document/Markdown-only graph cannot establish minted-project completeness. | required | `GAP-016` | graph adapter and causal empty-derivation negative; engine owner |
| `DSV2-BTE-R-GRAPH-008` | FPR-02 Resolved Decision 9 requires an exact 13-row owner-selected node-pattern catalogue. Every admitted backend kind must name one active node-to-pattern binding, canonical witness selector, deterministic implementation-obligation or output-contract identity, expected effect, and causal removal delta; catalogue, TestCase, primary mutation, receipt, and independent replay evidence must preserve that exact selection. | admission-blocked | FPR-02 Resolved Decision 9; `BTE-RFR-001` | node-pattern selection/admission handle, 13 exact causal proof units, and catalogue ReplayResult; node-pattern and validation owners |

## Obligation And Test Derivation

| ID | Requirement | Status | Audit link | Future evidence/owner |
| --- | --- | --- | --- | --- |
| `DSV2-BTE-R-DERIVE-001` | A validation owner independent of the generator must freeze a nonempty exact `O_spec` catalogue with stable IDs, governing source/criterion/rule identities, digests, and source anchors. | required | `GAP-017`, `GAP-020` | machine catalogue and validator receipt; validation owner |
| `DSV2-BTE-R-DERIVE-002` | Derivation from the canonical graph must produce deterministic `O_gen` IDs and exact source anchors and must fail if the graph, profile, or governing digest is missing/stale. | required | `GAP-005`, `GAP-016`, `GAP-017` | deterministic derivation and digest mutation tests; engine owner |
| `DSV2-BTE-R-DERIVE-003` | Exact-set comparison must prove `O_spec = O_gen` by stable identity and report every missing, extra, duplicate, or mismatched entry. | required | `GAP-017`, `GAP-020` | comparator tests and receipt; validation owner |
| `DSV2-BTE-R-DERIVE-004` | Every `O_gen` entry must emit exactly the required executable `TestCase`; an empty suite cannot coexist with a passing completeness receipt. | required | `GAP-019`, `GAP-020` | emitter negatives and aggregate checks; engine/test owners |
| `DSV2-BTE-R-DERIVE-005` | `needs_formal`, unsupported, skip, todo, orphan, and unrunnable states must be preserved as typed residue and fail any claim whose required set includes that item. | required | `GAP-019`, `GAP-020`, `GAP-021` | seeded residue controls; test/evidence owners |
| `DSV2-BTE-R-DERIVE-006` | `DEC-GCP-001` governs only the Rule predicate used by the optional key-and-door semantic fixture. It cannot block structural formation, graph, or non-Rule compiler work. | decision-blocked | `GAP-011` | accepted decision or explicit deferral; EVF semantic owner |

## Binding, Evaluation, Execution, And Mutation

| ID | Requirement | Status | Audit link | Future evidence/owner |
| --- | --- | --- | --- | --- |
| `DSV2-BTE-R-RUN-001` | Every required test role must resolve to exactly one role-typed binding whose test, fixture, adapter, runtime, graph, profile, schema/criterion, and evaluator digests are compatible. | required | `GAP-018` | binding schema, ambiguity/empty/stale negatives; binding owner |
| `DSV2-BTE-R-RUN-002` | First-match, empty-match, untyped, duplicate, and stale bindings must fail before execution. | required | `GAP-018` | resolver controls; binding owner |
| `DSV2-BTE-R-RUN-003` | Every selected formation criterion and admitted relationship causal effect must have an evaluator independent from the generator output being measured. | required | `GAP-021` | evaluator registry/contracts and cross-checks; evaluator owner |
| `DSV2-BTE-R-RUN-004` | Evaluator scope must be explicit (`structural`, `local`, `graph`, `temporal`, or `semantic`) and unsupported scopes must produce blocking residue rather than invented pass. | required | `GAP-021` | evaluator schema and unsupported-scope negative; evaluator owner |
| `DSV2-BTE-R-RUN-005` | Every required test must run and produce an `ExecutionResult` bound to the exact test, binding, evaluator, fixture, source, and governing-contract digests. | required | `GAP-019`, `GAP-022` | runnable suite and execution receipts; runner owner |
| `DSV2-BTE-R-RUN-006` | Each selected obligation/family negative must have a stable mutant ID, execute against the same governed path, and be killed; surviving or unexecuted mutants fail the set. | required | `GAP-024` | mutation catalogue/results and seeded survivor; test owner |

## Receipts, Replay, And Aggregates

| ID | Requirement | Status | Audit link | Future evidence/owner |
| --- | --- | --- | --- | --- |
| `DSV2-BTE-R-EVID-001` | A receipt must join source, profile, schema/criterion or relationship, graph, obligation, test, binding, evaluator, execution, mutation, and aggregate identities/digests as applicable. | required | `GAP-005`, `GAP-022` | receipt schema and complete positive chain; evidence owner |
| `DSV2-BTE-R-EVID-002` | Independent replay must recompute joins, digests, exact sets, verdict scope, and required-check presence from raw artifacts without trusting producer summaries. | required | `GAP-022` | replay tool plus tampered/stale negatives; replay owner |
| `DSV2-BTE-R-EVID-003` | `verify:bte:core` must fail closed over exact required source, compiler, graph, obligation, binding, evaluator, execution, mutation, and replay evidence. | required | `GAP-023` | core required-check manifest, command, seeded red controls; integration owner |
| `DSV2-BTE-R-EVID-004` | `verify:bte:consumers` must fail closed over exact fresh IOLM and Body War receipt handles produced after the accepted core run. | required | `GAP-023`, `GAP-025`, `GAP-027` | consumer manifest/command and red controls; integration owner |
| `DSV2-BTE-R-EVID-005` | Terminal `verify:bte` must compose the exact core and consumer aggregates and reject missing, empty, stale, extra, duplicate, skipped, todo, self-asserted, and surviving-mutant evidence. | required | `GAP-020`, `GAP-023`, `GAP-026` | terminal command and seeded failures; integration owner |
| `DSV2-BTE-R-EVID-006` | Receipts are non-admitting evidence. No test or consumer pass may change profile, relationship, FPR, release, production, or publication state. | required | claim boundary; `GAP-026` | receipt metadata and promotion-boundary checks; lifecycle owners |

## Consumer Proof

| ID | Requirement | Status | Audit link | Future evidence/owner |
| --- | --- | --- | --- | --- |
| `DSV2-BTE-R-CONS-001` | IOLM must run a consumer-owned adapter/runner and independently prove unchanged IDs, relation direction, provenance, semantic bytes, deterministic rebuild, view hashes, and graph/hierarchy/table parity. | required | `GAP-025` | versioned contract/schema, runner, fresh receipt and replay; IOLM owner |
| `DSV2-BTE-R-CONS-002` | IOLM's required-check schema must include `graph_hierarchy_table_get_parity`; digest-shaped handles and literal pass fields without independent recomputation must fail. | required | `GAP-025` | schema and negative fixtures; IOLM owner |
| `DSV2-BTE-R-CONS-003` | The integrated manifest may report 13/16 only from exact accepted core and fresh consumer receipts; pending or self-authored receipt handles cannot satisfy it. | required | `GAP-026` | manifest validator and red controls; integration owner |
| `DSV2-BTE-R-CONS-004` | Body War must replace its Markdown `source_contract` with a versioned machine contract, JSON/YAML schema, consumer-owned runner, fresh receipt, and independent replay path. | required | `GAP-027` | machine package and fresh run; Body War owner |
| `DSV2-BTE-R-CONS-005` | IOLM and Body War remain downstream consumers and cannot define DomainSpec criteria, graph truth, obligations, evaluators, or release admission. | required | `GAP-025`–`GAP-027` | authority-boundary assertions; core/consumer owners |

## Compatibility And Non-Regression

| ID | Requirement | Status | Audit link | Future evidence/owner |
| --- | --- | --- | --- | --- |
| `DSV2-BTE-R-COMPAT-001` | Preserve current-v1 proven facts: four declared kinds, three relations, deterministic generated views, cross-feature rejection, and explicit non-admission. | required | audit narrow current-v1 `KEEP` | compatibility suite; compiler owner |
| `DSV2-BTE-R-COMPAT-002` | Preserve completed `SWU-BTE-001` and `SWU-BTE-003` identities and receipts; later work may extend but must not rewrite their historical claims. | required | fixed old `GAP-009`; refresh obligation | historical receipts plus regression tests; BTE owner |
| `DSV2-BTE-R-COMPAT-003` | Tool `147/147`, engine `107/107`, and typecheck passing remain regression baselines only, never evidence of contract completeness. | required | audit test baseline | baseline plus new targeted evidence; validation owner |
| `DSV2-BTE-R-COMPAT-004` | UI and backend execution, evidence, blockers, and admissions remain separate lanes. | required | lane decision | dispatch/dependency checks; FPR owners |

## Explicit Non-Requirements

The following are `deferred`, not hidden acceptance criteria:

- all 30 relationship signatures or UI/cross-layer signature proof;
- business correctness or semantic satisfiability of arbitrary domain rules;
- cross-graph theorem proving, temporal verification, or universal solver
  selection;
- production, publication, or FPR release promotion;
- consumer product UX or UI admission;
- expanding 16 relationship families to 21/29 variants without a new owner
  decision and regenerated exact denominator.

## Surviving-Gap Coverage Check

| Audit gap | Requirement coverage |
| --- | --- |
| `GAP-002` | `AUTH-002`, `AUTH-004`, `FORM-001` |
| `GAP-004` | `AUTH-002`, `GRAPH-001`, `GRAPH-004`, `GRAPH-006` |
| `GAP-005` | `AUTH-005`, `AUTH-006`, `DERIVE-002`, `EVID-001` |
| `GAP-006` | `FORM-004` |
| `GAP-007` | `FORM-005`, `FORM-006` |
| `GAP-008` | `FORM-007` |
| `GAP-011` | `DERIVE-006` |
| `GAP-012` | `GRAPH-002` |
| `GAP-013` | `GRAPH-003`, `GRAPH-004`, `GRAPH-006` |
| `GAP-014` | `GRAPH-005` |
| `GAP-016` | `GRAPH-007`, `DERIVE-002` |
| FPR-02 Resolved Decision 9 / `BTE-RFR-001` | `GRAPH-008` |
| `GAP-017` | `DERIVE-001`–`DERIVE-003` |
| `GAP-018` | `RUN-001`, `RUN-002` |
| `GAP-019` | `DERIVE-004`, `DERIVE-005`, `RUN-005` |
| `GAP-020` | acceptance equation, `AUTH-002`, `DERIVE-003`–`DERIVE-005`, `EVID-005` |
| `GAP-021` | `DERIVE-005`, `RUN-003`, `RUN-004` |
| `GAP-022` | `AUTH-006`, `RUN-005`, `EVID-001`, `EVID-002` |
| `GAP-023` | `EVID-003`–`EVID-005` |
| `GAP-024` | `GRAPH-004`, `GRAPH-006`, `RUN-006` |
| `GAP-025` | `CONS-001`, `CONS-002`, `CONS-005` |
| `GAP-026` | `AUTH-001`, `EVID-005`, `EVID-006`, `CONS-003` |
| `GAP-027` | `AUTH-001`, `EVID-004`, `CONS-004`, `CONS-005` |
| `GAP-029` | `AUTH-003`, `AUTH-004`, `FORM-003` |
| `GAP-030` | `FORM-001`, `FORM-002` |

Old `GAP-009` remains fixed. `GAP-028` remains repaired/non-surviving.
`GAP-003`, `GAP-010`, and `GAP-015` remain dropped; this file does not revive
them.
