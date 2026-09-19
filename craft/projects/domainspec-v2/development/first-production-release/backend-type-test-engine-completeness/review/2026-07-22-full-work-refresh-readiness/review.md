---
artifact: bte-full-work-refresh-readiness-review
dispatchId: 2026-07-22-bte-full-work-refresh-readiness-review
status: accepted
reviewVerdict: FIX
updatedAt: 2026-07-22
semanticAuthority: none
---

# BTE Full-Work Refresh Readiness Review

## Review Boundary

This review asks one question: does the current Backend Type Test Engine (BTE)
package contain a coherent execution bundle that can enter Task Session without
another architecture loop? The answer is **no**. The validated Design is ready;
the pre-Design Plan, layering, work pack, execution, and synchronization surfaces
are not. This review specifies refresh inputs for a later Invoke Plan. It does
not rewrite the reviewed targets, select an SWU, implement a contract, grant an
admission, or treat regression tests as BTE completeness.

## Coverage

| Attacker | One lens | Findings raised | Zero-findings defense |
| --- | --- | ---: | --- |
| Capucci, Matteo | fidelity/governance | 6 | not applicable; authority, admission, trace, catalogue, chronology, and consumer contradictions were cited |
| Ashby, W. Ross | mechanics/correctness | 6 | not applicable; the executable dependency path, missing proof primitives, compiler route, and commands were tested |
| Popper, Karl | abuse/gaming | 5 | not applicable; false-green admission, exact-set, binding, mutation, replay, and consumer substitutions were attacked |

Robot-talks collapse check: all three converged on `FIX` and atomic regeneration,
but did not collapse—Capucci constrained authority and admissions, Ashby forced a
runnable candidate sequence without global admission blocking, and Popper added
independently authored behavioral falsification beyond schema/happy-path checks.

The lenses cover the full target families: accepted decision and current machine
sources; Define, Requirements, Design, validation, and layering seed; Plan,
implementation layering, execution pack/dispatch, work pack, tasks, waves, shared
ledgers, transport, and observability; narrow completed receipts; proof contracts;
and the IOLM and Body War consumer handshakes. Agent returns are working material,
not persisted review evidence.

## Authority, Age, And Source Precedence

Precedence has two axes because current runtime fact and accepted successor
architecture answer different questions.

**Axis A — observed current-v1/runtime facts:** current machine sources, active
profile declarations, and executable code govern what exists and runs now.
Completed `SWU-BTE-001`/`003` receipts and regression results are subordinate
evidence for only the behavior they observed. Define/Requirements prose,
Markdown, generated views, Inventory, and planning records may explain or index
those facts but cannot manufacture a runtime capability, change current-v1
bytes, or grant admission.

**Axis B — successor normative architecture:** accepted FPR Decisions 8/9 and
`DEC-BTE-FORMATION-AUTHORITY-001` govern the selected direction; the validated
2026-07-22 `DESIGN.md`, `DESIGN-VALIDATION.json`, and
`DESIGN-LAYERING-SEED.md` govern its architecture and dependency constraints.
`DEFINE.md` and `REQUIREMENTS.md` remain supporting normative context, with the
Decision 9 trace repaired. The 2026-07-17/20 Plan bundle is lower, historical
planning evidence to retain or regenerate; other Markdown, Inventory, generated
views, tests, and receipts remain explanatory/read-model evidence.

The current unimplemented machine state cannot negate an accepted successor
decision or validated Design. Conversely, Design cannot assert that a successor
contract, route, admission, command, or proof exists in the current runtime.

The accepted formation decision says it “does **not** make the present YAML
adapter the live formation authority, retire any JSON schema, change current v1
in place, or authorize implementation/admission”
(`decisions/DEC-BTE-FORMATION-AUTHORITY-001.md:88-90`). Design separately says it
is complete enough for Invoke Plan while formation/profile, node-pattern,
relationship, catalogue-freeze, consumer, and lifecycle gates remain external
(`DESIGN.md:41-47`, `DESIGN.md:735-741`).

## Canonical Design And Proven Baseline

No change request survives against the architecture itself. Keep:

- `DESIGN.md`, `DESIGN-VALIDATION.json`, `DESIGN-LAYERING-SEED.md`, Design
  distill/transport evidence, and the glossary artifacts;
- the accepted formation decision and existing FPR decisions;
- current-v1 `definitions/minted-project/supported-profiles.yml`,
  `impl/spec/minted-project/node.schema.json`, and the four
  `impl/spec/minted-project/formations/*.schema.json` files as frozen predecessor
  sources—not as proof that the successor exists;
- `SWU-BTE-001` receipt SHA-256
  `c74804c056c681e9596fce170c50ac664bdc002492b3fbc6340a13a47f42b1e1` and
  `SWU-BTE-003` receipt SHA-256
  `2465113b7e18d1e58670df52636a18499b22420f3c36cd460e5179a8f1c4a2c4`.

Those reports prove the shared criterion kernel and minted body adapter across
eight current rule forms (`SWU-BTE-001/.../TASK-SESSION-REPORT.md:28-35` and
`SWU-BTE-003/.../TASK-SESSION-REPORT.md:28-36`). They do not prove formation-v2,
current-v1 JSON compatibility, six-catalogue breadth, or a green BTE core. The
147 tool tests, 107 engine tests, and typecheck are regression baselines only
(`DESIGN-VALIDATION.json:58-76`).

**Review verdict: KEEP.**

## Requirements And Traceability

| ID | Exact current evidence | Severity | Proposed fix | Refresh disposition |
| --- | --- | --- | --- | --- |
| BTE-RFR-001 | `DESIGN.md:420-424`: “`REQUIREMENTS.md` does not give Resolved Decision 9 its own node-pattern requirement row.” | MAJOR | Add one requirement with Decision 9 as its source, exact 13-kind node-pattern selection, owner/admission state, canonical witness/effect, removal delta, catalogue/test/receipt evidence, and trace through layers/tasks/SWUs. No new decision is needed unless Decision 9 changes. | ADD |

**Review verdict: FIX.**

## Plan, Layering, And Work-Pack Family

| ID | Exact current evidence | Severity | Proposed fix | Refresh disposition |
| --- | --- | --- | --- | --- |
| BTE-RFR-002 | `PLAN.md:39` calls the 13 existing YAML files “The source formation contract”; the accepted decision requires a distinct versioned replacement, explicit retirement map, migrated fixtures, and compatibility results (`DEC-BTE-FORMATION-AUTHORITY-001.md:56-71,88-110`). | CRITICAL | Make formation-v2, exact JSON-retirement bijection, source migration, compatibility corpus, and reason-specific Entity false-green rejection prerequisites of successor activation; preserve current v1 byte-for-byte. | REGENERATE |
| BTE-RFR-003 | `PLAN.md:141-145` reduces completeness to one 16-member equation. Design instead defines six catalogues with 16/13/13/dynamic-graph/16/dynamic-graph memberships and requires all six for core (`DESIGN.md:351-375`). | CRITICAL | For each catalogue, prove exact O_spec/O_gen coverage_key projection equality plus compatible governing identities/digests. Require every required coverage key to appear exactly once in the TestCase, ExecutionResult, and primary MutationResult projections. Require those projections to trace unambiguously through declared ProofReceipt and ReplayResult scopes; receipt/replay scopes may partition a catalogue only when they are explicit and non-overlapping and their exact recomposition equals the catalogue's required coverage-key set, rejecting missing, extra, duplicate, stale, overlapping, or incompatible records or scopes. Preserve each TestCase bundle's internal role multiplicity. Give every catalogue its own ID/version/owner/admission/freeze handle and red matrix; one green L5 unit cannot substitute for L6 breadth. | REGENERATE |
| BTE-RFR-004 | `WORK-PACK.md:63-68` jumps from one `O_spec` task into generation/integration; it does not schedule Design's exact TestCase, role binding, independent evaluator, fresh child mutation, raw receipt, and independent replay boundaries (`DESIGN.md:441-531`). | CRITICAL | Materialize the complete proof-unit contracts and their semantic validators before engine consumers. Require zero/two/wildcard/stale binding controls, mechanical evaluator-dependency checks, declared phase/code/delta mutation kills, raw-handle replay, and exact reason-specific failures. | REGENERATE |
| BTE-RFR-005 | `WORK-PACK.md:95-97` records resolved decision blockers, but those rows are not executable admission or freeze receipts. Design's seed lists separate formation, profile, node-pattern, relationship, catalogue-freeze, and consumer gates with stage-specific failure posture (`DESIGN-LAYERING-SEED.md:34-43`). | MAJOR | Model each admission/freeze handle as a separate executable gate. Missing validation-owner freeze prevents TestCase emission. Missing formation/profile/node-pattern/relationship admission emits typed residue and prevents the affected catalogue/artifact from core; candidate/local evidence is never partial core proof. Candidate construction proceeds only where that stage's Design entry gate permits—never through a blanket L0-L3 allowance. | REGENERATE |
| BTE-RFR-006 | `IMPLEMENTATION-LAYERING.md:45-46` names completed `SWU-BTE-003` as next; `EXECUTION-DISPATCH.json:72-78` does the same. `WORK-PACK.md:70` correctly says no successor is selected pending refresh. | MAJOR | Regenerate executable definitions atomically. Retain a task/SWU ID when its semantic contract survives, and preserve completed 001/003 identities and receipts immutably. When meaning or scope changes, create a new identity with an exact old-to-new supersession/migration map. Plan no predetermined SWU count, propose dependency-ready candidates, and select none before validation and user handoff. | KEEP 001/003; REGENERATE definitions; RETIRE only superseded identities |
| BTE-RFR-007 | `DESIGN.md:675` requires legacy test-engine IR/rules/binding/emitter to be “isolate[d] as compatibility-only.” The stale execution package contains no mechanically validated isolation acceptance boundary for the BTE proof route. | MAJOR | Add dependency/import or equivalent mechanical boundary tests that keep compatibility APIs outside the BTE proof route. Preserve their compatibility behavior and history; do not infer unverified old-task call sites or label that behavior defective. | ADD isolation boundary; RETIRE only proved BTE-route eligibility |
| BTE-RFR-008 | The execution bundle is dated 2026-07-17/20, while `DESIGN.md:765-768` orders regeneration of stale layering/work-pack state and `EXECUTION-PACK.md:22` still reports “003 next.” | MAJOR | Produce one internally consistent atomic package with no mixed old/new executable state. Regenerate only surfaces whose routing, handles, dependencies, or status changed. Every retained/regenerated task, wave, or surface must own a unique dependency, write boundary, command, fixture matrix, or handoff; mark decorative/redundant surfaces historical. Refresh Distill, transport, observability, and shared ledgers only where concrete routing or handles changed. | REGENERATE changed surfaces; RETIRE redundant surfaces as historical |
| BTE-RFR-011 | The complete script list in `projects/domainspec-v2/impl/package.json:16-32` has no `verify:bte:catalogue`, `verify:bte:core`, `verify:bte:consumers`, or terminal `verify:bte` entry, although `DESIGN.md:708-715` defines their command semantics. | MAJOR | Plan exact command owners, modules, inputs, output roots, nonzero residue behavior, and package-script entrypoints in dependency order; do not represent planned commands as runnable. | ADD |

`RETIRE` above is never a verdict on history: the affected family remains `FIX`
until exact replacement identities, compatibility routing, and retirement notes
exist.

**Review verdict: FIX.**

## Consumer Proof Family

| ID | Exact current evidence | Severity | Proposed fix | Refresh disposition |
| --- | --- | --- | --- | --- |
| BTE-RFR-009 | IOLM's machine contract already requires `graph_hierarchy_table_get_parity` (`cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/consumer-contract.yml:63-71`), but the closed `checks` schema requires only six other keys and has no property for it (`cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/receipt.schema.json:92-110`). | MAJOR | Repair the existing receipt schema—not replace a supposedly absent contract—then add invalid/missing/parity-drift fixtures, a consumer-owned run, raw evidence, and BTE-owned independent replay. | ADD schema repair and executable proof |
| BTE-RFR-010 | Body War has only `ADAPTER-CONTRACT.md` and `fixture.json`; the Markdown says it will consume handles and emit a projection (`cyberAlchemy-v2/development/domainspec-v2/body-war-consumer/ADAPTER-CONTRACT.md:3-20`) but supplies no machine contract/schema/runner/receipt/replay package. | MAJOR | Add a versioned machine contract and schema, consumer-owned runner, declared writes/redaction validator, raw evidence, fresh receipt, independent replay, and stale/missing/private-leak/mutation controls. | ADD |

Both consumers remain downstream of core and parallel with each other. Neither
may define DomainSpec graph truth, criteria, `O_spec`, evaluators, admission, or
core success.

**Review verdict: FIX.**

## Dependency-Ordered Full-Refresh Input Pack

### Atomic refresh boundary

Invoke Plan must emit one internally consistent executable package spanning
`PLAN.md`, `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, `EXECUTION-PACK.md`,
`EXECUTION-DISPATCH.json`, and every task/wave/contract surface retained by the
new route. Regenerate a surface only when its routing, handles, dependencies, or
status changed. Refresh Distill, transport, observability, contracts README, and
shared context/decisions/gaps/traceability only when a concrete route or handle
changed. Every retained or regenerated surface must own a unique dependency,
write boundary, command, fixture matrix, or handoff; decorative duplicates are
retired as historical. Mixed old/new executable state is invalid. Accepted
decisions and historical receipts remain immutable.

### Candidate DAG and contracts

| Order | Consumes | Must emit before its dependants can run |
| --- | --- | --- |
| receipts -> refreshed Plan | validated Design/seed, accepted decisions, current-v1 sources, narrow 001/003 receipts | validated atomic Plan bundle; exact task/SWU IDs where known, old-to-new maps where meaning changed, dependencies, project-relative read/write paths, validation commands, stop conditions, owner gates, and no selected SWU |
| L0 proof primitives | exact validated Design/seed handles and digests | artifact-handle, logical-ID/content-digest, authority-class, diagnostic, and exact-set contracts; separate shape schemas and semantic validators; pre-execution frozen independently produced red-fixture manifest; non-admitting L0 ValidationReceipt |
| L1 formation-v2 | L0 plus current-v1 JSON/YAML predecessor handles | 13 formation-structure bundles, 16 criterion records, closed structural AST/preflight/evaluator, exact retirement bijection, compatibility/source-migration corpus, Entity false-green diagnostic evidence |
| L2 successor sources/resolver | L0-L1 plus accepted source topology | versioned project/feature/node/edge/source-set contracts, independent same/cross-feature edge roots, connections-to-edge migration, resolver positives and typed negatives |
| L3 compiler/graph/build replay | L1-L2, kernel and adapter receipts | hard v1/v2 profile dispatch, successor formation/relationship route, graph v2, manifest v2, build receipt, proof-context envelope, deterministic independent build replay; candidate posture until admission |
| L4 catalogues/selections | exact candidate contract handles | six distinct nonempty catalogue contracts; independently frozen `O_spec` before any TestCase emission; node-pattern and relationship-composition selections; exact admission handles or typed gate residue |
| L5 one proof unit | L0, L3, one independently frozen and stage-eligible L4 entry | exact `O_spec`/`O_gen` coverage-key join, pre-run TestCase, one binding per role, raw execution, bounded independent evaluation, fresh reason-specific primary MutationResult, and unambiguous tracing through declared ProofReceipt and independent ReplayResult scopes. An unadmitted but otherwise candidate-valid artifact may emit only the typed local evidence its Design stage permits, never successful core evidence. |
| L6 six-catalogue core | L5 plus exact formation/profile/node-pattern/relationship admissions and six freezes | exact successful ReplayResult-scope recomposition over every required coverage key in all six catalogues and fail-closed `verify:bte:core`; one L5 unit never proves breadth |
| L7A IOLM \|\| L7B Body War | one exact green core handle plus each consumer's contract | two independent consumer-owned runs/raw evidence/receipts and two BTE-owned ReplayResults; lanes run in parallel and have disjoint writes |
| L8 consumers/terminal | exact L6 core and both L7 ReplayResults | `verify:bte:consumers` and terminal `verify:bte` aggregates, still non-admitting |

The preferred first dependency-ready candidate is one coherent L0 slice; this is
a Plan input, not an SWU selection. The later Plan must fix:

- exact input handles and digests for the validated Design and layering seed;
- separate outputs for shape schemas and deterministic semantic validators;
- a red-fixture manifest frozen before execution, with an independent producer
  identity and digest, so implementation output cannot author expected values;
- allowed contract, validator, fixture, test, and generated-output roots, plus
  explicit prohibitions on compiler, consumer, current-v1, and admission writes;
- deterministic command behavior rejecting unsupported keywords, missing/extra/
  duplicate IDs, digest mismatch, path escape, forged authority class, and
  unknown diagnostic code;
- immediate stop on an ignored keyword, rewritten fixture, implementation-derived
  expectation, or write outside the declared roots; and
- a non-admitting L0 `ValidationReceipt` that is explicitly not a `BuildReceipt`,
  `ProofReceipt`, `ReplayResult`, admission record, or core evidence.

Plan may split L0 only if it proves dependencies, non-overlapping namespaces and
write scopes, and a recomposition check. Concrete filenames remain Plan-owned,
not Design facts, and must be fixed before Task Session.

### Required test and command surface

Every regenerated SWU must declare exact `consumes`, `emits`, allowed write paths,
forbidden dependencies, positive checks, reason-specific negative controls, and
stop conditions. The Plan must preserve these current regression commands:

- `npm --prefix projects/domainspec-v2/impl run tools:test`;
- `npm --prefix projects/domainspec-v2/impl run engine:test`;
- `npm --prefix projects/domainspec-v2/impl run typecheck`;
- content and instance validation where their sources are touched.

It must additionally name deterministic commands for contract shape validation,
semantic red matrices, each of the six `verify:bte:catalogue <catalogue-id>` runs,
`verify:bte:core`, `verify:bte:consumers`, terminal `verify:bte`, independent
replay, dispatch validation, local-link/JSON checks, and scoped `git diff --check`.
Do not claim these commands exist until their scripts and package entries do.

At minimum, negative matrices must reject empty/missing/extra/duplicate/stale/
mismatched catalogue members; absent/stale/wrong admission handles; unsupported
formation keywords; the Entity false green for the formation reason; v1/v2
fallback; source-root/path/endpoint/order errors; zero/two/wildcard/stale bindings;
forbidden evaluator dependencies; skip/todo/orphan/unrunnable residue; base-receipt
or wrong-reason mutation kills; raw-artifact tamper; self-authored or literal-pass
replay; one-unit-as-breadth; missing consumer; IOLM parity omission/drift; and Body
War schema-only, private-leak, or mutation evidence.

Stop immediately if a source/decision digest changes, a Design frame-expiry
condition is met, a validator silently ignores a keyword, `O_spec` is generated by
the implementation under test, a write crosses its declared boundary, an owner
gate is inferred, UI becomes a dependency, current v1 is changed in place, a
receipt is rewritten, or an aggregate can pass without exact fresh ReplayResults.

### Ownership, writes, and synchronization

Core contract and implementation writes stay under `projects/domainspec-v2/`;
current-v1 sources and session evidence are read-only unless a separately scoped
compatibility task explicitly authorizes additive evidence. IOLM and Body War
machine packages remain consumer-owned under
`cyberAlchemy-v2/development/domainspec-v2/{iolm-consumer,body-war-consumer}/` and
communicate through versioned handles. UI/FPR-02U, public Arcanum, semantic source
authority, and lifecycle records are outside BTE implementation writes.

After the atomic refresh validates, synchronize scoped and umbrella Craft
continuation pointers and Inventory entries whose referenced Plan/Design handles
changed. Refresh observability and transport only for changed concrete routing or
handles. Mark every superseded task/SWU/API historical with an exact replacement
or retirement reason; preserve stable surviving identities, especially completed
001/003. Craft and Inventory index evidence; neither can substitute for a source,
decision, run, or replay.

## Severity-Ordered Change Requests

1. **CRITICAL — BTE-RFR-002:** materialize formation-v2 and current-v1
   retirement/compatibility before successor activation.
2. **CRITICAL — BTE-RFR-003:** replace the one-denominator plan with six exact
   catalogue proof lanes.
3. **CRITICAL — BTE-RFR-004:** schedule the complete independently checkable
   graph-to-proof unit and abuse controls.
4. **MAJOR — BTE-RFR-001:** add Decision 9 node-pattern requirement and trace.
5. **MAJOR — BTE-RFR-005:** separate candidate construction from admission and
   core eligibility.
6. **MAJOR — BTE-RFR-006/BTE-RFR-008/BTE-RFR-011:** atomically reconcile changed
   executable definitions and dependent surfaces, preserve stable identities,
   retire redundant surfaces, and add real command entrypoints.
7. **MAJOR — BTE-RFR-007:** isolate legacy compatibility APIs from the BTE proof
   route without rewriting their historical contract.
8. **MAJOR — BTE-RFR-009/BTE-RFR-010:** repair IOLM's closed receipt schema and
   add the Body War machine proof package.

## Closeout

- `exit_reason`: `resolved`
- `agents_spawned`: 7 working agents — 3 explorers, 1 writer, 2 skeptics,
  1 coverage auditor, and 0 helpers
- `loops_used`: 1
- `parent_final_approval`: `accepted` on 2026-07-22 after inspecting the
  single persisted artifact, its quoted source anchors, verifier narrowing,
  auditor feedback, forbidden-artifact absence, and scoped `git diff --check`
