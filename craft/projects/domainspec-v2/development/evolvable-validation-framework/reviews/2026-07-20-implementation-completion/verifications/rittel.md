# Rittel counterexample verification

- Dispatch: `2026-07-20-evf-implementation-completion-review`
- Reviewer: Rittel, Horst
- Posture: read-only skeptic over the frozen corpus and cited Lean sources
- Candidate count: 15/15
- Dispositions: **ACCEPT 3 · REVISE 12 · REFUTE 0**

`REVISE` below means the observable current gap survives, but the candidate row is not executable or exact as written. It does not mean the missing implementation already exists.

## Cross-cutting probes

- Frozen integrity: recomputing `sha256sum --check --strict` from `corpus-manifest.json` returned **61/61 OK**.
- Zero-obligation counterexample: calling `deriveFeature` on `test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door` returned `obligations: 0`, an empty SPEC table, an empty `describe`, and process status 0.
- Boolean counterexample: `parseFormal("has_key == true")` returned `{"kind":"unparsed","raw":"has_key == true"}`.
- Binding counterexample: an in-memory `BindingSet` with two matching entries resolved to the first entry. Reversing order changes the selected symbol without changing the obligation.
- Gap emission counterexample: an in-memory `needs-formal` obligation emitted an `it.todo` in legacy mode; hybrid mode emitted one property plus one `it.skip`, with `coverageGaps: 1`.
- Focused-command counterexample: `npm --prefix projects/domainspec-v2/impl exec -- vitest run test-derivation-engine/src/formal/eval.test.ts` started Vitest at the repository root and ran both the legacy mirror and v2 file: **2 files / 32 tests**. The workspace form `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/formal/eval.test.ts` ran only v2: **1 file / 16 tests**.
- Lean-command counterexample: the draft `cd .../lean-formalization/files && lake build ...` triggered Lake's update hook and changed the tracked `lean-toolchain` from `v4.30.0-rc2` to `v4.33.0-rc1` before a trustworthy build result. The tracked file was immediately restored byte-for-byte; its SHA-256 again matches `HEAD`. The command is not a read-only verification command in this checkout.

## S1 candidates

### ICR-S1-001 — REVISE

- **Exact target quote/line:** `impl/spec/minted-project/formations/rule-body.schema.json:7-8` requires only `formal_return_type`; `.../has-key-rule.json:7-9` contains only `"formal_return_type": "boolean"`. The pending decision says at `decisions/2026-07-20-key-and-door-formal-source.md:17-19`, “The current Rule source declares only `formal_return_type: boolean` ... Proceeding without this decision would invent semantics.”
- **Reproduction/counterexample evidence:** the frozen key-door tree has no machine predicate or true/false fixture, and the live parser probe leaves `has_key == true` unparsed. A return-type declaration is not a predicate.
- **Missing evidence:** no admitted predicate schema, predicate instance, typed input fixture, or stable blocked-result API exists. The proposed focused command is repository-rooted and may cross-run the legacy mirror.
- **Precise required revision:** retain the finding, but define the fixture schema and blocked result type explicitly (including `status: "blocked"` and code `FORMAL_PREDICATE_MISSING`). Replace the command with `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-vertical.test.ts -t "blocks when machine predicate is absent"`.

### ICR-S1-002 — REVISE

- **Exact target quote/line:** `src/index.ts:23-32` parses a feature directory through the Markdown/SPEC grammar. `src/rules/index.ts:696-720` derives only through node-oriented functions and never reads `graph.edges`. `src/ir/types.ts:33-40` says `enforces` is `Operation --enforces--> Invariant`, while `relationships.yml:84-97` owns `Rule --enforces--> Operation`. The minted fixture carries exactly that canonical edge at `expected/graph.json:45-51`.
- **Reproduction/counterexample evidence:** the live key-door `deriveFeature` probe returned zero obligations and status 0. Removing the minted `enforces` edge cannot change an engine output that never consumes the minted graph.
- **Missing evidence:** there is no minted adapter, edge-anchored obligation, edge/digest lineage, independent one-item denominator, or edge-direction mutation through the engine.
- **Precise required revision:** keep the adapter and lineage change, but place `O_spec` under a validation-owned contract path such as `development/evolvable-validation-framework/contracts/key-door-obligations.v1.json`, not ambiguously under generated `expected/` views. Specify exact-set validation before loading `O_gen`. Replace the command with the workspace-scoped `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/enforces-derivation.test.ts`.

### ICR-S1-003 — REVISE

- **Exact target quote/line:** `src/formal/ast.ts:112-121` has no Boolean-expression variant and `:380-386` routes comparisons outside supported forms to `unparsed`. `src/formal/eval.ts:24-29` permits only `number | string` variables; `:211-215` returns `string | null` from arithmetic evaluation. `src/bindings/index.ts:21-28` repeats the non-Boolean fixture limitation.
- **Reproduction/counterexample evidence:** `parseFormal("has_key == true")` returned `unparsed`; therefore no independent current evaluator can distinguish the fixture's true and false cases.
- **Missing evidence:** no machine Boolean AST, Boolean environment, `evalBool`, or mutation test exists. The proposed connective/inequality breadth is not needed to close the demonstrated S1 gap, and the draft command can cross-run mirrors.
- **Precise required revision:** narrow the first contract to variable, Boolean literal, and equality—the exact `has_key == true` seam—plus typed true/false inputs and an operator/literal mutant. Defer connectives until a concrete predicate requires them. Use `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/formal/key-and-door-predicate.test.ts`.

### ICR-S1-004 — REVISE

- **Exact target quote/line:** `src/bindings/index.ts:30-42` has selector, module, symbol, strategy, and optional fixture but no stable binding/obligation identity or graph/source/predicate/fixture digests. `:63-81` documents and implements first-subset-match selection.
- **Reproduction/counterexample evidence:** two matching bindings selected the first symbol; changing array order changed selection. No current field can make a graph or fixture mutation stale.
- **Missing evidence:** no uniqueness validator, digest-bound binding contract, runtime fixture module, or typed ambiguity/staleness error exists. The draft focused command can cross-run mirrors.
- **Precise required revision:** define `GraphBinding` and `resolveGraphBinding` as an exact-one-match result API with stable error codes, and explicitly create the cited `runtime/key-and-door.ts::unlockDoor` target before referring to it. Use `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/bindings/key-door-binding.test.ts`.

### ICR-S1-005 — REVISE

- **Exact target quote/line:** `src/emit/tests.ts:73-90` emits one `it.todo`; `:114-121` emits `it.skip`; `:354-433` counts gaps but only returns source text and counts. `src/cli.ts:365-400` emits/writes the suite, prints the gap count, and returns 0; it does not invoke Vitest.
- **Reproduction/counterexample evidence:** the zero-obligation live probe produced an empty `describe` and status 0. The in-memory probes produced todo/skip source without any execution record.
- **Missing evidence:** no strict non-empty gate, generated-suite runner, exact test-result join, or failing cases for missing export/throw/wrong result/gap exist. The draft command can cross-run mirrors.
- **Precise required revision:** preserve the proposed strict runner but require its test to assert a child-process Vitest result joined by obligation/test ID, not merely inspect emitted text. Use `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/enforces-execution.test.ts`.

### ICR-S1-006 — REVISE

- **Exact target quote/line:** `src/residue/receipt.ts:1-6` says the receipt is “intentionally structural” and disclaims semantic/application claims. `src/minted-project/conformance-receipt.ts:49-60` records conformance fixtures/cases and `release_admission: "not-granted"`, but no obligation, binding, generated-test, runner, or evaluator chain.
- **Reproduction/counterexample evidence:** the receipt types contain no field that could attest the live zero-obligation path or distinguish an executed assertion from an emitted todo. A Lean proof does not fill that runtime join.
- **Missing evidence:** the proposed receipt/verifier and all same-chain semantic/stale mutants are absent. The draft focused command can cross-run mirrors.
- **Precise required revision:** keep the distinct receipt type and recomputation requirement, explicitly make verification consume independently recomputed artifact bytes rather than trust receipt fields, and use `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-receipt.test.ts`.

### ICR-S1-007 — ACCEPT

- **Exact target quote/line:** root `impl/package.json:17-32` has no `verify:evf-s1`; `validate` omits `engine:test` and `typecheck`. Engine `package.json:8-13` exposes only generic `test`, `roundtrip`, and `lint:docs` scripts.
- **Reproduction/counterexample evidence:** the frozen green baseline coexists with the live zero-obligation/empty-suite status-0 counterexample. Therefore current aggregate green does not detect the missing S1 chain.
- **Missing evidence:** none needed to accept the current-gap finding; implementation is intentionally future work.
- **Precise required revision:** none. Keep the exact equality and zero-residue conditions, required-check manifest, missing/empty/omitted-subcheck red controls, and terminal command `npm --prefix projects/domainspec-v2/impl run verify:evf-s1`.

## Backend candidates

### ICR-BTE-001 — REVISE

- **Exact target quote/line:** `impl/spec/minted-project/node.schema.json:13-16` accepts any non-empty `kind`; `:18-35` conditionally attaches only Entity, Event, Operation, and Rule bodies. BTE `PLAN.md:35-43` names the 13-kind set and says the current profile proves four; `WORK-PACK.md:60-62` still marks the exact profile and 13-positive/16-mutant corpus as unbuilt.
- **Reproduction/counterexample evidence:** the current schema has no rejecting `else` or exact profile enum, so an arbitrary fifth kind can receive only the generic object check. This is a stronger observable gap than “four branches.”
- **Missing evidence:** no exact 13-kind machine profile, profile digest gate, 13 positive nodes, or 16 criterion mutants exists. The draft focused command can cross-run mirrors.
- **Precise required revision:** add an explicit unsupported-kind negative proving generic admission cannot masquerade as profile support; distinguish envelope acceptance from profile admission. Use the workspace command `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/backend-profile.test.ts src/minted-project/backend-formation.test.ts`.

### ICR-BTE-002 — REVISE

- **Exact target quote/line:** `check-code-tag-composability.ts:269-282` emits `CT-COMP-024` at MEDIUM for an active signature without call semantics; `:377-429` blocks only HIGH/CRITICAL. Its test at `code-tag-composability.test.ts:520-538` requires status 0, `payload.ok === true`, and the unsupported `performs:entity->operation` coverage gap.
- **Reproduction/counterexample evidence:** current generic strict mode intentionally greens an unsupported active signature. Relationship shape/call-text checks therefore cannot establish the plan's causal 16/16 denominator.
- **Missing evidence:** the row names no exact selected-signature manifest path/schema, positive edge-fixture root, witness record type, or verifier API; “traversal result” and “provenance join” are not yet executable seams.
- **Precise required revision:** retain generic mode, but name a validation-owned manifest such as `development/first-production-release/backend-type-test-engine-completeness/contracts/backend-signatures.v1.json`, a minted edge-fixture root, and a verifier returning exact witness IDs and stable missing/extra/duplicate/removal/endpoint codes. Then wire root `verify:bte:signatures` to those artifacts and require exactly 16 IDs.

### ICR-BTE-003 — REVISE

- **Exact target quote/line:** BTE `PLAN.md:137-147` states `Criteria_profile = O_spec = O_gen = T_gen = E_run = 16` and all residue counts zero, explicitly calling those counts current-plan expectations. `WORK-PACK.md:63-65,79-81` marks independent `O_spec`, derivation, execution, and 16 killed mutants as blocked/not built.
- **Reproduction/counterexample evidence:** no machine `O_spec`, generated/executed 16-ID result set, or kill matrix is present in the frozen 61-file corpus; only planning references exist. This is an observable current denominator gap, not a claim that the plan has already implemented it.
- **Missing evidence:** the proposed change does not name the catalogue schema/path, its independent owner receipt, or exact-set comparator API.
- **Precise required revision:** bind the row to `development/first-production-release/backend-type-test-engine-completeness/contracts/backend-obligations.v1.json` plus a schema and validation-owner digest receipt; name the comparator output fields for `O_spec`, `O_gen`, `T_gen`, `E_run`, and mutant IDs. Only then is `npm --prefix projects/domainspec-v2/impl run verify:bte:denominator` executable rather than aspirational.

### ICR-BTE-004 — ACCEPT

- **Exact target quote/line:** root `impl/package.json:16-32` has no backend aggregate. BTE `PLAN.md:43-50` explicitly lists the missing fail-closed integration gate; `WORK-PACK.md:66,81-82` leaves the aggregate blocked and requires missing/empty and required-check controls.
- **Reproduction/counterexample evidence:** current root scripts can run component checks independently, but no script joins profile, signature, denominator, execution, mutation, and receipt evidence or rejects omission of one component.
- **Missing evidence:** none needed to accept the current-gap finding.
- **Precise required revision:** none. Keep the required-check manifest, omission/missing/empty/stale/nonzero-residue subprocess controls, and terminal `npm --prefix projects/domainspec-v2/impl run verify:bte`.

### ICR-BTE-005 — ACCEPT

- **Exact target quote/line:** `WORK-PACK.md:28-30` makes integrated BTE/IOLM/Body War receipts part of success; `:52-53,68` leaves the integrated manifest and verification unstarted/blocked; `:95-96` records IOLM blocked and Body War not executed.
- **Reproduction/counterexample evidence:** the frozen manifest contains no IOLM or Body War consumer receipt, while the authoritative work-pack records both active gaps. This is current observable absence, not merely a future roadmap preference.
- **Missing evidence:** none needed to accept the gap; the receipts and validator are the proposed implementation.
- **Precise required revision:** none. Keep consumer receipts as proof surfaces, preserve non-admission posture, and require missing/stale/extra/duplicate/skipped/survivor controls under `verify:bte:consumers`.

## Defer/reject candidates

### ICR-DR-001 — REVISE

- **Exact target quote/line:** `LanguageFunctorialSemantics.lean:10-14,61-67` calls itself a capability/MAP artifact and says it licenses no running-system claim; symbols `Syn`, `M`, and `meaning_compositional` exist at `:91`, `:132`, and `:150-152`.
- **Reproduction/counterexample evidence:** no v2 source imports or consumes these Lean modules, and the exact proposed Lake command triggered a tracked toolchain rewrite before a trustworthy completion. A Lean theorem remains model evidence only.
- **Missing evidence:** no DomainSpec parser/profile/normalizer mapping and no safe pinned build invocation for this checkout.
- **Precise required revision:** keep the runtime rejection, but remove this Lake command from v2 acceptance. If contextual Lean build health is retained, run it only in a disposable checkout pinned to `c2ed8782706083d77323c57ffe722b918deeab67`, with a clean-tree assertion before and after; report it explicitly as non-v2 evidence.

### ICR-DR-002 — REVISE

- **Exact target quote/line:** the Lean proposal says at `experiments/corpus-typed-graph-schema/proposal.md:20-21`, “Nothing here is validated”; at `:188-191` the Lean-typed versus generated-doc fork remains open. Current v2 has machine relationship authority (`relationships.yml:84-97`) and node/connection/graph JSON schemas.
- **Reproduction/counterexample evidence:** the proposal is not a runtime authority and supplies no current v2 consumer. The proposed `validate:rels && engine:test` command only checks existing regressions; it would not execute any future evidence-ref closure or forbidden-composite rule.
- **Missing evidence:** no exact v2 fixture, adapter/API, stable violation codes, or graph-law test is named.
- **Precise required revision:** retain DEFER, but do not claim an adaptation validation command until a concrete seam exists. Name, at minimum, a machine fixture containing one missing `evidence_ref` and one forbidden composite, a verifier API with stable codes, and `src/minted-project/graph-laws.test.ts`; add that test to the validation command after L0/L1.

### ICR-DR-003 — REVISE

- **Exact target quote/line:** the bundle is not literally uniform. `MergeResidue.lean:13-17,41-60` is a concrete direct pushout model with bounded claims, not text calling itself “toy.” `DecisionTraceResidue.lean:61-75` says model-of-math is not system-wired. `HistoryContinuationCriterion.lean:14-26` says it is not a real-process instance and requires a future independently fixed oracle. `LedgerEventResidue.lean:61-73` says model-of-math is not system-wired. `SourceLedgeredAmalgamationResidue.lean:40-66` says it reuses `MergeResidue`, adds a framework reading, and is not system-wired.
- **Reproduction/counterexample evidence:** none of these sources supplies the missing v2 minted adapter, Boolean evaluator, generated execution, or receipt verifier. Their theorems cannot make the live zero-obligation path pass.
- **Missing evidence:** the draft overstates “bespoke/toy,” combines materially different defer and reject reasons in one status, and names no admitted L2 consumer/oracle/test.
- **Precise required revision:** split the row: defer `MergeResidue`/`DecisionTraceResidue`/`HistoryContinuationCriterion`/`LedgerEventResidue` as bounded L2 prior art pending a named temporal/graph oracle and executable test; separately reject `SourceLedgeredAmalgamationResidue` from this build because it adds only the excluded governance/provenance reading. Quote each source's actual limitation rather than the composite “bespoke/toy or not system-wired” paraphrase.

## Skeptic closeout

The implementation-completion block is supported by literal runtime seams, not by roadmap ambition: the authoritative edge is not consumed, the key-door predicate is absent and unparseable, binding selection is order-dependent, todo/skip/empty output can remain green, receipts do not join execution, and neither S1 nor backend has a fail-closed aggregate. The backend breadth rows are legitimate only when tied to the work-pack's exact current gaps and independent machine denominators. Lean material may guide test discipline but is never runtime evidence.
