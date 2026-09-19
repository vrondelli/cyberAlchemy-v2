# Attack return — Lawvere, F. William

Dispatch: `2026-07-20-evf-implementation-completion-review`
Attack lens: implementation reuse, typed graph/signature/composition/property-test/build patterns
Evidence boundary: frozen 61-file v2 corpus plus pinned 111-commit Lean window

## Verdict

`FIX` for implementation-completion claims. The Lean window contains useful test/build disciplines but no executable DomainSpec v2 graph-to-receipt implementation. A short-term implementation remains defensible only if it is a narrow S1 adapter with a real authored predicate, a count-preserving semantic mutant, a replay-verifiable typed receipt, and a named aggregate command. Importing the Lean language/merge/governance models would increase analogy and coupling without closing the actual seam.

## Stable findings

### LAW-1 — The language capability tower is not a DomainSpec DSL

- **File/symbol:** Lean `40cb1d8`, `lean-formalization/LanguageFunctorialSemantics.lean::{Syn,M,meaning_compositional}`; `LanguageAsChannel.lean::Channel`; `LambekResidual.lean::rres`; `DisCoCatMini.lean::Reduces`.
- **Literal evidence:** `LanguageFunctorialSemantics.lean` says it is a “capability / MAP artifact,” “no novelty is claimed,” and “does not license any claim about a running system.” `LanguageAsChannel.lean` says language is an instance with a structured source, not a proven ordering. `DisCoCatMini.lean` says the full semantic functor is not built.
- **Severity:** `MAJOR` if used as implementation evidence; otherwise an explicit rejection.
- **Proposed v2 code/test change:** none. Keep the S1 adapter grounded in `relationships.yml`, minted graph JSON, and the selected formal predicate source. Do not add a Lean or categorical-language dependency.
- **Dependency:** DEC-GCP-001 must choose the formal predicate source; no language theorem resolves it.
- **Command:** `cd domainspec-lean-formalization/lean-formalization/files && lake build LanguageFunctorialSemantics LanguageAsChannel LambekResidual DisCoCatMini` validates only those models.
- **Challenge to a short-term one-off:** if an implementation labels a free-path toy category or channel composition “the DomainSpec DSL,” require the exact parser, profile-admission, normalization, and emitted-test consumer. None exists in the frozen S1 path.

### LAW-2 — The corpus typed-graph proposal is weaker than the current v2 machine contract for L0

- **File/symbol:** Lean `142544e`, `experiments/corpus-typed-graph-schema/proposal.md` §§1–6 (`G=(V,E,τ,λ)`, `σ`, R1–R4, open Lean-vs-generated fork).
- **Literal evidence:** the proposal begins, “Nothing here is validated,” requires family-S edges to be generated from `.lean` source, and leaves “Lean-typed vs generated-doc” open. Current v2 already has `relationships.yml`, `node.schema.json`, `connection.schema.json`, `graph.schema.json`, compiled key-and-door graph/source manifest, and executable endpoint mutations.
- **Severity:** `MAJOR` if adopted into S1; `MINOR` as deferred L2 prior art.
- **Proposed v2 code/test change:** do not port the corpus node vocabulary. For L0, add only a minted-graph adapter that consumes the existing v2 graph/signature authority and emits one `enforces` obligation. Reserve evidence-ref closure/forbidden composites for `TASK-GCP-GRAPH-LAWS`.
- **Dependency:** DEC-GCP-001 and an explicit repair of the legacy `enforces` direction (`src/ir/types.ts` currently says `Operation -> Invariant`, while v2 says `Rule -> Operation`).
- **Command:** `npm --prefix projects/domainspec-v2/impl run validate:rels && npm --prefix projects/domainspec-v2/impl run engine:test`.
- **Challenge to a short-term one-off:** do not create a second graph model merely to make the key-and-door fixture pass. The adapter must preserve current node IDs, edge IDs, signature direction, source anchors, and digests.

### LAW-3 — The green baseline does not execute S1; target inclusion must become explicit

- **File/symbol:** Lean `29400ed`, `.github/workflows/lean-build.yml::jobs.build`; `162133a` and `9a9c162`, `lean-formalization/files/lakefile.toml` target repairs. v2 `projects/domainspec-v2/impl/package.json#scripts`.
- **Literal evidence:** Lean CI says bare `lake build` covers 137 default targets, not all 358 registered libraries, and that green proves neither absence of `sorry` nor axiom cleanliness. The frozen v2 baseline likewise says 107 tests “does not establish the planned graph-to-receipt vertical slice.” There is no S1 command in `impl/package.json`.
- **Severity:** `MAJOR`.
- **Proposed v2 code/test change:** add `graph:proof` to `impl/package.json`; make it run the focused graph-proof test, `validate:rels`, `engine:test`, and `typecheck`. Add a control that fails when the S1 receipt/test target is missing or empty. Wire the focused test into the normal engine suite as well.
- **Dependency:** the S1 adapter/receipt test file must exist; DEC-GCP-001 controls whether the positive semantic assertion can be generated.
- **Command:** `npm --prefix projects/domainspec-v2/impl run graph:proof`.
- **Challenge to a short-term one-off:** a manually runnable script, orphan fixture, or report file is not implementation completion. The named target must be invoked by the ordinary required-check surface.

### LAW-4 — S1 needs a count-preserving semantic mutant, not another cardinality assertion

- **File/symbol:** Lean `31f1370`, `lean-formalization/DiamondResidueInvariantFactors.lean::{card_pushout_eq,no_addEquiv_pushout}`; reinforced by `f464b48`, `DecisionTraceResidue.lean::{decisions_count_equal,trace_class_distinct}`. v2 `conformance.test.ts::{compileMutation,runCase}` and key-and-door `expected/graph.json`.
- **Literal evidence:** the Lean witness pairs have equal cheap counts while a richer invariant separates them. Current v2 conformance asserts key-and-door has 4 nodes and 3 edges and has endpoint mutants, but it does not run the `HasKeyRule --enforces--> UnlockDoor` edge through obligation, binding, assertion, evaluator, and receipt.
- **Severity:** `MAJOR`.
- **Proposed v2 code/test change:** add `src/minted-project/graph-proof.test.ts` with a mutant that keeps 4 nodes/3 edges and stable unrelated sources while changing/removing/reversing the `enforces` edge. Require a stable typed failure or changed receipt verdict, and prove the positive and mutant receipts differ for the semantic reason rather than only source digest drift.
- **Dependency:** minted-graph adapter, governed signature lookup, and the chosen formal source/binding.
- **Command:** `npm --prefix projects/domainspec-v2/impl exec -- vitest run test-derivation-engine/src/minted-project/graph-proof.test.ts -t "kills count-preserving enforces mutant"`.
- **Challenge to a short-term one-off:** a fixture-count assertion or raw digest mismatch can pass while composition semantics are absent. The mutant must reach the evaluator and fail on the governed relation/predicate.

### LAW-5 — Missing formal semantics is a negative result, not an allowed placeholder

- **File/symbol:** Lean `12b7dea`, `AsymmetricTowerHRigidity.lean`: false `aut_fixes_all` retired, true base case `aut_fixes_all_one` retained, counterexample `h9_false_at_two'` registered. v2 `src/emit/tests.ts::{emitSkip,propertyStandsInForMissingValue,emitHybridTests}` and DEC-GCP-001.
- **Literal evidence:** the Lean commit says a false goal is not an open proof task. The v2 Rule source contains only `formal_return_type: boolean`; the decision record says deriving an expected value now would invent semantics. The emitter already counts `needs_formal` and co-emits a gap when a property merely stands in for a missing value.
- **Severity:** `CRITICAL` if a passing S1 receipt is emitted without an authored predicate; otherwise `MAJOR` missing acceptance control.
- **Proposed v2 code/test change:** add a receipt state/code such as `blocked / FORMAL_PREDICATE_MISSING`; test that the unchanged fixture cannot produce `status: pass`, `coverageGaps: 0`, or an executable semantic verdict. Once option 1 or 2 is selected, add the positive authored predicate and retain this missing-source case as a red control.
- **Dependency:** DEC-GCP-001. This finding does not choose for the user.
- **Command:** `npm --prefix projects/domainspec-v2/impl exec -- vitest run test-derivation-engine/src/minted-project/graph-proof.test.ts -t "blocks when formal predicate is absent"`.
- **Challenge to a short-term one-off:** do not use `it.skip`, `it.todo`, a property floor, or the implementation output itself as the oracle while still calling the receipt complete.

### LAW-6 — Source-ledgered amalgamation and merge residue do not close the receipt seam

- **File/symbol:** Lean `1540775`, `SourceLedgeredAmalgamationResidue.lean::{amalgamation_dedup_beats_source_count,sourceLedgeredAmalgamationResidue}`; `28c9862`, `MergeResidue.lean::{Xglue,Xsep,separation_is_merge_action}`.
- **Literal evidence:** the source-ledger file says it reuses `MergeResidue` verbatim, adds nothing mathematical, is “not system-wired,” and formalizes an authority/provenance reading. `MergeResidue` is a concrete pushout witness over a bespoke span.
- **Severity:** `MAJOR` if cited as running-v2 proof; otherwise `MINOR` deferred prior art.
- **Proposed v2 code/test change:** none for L0. Continue using the existing source manifest and digest-bound conformance receipt. If L2 opens, adapt only the gluing-vs-fibre distinction into bounded graph-law tests under `TASK-GCP-GRAPH-LAWS`.
- **Dependency:** L0/L1 completion before L2; a separately admitted graph-law oracle.
- **Command:** `cd domainspec-lean-formalization/lean-formalization/files && lake build MergeResidue SourceLedgeredAmalgamationResidue`.
- **Challenge to a short-term one-off:** adding pushout terminology or a source cohort ledger does not create the missing obligation, binding, executable predicate, evaluator, or receipt verification.

### LAW-7 — Temporal/provenance theorems belong after the local proof

- **File/symbol:** Lean `f464b48`, `DecisionTraceResidue.lean::{traceCon,trace_class_distinct}`, `HistoryContinuationCriterion.lean::beatsCount_leftQuotient_iff`, `LedgerEventResidue.lean::{leftQuotient_collapse,minKernel_nonempty}`.
- **Literal evidence:** `HistoryContinuationCriterion` says neither current companion file alone clears the continuation gate; snapshot and admissibility language must be fixed independently. `DecisionTraceResidue` says model-of-math is not system-wired. `LedgerEventResidue` deliberately exhibits provenance states that minimization collapses.
- **Severity:** `MINOR` now; `MAJOR` if pulled into L0 and used to inflate completion.
- **Proposed v2 code/test change:** none in S1. Record these against the future temporal evaluator and `TASK-GCP-GRAPH-LAWS`; require a same-snapshot/separating-continuation test before any temporal completeness claim.
- **Dependency:** L0/L1 receipts and an independently authored temporal language/oracle.
- **Command:** `cd domainspec-lean-formalization/lean-formalization/files && lake build DecisionTraceResidue HistoryContinuationCriterion LedgerEventResidue`.
- **Challenge to a short-term one-off:** do not turn one `has_key == true` local predicate into a history/trace model. That would widen the proof boundary without consumer evidence.

## Change requests ordered by severity

1. `CRITICAL`: fail closed with a typed blocked receipt when the formal predicate is absent; never issue a passing S1 receipt from shape-only evidence.
2. `MAJOR`: add a count-preserving `enforces` mutant that traverses the entire graph-to-receipt chain.
3. `MAJOR`: add and wire a named `graph:proof` aggregate target; green baseline tests alone are not S1 proof.
4. `MAJOR`: adapt the current v2 graph/signature authority directly; do not import the Lean corpus schema or language capability tower as runtime authority.
5. `MINOR`: bank merge/trace/continuation patterns for L2 only and keep governance/source-ledger work out of this build.

## Final attack on a short-term implementation

A narrow one-off is acceptable only if it is narrow in **scope**, not narrow in **evidence**. It must still traverse all named boundaries:

```text
minted source + governed Rule->Operation edge + authored predicate
  -> normalized adapter
  -> stable obligation
  -> independent binding/fixture input
  -> real assertion
  -> evaluator verdict
  -> digest-bound positive or blocked/negative receipt
```

If any arrow is replaced by fixture cardinality, digest change alone, `it.skip`, a generated expected value copied from the implementation, or a Lean analogy, the implementation is shorter only because it omits the trust claim it is supposed to prove.
