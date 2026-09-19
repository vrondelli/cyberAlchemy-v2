# Capucci scope and non-vacuity verification

- Dispatch: `2026-07-20-evf-implementation-completion-review`
- Reviewer: Capucci, Matteo
- Lens: critical-path relevance, scope minimality, authority separation, and non-vacuity
- Corpus: frozen 61-target manifest, frozen build baseline, three attack returns, Lean reuse inventory, and draft findings
- Posture: read-only verification; no target or finding was edited

## Verdict

The draft is directionally correct but is not promotable unchanged. Dispositions:

- `ACCEPT`: 6
- `REVISE`: 8
- `REFUTE`: 1

The seven S1 rows describe the smallest complete **evidence chain**, but they must remain implementation subtasks inside the already selected atomic `SWU-GCP-001`; they are not seven separately authorized SWUs. No backend row may start before one replay of the corrected S1 chain is verified and a backend Task Session selects one dependency-ready BTE SWU.

The controlling authority rule is:

> Domain semantics must be authored in an admitted machine source and validated by its machine contract. Derivation and generation may preserve, normalize, evaluate, and verify those semantics; they may not originate them. Fixtures, `O_spec`, generated graphs, tests, results, and receipts are evidence or read models, never semantic or release authority.

The current baseline is non-vacuous only at component scope: `engine:test` is 107 passing tests, `typecheck` passes, and `validate:rels` loads 30 canonical signatures, while `TASK-SESSION-RESULT.md` remains `BLOCK`, the Rule source contains only `formal_return_type`, `derive` never traverses `graph.edges`, and `emit-tests` can return zero with todos/skips or an empty suite. The review therefore correctly rejects completion, but several proposed repairs overstep the admitted architecture.

## S1 dispositions

### ICR-S1-001 — REVISE

**Critical-path / non-vacuity.** A machine-owned predicate is the first causal dependency. `rule-body.schema.json` requires only `formal_return_type`; `has-key-rule.json` supplies only that field; `TASK-SESSION-RESULT.md` lines 30-35 records the absent predicate and fixture-input source as the acceptance-critical blocker. Without an authored predicate, every later obligation, test, evaluator verdict, and positive receipt is vacuous.

**Scope/dependency evidence.** `DEC-GCP-001` is still `status: pending` and owner `user`. Option 2 changes shared schemas/compiler/fixtures and explicitly exceeds the current L0 evidence-only write scope; option 3 can produce only a blocked receipt. The work-pack says implementation is not execution-authorized and existing test edits require Task Session confirmation.

**Missing evidence.** No owner selection admits option 2 or any equivalent machine predicate contract. The proposed `specs/key-and-door/fixtures/` root is not part of the frozen minted source contract or approved L0 write scope.

**Required revision.** Do not state “extend the Rule schema” as already selected. Make the candidate conditional on an owner-approved machine-source decision and refreshed Task Session scope. The admitted Rule source must own a validated typed predicate (for example, a minimal equality over a Boolean variable). Keep fixture **inputs** in the existing binding/evidence boundary unless a fixture source root is separately admitted; do not author an expected output in the fixture. Until that gate closes, the only valid result is `blocked / FORMAL_PREDICATE_MISSING`.

### ICR-S1-002 — REVISE

**Critical-path / non-vacuity.** The minted-to-engine bridge is necessary. `src/index.ts::deriveFeature` parses Markdown/normalized `SPEC.md`; `src/rules/index.ts::derive` enumerates node-derived rules without reading edges; the legacy `EdgeType` comment reverses canonical `enforces`, while `relationships.yml` lines 84-97 admits `Rule -> Operation`. An edge-removal or endpoint mutation therefore cannot currently affect an obligation.

**Scope/dependency evidence.** `graph.schema.json` labels the graph `generated-semantic-read-model`; `source-manifest.json` is a generated provenance read model. `WORK-PACK.md::GCP-B-002` defers general closed-union admission changes until after L0. S1 depends on the admitted predicate from revised ICR-S1-001 and canonical relationship admission.

**Missing evidence.** The draft does not show how a derived graph is checked back to the authored node connection and relationship registry before obligation derivation. It also proposes repairing the shared legacy IR in L0 despite the explicit defer.

**Required revision.** Add a bounded minted adapter with L0-local types; do not generalize or replace the legacy `ConceptGraph`/closed unions in this slice. Validate the generated graph and manifest against the authored source connection, source digests, and canonical relationship signature, then derive exactly one edge-anchored obligation. Treat independent `O_spec` as validation evidence, not a second semantic authority. Include edge/source/graph/predicate/rule-set lineage in the obligation key, but leave general profile admission to L1/BTE.

### ICR-S1-003 — REVISE

**Critical-path / non-vacuity.** A machine-verifiable predicate evaluator is required so expected behavior is not copied from runtime output. Current `parseFormal("has_key == true")` falls through to `unparsed`; `EvalEnv.vars` excludes Boolean values; `evalArith` returns only an arithmetic result or `null`.

**Scope/dependency evidence.** The design says the first proof uses structural and local evaluation; graph, temporal, and general semantic evaluator families are future extension points. The current `formal/ast.ts` parser is explicitly a parser of Markdown `Formal` cells. S1 depends on the machine predicate contract admitted by revised ICR-S1-001, not on a new textual formula dialect.

**Missing evidence.** No need is shown for inequality or connective grammars in the key-door slice, and extending `parseFormal` would make a Markdown/string path capable of originating the very semantics the review requires to live in machine source.

**Required revision.** Do not extend the Markdown parser for S1. Validate and evaluate the typed predicate object read from the admitted Rule source. Implement only the operator needed by the source contract (`eq(var("has_key"), bool(true))`, plus total typed failure); add Boolean fixture-input support and true/false/operator/literal/input mutants. Any broader Boolean language belongs behind a later admission decision.

### ICR-S1-004 — REVISE

**Critical-path / non-vacuity.** Unique and fresh binding is necessary. Current `Binding` lacks stable obligation/runtime/input digests and `bindingFor` returns the first subset match, so order, ambiguity, and staleness are invisible.

**Scope/dependency evidence.** The engine already has a machine binding sidecar contract and fixture-input boundary in `src/bindings/index.ts`; its comments correctly state that fixture data is input, not an oracle. `TASK-SESSION-RESULT.md` reports `adapter: none`, and the frozen key-door corpus contains no runtime implementation target. This row depends on revised ICR-S1-002/003 and on an explicitly admitted runtime adapter.

**Missing evidence.** There is no authorization or existing machine contract for a parallel `GraphBinding` type, the proposed fixture-local `runtime/key-and-door.ts`, or a claim that such a synthetic runtime represents the real `UnlockDoor` operation.

**Required revision.** Extend and validate the existing `Binding`/`BindingSet` contract for the selected S1 mode rather than create a parallel binding authority. Require exactly one match and bind stable IDs plus obligation, adapter/version, runtime module/symbol, graph/source/predicate/fixture digests. A Task Session must select an existing real runtime target or explicitly admit an evidence-local adapter and narrow the receipt claim to that adapter; absence remains a typed block.

### ICR-S1-005 — ACCEPT

**Critical-path / non-vacuity.** Exact current evidence supports this row: `emitTests` emits `it.todo`; `emitHybridTests` emits counted `it.skip` gaps; `cli.ts::runEmitTests` writes/prints the file and returns `0` without executing it. Requiring exactly one generated assertion, actual Vitest execution, exact test/result identity, and nonzero failure for empty/gapped/unrunnable output closes a real handoff rather than adding governance.

**Scope/dependency evidence.** This is the existing emitter/CLI/test surface, remains bounded to one S1 obligation, and follows the admitted predicate, evaluator, and binding/runtime decisions in revised ICR-S1-003/004. The strict behavior must be opt-in for S1 so legacy gap-reporting behavior is not silently redefined.

### ICR-S1-006 — ACCEPT

**Critical-path / non-vacuity.** The current residue receipt explicitly says it is structural; the minted conformance receipt has `release_admission: "not-granted"` and no obligation/binding/test/evaluator chain. A distinct replay verifier that recomputes all handoff digests and kills predicate, endpoint/direction/signature, and stale-input mutants is the minimum evidence that the arrows compose.

**Scope/dependency evidence.** This row follows actual generated-suite execution in ICR-S1-005 and reuses the current receipt/replay pattern without relabeling either current receipt. Its output is evidence only and must retain an explicit non-admission posture. Verification must recompute from admitted source and raw execution artifacts, not merely compare internally self-reported digest fields.

### ICR-S1-007 — REVISE

**Critical-path / non-vacuity.** A named fail-closed command is necessary: root `package.json::validate` omits `engine:test`, `typecheck`, and any S1 proof target, while the engine package exposes only generic `vitest run`. A missing target can therefore remain green.

**Scope/dependency evidence.** The plan requires the completed S1 check to join the ordinary required surface only after Task Session implementation. The S1 work-pack does not approve a separate required-check-manifest architecture; `package.json` is already the machine command contract.

**Missing evidence.** The draft does not show that a new manifest is needed rather than duplicating package-script ownership, and the review sources use three names (`graph:proof`, `validate:evf-s1`, `verify:evf-s1`) without an admitted command decision.

**Required revision.** Select one canonical command—`verify:evf-s1` is acceptable—and implement it first as a package-script aggregate over the focused replay/verifier plus required regressions. Add red subprocess tests for missing/empty/omitted targets. Introduce a separate manifest only if the executable design proves package scripts cannot provide check enumeration and result identity. Add the command to ordinary `validate` only when the S1 Task Session closes green; do not make the currently blocked branch permanently fail its existing aggregate.

## Backend dispositions

All backend candidates are `BUILD-NEXT`. “After S1” means after the corrected `verify:evf-s1` produces a replay-verified non-admitting receipt and a separate BTE Task Session selects exactly one dependency-ready SWU. S1 does not authorize backend mutations.

### ICR-BTE-001 — REVISE

**Critical-path / non-vacuity.** Exact 13-kind profile admission, one positive node per kind, and one discriminating mutant per 16 criterion are necessary; the current v1 node schema branches only over Entity/Event/Operation/Rule.

**Scope/dependency evidence.** The BTE plan accepts successor profile `feature-with-independent-node-and-edge-files@1` and explicitly says current `feature-with-independent-node-files@1` remains unchanged historical evidence. Its work-pack orders shared criterion kernel (`SWU-BTE-001`), profile binding (`002`), adapter (`003`), then corpus (`004`), one SWU per Task Session.

**Missing evidence.** The draft says to “extend minted node admission/adapters” and marks current `node.schema.json` for fixing, which can widen v1 in place. It also collapses four dependency-ordered SWUs into one candidate execution.

**Required revision.** Preserve the current v1 schema/profile. Bind a successor profile machine contract to the canonical 13 YAML schema paths/digests, extract/reuse the shared criterion kernel, add the successor adapter, and only then build the 13-positive/16-mutant corpus. Execute these as the existing SWU sequence, never as one broad Task Session.

### ICR-BTE-002 — REFUTE

**Critical-path / non-vacuity.** The need for 16 causal edge witnesses is real, but the proposed implementation is the wrong authority and duplicates an accepted machine contract.

**Scope/dependency evidence.** The BTE plan already binds the exact 16 signatures in the accepted successor profile and requires independent edge JSON roots/resolver behavior. `check-code-tag-composability.ts` consumes extracted code tags and has only seven call-semantics mappings; its `CT-COMP-024` gap is intentionally non-blocking in generic mode. Relationship and code-tag checks are consumers of the profile, not profile authority.

**Missing evidence.** No evidence shows that all 16 structural backend signatures should acquire code-call semantics, that a second selected-16 manifest is needed, or that the code-tag checker is the admitted minted-edge resolver.

**Required replacement.** Remove the proposed new selected-16 manifest and backend mode from the code-tag checker. Implement `verify:bte:signatures` over the accepted successor-profile signature set, canonical relationship registry, independent edge records, and the dedicated minted edge resolver. Require exact-set equality, traversal, provenance, removal, and wrong-endpoint controls. Code-tag composability may contribute optional consumer evidence only for signatures with admitted call semantics; unsupported call semantics must not define structural profile failure.

### ICR-BTE-003 — ACCEPT

**Critical-path / non-vacuity.** This directly instantiates the BTE completeness equation and prevents the engine from choosing its own denominator. Exact ID-set equality across independently owned `O_spec`, `O_gen`, generated tests, executed results, and 16 distinct killed mutants rejects missing, extra, duplicate, orphan, skipped, unrunnable, and survivor false greens.

**Scope/dependency evidence.** It matches BTE `SWU-BTE-005..007` and follows corrected profile/kernel/corpus plus the replacement strict signature verifier. `O_spec` must remain a validation-owned evidence catalogue anchored to canonical YAML criterion IDs and digests; it may enumerate expected obligations but may not author or alter domain criteria.

### ICR-BTE-004 — REVISE

**Critical-path / non-vacuity.** A fail-closed aggregate and required-check manifest are explicitly approved BTE delivery, and omission/missing/empty/stale red controls are necessary.

**Scope/dependency evidence.** The BTE work-pack orders core integration `SWU-BTE-008` before integrated consumer manifest `SWU-BTE-010`; the latter depends on `008` and `009`. The draft instead makes the only backend aggregate depend on consumer receipts, reversing that order.

**Missing evidence.** There is no core aggregate for consumer owners to replay before producing their evidence, creating a dependency inversion between ICR-BTE-004 and ICR-BTE-005.

**Required revision.** First add `verify:bte:core` after corrected BTE-001/002 and accepted BTE-003; it must bind profile, criteria, signatures, denominator, generation, execution, mutation, and core receipt verification. Then run consumer proof. Finally make terminal `verify:bte` compose `verify:bte:core` with `verify:bte:consumers`. The required-check manifest records executed checks/results; it does not become profile or release authority.

### ICR-BTE-005 — REVISE

**Critical-path / non-vacuity.** Genuine IOLM and Body War receipts are necessary for the stated backend exit, but only as downstream evidence. The work-pack explicitly calls them proof surfaces, not authorities, and records both as active gaps.

**Scope/dependency evidence.** BTE execution order puts independent closure and consumer proof after the core aggregate. `G-BTE-005` says IOLM cannot claim authoritative FPR graph input until its own gate passes; `G-BTE-006` says Body War has not executed. Consumer validation therefore depends on corrected ICR-BTE-004 core and the consumers' own gates/runs, not merely ICR-BTE-003.

**Missing evidence.** The proposed receipt “fixtures” could satisfy a validator without proving either consumer ran, and no consumer-owned current receipt exists in the frozen corpus.

**Required revision.** Add schemas and negative fixtures only to test the consumer-manifest validator. Backend exit must require actual independently produced, fresh consumer receipts from their admitted runs. Compare exact profile/obligation/test/result IDs, digests, and explicit non-admission posture; never copy consumer data into profile authority or allow receipts to select criteria. Keep `verify:bte:consumers` after `verify:bte:core`, and leave the terminal gate blocked while either consumer receipt is absent.

## Defer/reject dispositions

### ICR-DR-001 — ACCEPT

The rejection is correct and non-vacuous. The Lean language files explicitly disclaim running-system proof, and the frozen v2 corpus has no parser/profile/normalizer consumer for them. No v2 code or runtime dependency should be added. A successful Lean build proves only the Lean models.

### ICR-DR-002 — ACCEPT

The defer is correct. The corpus typed-graph proposal says it is unvalidated and leaves its implementation fork open, while v2 already owns machine relationship, node, connection, and generated-graph contracts. Importing it would duplicate authority and move L2 closure/forbidden-composite work into S1. Reconsider only under `TASK-GCP-GRAPH-LAWS` after L0/L1 with an admitted oracle and executable consumer.

### ICR-DR-003 — ACCEPT

The mixed defer/reject is precise enough: merge/trace/continuation models may remain L2/L3 prior art after a current consumer and independent oracle exist; source-ledgered governance work is rejected from this build. None supplies an S1 obligation, runtime binding, local predicate evaluator, execution result, or receipt verifier, and no Lean-only check counts as v2 evidence.

## Promotion conditions for the draft

Before promotion, revise the candidate table and acceptance lock so that:

1. DEC-GCP-001 remains a real owner gate; the findings do not silently choose shared-schema option 2.
2. Machine Rule source owns the predicate; a typed validator/evaluator verifies it; no Markdown parser, generator, fixture expected-output, `O_spec`, runtime output, or receipt originates semantics.
3. S1 uses a bounded minted adapter and the existing binding surface; it does not generalize legacy IR, invent a parallel binding authority, or assume a synthetic runtime target.
4. The corrected seven-step S1 chain closes atomically under one Task Session and one canonical command before any BTE Task Session starts.
5. The current minted v1 profile remains unchanged; backend breadth uses the accepted successor profile and its existing 13-kind/16-signature machine contract.
6. The code-tag checker is not promoted into backend signature authority.
7. Core backend verification precedes consumer proof; actual consumer receipts are evidence and preserve non-admission posture.
8. Lean proposals/theorems and governance-only artifacts remain outside runtime completion claims.

With these changes, the candidate set becomes both scope-minimal and non-vacuous: every retained S1 boundary is needed to establish the causal claim, backend breadth begins only after that claim is replayable, and no evidence surface is promoted into authority.
