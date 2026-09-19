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
