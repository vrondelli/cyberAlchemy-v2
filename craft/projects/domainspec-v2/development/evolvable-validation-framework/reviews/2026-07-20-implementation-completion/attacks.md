# Implementation-completion attack returns

Dispatch: `2026-07-20-evf-implementation-completion-review`

## Frozen-corpus coverage manifest

- Manifest targets: **61/61 present**.
- Working-tree SHA-256 verification: **61/61 match; 0 mismatches**.
- Category coverage: 1 relationship machine definition; 6 EVF review targets; 2 backend completion plans; 5 validator/composability gates; 2 package gates; 4 minted machine contracts; 11 key-door machine fixtures/read models; 30 engine sources/tests.
- Attack-return coverage: **3/3 present**, reproduced verbatim below.
- Verifier-report coverage: **2/2 present**, reproduced verbatim after the attack returns.
- Evidence boundary: the frozen paths and digests in `corpus-manifest.json`; the Lean window is contextual evidence under the separate pinned manifest, not running-v2 proof.

## Source: `returns/attack-ashby.md`

# Ashby coverage attack: implementation-completion review

- Dispatch: `2026-07-20-evf-implementation-completion-review`
- Reviewer: Ashby, W. Ross
- Posture: read-only attack over the frozen corpus; governance-only completion is excluded
- Verdict: **BLOCK** for S1 and **BLOCK** for the backend exit contract

The current packages have useful, green component checks. They do not yet form a
closed control loop from the authoritative minted edge to an independent
obligation, fresh binding, executed generated test, evaluator verdict, and typed
receipt. The backend target is further away: the frozen corpus contains neither
the exact 13-kind/16-signature machine profile nor the independent 16-obligation
denominator, 16 executed tests, 16 killed mutants, zero-gap aggregate, or consumer
receipts.

## Corpus integrity

All **61/61** paths in `corpus-manifest.json` matched their recorded working-tree
SHA-256. No reviewed target was modified.

The separate Lean window was cross-read. Its SHA-256 is
`3c8edd2d8e48e55ec9c8b7d503d20ed78d8bdb7cf2272a8e4dbfc3d09e542f33`.
It enumerates 111 Lean-repository commits, but contains no path matching
`projects/domainspec-v2`, `evolvable-validation-framework`,
`test-derivation-engine`, or `backend-type-test-engine-completeness`. It is
therefore context, not evidence for any EVF or backend implementation gate.

## Target coverage

### S1 acceptance contract

| Required observation | Frozen evidence | Status |
| --- | --- | --- |
| Deterministic `enforces` obligation tied to the authored edge, source anchors, and content digests | Minted graph/build digests exist; engine obligations have no `source_edge_id`, graph digest, fixture digest, or rule-set version | **uncovered** |
| Independent expected obligation fixture | `expected/graph.json` and build views exist; no expected obligation catalogue exists | **uncovered** |
| Machine-authored predicate and fixture, or an explicit block | Rule body contains only `formal_return_type: boolean`; decision and Task Session remain blocked | **blocked honestly** |
| Positive generated test executes against a runtime target | Hybrid files are transpile-checked only; default files are `it.todo` | **uncovered** |
| Predicate mutation fails | No predicate is expressible for key-and-door | **uncovered** |
| Endpoint/signature mutation fails through the same S1 aggregate | Compiler/conformance endpoint controls exist, but are not joined to derivation/execution/receipt | **component-only** |
| Stale graph/fixture/binding fails | Build-view stale graph/source controls exist; binding has no graph or fixture digest | **component-only** |
| Structural and execution evidence are separate | Structural residue and minted build-conformance receipts exist; no S1 execution/evaluator envelope exists | **uncovered** |
| Selected slice has zero skip/todo/`needs_formal` | Existing tests positively assert todos/skips; CLI returns zero with gaps | **failed** |

### Backend exit contract

| Required observation | Frozen evidence | Status |
| --- | --- | --- |
| `Kinds_profile = Kinds_exercised = 13` | Minted node schema and key-and-door corpus exercise 4 kinds | **uncovered** |
| 16/16 selected backend signatures causally exercised | Global registry has 30 active signatures; key fixture has 3 edges and the second conformance fixture adds 1 edge; no selected-16 manifest or causal matrix exists | **uncovered** |
| `O_spec = O_gen = T_gen = E_run = 16` | No machine-owned `O_spec`; no minted-graph `O_gen`; no executed generated-suite denominator | **uncovered** |
| 16 killed mutants | Compiler/build damage controls exist, but no one-mutant-per-obligation kill matrix | **uncovered** |
| zero skips/todos/orphans/unrunnable | Current emitters intentionally produce and accept skips/todos | **failed** |
| fail-closed aggregate | No package script composes source/profile, denominator, generation, execution, mutation, receipt verification, and missing/empty/stale red controls | **uncovered** |
| BTE/IOLM/Body War receipts | Work-pack records IOLM and Body War as active gaps; no receipts are in the frozen corpus | **uncovered** |

## Current green baseline versus what it detects

The frozen commands were replayed from `projects/domainspec-v2/impl`:

| Command | Replay | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `npm run engine:test` | PASS, 10 files / 107 tests | existing Markdown/aspect parser, current derivation rules, formal arithmetic, emitter text, minted build conformance, deterministic component behavior | minted graph-to-obligation derivation, execution of generated tests, zero gaps, independent denominator, 13/16 breadth |
| `npm run typecheck` | PASS | current TypeScript compiles | runtime or evidence completeness |
| `npm run validate:rels` | PASS, 5 specs / 34 edges / 30 canonical signatures | Markdown endpoint-shape and schema-participation validation | selected backend 16, causal implementation behavior, obligation/test/receipt coverage |

Supplemental package replays also passed: `npm run tools:test` (136 tests) and
`npm run tags:test` (15 tests). They do not change the verdict. They are not part
of the frozen baseline aggregate, and the frozen composability test deliberately
expects an unsupported active signature to be a non-blocking green result.

A minimal happy path is insufficient because no package-level gate currently
requires all handoffs to have occurred. One compiler test can prove that an edge
is well-shaped while the deriver ignores it; one emitter test can prove that text
transpiles while Vitest never runs it; one build receipt can be fresh while the
binding is stale; one green relationship check can leave most call semantics
unsupported. Completion requires a single fail-closed detector over the joined
chain, plus red controls that break every join.

## Dependency-ordered critical path

1. **D0 — Formal source gate.** Resolve `DEC-GCP-001` into a machine source and
   fixture contract, or preserve a machine-readable blocked receipt. Markdown may
   not become the assertion oracle.
2. **D1 — Minted graph adapter and lineage.** Adapt `minted-graph/v1` plus source
   manifest into the engine IR, retaining edge identity and digests. Freeze an
   independent expected `enforces` obligation fixture.
3. **D2 — Predicate evaluator.** Add the smallest boolean predicate AST/evaluator
   needed for `has_key == true`; add positive/negative fixture inputs and predicate
   mutation.
4. **D3 — Fresh, unique binding.** Bind exactly one obligation to exactly one
   runtime and fixture, with graph/source/fixture digests. Reject missing,
   ambiguous, duplicate, or stale bindings.
5. **D4 — Execute generated tests.** Generate the selected S1 suite, run it under
   Vitest, capture test identity/result, and reject all skip/todo/`needs_formal` in
   the selected slice.
6. **D5 — Receipt and red controls.** Emit separate structural, execution, and
   evaluator evidence; verify the receipt; prove predicate, endpoint, signature,
   source, fixture, graph, and binding mutations fail.
7. **D6 — Backend formation denominator.** Freeze the exact 13-kind profile, 16
   YAML criteria, 13 positive nodes, and one distinct mutant per criterion.
8. **D7 — Independent denominator and breadth.** Freeze machine-owned `O_spec=16`,
   derive `O_gen` from minted graph/source inputs, and build the causal 16-signature
   matrix with removal and endpoint negatives.
9. **D8 — Backend aggregate.** Enforce exact-set equality, 16 generated/executed
   tests, 16 killed mutants, and zero skips/todos/orphans/unrunnable/survivors.
10. **D9 — Consumers.** Bind BTE, IOLM, and Body War evidence by exact identity,
    digest, and non-admission posture; reject missing/stale/extra/duplicate/skipped
    consumer evidence.

## Findings

### ASHBY-001 — The public engine entrypoint cannot consume the authoritative minted graph

- Severity: **BLOCKER**
- File + symbol: `impl/test-derivation-engine/src/index.ts::deriveFeature`, lines 23-33; `src/rules/index.ts::derive`, lines 696-720
- Literal evidence: `const { graph } = parse(featureDir);` followed by
  `const obligations = derive(graph, ...)`; `derive` enumerates node-derived rules
  and never reads `graph.edges`.
- Failure: the authoritative
  `key-and-door.edge.has-key-rule-enforces-unlock-door` can be present, removed, or
  changed without being the cause of an engine obligation. `deriveFeature` also
  discards parser violations by destructuring only `graph`.
- Exact code/test request: add
  `src/minted-project/derive.ts::deriveMintedGraph(graph, sourceManifest, rules)`;
  retain edge identity, source path/digest, graph/source-set digests, and rule-set
  version in each obligation. Add
  `src/minted-project/enforces-derivation.test.ts` with an independently authored
  `expected/obligations.json`; assert byte stability and assert edge removal,
  signature change, wrong endpoint, and source-digest change each fail or change
  the exact obligation set.
- Dependency: D1 after D0's source contract is selected; prerequisite to every
  later S1 and backend derivation gate.
- Command: `npx vitest run src/minted-project/enforces-derivation.test.ts`

### ASHBY-002 — The engine IR cannot carry the required edge and digest lineage

- Severity: **CRITICAL**
- File + symbol: `impl/test-derivation-engine/src/ir/types.ts::EdgeType` and
  `Obligation`, lines 33-40 and 93-100
- Literal evidence: the legacy union says
  `"enforces" // Operation --enforces--> Invariant`, while current authority says
  `Rule --[enforces]--> Operation` in `definitions/relationships/relationships.yml`,
  lines 84-97. `Obligation` contains only key, rule type, source anchor, params, and
  description.
- Failure: the frozen types cannot represent the authoritative S1 direction or
  prove which edge and source bytes caused an obligation. A stable hash over an
  incomplete payload is stable but not sufficient evidence.
- Exact code/test request: replace the closed legacy edge assumption at the minted
  boundary with an admitted relationship record; add `source_edge_id`,
  `source_edge_digest`, `graph_digest`, `source_set_digest`, and
  `rule_set_version` to graph-backed obligations. Add a compile-time and runtime
  test for the canonical Rule-to-Operation direction and reject the legacy reverse.
- Dependency: D1; must land with ASHBY-001.
- Command: `npm run typecheck && npx vitest run src/minted-project/enforces-derivation.test.ts`

### ASHBY-003 — No key-and-door predicate is authored, and the formal stack cannot evaluate the proposed boolean form

- Severity: **BLOCKER**
- File + symbol: `impl/spec/minted-project/formations/rule-body.schema.json`, lines
  5-9; `src/formal/ast.ts::parseFormal`, lines 375-386;
  `src/bindings/index.ts::ClosedFormFixture`, lines 21-27
- Literal evidence: the Rule body requires only `formal_return_type`; comparison
  syntax not handled by the typed ternary/range/count-cap branches ends in
  `return { kind: "unparsed", raw: formal }`; fixture variables are only
  `number | string`.
- Failure: `has_key == true` cannot currently become an expected boolean assertion,
  and no boolean fixture can be supplied through the closed-form fixture type. The
  Task Session correctly records: `missing authored formal predicate blocks
  mutation` (`TASK-SESSION-RESULT.md`, line 23).
- Exact code/test request: after selecting the formal source, add a machine
  predicate object (not Markdown), a boolean `CompareAst`, boolean fixture values,
  pure evaluation, and an emitter branch. Add independent fixtures for
  `{has_key:true}` and `{has_key:false}`; mutate the operator, literal, and fixture
  input separately and require the selected suite to go red. If no source is
  selected, emit and verify an explicit `blocked: needs_formal` receipt instead.
- Dependency: D0 then D2.
- Command: `npx vitest run src/formal/key-and-door-predicate.test.ts src/minted-project/enforces-execution.test.ts`

### ASHBY-004 — Binding resolution is first-match and has no freshness contract

- Severity: **CRITICAL**
- File + symbol: `impl/test-derivation-engine/src/bindings/index.ts::Binding` and
  `bindingFor`, lines 30-41 and 67-81
- Literal evidence: `Binding` has no fixture, graph, source, or obligation digest;
  `bindingFor` says `if (hit) return b`.
- Failure: overlapping entries silently select the first binding, while a stale
  fixture or graph remains indistinguishable from a fresh one. This cannot satisfy
  the design's stale-digest failure boundary.
- Exact code/test request: introduce a validated `GraphBinding` containing exact
  obligation ID/key, adapter ID/version, runtime target, `graph_digest`,
  `source_set_digest`, and `fixture_digest`; make resolution return exactly one
  match or a typed error. Add missing, duplicate, ambiguous-subset, wrong-key,
  stale-graph, stale-source, and stale-fixture tests.
- Dependency: D3 after ASHBY-001/002.
- Command: `npx vitest run src/bindings/graph-binding.test.ts`

### ASHBY-005 — Test generation can exit successfully with no executed assertion

- Severity: **BLOCKER**
- File + symbol: `impl/test-derivation-engine/src/emit/tests.ts::emitTests` and
  `emitHybridTests`, lines 73-90 and 354-433; `src/cli.ts::runEmitTests`, lines
  360-400
- Literal evidence: legacy output is `One it.todo per derived obligation_key`;
  hybrid gaps become `it.skip`; `runEmitTests` prints `coverage_gap` and still
  `return 0`. The emitter test closes with: `A separate end-to-end run against the
  poker-team backend is out of this package's scope` (lines 197-199).
- Failure: syntax/transpile success is mislabeled as runnable evidence. A package
  can be green when every selected obligation is todo, skipped, or never executed.
- Exact code/test request: add strict emission mode for a declared slice that
  rejects any todo/skip/`needs_formal`/unmatched binding before writing; run the
  emitted file under Vitest in a subprocess and capture its result. Add red controls
  for missing runtime export, throwing runtime, wrong expected predicate, skip,
  todo, and empty suite.
- Dependency: D4 after ASHBY-003/004.
- Command: `npm run verify:evf-s1` (new required aggregate; must execute the emitted suite)

### ASHBY-006 — Existing receipts do not attest the S1 chain

- Severity: **CRITICAL**
- File + symbol: `impl/test-derivation-engine/src/residue/receipt.ts::ResidueReceipt`,
  lines 30-50; `src/minted-project/conformance-receipt.ts::MintedProjectConformanceReceipt`,
  lines 49-60
- Literal evidence: the residue receipt contains declaration/rejection/commitment
  lists only. The minted conformance receipt contains fixture digests and case
  results, but no obligation, binding, generated test, execution result, evaluator
  scope, or residue for the proof slice.
- Failure: structural build freshness can pass independently of execution. There is
  no consumer-verifiable assertion that the exact source edge caused the exact
  executed verdict.
- Exact code/test request: add a versioned S1 receipt with separate `structural`,
  `execution`, and `evaluator` envelopes; bind source/edge/graph/obligation/fixture/
  binding/test/result digests and an explicit `pass | fail | blocked` verdict. Add
  replay verification and one digest mutation per handoff.
- Dependency: D5 after D4.
- Command: `npx vitest run src/minted-project/enforces-receipt.test.ts`

### ASHBY-007 — No package-level command detects an incomplete S1 or backend witness

- Severity: **BLOCKER**
- File + symbol: `impl/package.json::scripts`, lines 16-32;
  `impl/test-derivation-engine/package.json::scripts`, lines 8-13
- Literal evidence: root `validate` runs docs, relationships, content, tools, and
  `engine:lint`; `engine:test`, `typecheck`, `tags:test`, generated-suite execution,
  denominator comparison, mutation verification, and receipt replay are not one
  aggregate. Engine `test` is only `vitest run`.
- Failure: component greens can be selected independently and no required-check
  manifest proves that all completion gates ran. Missing and empty witnesses have
  no package-level detector.
- Exact code/test request: add `verify:evf-s1` and `verify:bte` scripts backed by a
  required-check manifest. The commands must fail nonzero for a missing input,
  empty obligation/test/result set, stale digest, skip/todo/needs-formal, orphan,
  unrunnable test, surviving mutant, omitted sub-check, or unverified receipt. Add
  subprocess tests that seed each failure and assert nonzero.
- Dependency: D5 for S1; D8 after ASHBY-008/009 for backend.
- Command: `npm run verify:evf-s1 && npm run verify:bte`

### ASHBY-008 — The frozen minted profile proves four kinds, not the backend set of thirteen

- Severity: **BLOCKER**
- File + symbol: `impl/spec/minted-project/node.schema.json::allOf`, lines 18-34;
  `src/minted-project/conformance.test.ts`, lines 285-288
- Literal evidence: the node schema branches only for `Entity`, `Event`,
  `Operation`, and `Rule`; conformance asserts key-and-door has four nodes. The BTE
  plan states: `The current minted-project profile proves four kinds` and lists the
  missing 13-kind profile work (`PLAN.md`, lines 41-50).
- Failure: generic/meta-type component tests cannot substitute for a minted profile
  census, graph compilation, independent denominator, and execution evidence over
  the same 13 source nodes.
- Exact code/test request: create the successor machine profile with the exact 13
  kind IDs and schema digests; create one positive minted node per kind and 16
  distinct criterion mutants across all eight rule forms. Assert exact set equality
  (not `>=`), deterministic graph/source manifest, and distinct failure codes.
- Dependency: D6 after the shared criterion kernel and profile digest are frozen.
- Command: `npx vitest run src/minted-project/backend-profile.test.ts src/minted-project/backend-formation.test.ts`

### ASHBY-009 — Relationship greens do not establish 16 causal signatures

- Severity: **BLOCKER**
- File + symbol: `impl/governance/tags/tools/check-code-tag-composability.ts::callSemanticsByEdge`,
  lines 45-117; `code-tag-composability.test.ts`, lines 520-538;
  `impl/tools/lib/relationship-signatures.ts::validateRelationshipSpecFile`, lines
  146-245
- Literal evidence: call semantics exist for only seven labels. The test explicitly
  requires unsupported `performs` to exit zero: `payload.ok, true`,
  `blockingIssues, 0`, and report code `CT-COMP-024`. Relationship validation reads
  Markdown tables and checks endpoint shape; it does not run the implementation.
- Failure: `validate:rels` reports all 30 authority signatures loaded, not 16/16
  selected backend signatures causally exercised. A non-blocking unsupported edge
  is an intentional false green relative to the backend exit claim.
- Exact code/test request: freeze a machine-readable selected-16 signature manifest.
  For each signature require a positive edge, traversal result, implementation
  composition witness, edge-removal failure, wrong-endpoint failure, and provenance
  join. Add a backend strict mode in which unsupported call semantics, missing
  witness, extra signature, or duplicate witness is blocking.
- Dependency: D7 after D6 profile/corpus.
- Command: `npm run verify:bte:signatures` (new; must report exactly `16/16`)

### ASHBY-010 — There is no independent machine denominator or 16-mutant execution matrix

- Severity: **BLOCKER**
- File + symbol: `impl/test-derivation-engine/src/index.test.ts`, lines 227-239 and
  286-299; BTE `PLAN.md`, lines 137-158
- Literal evidence: current round-trip reads `TEST-SPEC.md` and allows
  `PASS (at declared scope)` with documented-irreducible missing rows. The backend
  contract instead requires `Criteria_profile = O_spec = O_gen = T_gen = E_run = 16`
  and zero survivors.
- Failure: Markdown cannot own `O_spec`, and a superset/pass-with-residue comparator
  cannot prove exact equality. Compiler/build damage controls are not one killed
  mutant per independently specified obligation.
- Exact code/test request: add a validation-owner-authored JSON `O_spec` catalogue
  with 16 stable IDs, criterion/schema anchors and digests; validate it independently
  before loading engine output. Compare exact sets and counts for `O_gen`, generated
  test IDs, executed result IDs, and mutant kill IDs. Reject missing, extra,
  duplicate, orphan, unrunnable, skipped, and surviving entries.
- Dependency: D7 after D6; consumed by D8.
- Command: `npm run verify:bte:denominator` (new; must print and enforce `16=16=16=16` and `killed=16`)

### ASHBY-011 — Consumer receipt gates are absent, not merely unproven

- Severity: **HIGH** for implementation; **BLOCKER** for the stated backend exit
- File + symbol: BTE `WORK-PACK.md::Blocker And Gap Ledger`, lines 84-97
- Literal evidence: `G-BTE-005` says IOLM remains blocked and `G-BTE-006` says the
  Body War fixture/adapter is not yet executed. No BTE, IOLM, or Body War receipt is
  present in the frozen manifest.
- Failure: the backend result cannot claim consumer integration or exact posture/
  digest parity. Local engine success is not evidence that either consumer can
  replay the same profile and denominator.
- Exact code/test request: define machine receipt schemas and fixtures for BTE,
  IOLM, and Body War, then a consumer manifest validator requiring exact profile,
  obligation/test/result identities, digests, and `non-admission` posture. Seed
  missing, stale, extra, duplicate, skipped, and surviving-evidence controls.
- Dependency: D9 after D8 is green.
- Command: `npm run verify:bte:consumers` (new; included by `verify:bte`)

## Required closeout evidence

S1 may close only when `npm run verify:evf-s1` independently demonstrates:

```text
source edge -> digest-bound obligation -> unique fresh binding
            -> generated assertion -> positive execution -> evaluator verdict
            -> separated structural/execution receipt

selected obligations = generated tests = executed tests = 1
skips = todos = needs_formal = orphans = unrunnable = 0
predicate + endpoint + signature + source + fixture + graph + binding mutants: killed
```

The backend package may close only when `npm run verify:bte` independently
demonstrates:

```text
kinds: 13/13
causal signatures: 16/16
O_spec = O_gen = T_gen = E_run = 16
killed mutants = 16
skips = todos = needs_formal = orphans = unrunnable = survivors = 0
BTE + IOLM + Body War receipts: present, fresh, exact, non-admitting
```

Until those package-level detectors exist and their red controls are proven, the
green component baseline is valid but cannot be promoted to implementation
completion.

## Source: `returns/attack-lawvere.md`

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

## Source: `returns/attack-smithe.md`

# Implementation-completion attack: runtime path and proof closure

Reviewer: Smithe, Toby
Lane: explorer / runtime-path attack
Date: 2026-07-20
Disposition: **BLOCK implementation-completion claim; preserve the narrow S1 slice as the next executable unit.**

## Coverage and integrity

I read every one of the 61 files frozen in `corpus-manifest.json`, including the complete 1,050-line Lean commit-window manifest, and recomputed every manifest SHA-256 digest. Result: **61/61 match**; there is no corpus-integrity exception behind this review.

I also reran the frozen baseline from `projects/domainspec-v2/impl`:

```text
npm run engine:test       PASS: 10 files, 107 tests
npm run typecheck         PASS
npm run validate:rels     PASS: 5 specs, 34 edges, 30 canonical signatures
```

Those passes are real but bounded. They establish that the current legacy engine, type surface, and relationship documents are internally green. They do **not** establish the key-door vertical proof. The live key-door probes below all exited zero while producing no executable proof:

```text
deriveFeature(<minted key-and-door root>)
=> {"obligations":0,"spec":"| Key ...","tests":"... describe(...) {\n});\n"}

cli derive <minted key-and-door root>
=> empty obligation table, exit 0

cli emit-tests <minted key-and-door root>
=> empty describe block, exit 0

parseFormal("has_key == true")
=> {"kind":"unparsed","raw":"has_key == true"}
```

## Actual current call and data path

There are three disconnected paths, not one end-to-end proof path.

```text
Minted JSON nodes/connections
  -> compile/build minted project views
  -> graph.json + source-manifest.json + build-receipt.json
  -> minted conformance receipt
  -> STOP (no obligation, binding, generated test, evaluation, or proof receipt)

Markdown aspect docs or normalized SPEC.md
  -> grammar.parse
  -> legacy ConceptGraph
  -> rules.derive (node-based; graph edges are not traversed)
  -> emitSpec / emitTests [or separately emitHybridTests]
  -> optional parseFormal / evalArith
  -> generated source containing todo/skip on gaps
  -> STOP (no execution and no digest-bound proof receipt)

Code-tag fixture JSON
  -> composability checker
  -> textual operation-calls-rule check
  -> STOP (not joined to the minted graph, obligation, test, or receipt)
```

The key-door fixture enters only the first path. `deriveFeature` enters only the second. The missing minted-graph-to-engine morphism is therefore the primary runtime break.

## Findings

### SMITHE-CRIT-001 — The minted key-door graph never enters derivation

- **Severity:** CRITICAL
- **Exact surface:** `projects/domainspec-v2/impl/test-derivation-engine/src/index.ts::deriveFeature`, lines 23-33; `src/grammar/index.ts::parse`, lines 1093-1140.
- **Literal evidence:** `deriveFeature` begins with `const graph = await parse(featureDir);` and then calls `const result = derive(graph);`. The parser reads aspect Markdown or normalized `SPEC.md`; it has no minted project/graph adapter. The live minted key-door invocation returned `obligations: 0` and an empty test body with status 0.
- **Missing behavior:** No function consumes the compiled minted graph and source manifest as semantic inputs to the derivation engine; an empty parse is accepted as success.
- **One-line code/test fix:** Add a typed `deriveMintedProject(graph, sourceManifest)` adapter and a key-door test that requires exactly one derived obligation and fails on a zero-node/zero-obligation input.
- **Dependencies:** None; this is the first bridge.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-vertical.test.ts -t "derives one obligation from the minted enforces edge"
  ```

### SMITHE-CRIT-002 — Canonical `Rule -> Operation` semantics disappear at the legacy IR boundary

- **Severity:** CRITICAL
- **Exact surface:** `projects/domainspec-v2/definitions/relationships/relationships.yml::enforces`, lines 84-97; `projects/domainspec-v2/impl/test-derivation-engine/src/ir/types.ts::EdgeType/ConceptGraph/Obligation`, lines 33-40 and 63-101; `src/rules/index.ts::derive`, lines 696-729.
- **Literal evidence:** the canonical relationship declares `source_type: Rule` and `target_type: Operation`, with semantics `A rule gates whether an operation may execute.` The legacy IR instead comments `"enforces" // Operation --enforces--> Invariant`. More decisively, `derive` concatenates node-derived obligations and never traverses `graph.edges`.
- **Missing behavior:** The admitted source edge, its direction, its stable source identity, and its relationship signature do not survive into an obligation. Current rule obligations are derived from Rule nodes in isolation.
- **One-line code/test fix:** Introduce a v2 edge adapter/rule that accepts only canonical `Rule --enforces--> Operation`, emits one edge-anchored obligation carrying `source_edge_id` and relationship/rule-set version, and rejects reversed or mistyped endpoints.
- **Dependencies:** SMITHE-CRIT-001.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-vertical.test.ts -t "preserves canonical Rule to Operation direction and rejects endpoint mutants"
  ```

### SMITHE-CRIT-003 — There is no machine-owned executable Boolean predicate

- **Severity:** CRITICAL
- **Exact surface:** `projects/domainspec-v2/impl/tools/schemas/minted-project/rule-body.schema.json`, lines 5-9; `test-derivation-engine/src/formal/ast.ts::FormalAst/parseFormal`, lines 112-121 and 347-383; `src/formal/eval.ts::evalArith`, lines 211-215; `.../decisions/2026-07-20-key-and-door-formal-source.md`, lines 23-45.
- **Literal evidence:** the Rule schema requires only `"formal_return_type": { "const": "boolean" }`; it carries no predicate. `FormalAst` has no Boolean predicate case, and the proposed text `has_key == true` parses as `{kind:"unparsed"}`. The only evaluator exposed here is `evalArith`, returning a decimal result or `null`.
- **Missing behavior:** Nothing machine-readable states or evaluates the rule `has_key == true`; therefore neither the operation nor an independent evaluator can be tested against it.
- **One-line code/test fix:** Extend the machine-owned Rule body with a minimal typed Boolean predicate AST plus typed fixture inputs, add deterministic `evalBool`, and test both true and false inputs.
- **Dependencies:** SMITHE-CRIT-001 and SMITHE-CRIT-002.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/formal/key-door-predicate.test.ts
  ```

**Direct challenge to the pending prior:** decision option 1 makes evidence-local `operations.md` the formal source. That is inadmissible under this review's explicit rule that Markdown is never semantic source, and it would still fail because the proposed expression is unparsed. Use the bounded part of option 2 instead: enrich the machine-owned key-door Rule contract without generalizing every relationship kind.

### SMITHE-MAJ-004 — Bindings are unvalidated, ambiguous, and unbound to input digests

- **Severity:** MAJOR
- **Exact surface:** `projects/domainspec-v2/impl/test-derivation-engine/src/bindings/index.ts::Binding/BindingSet/bindingFor`, lines 30-49 and 63-81.
- **Literal evidence:** `Binding` contains selector and callable fields but no `binding_id`, `obligation_id`, `test_id`, runtime target, graph digest, or fixture digest. `bindingFor` returns the first subset match: `return set.bindings.find((b) => matches(b, obligation)) ?? null;`.
- **Missing behavior:** Duplicate or overbroad bindings are order-dependent; stale graph/fixture inputs cannot be detected; the selected callable cannot be traced uniquely to the derived obligation or generated test.
- **One-line code/test fix:** Validate a strict binding schema, require exactly one match, and bind its stable ID to obligation, graph, predicate, fixture, runtime target, and their digests.
- **Dependencies:** SMITHE-CRIT-002 and SMITHE-CRIT-003.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/bindings/key-door-binding.test.ts
  ```

### SMITHE-CRIT-005 — Test emission is fail-open and does not execute the generated assertion

- **Severity:** CRITICAL
- **Exact surface:** `projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts::emitTests/emitHybridTests`, lines 73-90 and 354-434; `src/cli.ts::runEmitTests`, lines 365-400.
- **Literal evidence:** legacy emission writes `it.todo(...)` for every obligation. Hybrid emission writes `it.skip(...)` when a binding is absent or fails and records a coverage gap, but the CLI prints the result and returns success. Neither emitter executes the generated file.
- **Missing behavior:** Completion can be green with zero assertions, skipped obligations, todo obligations, failed bindings, or an unexecuted generated test.
- **One-line code/test fix:** Add an S1 proof command that requires one runnable assertion, rejects any `todo`/`skip`/`needs_formal`/gap, executes the generated test, and records the runner result.
- **Dependencies:** SMITHE-CRIT-003 and SMITHE-MAJ-004.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-vertical.test.ts -t "executes one generated assertion with zero gaps"
  ```

### SMITHE-CRIT-006 — Existing receipts are not proof receipts

- **Severity:** CRITICAL
- **Exact surface:** `projects/domainspec-v2/impl/test-derivation-engine/src/residue/receipt.ts::ResidueReceipt/buildResidueReceipt`, lines 30-51 and 68-134; `src/minted-project/conformance-receipt.ts::MintedProjectConformanceReceipt`, lines 49-60.
- **Literal evidence:** `ResidueReceipt` accounts for normalized boundary residue; the minted receipt records conformance status, fixtures, cases, and a repeat digest. Neither contains the graph/source/rule-set/obligation/binding/test/evaluator chain, execution verdict, or killed mutations required by `DESIGN.md`'s receipt interface.
- **Missing behavior:** No verifiable artifact proves that the admitted source edge caused one obligation, one bound executable test, an independent evaluation, and the expected positive/negative result over identical digested inputs.
- **One-line code/test fix:** Define and verify an `EvolvableValidationReceipt` carrying all stage IDs/digests, exact counts, execution/evaluator verdicts, zero-gap residue, and named killed mutants; recompute rather than trust fields.
- **Dependencies:** SMITHE-CRIT-001 through SMITHE-CRIT-005.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-receipt.test.ts
  ```

### SMITHE-MAJ-007 — Identity cannot detect rule-set, predicate, edge, or graph drift

- **Severity:** MAJOR
- **Exact surface:** `projects/domainspec-v2/impl/test-derivation-engine/src/identity/keys/index.ts::obligationKey`, lines 22-29; `src/ir/types.ts::Obligation`, lines 93-101.
- **Literal evidence:** the obligation key hashes only the current anchor, rule type, and parameters; the obligation has no `source_edge_id`, relationship/rule-set version, predicate digest, or graph digest.
- **Missing behavior:** A semantic change can retain the same obligation identity, so a stale binding or receipt cannot be rejected reliably.
- **One-line code/test fix:** Version the obligation-key preimage and include stable edge identity, rule-set/relationship version, predicate digest, and graph/source-manifest digest.
- **Dependencies:** SMITHE-CRIT-002 and SMITHE-CRIT-003.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/identity/keys/key-door-identity.test.ts
  ```

### SMITHE-MAJ-008 — The aggregate package gate omits the proof-bearing suites

- **Severity:** MAJOR
- **Exact surface:** `projects/domainspec-v2/impl/package.json::scripts.validate`, lines 17-32.
- **Literal evidence:** `validate` runs docs, relationship, content, tool tests, and `engine:lint`; it does not run `engine:test`, `typecheck`, tag composability, minted instances/conformance, any generated proof test, receipt verification, or mutation gate. `engine:test` exists only as a separate script.
- **Missing behavior:** The package can pass its aggregate gate without running even the present engine tests, much less the S1 vertical proof. A `CLEAN(0)` lint result is possible on an empty input.
- **One-line code/test fix:** Add `validate:evf-s1` for the complete key-door proof and include it, `engine:test`, and `typecheck` in the aggregate gate while keeping broad BTE completeness a separately named release gate.
- **Dependencies:** SMITHE-CRIT-001 through SMITHE-CRIT-006 and SMITHE-MAJ-007.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl run validate:evf-s1 && npm --prefix projects/domainspec-v2/impl run validate
  ```

## Minimal S1 build sequence

This is the smallest sequence that closes the causal chain without pulling the 13-kind/16-signature BTE breadth into the first proof.

1. **Machine semantic contract.** Extend the minted key-door Rule body with a typed Boolean predicate such as `eq(var("has_key"), bool(true))`. Put typed inputs and expected outcomes in a machine-owned binding/fixture artifact. Keep generated `SPEC.md` and any `operations.md` explanatory only.
2. **Minted-to-engine adapter.** Consume the compiled graph and source manifest, admit canonical `Rule --enforces--> Operation`, preserve edge provenance and all input digests, and fail on an empty or unsupported graph.
3. **Edge-based derivation.** Derive exactly one `enforces-operation` obligation from the admitted edge and predicate. Compare `O_gen` against an independently authored one-item `O_spec`; do not derive the expected set with the implementation under test.
4. **Strict binding and evaluator.** Resolve exactly one digest-bound binding to the real key-door operation and evaluate the Boolean predicate independently over the same typed fixture input.
5. **Emit and execute.** Generate exactly one runnable assertion; reject `todo`, `skip`, `needs_formal`, orphan obligations, missing bindings, and coverage gaps; execute the generated test through Vitest.
6. **Proof receipt.** Emit a recomputable receipt with graph/source/rule-set/obligation/binding/fixture/test/evaluator digests, `|O_spec|=|O_gen|=|T_gen|=|E_run|=1`, equality of the obligation sets, zero residue, and the execution/evaluator verdicts.
7. **Three killed mutations.** Run through the same path and record distinct rejection codes for: (a) predicate or operation-bypass mutation, killed by the generated assertion/independent evaluator; (b) reversed or mistyped endpoint, rejected at admission/derivation; (c) stale graph, predicate, binding, fixture, test, or receipt digest, rejected by receipt verification.
8. **Package gate.** Add `validate:evf-s1`, make it deterministic and fail-closed, and include it in the aggregate `validate`. Name the broader 13-kind/16-signature gate separately so S1 cannot be confused with release-wide completeness.

The terminal command for the sequence should be:

```bash
npm --prefix projects/domainspec-v2/impl run validate:evf-s1
```

Its success criteria are one admitted canonical edge, one expected obligation, one generated obligation, one binding, one generated and executed assertion, one independent evaluator result, one verified positive receipt, three killed negative controls, and zero gaps/todos/skips/needs-formal/orphans/stale digests.

## Direct prior challenges

### Ashby: defend the slice; reject the completion inference

The narrow key-door slice is the right first executable unit. Requiring all 13 relationship kinds and all 16 active signatures before the first causal proof would overload the experiment with release-scale variety and make failures hard to localize. But a narrow slice is adequate only if its regulator contains the failure variety that matters to that slice: wrong predicate/operation behavior, wrong endpoint or direction, and stale identity/digest. Without those three negative controls, the slice is a demo, not regulatory evidence. With them, it is a valid S1 pilot—not a package- or release-completeness claim.

### Lawvere: the current diagram does not commute

Naming `Graph`, `Obligation`, `Binding`, `Test`, `Evaluator`, and `Receipt` in a design does not supply the morphisms between them. Today the minted graph cannot map into the legacy `ConceptGraph`; even inside the legacy engine, the `enforces` edge is erased because derivation does not traverse edges. There is therefore no path whose composed output can be compared with a direct semantic evaluation. Completion requires explicit machine-readable adapters and receipt equations over the same digested source, not resemblance between generated artifacts.

The Lean commit-window manifest does not repair this gap. It inventories a 111-commit window containing unrelated formalization/build work, but the frozen corpus contains no checked Lean theorem or generated proof artifact for this key-door edge-to-receipt chain. It is context, not evidence for SWU-GCP-001.

## Verdict

Keep SWU-GCP-001 as the immediate implementation target and keep the vertical slice narrow. Reject any statement that the implementation or package gate is complete on the present evidence. The current repository proves source conformance and several useful components independently; it does not yet prove the required causal chain:

```text
canonical Rule -> Operation edge
  -> one edge-anchored obligation
  -> one strict digest-bound binding
  -> one generated and executed assertion
  -> one independent semantic evaluation
  -> one recomputable receipt
  -> predicate + endpoint + stale-digest mutations killed
```

Implementation completion becomes supportable for S1 only when that exact path is executable and `validate:evf-s1` fails closed. Release/package completeness remains blocked until the separate broad BTE coverage and aggregate gates are also implemented.

## Source: `verifications/rittel.md`

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

## Source: `verifications/capucci.md`

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
