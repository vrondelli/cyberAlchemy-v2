# CORRECTED CANDIDATE — implementation-completion findings

Dispatch: `2026-07-20-evf-implementation-completion-review`
Status: **CORRECTED CANDIDATE — PENDING RE-AUDIT**
Original audit: [audit.md](audit.md) — `REJECT` because the candidate reassigned existing edge-coverage `SWU-BTE-009` to consumer execution.
Promotion rule: this is the verifier-corrected, order-repaired candidate, not an implementation-completion claim. A new audit against `corpus-manifest.refresh-001.json` must confirm the repair and refreshed evidence boundary before promotion; the original rejected audit remains immutable.

## Review goal and evidence boundary

This review identifies the shortest executable work needed to close the key-and-door S1 causal proof and, only afterward, the backend completion contract. Evidence is bounded to the 61 SHA-frozen targets in `corpus-manifest.json`, `build-baseline.md`, `lean-reuse-inventory.md`, the three attack returns, and the two appended verifier reports in `attacks.md`.

All 61 targets remain present and matched their frozen working-tree SHA-256 values at synthesis time. The three attack returns and both verifier reports are included verbatim in `attacks.md`. No frozen review target was modified. `FIX` below is a proposed implementation disposition, not an edit made by this review.

## Controlling authority rules

1. `DEC-GCP-001` remains a real owner gate. This review does not select shared-schema option 2 or authorize any equivalent machine source.
2. Domain semantics are authored only in an owner-admitted machine source validated by its machine contract. Derivation may preserve, normalize, evaluate, and verify those semantics; it may never originate them.
3. Markdown, fixtures, `O_spec`, generated graphs, tests, results, and receipts are evidence/read models. None may author domain semantics or release authority.
4. Until the owner admits a machine predicate source and the Task Session admits the implementation scope, the only valid S1 result is `{ status: "blocked", code: "FORMAL_PREDICATE_MISSING" }`; no positive receipt may issue.
5. ICR-S1-001..007 are seven dependency-ordered subtasks of the single atomic `SWU-GCP-001`, not seven separately authorized SWUs. One resumed Task Session must close the chain together.
6. The current minted v1 profile remains unchanged historical evidence. Backend breadth uses the accepted successor profile and the existing BTE SWU order.

## Current verified baseline

| Observation | Verified result | Boundary |
| --- | --- | --- |
| Frozen corpus | 61/61 present and SHA-matching | Reviewers attacked identical bytes. |
| `npm run engine:test` | PASS: 10 files, 107 tests | Does not run the minted key-door graph-to-receipt slice. |
| `npm run typecheck` | PASS | Does not prove runtime/evidence completeness. |
| `npm run validate:rels` | PASS: 5 specs, 34 edges, 30 canonical signatures | Proves registry/shape checks, not 16 causal backend witnesses. |
| Owner gate | `DEC-GCP-001` pending; `TASK-SESSION-RESULT.md` is `BLOCK` | No machine predicate source or runtime adapter is admitted. |
| Live counterexamples | minted key-door derivation returns zero obligations/status 0; `has_key == true` is `unparsed`; first matching binding wins; todo/skip/empty emission can return 0 | The causal implementation chain is open. |

Verdict remains **BLOCK** for S1 completion and **BLOCK** for backend exit. The green baseline is retained at component scope.

## Implementation topology

```text
CURRENT
minted JSON -> generated graph/manifest/build receipt -> conformance receipt -> STOP
Markdown/SPEC -> legacy ConceptGraph -> node obligations -> todo/skip text -> STOP
code tags -> optional composability report -> STOP

CORRECTED S1, after owner admission
admitted machine Rule predicate + fixture inputs from existing evidence boundary
  + authored node connection + canonical relationship registry
  -> bounded L0 minted adapter validates generated graph/manifest back to raw sources
  -> one edge-anchored O_gen compared with validation-owned O_spec evidence
  -> typed predicate-object evaluation
  -> exact-one existing Binding/BindingSet resolution to an admitted runtime target
  -> opt-in strict generated assertion -> child Vitest -> ID-joined result
  -> verifier recomputes raw bytes -> non-admitting receipt -> mutants killed
  -> verify:evf-s1
```

## Per-target KEEP/FIX disposition

Paths are relative to `projects/domainspec-v2/`.

| # | Frozen target | Disposition | Corrected reason / candidate |
| ---: | --- | --- | --- |
| 1 | `definitions/relationships/relationships.yml` | KEEP | Canonical `Rule -> Operation` authority; S1/BTE resolvers consume it. |
| 2 | `development/evolvable-validation-framework/DESIGN.md` | KEEP | Target contract; implementation has not met it. |
| 3 | `development/evolvable-validation-framework/IMPLEMENTATION-LAYERING.md` | KEEP | Layering remains valid. |
| 4 | `development/evolvable-validation-framework/PLAN.md` | KEEP | S1 remains the narrow immediate slice. |
| 5 | `development/evolvable-validation-framework/WORK-PACK.md` | KEEP | `SWU-GCP-001` remains atomic. |
| 6 | `development/evolvable-validation-framework/decisions/2026-07-20-key-and-door-formal-source.md` | KEEP | Pending owner gate; this review does not resolve it. ICR-S1-001. |
| 7 | `development/evolvable-validation-framework/runs/SWU-GCP-001/TASK-SESSION-RESULT.md` | KEEP | Honest block until owner selection and resumed scope. |
| 8 | `development/first-production-release/backend-type-test-engine-completeness/PLAN.md` | KEEP | Owns successor-profile and backend exit order. |
| 9 | `development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md` | KEEP | Existing SWU sequence controls BUILD-NEXT. |
| 10 | `impl/governance/tags/tools/check-code-tag-composability.ts` | KEEP | Optional consumer evidence only; not minted structural authority. |
| 11 | `impl/governance/tags/tools/tests/code-tag-composability.test.ts` | KEEP | Preserve intentional generic non-blocking semantics. |
| 12 | `impl/package.json` | FIX | Add canonical commands after their gates: ICR-S1-007, ICR-BTE-004. |
| 13 | `impl/spec/minted-project/connection.schema.json` | KEEP | Authored connection contract is an S1 admission input. |
| 14 | `impl/spec/minted-project/formations/rule-body.schema.json` | FIX | Conditional only on owner admission of this machine source. ICR-S1-001. |
| 15 | `impl/spec/minted-project/graph.schema.json` | KEEP | Generated read model, validated back to source; never authority. |
| 16 | `impl/spec/minted-project/node.schema.json` | KEEP | Preserve v1; backend creates/uses successor profile. ICR-BTE-001. |
| 17 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/SPEC.md` | KEEP | Explanatory generated read model only. |
| 18 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/build-receipt.json` | KEEP | Structural evidence only. |
| 19 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/graph.json` | KEEP | Generated graph read model; adapter checks it back to source. |
| 20 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/markdown-view.json` | KEEP | Generated read model only. |
| 21 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/source-manifest.json` | KEEP | Generated provenance evidence; verifier recomputes raw bytes. |
| 22 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/project.json` | KEEP | Existing fixture-root metadata. |
| 23 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/specs/key-and-door/feature.json` | KEEP | Existing machine feature source. |
| 24 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/specs/key-and-door/nodes/door-unlocked.json` | KEEP | Existing event source. |
| 25 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/specs/key-and-door/nodes/has-key-rule.json` | FIX | Conditional predicate addition only if owner admits this Rule source. ICR-S1-001. |
| 26 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/specs/key-and-door/nodes/player.json` | KEEP | Existing entity source. |
| 27 | `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/specs/key-and-door/nodes/unlock-door.json` | KEEP | Existing operation source; runtime target remains a separate Task Session gate. |
| 28 | `impl/test-derivation-engine/package.json` | FIX | Expose focused S1 execution without renaming the canonical root command. |
| 29 | `impl/test-derivation-engine/src/README.md` | KEEP | Refresh only after runtime closure; no documentation-only completion. |
| 30 | `impl/test-derivation-engine/src/bindings/index.ts` | FIX | Extend existing Binding/BindingSet; exact-one and freshness. ICR-S1-004. |
| 31 | `impl/test-derivation-engine/src/cli.ts` | FIX | Add opt-in strict generation/child execution. ICR-S1-005. |
| 32 | `impl/test-derivation-engine/src/concise/desugar.test.ts` | KEEP | No S1 seam. |
| 33 | `impl/test-derivation-engine/src/concise/desugar.ts` | KEEP | No S1 seam. |
| 34 | `impl/test-derivation-engine/src/emit/spec.ts` | KEEP | Read-model emission only. |
| 35 | `impl/test-derivation-engine/src/emit/tests.test.ts` | FIX | Add opt-in strict-mode controls without changing legacy mode. ICR-S1-005. |
| 36 | `impl/test-derivation-engine/src/emit/tests.ts` | FIX | Add opt-in strict one-assertion mode. ICR-S1-005. |
| 37 | `impl/test-derivation-engine/src/formal/ast.ts` | KEEP | Do not extend Markdown `parseFormal` for S1. |
| 38 | `impl/test-derivation-engine/src/formal/eval.test.ts` | KEEP | Preserve arithmetic coverage; typed predicate tests are separate. |
| 39 | `impl/test-derivation-engine/src/formal/eval.ts` | KEEP | Preserve arithmetic evaluator; typed predicate evaluator is separate. |
| 40 | `impl/test-derivation-engine/src/grammar/index.ts` | KEEP | Markdown/SPEC grammar cannot originate S1 semantics. |
| 41 | `impl/test-derivation-engine/src/grammar/l3-domain-rules.test.ts` | KEEP | Outside machine-source S1. |
| 42 | `impl/test-derivation-engine/src/grammar/normalized-spec.test.ts` | KEEP | Normalized Markdown remains a read model. |
| 43 | `impl/test-derivation-engine/src/identity/human-id.test.ts` | KEEP | Display identity is not semantic freshness. |
| 44 | `impl/test-derivation-engine/src/identity/human-id.ts` | KEEP | Display identity remains valid. |
| 45 | `impl/test-derivation-engine/src/index.test.ts` | KEEP | Existing entrypoint tests remain; bounded minted tests are separate. |
| 46 | `impl/test-derivation-engine/src/index.ts` | FIX | Add bounded minted entrypoint without replacing legacy entrypoint. ICR-S1-002. |
| 47 | `impl/test-derivation-engine/src/ir/types.ts` | KEEP | Do not generalize the legacy closed union in L0. |
| 48 | `impl/test-derivation-engine/src/keys/index.ts` | KEEP | Use a bounded minted obligation key rather than widening legacy identity. |
| 49 | `impl/test-derivation-engine/src/minted-project/conformance-receipt.ts` | KEEP | Structural replay and explicit non-admission remain separate. |
| 50 | `impl/test-derivation-engine/src/minted-project/conformance.test.ts` | KEEP | Reuse harness patterns; S1 tests remain distinct. |
| 51 | `impl/test-derivation-engine/src/paths/containment.test.ts` | KEEP | Existing control. |
| 52 | `impl/test-derivation-engine/src/paths/containment.ts` | KEEP | Existing behavior. |
| 53 | `impl/test-derivation-engine/src/provenance/index.ts` | KEEP | Reuse only if compatible; it does not close joins by itself. |
| 54 | `impl/test-derivation-engine/src/residue/receipt.ts` | KEEP | Structural receipt stays distinct from S1 receipt. |
| 55 | `impl/test-derivation-engine/src/roundtrip/index.ts` | KEEP | Existing scope remains valid. |
| 56 | `impl/test-derivation-engine/src/roundtrip/negative-control.test.ts` | KEEP | Existing controls remain; semantic mutants are separate. |
| 57 | `impl/test-derivation-engine/src/roundtrip/negative-control.ts` | KEEP | Existing scope remains valid. |
| 58 | `impl/test-derivation-engine/src/rules/index.ts` | KEEP | Do not widen legacy derivation; bounded minted derivation is separate. |
| 59 | `impl/tools/lib/relationship-signatures.ts` | KEEP | Reuse canonical registry loader; no second selected-16 manifest. ICR-BTE-002R. |
| 60 | `impl/tools/tests/validate-relationships.test.ts` | KEEP | Shape tests remain shape tests. |
| 61 | `impl/tools/validate-relationships.ts` | KEEP | Do not inflate shape validation into runtime proof. |

## Candidate table

Every survivor below is **CORRECTED CANDIDATE — PENDING RE-AUDIT**. Severity is normalized to `CRITICAL`, `MAJOR`, or `MINOR`.

### BUILD-NOW — seven subtasks inside atomic SWU-GCP-001

| ID | Exact surface and literal evidence | Severity / missing behavior | Corrected code and test change | Dependency and exact validation | Attack provenance |
| --- | --- | --- | --- | --- | --- |
| ICR-S1-001 | `rule-body.schema.json::required/properties`, `has-key-rule.json::body`; literals: `"required": ["formal_return_type"]`, `"formal_return_type": "boolean"`. `DEC-GCP-001`: `status: pending`, `owner: user`, and `Proceeding without this decision would invent semantics.` | CRITICAL. No admitted machine predicate or typed fixture input exists. | Do not choose a source here. Owner must admit a machine source and refresh Task Session scope. If the Rule JSON is selected, validate a minimal typed equality predicate there; otherwise use the selected machine contract. Fixture inputs stay in the existing binding/evidence boundary unless a new root is separately admitted; fixtures contain no expected output. Add `src/minted-project/types.ts::S1BlockedResult` with exact `{status:"blocked", code:"FORMAL_PREDICATE_MISSING"}` and retain this block as a red control. | Gate zero. Until closed, stop. `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-vertical.test.ts -t "blocks when machine predicate is absent"` | ASHBY-003; LAW-5; SMITHE-CRIT-003 |
| ICR-S1-002 | `src/index.ts::deriveFeature` literal `const { graph } = parse(featureDir);`; `src/rules/index.ts::derive` never reads edges; `relationships.yml::enforces` owns `"source_type": "Rule"`, `"target_type": "Operation"`; graph schema says `generated-semantic-read-model`. | CRITICAL. Generated graph cannot cause a validated edge-anchored obligation or prove its source lineage. | Add bounded L0 `src/minted-project/derive.ts::{admitMintedEnforcesEdge,deriveMintedObligation}` with local types. Validate generated graph/manifest back to raw `has-key-rule.json::connections`, recomputed source bytes/digests, and `loadRelationshipAuthority()` canonical signature before deriving one obligation. Put independent validation evidence at `development/evolvable-validation-framework/contracts/key-door-obligations.v1.json`; exact-set validate O_spec before O_gen, but never treat O_spec as authority. Do not change shared legacy IR/unions. | After ICR-S1-001 admission. `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/enforces-derivation.test.ts` | ASHBY-001; ASHBY-002; LAW-2; LAW-4; SMITHE-CRIT-001; SMITHE-CRIT-002; SMITHE-MAJ-007 |
| ICR-S1-003 | `src/formal/ast.ts::parseFormal` literal `return { kind: "unparsed", raw: formal };`; `src/formal/eval.ts::EvalEnv` excludes Boolean and `evalArith` returns arithmetic text/null. | CRITICAL. No independent typed evaluation of the admitted predicate object exists. | Add `src/minted-project/typed-predicate.ts::{validateTypedPredicate,evalTypedPredicate}` over the machine JSON object directly. First contract supports only variable, Boolean literal, equality, and total typed failure; add Boolean fixture inputs and true/false/operator/literal/input mutants. Do not call or extend Markdown `parseFormal`. | After ICR-S1-001 and before binding. `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/formal/key-door-predicate.test.ts` | ASHBY-003; LAW-5; SMITHE-CRIT-003 |
| ICR-S1-004 | `src/bindings/index.ts::Binding/BindingSet/bindingFor`; literal comment `the first binding` and code `if (hit) return b;`. | CRITICAL. Match is order-dependent and cannot reject stale graph/source/predicate/fixture/runtime data. | Extend existing `Binding`/`BindingSet` with stable binding/test/obligation IDs, adapter/version, runtime module/symbol, and graph/source/predicate/fixture digests. Make existing resolution return exactly one match or stable missing/duplicate/ambiguous/stale codes; no parallel `GraphBinding`. A resumed Task Session must select a real runtime target or explicitly admit an evidence-local adapter and narrow the receipt claim; otherwise return typed runtime-target block. | After ICR-S1-002/003 and runtime selection. `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/bindings/key-door-binding.test.ts` | ASHBY-004; SMITHE-MAJ-004; SMITHE-MAJ-007 |
| ICR-S1-005 | `src/emit/tests.ts::emitTests` literal `One it.todo per derived obligation_key`; hybrid emits `it.skip coverage_gap`; `src/cli.ts::runEmitTests` ends `return 0` without Vitest. | CRITICAL. Empty/gapped/unexecuted output can be green. | Add opt-in `evf-s1-strict` mode only; preserve legacy behavior. Require one assertion and zero gaps before emission, run the generated file in a child Vitest process, and join child result to obligation/test IDs. Test missing export, throw, wrong result, empty, skip, todo, needs-formal, orphan, unrunnable, and ID mismatch. | After ICR-S1-003/004. `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/enforces-execution.test.ts` | ASHBY-005; LAW-5; SMITHE-CRIT-005 |
| ICR-S1-006 | `src/residue/receipt.ts` literal `This receipt is intentionally structural.` `MintedProjectConformanceReceipt` has `release_admission: "not-granted"` but no obligation/binding/test/evaluator join. | CRITICAL. No recomputable evidence binds admitted source bytes to execution and independent evaluation. | Add `src/minted-project/evolvable-validation-receipt.ts::{EvolvableValidationReceipt,verifyEvolvableValidationReceipt}` with structural, execution, and evaluator envelopes and explicit non-admission. Verifier reads and hashes raw admitted source, generated artifacts, child-run result, and evaluator output independently; it must not trust receipt-reported digests. Kill predicate/operation, endpoint/direction/signature, and stale raw graph/source/predicate/binding/fixture/test/result/receipt mutations with stable codes. | After ICR-S1-005. `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-receipt.test.ts` | ASHBY-006; LAW-4; LAW-5; SMITHE-CRIT-006; SMITHE-MAJ-007 |
| ICR-S1-007 | `impl/package.json::scripts.validate` literal excludes `engine:test`, `typecheck`, and S1; engine package has only `"test": "vitest run"`. | CRITICAL. No single fail-closed S1 detector exists. | Add one canonical root package script, `verify:evf-s1`, composing the focused replay/verifier and required regressions. Do not add a required-check manifest unless implementation proves package-script enumeration/result identity insufficient. Add subprocess red controls for missing/empty/omitted targets. Add `verify:evf-s1` to ordinary `validate` only after the resumed Task Session closes green; the currently blocked branch must not permanently break its existing aggregate. | Last S1 subtask. Terminal: `npm --prefix projects/domainspec-v2/impl run verify:evf-s1` | ASHBY-007; LAW-3; SMITHE-MAJ-008 |

## Shortest S1 build order and exact acceptance lock

One resumed Task Session for `SWU-GCP-001` executes, in order: owner-admitted machine source or typed block (001) -> bounded source-validating adapter and independent O_spec evidence (002) -> direct typed-object evaluator (003) -> existing binding extension plus admitted runtime (004) -> opt-in child Vitest execution with ID join (005) -> raw-byte receipt verification and mutants (006) -> canonical aggregate (007). Failure at any dependency stops the atomic SWU; later subtasks do not manufacture placeholders.

`npm --prefix projects/domainspec-v2/impl run verify:evf-s1` may pass only when:

1. The owner-admitted machine source, and only that source, authors the typed predicate. If absent, command returns nonzero with `blocked / FORMAL_PREDICATE_MISSING` and no positive receipt.
2. The bounded adapter validates generated graph/manifest back to the authored connection, recomputed source digests, and canonical `Rule -> Operation` registry signature.
3. Exactly one deterministic edge-anchored obligation carries edge/source/graph/predicate/rule-set lineage, and validation-owned evidence satisfies exact `O_spec = O_gen = 1` without becoming authority.
4. The typed predicate object and Boolean fixture inputs validate; a direct independent evaluator returns the expected Boolean without reading runtime output or Markdown.
5. Existing Binding/BindingSet resolution yields exactly one fresh, digest-bound binding to a Task Session-admitted real runtime or explicitly admitted evidence-local adapter.
6. Opt-in strict mode generates exactly one assertion; a child Vitest process executes it; obligation ID, test ID, and result ID join exactly.
7. The verifier recomputes raw artifact bytes and emits a non-admitting digest-bound receipt.
8. Predicate/operation-bypass, endpoint/direction/signature, and stale raw-artifact mutations are killed with stable codes.
9. `O_spec=O_gen=T_gen=E_run=1` and `skips=todos=needs_formal=orphans=unrunnable=surviving_mutants=0`.
10. Only the command name `verify:evf-s1` counts. Ordinary `validate` invokes it only after S1 closure.

### BUILD-NEXT — backend breadth after a verified S1 replay

No backend mutation starts until `verify:evf-s1` emits a replay-verified non-admitting receipt and a separate BTE Task Session selects exactly one dependency-ready existing SWU.

| ID | Exact surface and literal evidence | Severity / missing behavior | Corrected code and test change | Dependency and exact validation | Attack provenance |
| --- | --- | --- | --- | --- | --- |
| ICR-BTE-001 | `node.schema.json::kind/allOf` accepts any non-empty kind but has only four body branches. BTE plan literal: `The current minted-project profile proves four kinds`; work-pack sequences SWU-BTE-001..004. | CRITICAL. No admitted exact 13-kind successor profile, shared kernel, adapter, or 13-positive/16-mutant corpus exists. | Preserve v1 unchanged. In existing order: SWU-BTE-001 extracts/reuses the shared eight-form criterion kernel; 002 binds accepted successor `feature-with-independent-node-and-edge-files@1` to canonical 13 YAML paths/digests; 003 adds its adapter and explicit unsupported-kind rejection; 004 builds 13 positives and 16 discriminating mutants with deterministic graph/source evidence. | After S1, one existing SWU per Task Session. Focused check: `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/backend-profile.test.ts src/minted-project/backend-formation.test.ts` | ASHBY-008 |
| ICR-BTE-002R | Original 002 is refuted. Existing code-tag test literal: `active performs without call semantics reports a non-blocking coverage gap`; accepted successor profile already owns the exact 16 signature set. | CRITICAL. A dedicated minted resolver/verifier for 16/16 causal edge witnesses is absent. | Existing `SWU-BTE-009` in W2 adds `src/minted-project/backend-edge-resolver.ts::{resolveBackendEdges,verifyBackendSignatureWitnesses}`. Inputs are the accepted successor profile's 16 signatures, canonical registry from `loadRelationshipAuthority`, and independent edge JSON records. Require exact-set equality, traversal, source provenance, removal failure, and wrong-endpoint failure. Do not create a second selected-16 manifest and do not route minted verification through code tags. Code-tag composability is optional consumer evidence only where call semantics are admitted. | After successor profile/adapter/corpus and before denominator closure. `npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/backend-signatures.test.ts` | Replacement for ASHBY-009 after Capucci refutation |
| ICR-BTE-003 | BTE plan literal: `Criteria_profile = O_spec = O_gen = T_gen = E_run = 16`; current corpus contains no machine denominator or kill matrix. | CRITICAL. Engine can choose its own denominator; exact IDs and 16 distinct killed mutants are absent. | Under existing SWU-BTE-005..007, add validation-owned `development/first-production-release/backend-type-test-engine-completeness/contracts/backend-obligations.v1.json`, schema, and independent digest receipt anchored to canonical YAML criterion IDs/digests. Add `src/minted-project/backend-denominator.ts::compareBackendEvidenceSets` with explicit O_spec/O_gen/T_gen/E_run/mutant ID sets. Evidence enumerates obligations but never authors criteria. | After BTE-001/002R. `npm --prefix projects/domainspec-v2/impl run verify:bte:denominator` must enforce exact 16/16/16/16 and 16 distinct kills. | ASHBY-010 |
| ICR-BTE-004 | Root `impl/package.json::scripts` has no backend aggregate; plan requires `a fail-closed integration gate that rejects missing/empty release witnesses.` | CRITICAL. Consumer proof currently has no replayable core, and terminal aggregation is absent. | After SWU-BTE-004..007 plus edge-coverage SWU-BTE-009, SWU-BTE-008 adds `verify:bte:core`, joining profile, criteria, signatures, denominator, generation, execution, mutation, and core receipt verification via the approved BTE required-check manifest. It emits only the non-admitting core receipt. After actual consumer runs and SWU-BTE-010 validation, terminal `verify:bte` composes `verify:bte:core + verify:bte:consumers`. Manifests record checks/results only; they are not profile/release authority. | After SWU-BTE-004..007 and 009 for core; after fresh consumer receipts and 010 for terminal. `npm --prefix projects/domainspec-v2/impl run verify:bte:core`; terminal `npm --prefix projects/domainspec-v2/impl run verify:bte` | ASHBY-007; ASHBY-010 |
| ICR-BTE-005 | Work-pack literal requires `integrated BTE/IOLM/Body War receipts`; gaps say IOLM remains blocked and Body War is `not yet executed`. | CRITICAL for backend exit. No genuine fresh independently produced consumer receipts exist. | After `verify:bte:core`, the independently governed IOLM and Body War owners run their admitted consumer gates and return fresh receipt handles. Schemas/negative fixtures test only the consumer-manifest validator; they cannot satisfy exit. SWU-BTE-010 consumes those handles, compares exact profile/obligation/test/result IDs, raw digests, and non-admission posture, and owns `verify:bte:consumers`; missing either real receipt keeps the terminal gate blocked. Terminal `verify:bte` composes core plus consumer validation. | After BTE core and each consumer's own gate. `npm --prefix projects/domainspec-v2/impl run verify:bte:consumers`; consumed by terminal `verify:bte`. | ASHBY-011 |

## Shortest backend order and exact exit lock

1. Preserve v1; execute existing SWU-BTE-001 -> 002 -> 003 -> 004 for kernel, successor profile, adapter, and corpus.
2. Execute existing W2 `SWU-BTE-009` for ICR-BTE-002R's dedicated strict minted edge resolver against the accepted successor profile; code tags remain optional evidence.
3. Execute SWU-BTE-005 -> 006 -> 007 for independent denominator, derivation/execution, exact comparator, and 16 mutant kills.
4. SWU-BTE-008 produces `verify:bte:core` and its non-admitting core receipt.
5. After the green core receipt, the independently governed IOLM and Body War owners perform their own runs and return fresh receipt handles.
6. SWU-BTE-010 validates those external handles via `verify:bte:consumers`; terminal `verify:bte` composes core plus consumers.

Terminal backend exit requires: `kinds=13/13`; causal signatures `=16/16`; `O_spec=O_gen=T_gen=E_run=16`; killed mutants `=16`; `skips=todos=needs_formal=orphans=unrunnable=survivors=0`; `verify:bte:core` green; and fresh, exact, independently produced BTE, IOLM, and Body War non-admitting receipts. Receipt schemas and fixtures prove only validator behavior.

### DEFER / REJECT

| ID | Final scope | Literal evidence and resolution | Validation |
| --- | --- | --- | --- |
| ICR-DR-001 | REJECT — CORRECTED CANDIDATE PENDING RE-AUDIT | `LanguageFunctorialSemantics` calls itself a `capability / MAP artifact` and says it `does not license any claim about a running system`. No Lean/categorical-language dependency enters v2. | No validation command exists until a concrete v2 consumer seam is admitted. The unsafe Lake command is excluded from v2 acceptance. |
| ICR-DR-002 | DEFER — CORRECTED CANDIDATE PENDING RE-AUDIT | Corpus proposal says `Nothing here is validated` and leaves its implementation fork open. It is not runtime authority; reconsider only under `TASK-GCP-GRAPH-LAWS` after L0/L1 with an admitted machine fixture, verifier API/stable codes, and executable consumer test. | No validation command exists until that concrete seam is admitted. |
| ICR-DR-003 | MIXED DEFER/REJECT — CORRECTED CANDIDATE PENDING RE-AUDIT | Defer bounded `MergeResidue`, `DecisionTraceResidue`, `HistoryContinuationCriterion`, and `LedgerEventResidue` prior art until an admitted L2 oracle/consumer/test exists. Reject `SourceLedgeredAmalgamationResidue` from this build because its source-ledger authority/provenance reading is governance-only and not system-wired. | No validation command exists until a concrete seam is admitted. No Lean-only check counts as v2 evidence. |

Lean `USE-NOW` remains only mapped discipline, never runtime evidence: explicit target inclusion informs ICR-S1-007; count-preserving separation informs ICR-S1-006 mutants; false-goal retirement informs ICR-S1-001's typed block.

## Original 15-ID verifier disposition appendix

The appendix preserves the exact dispositions issued against the original draft IDs. “Resolution” states how this final candidate incorporated both reports.

| Original ID | Rittel | Capucci | Concrete resolution |
| --- | --- | --- | --- |
| ICR-S1-001 | REVISE | REVISE | Restored pending owner gate; made machine source conditional; fixture input is non-oracle; exact blocked type/code and workspace command added. |
| ICR-S1-002 | REVISE | REVISE | Moved O_spec to validation-owned contract evidence; bounded adapter validates generated views back to authored connection/raw digests/registry; shared legacy IR remains unchanged. |
| ICR-S1-003 | REVISE | REVISE | Removed Markdown-parser extension and extra Boolean breadth; evaluator consumes typed machine object directly with equality-only first seam and workspace test. |
| ICR-S1-004 | REVISE | REVISE | Removed parallel GraphBinding and assumed synthetic runtime; extended existing Binding/BindingSet with exact-one/freshness and added Task Session runtime-admission gate. |
| ICR-S1-005 | REVISE | ACCEPT | Retained gap; made strict mode opt-in; required child Vitest execution joined by obligation/test/result IDs; corrected workspace command. |
| ICR-S1-006 | REVISE | ACCEPT | Retained distinct non-admitting receipt; verifier now recomputes raw artifact bytes rather than trusting receipt fields; corrected workspace command. |
| ICR-S1-007 | ACCEPT | REVISE | Selected only `verify:evf-s1`; removed unproven S1 required-check manifest; ordinary `validate` joins only after green closure. |
| ICR-BTE-001 | REVISE | REVISE | Preserved v1; moved all breadth to accepted successor profile and existing SWU-BTE-001..004 order; added unsupported-kind negative and workspace command. |
| ICR-BTE-002 | REVISE | REFUTE | Original candidate removed from survivors. No second selected-16 manifest or code-tag backend authority. New replacement is ICR-BTE-002R, a strict minted edge resolver over accepted profile, registry, and independent edge JSON. |
| ICR-BTE-003 | REVISE | ACCEPT | Named validation-owned O_spec path/schema/receipt and exact comparator fields; kept criteria authority in canonical YAML and existing SWU-BTE-005..007. |
| ICR-BTE-004 | ACCEPT | REVISE | Split core and terminal commands: `verify:bte:core` before consumer proof, terminal `verify:bte` after actual consumer evidence; retained approved BTE check manifest as evidence only. |
| ICR-BTE-005 | ACCEPT | REVISE | Schemas/fixtures now test validator only; backend exit requires actual independently produced fresh IOLM and Body War receipts after core. |
| ICR-DR-001 | REVISE | ACCEPT | Kept rejection; removed unsafe Lake/v2 acceptance command; no command until a concrete v2 seam exists. |
| ICR-DR-002 | REVISE | ACCEPT | Kept defer; removed false current regression command; named prerequisites and no command until a concrete seam exists. |
| ICR-DR-003 | REVISE | ACCEPT | Kept one mixed ID but made internal split exact: bounded four-model L2 defer versus governance-only source-ledger rejection; removed imprecise toy claim and Lean command. |

## Final-candidate closeout

The corrected package keeps the S1 chain atomic and minimal, makes the unresolved human decisions visible, and prevents evidence surfaces from becoming authority. Backend breadth begins only after a replayable S1 receipt, preserves v1, follows the existing successor-profile SWUs, replaces the refuted code-tag route, and orders W2 edge proof before core verification and independently governed consumer proof. Status remains **CORRECTED CANDIDATE — PENDING RE-AUDIT**.
