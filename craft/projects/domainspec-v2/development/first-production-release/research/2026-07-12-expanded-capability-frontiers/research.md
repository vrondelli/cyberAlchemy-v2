# Expanded production frontiers — explorer returns

Dispatch: `2026-07-13-domainspec-v2-expanded-production-frontiers`
Evidence boundary: verbatim explorer returns; no synthesis or authority promotion.

## Agent 1 — formal semantics and graph equivalence

# Formal-soundness frontier return

## Executive verdict

**[OBSERVATION]** The accepted contract supersedes the old Option-A capability exclusions and makes formal-model extraction, architecture/pattern enforcement, generated executable obligations, implementation-graph derivation, and bounded cross-graph equivalence first-release claims (`projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:10-22,54-69`). The old roadmap’s “broad formal proof does not apply” disposition therefore survives only for universal proof; it cannot be used to defer profile-bounded formal validation (`implementation/domainspec/research/2026-07-12-first-production-release/findings.md:423-425`).

**[OBSERVATION]** Current evidence is a set of useful but non-equivalent fragments:

- Root DS-D8 is an active finite typed-edge authority with 30 signatures, but DS-D1 remains a 13-backend/11-UI staged candidate system (`projects/domainspec-v2/definitions/meta-types/meta-types.yml:4-23`; `projects/domainspec-v2/definitions/DEFINITIONS.md:1111-1159`).
- The canonical prose still contains live 25/31 claims while the machine views say 24 candidates/13 backend and 30 signatures (`projects/domainspec-v2/definitions/DEFINITIONS.md:229-260,337-374,999-1039`; `projects/domainspec-v2/definitions/meta-types/meta-types.yml:10-23`; `projects/domainspec-v2/definitions/relationships/relationships.yml:1-18`).
- The engine’s `ConceptGraph G` uses a different internal node/edge alphabet—e.g. `State`, `Transition`, `Invariant`, seven IR edge kinds—rather than root DS-D1/DS-D8 (`projects/domainspec-v2/impl/test-derivation-engine/src/ir/types.ts:5-35,42-61`).
- Alloy/TLA tooling is executable research evidence only: Alloy found no counterexample within scope 8; TLA+ found a real freshness-safety violation; canonical integration was explicitly “not ready” (`projects/domainspec-v2/research/alloy-tla-modeling/invoke-plan/run-results/alloy/order-fulfillment-summary.md:38-52`; `projects/domainspec-v2/research/alloy-tla-modeling/invoke-plan/run-results/tla/order-fulfillment-summary.md:12-29`; `projects/domainspec-v2/research/alloy-tla-modeling/invoke-plan/run-results/swu-fmt-008-readiness-closeout.md:54-60`).
- Code-tag checking consumes DS-D8 but is annotation-led and uses whole-file regex call detection; it is not a structural implementation semantics (`projects/domainspec-v2/impl/governance/tags/CODE-TAG-SCHEMA.md:5-8,27-51`; `projects/domainspec-v2/impl/governance/tags/tools/check-code-tag-composability.ts:571-590`).

**[INFERENCE]** There is no current sound chain
`business ontology B → semantic spec S → architecture A / formal model F → obligations O → tests T → implementation graph I`.
There are pairwise mechanisms, but no owned graph schemas, total correspondence relations, preservation algorithms, or integrated equivalence verdict. Those are release blockers because the contract explicitly requires them and leaves their exact definition to R2/R3 (`projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:34-38,143-156`).

## Required graph chain

Let:

- `B` = governed business-ontology graph;
- `S` = root-authoritative typed semantic specification graph;
- `G` = engine compiler IR;
- `A` = architecture/pattern obligation graph;
- `F` = solver model(s);
- `O` = exact derivable obligation graph;
- `T` = executable-test/evidence graph;
- `I` = structurally derived implementation graph.

“Equivalence” must be implemented as a finite family of declared preservation predicates over mappings—not as graph equality or universal program equivalence.

### 1. `B → S`: business meaning to typed specification

- **Semantics:** every in-profile business concept, identity, rule, relation, and constraint in `B` maps to one or more typed `S` nodes/edges without silent loss; many-to-one mappings require an explicit quotient/abstraction rule.
- **Owner/authority:** business-ontology semantic owner plus definitions/layering owners; implementation cannot author this mapping. A1 makes semantic authority precede implementation (`projects/domainspec-v2/authority/AXIOMS.md:47-64`).
- **Decidability/soundness boundary:** mapping totality, target typing, IDs, and declared relation preservation are finite/decidable. Whether the ontology captured the real business correctly remains an owner judgment.
- **Current evidence:** `ontology/` contains only a candidate instantiation README; entries have no authority effect until owner promotion (`projects/domainspec-v2/ontology/README.md:1-15,93-116`). The active two-plane definition instead says ontology is an authoring lens and authority flows contract→authoring (`projects/domainspec-v2/definitions/DEFINITIONS.md:183-216`).
- **Missing capability:** a governed `B` schema/instance for the supported profile, stable business IDs, typed `B→S` correspondence, and reconciliation of the current two-plane direction with the newly accepted ontology→spec chain.
- **Positive witness:** a Body War business rule and identity represented in `B`, mapped to exact `S` nodes/edges, with all declared constraints preserved.
- **Negative witness:** delete or mistype one mapped business rule/identity, or map two distinct identities without an approved quotient; validation must reject.
- **Release consequence:** **hard blocker**—without `B`, “proof of declared requirements” has no machine-readable source universe.
- **Dependencies:** reconciled authority baseline and exact supported profile first.
- **Strictest sufficient proof:** machine-valid `B` and mapping schemas; totality/orphan check; identity/relation preservation checks; discriminating omission, collision, and incompatible-relation mutants; semantic-owner receipt.
- **Disposition:** **BLOCKER; sequential before all downstream preservation claims.**

### 2. `S → G` and intrinsic `S` validation

- **Semantics:** `S` is the profile-bounded DS-D1/DS-D2/DS-D8 graph; compiler IR `G` may normalize it, but must preserve source identity, type, relationship, constraint, and provenance.
- **Owner/authority:** definitions-governance owns DS-D1/DS-D2/DS-D8; validation-governance owns checking; layering owns edge law (`projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md:44-52,121-134`).
- **Decidability/soundness boundary:** schema shape and finite endpoint signatures are decidable. Existing “formal criteria” check shape, explicitly not meaning (`projects/domainspec-v2/definitions/DEFINITIONS.md:299-335`).
- **Current evidence:** the content/relationship validators exercise 13 schemas and 30 signatures over three packs with a discriminating invalid edge (`projects/domainspec-v2/development/r3-closeout-plan/task-sessions/2026-07-12-swu-r3c-004/TASK-SESSION-RESULT.md:50-77`). But the engine IR’s alphabet differs materially from root authority.
- **Missing capability:** exact supported-profile registry, canonical count reconciliation, `S↔G` mapping contract, profile-required document rules, and fail-closed rejection of unrepresented/unsupported types.
- **Positive witness:** serialize a valid `S` pack into `G`, then reconstruct a canonical semantic manifest with identical IDs/types/relations/constraints.
- **Negative witness:** remove a required document, introduce a formation-deferred type, or collapse a DS-D8 edge into an unmapped IR relation; compilation must reject rather than derive a partial graph.
- **Release consequence:** **hard blocker**—all later formal and obligation results are unsound if `G` silently loses `S`.
- **Dependencies:** step 1 plus canonical 13/24/30 reconciliation.
- **Strictest sufficient proof:** total profile matrix; bidirectional semantic-manifest comparison; one mutant per supported type/relation/document/constraint; zero unmapped root-authority elements.
- **Disposition:** **BLOCKER; critical path.**

### 3. `S → F`: formal extraction, satisfiability, state, and invariants

- **Semantics:** extract finite structural models to Alloy-like logic and state/transition systems to TLA+-like logic. Each model symbol must retain an `S` source ID and declared abstraction rule.
- **Owner/authority:** semantic owner owns modeled meaning; formalism/validation owner owns translation and solver protocol; solver output supplies evidence, never release authority.
- **Decidability/soundness boundary:** Alloy “SAT/UNSAT/no counterexample” is bounded by declared scope; TLC checks the declared finite model, not arbitrary implementations. Timeouts, translation gaps, and solver errors must be indeterminate/fail, never pass. Liveness/fairness is required only when declared.
- **Current evidence:** the formal tower itself says Alloy is for bounded graph counterexamples, TLA+ for finite state/trace obligations, and rejects “proof engine for all DomainSpec” (`projects/domainspec-v2/research/alloy-tla-modeling/BRIDGE-DECISIONS.md:7-15`). Existing Alloy evidence is scope-8 only, while existing TLA+ exposes a violated freshness invariant.
- **Missing capability:** generator from current `S/G`; model schema; solver-version/scope policy; translation-validation checks; satisfiability obligation taxonomy; state-machine semantics. The current state-machine schema only requires `has_transitions=yes`, not transition closure, reachability, invariant preservation, or deadlock freedom (`projects/domainspec-v2/impl/spec/meta-types/lifecycle/state-machine.schema.yml:1-26`).
- **Positive witness:** a satisfiable Body War structure plus reachable valid traces preserving each declared safety invariant.
- **Negative witness:** seeded impossible cardinality/edge constraints produce UNSAT; seeded transition/invariant violation produces a solver counterexample with an `S` source trace.
- **Release consequence:** **hard blocker** for every declared formal capability; the current research examples cannot be relabeled as integrated proof.
- **Dependencies:** stable `S→G` and selected supported solver profile.
- **Strictest sufficient proof:** generated model and deterministic manifest; independent source-ID coverage audit; SAT non-vacuity model; one falsifying mutant per invariant/transition/satisfiability class; pinned solver receipts with bounds and failure taxonomy.
- **Disposition:** **BLOCKER; can run in parallel with architecture and implementation-graph lanes after step 2.**

### 4. `S → A`: architecture laws, patterns, and composition

- **Semantics:** derive admissible layers, forbidden dependency edges, pattern assignments, and finite composition-path obligations from `S`.
- **Owner/authority:** layering-governance owns the law; validation checks it. A2 requires forbidden edges to be unconstructible, not merely reported (`projects/domainspec-v2/authority/AXIOMS.md:73-88`).
- **Decidability/soundness boundary:** finite endpoint/layer/path tables are decidable. General category identity, closure, associativity, path equations, and functorial preservation are explicitly unproved (`projects/domainspec-v2/definitions/DEFINITIONS.md:999-1025`).
- **Current evidence:** APE validates spec node shape and DS-D8 edges, but describes layering as post-hoc and unconstructibility as deferred (`projects/domainspec-v2/development/architecture-pattern-enforcement/SPEC.md:48-56,105-112`). The category-law route says only local endpoint compatibility is enforced; composed-path semantics, closure, associativity, and general preservation are absent (`projects/domainspec-v2/definitions/reviews/2026-07-12-category-law-formalization-route.md:25-45`).
- **Missing capability:** `A` schema; layer assignment rules; forbidden-edge construction gate; finite supported pattern catalog; per-path operational semantics; pattern-derived obligation mapping.
- **Positive witness:** each supported pattern yields the expected architecture nodes/edges and admits a known legal composition.
- **Negative witness:** forbidden adapter dependency, wrong pattern assignment, invalid two-edge composition, and grouping-sensitive three-edge path must reject.
- **Release consequence:** **hard blocker** for architecture/pattern claims.
- **Dependencies:** step 2; finite composition laws can be developed alongside formal extraction.
- **Strictest sufficient proof:** exhaustive profile-relative layer/edge/pattern tables, real-pack witnesses, mutation suite, and machine comparison of derived `A` against implementation structure.
- **Disposition:** **BLOCKER. General category theory is DEFERRED; finite release-path laws are mandatory.**

### 5. `S/G/F/A → O → T`: complete obligation and executable-witness coverage

- **Semantics:** define the exact obligation universe `O(P)` for supported profile `P`; coverage is 1.0 only when every applicable obligation has an executable positive witness and, where meaningful, a discriminating negative witness.
- **Owner/authority:** validation-governance owns derivation/pass-fail; generation owner owns emitted artifacts; semantic owner approves obligation meaning.
- **Decidability/soundness boundary:** enumeration and coverage are decidable only after `P` and every derivation rule are closed. Passing tests establish witnessed behavior, not general runtime correctness (`projects/domainspec-v2/authority/AUTHORITY-MODEL.md:40-47,54-64`).
- **Current evidence:** engine formal parsing is intentionally tiny and routes anything else to `coverage_gap` (`projects/domainspec-v2/impl/test-derivation-engine/src/formal/ast.ts:1-13,293-386`). Legacy generation emits one `it.todo` per obligation (`projects/domainspec-v2/impl/test-derivation-engine/src/index.test.ts:327-356`); hybrid generation counts `it.skip` gaps but exits 0 (`projects/domainspec-v2/impl/test-derivation-engine/src/cli.ts:353-393`). Roundtrip accepts derived supersets and therefore does not prove exactness (`projects/domainspec-v2/impl/test-derivation-engine/src/roundtrip/index.ts:43-56`).
- **Missing capability:** independently specified obligation universe, exact rather than subset/superset comparison, executable binding for every obligation, negative-witness policy per kind, and rejection on todo/skip/orphan/unexecutable output.
- **Positive witness:** every `o∈O(P)` executes and passes against a conforming Body War candidate.
- **Negative witness:** remove/inject/mutate each obligation class; coverage or discriminating behavior must fail.
- **Release consequence:** **hard blocker** under the binding full-coverage definition (`projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:28-32`).
- **Dependencies:** steps 2–4.
- **Strictest sufficient proof:** canonical obligation manifest independently computed from `P`; exact set equality; zero skips/placeholders; per-kind positive/negative/mutation receipts; generated suite bound to release digest.
- **Disposition:** **BLOCKER.**

### 6. Body War code `→ I`: implementation graph

- **Semantics:** `I` must be derived from parsed program structure plus verified tags; tags provide correspondence claims, not structural truth.
- **Owner/authority:** implementation/platform owner owns code conformance; DomainSpec validators may reject unsupported claims but cannot self-authorize implementation satisfaction.
- **Decidability/soundness boundary:** syntax/AST, imports, calls, declarations, and selected dataflow are decidable within a pinned language/tool profile. Dynamic behavior requires runtime witnesses or refinement arguments.
- **Current evidence:** code tags preserve IDs/types/outbound edges (`projects/domainspec-v2/impl/governance/tags/tools/lib/code-tag-types.ts:9-35`). The checker has nine code-call rules and 26 unsupported active signature variants, with unsupported semantics only MEDIUM and therefore non-blocking (`projects/domainspec-v2/development/r3-closeout-plan/task-sessions/2026-07-12-swu-r3c-003/TASK-SESSION-RESULT.md:38-57`; `projects/domainspec-v2/impl/governance/tags/tools/check-code-tag-composability.ts:269-282,377-429`). It detects calls through a regex over the entire file, not symbol-bounded AST analysis.
- **Missing capability:** Body War extraction input, language-specific AST/structural analyzer, symbol ownership/boundaries, import/dependency/dataflow rules, tag-to-structure cross-check, and dynamic-semantics protocol.
- **Positive witness:** tagged concept/edge agrees with actual symbol type, contained call/dependency structure, and required runtime behavior.
- **Negative witness:** lying/stale tag, same symbol text in comments or unrelated functions, missing tag, forbidden dependency, and dynamically violated invariant must fail.
- **Release consequence:** **hard blocker**; annotation agreement alone cannot establish implementation conformance.
- **Dependencies:** steps 2 and 4; executable-test lane can proceed in parallel.
- **Strictest sufficient proof:** AST-derived `I`, canonical manifest, complete tag reconciliation, one negative mutant per structural rule, dynamic evidence for behavioral obligations, exact Body War candidate digest.
- **Disposition:** **BLOCKER.**

### 7. `{B,S,A,F,O,T,I}` cross-graph verdict

- **Semantics:** evaluate named predicates for node/ID totality, type preservation, relationship compatibility, constraint/invariant preservation, architecture laws, obligation/test realization, and supported behavioral refinement. Missing or orphaned elements fail.
- **Owner/authority:** validation owner produces the verdict; independent verifier checks evidence; external owner alone accepts conformance/release.
- **Decidability/soundness boundary:** each declared predicate must identify whether it is exact finite comparison, bounded model check, static approximation, test witness, or owner judgment. No single “equivalent” boolean may erase these boundaries.
- **Current evidence:** no such integrated schema or algorithm exists; the contract explicitly defers correspondence relations, preservation algorithms, and verdict taxonomy (`projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:143-156`).
- **Missing capability:** correspondence graph, preservation predicate registry, fail taxonomy, machine-readable integrated receipt, and evidence provenance.
- **Positive witness:** complete Body War chain passes every predicate on one immutable candidate.
- **Negative witness:** mutation matrix independently breaks a type, identity, relation, invariant, architecture edge, obligation, test, tag, and runtime behavior; each must produce the expected bounded failure code.
- **Release consequence:** **final technical blocker** before pilot/owner authorization.
- **Dependencies:** all prior blockers.
- **Strictest sufficient proof:** exact correspondence manifest plus predicate-level results/bounds, full mutation matrix, independent reproduction, and release-digest binding.
- **Disposition:** **BLOCKER; integration gate.**

## Composition, equivalence, and exclusion boundaries

- **[TARGET]** Use finite, profile-relative path composition with enumerated operational meaning and obligation preservation. Do not require general category laws.
- **[TARGET]** Treat implementation conformance as a mixed proof: static preservation for structure, bounded model evidence for declared state/constraints, executable witnesses for behavior, and external owner acceptance.
- **[CONDITIONAL FRONTIER]** Liveness/fairness becomes mandatory only for profile-declared progress obligations.
- **[CONDITIONAL FRONTIER]** UI DS-D1 formation becomes release-critical only if the Body War acceptance profile claims UI semantic equivalence; Body War UI’s existence alone does not make DomainSpec’s own UI a product surface.
- **[DEFERRED]** General identity/closure/associativity/path-equation/functor preservation theorem.
- **[EXCLUDED]** Universal proof of arbitrary programs, arbitrary source-code↔human-meaning equivalence, requirements absent from `B/S`, multi-language support, automatic Saturn actuation, and automatic release authorization (`projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:71-85`).

## Dependency-critical conclusion

```text
authority/profile reconciliation
  → governed B + B→S contract
  → exact S + lossless S→G contract
  ├─→ S→F formal extraction and bounded solver checks
  ├─→ S→A finite architecture/pattern laws
  └─→ code→I structural extraction
          ↓
       exact O(P) → zero-gap executable T
          ↓
   cross-graph preservation + mutation gate
          ↓
 Body War pilot + independent verification + owner authorization
```

The formal-soundness position is strict: executable checks without a proved source mapping are evidence about the checker, not about the declared semantics; a successful pilot cannot repair an unenumerated obligation universe or an unproved correspondence relation.

## Agent 2 — executable generator and conformance engine

# Ashby executable-evidence audit

## Verdict

The current repository demonstrates useful but narrow structural validation, deterministic obligation derivation, and 12 fully generated dynamic assertions against one financial-settlement implementation. It does **not** demonstrate the confirmed production chain. Business-ontology extraction, TLA+/Alloy-like validation, architecture-layer enforcement, a complete implementation graph, bounded cross-graph equivalence, fail-closed obligation coverage, Body War integration, release packaging, atomic state writes, and release CI are absent or partial.

Green unit tests cannot support production readiness: the committed generated suite exits 0 with **13 passed and 67 skipped**, and missing inputs can yield CLEAN/empty-success verdicts.

## Capability matrix

| Included capability | Current state | Executable evidence and boundary | Required target / discriminating witness | Release impact |
|---|---|---|---|---|
| Supported profile and structural schemas | **Partial** | 13 meta-type schemas; current structural run checked 20 concepts and 14 edges in 3 internal specs. `validate-content` explicitly checks shape, not satisfiability ([validate-content.ts:3-8](projects/domainspec-v2/impl/tools/validate-content.ts:3)); unknown/unformalized concept types are silently skipped ([validate-content.ts:110-119](projects/domainspec-v2/impl/tools/validate-content.ts:110)). | Machine profile enumerating required/optional files, types, relations, formal fragment, code roots, commands, outputs, rejection rules. Positive pack plus unknown-type, absent-file, empty-pack, and malformed-table negatives. | Blocks every downstream completeness claim. |
| Business-ontology graph | **Absent** | No live implementation artifact or CLI constructs the contract’s governed business-ontology graph. Existing engine begins from aspect Markdown, not an ontology authority. | Versioned ontology graph schema, deterministic extractor, authority/provenance manifest; reject unresolved terms, duplicate identities, orphan rules, and empty input. | Blocks ontology→spec preservation and Body War business-rule traceability. |
| Typed specification graph | **Partial / false-green** | Parser covers nine specifically shaped aspect files ([grammar/index.ts:919-932](projects/domainspec-v2/impl/test-derivation-engine/src/grammar/index.ts:919)); graph vocabulary is only the engine’s local node/edge union ([ir/types.ts:5-35](projects/domainspec-v2/impl/test-derivation-engine/src/ir/types.ts:5)). It does not parse `SPEC.md` Concept Registry / Feature Concept Graph. Missing aspect files are explicitly accepted ([grammar/index.ts:934-940](projects/domainspec-v2/impl/test-derivation-engine/src/grammar/index.ts:934)). | Canonical graph JSON covering the exact supported profile, with source anchors and per-input digests. Missing required target/doc and unsupported authored structure must fail. Mutation: remove one concept/edge/formal cell and require a specific deficit verdict. | Current graph is not a complete specification graph. |
| Relationship/edge validation | **Demonstrated, bounded** | Root DS-D8 static signature checking is live; current run passed 30 signatures on internal packs. Validators reject seeded wrong endpoints. | Run over every release pack including Body War; exact graph denominator and zero ignored/unknown rows. | Retain, but broaden to release corpus. |
| Architecture laws and composable patterns | **Partial** | Dynamic checker consumes root authority, but only 9 call-semantic rules exist and 26 active signatures are explicitly unsupported ([check-code-tag-composability.ts:381-401](projects/domainspec-v2/impl/governance/tags/tools/check-code-tag-composability.ts:381)). Unsupported active semantics are MEDIUM/nonblocking, since only HIGH/CRITICAL fail ([check-code-tag-composability.ts:375-379](projects/domainspec-v2/impl/governance/tags/tools/check-code-tag-composability.ts:375)). Call evidence is a whole-file regex, so comments/dead text can satisfy it ([check-code-tag-composability.ts:571-590](projects/domainspec-v2/impl/governance/tags/tools/check-code-tag-composability.ts:571)). APE itself records layer unconstructibility as deferred ([APE SPEC:48-56](projects/domainspec-v2/development/architecture-pattern-enforcement/SPEC.md:48)). | Explicit architecture graph + layer assignment + import/call graph. Positives for every supported pattern; negatives for forbidden edge/import/direction; mutation/comment-only call must fail. Unsupported applicable signature must be blocking. | Blocks architecture/pattern claim. |
| Formal-model extraction and solver validation | **Absent** | The engine has a tiny deterministic expression AST for ternary/range/count/arithmetic ([formal/ast.ts:1-13](projects/domainspec-v2/impl/test-derivation-engine/src/formal/ast.ts:1)) and exact rational evaluation ([formal/eval.ts:1-14](projects/domainspec-v2/impl/test-derivation-engine/src/formal/eval.ts:1)). No `.tla`/`.als` model, solver dependency, state-space/model-check command, satisfiability engine, or counterexample artifact exists. | Supported formal fragment → model artifact → pinned solver invocation → stable verdict/counterexample. Positive model plus invariant, transition, and satisfiability mutants. | Hard blocker; AST evaluation is not TLA+/Alloy-like validation. |
| Deterministic obligation derivation | **Demonstrated, bounded** | Pure sorted derivation exists ([rules/index.ts:631-663](projects/domainspec-v2/impl/test-derivation-engine/src/rules/index.ts:631)); stable content keys and tombstones exist. Engine tests: 97/97 pass. | Bind ruleset/profile version in output; prove on two clean arbitrary checkouts, path/time normalization, and all supported Body War constructs. | Reusable foundation, not complete production engine. |
| Generated executable tests | **Partial / false-green** | Without a binding, generator emits one `it.todo` per obligation ([emit/tests.ts:71-90](projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts:71)). Hybrid mode emits `it.skip` for gaps ([emit/tests.ts:114-121](projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts:114)) and returns success regardless of gaps ([cli.ts:382-393](projects/domainspec-v2/impl/test-derivation-engine/src/cli.ts:382)). `emit-tests` also prints parser violations but continues ([cli.ts:353-365](projects/domainspec-v2/impl/test-derivation-engine/src/cli.ts:353)). | Generation must fail on parser violations, absent binding/target, `todo`, `skip`, placeholder, duplicate/orphan key, and zero obligations. Generated suite plus required negative/mutation witnesses must pass. | Hard blocker for “full coverage.” |
| Current generated dynamic-semantics evidence | **Demonstrated, narrow** | Committed financial-settlement file declares 12 assertions + 1 property + 67 gaps ([derived test:1-11](validation/poker-team/backend/src/domain/__derived__/financial-settlement.derived.test.ts:1)). It imports and executes real domain functions. Run result: 13 passed, 67 skipped, exit 0. One property is explicitly only a floor and co-emits a gap ([emit tests test:144-162](projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.test.ts:144)). No mutation runner/kill receipt exists. | Per-obligation positive, required negative, and mutation kill. Side effects, HTTP, workflow, transitions, events, mappings, and state semantics need real harnesses. | Only 12/79 unique obligation keys are fully satisfied by generated assertions: **15.2% assertion coverage**, before mutation requirements. |
| Code tags and implementation-graph extraction | **Partial / false-green** | Extractor scans existing configured JS/TS/PY roots, silently drops missing roots ([extract-code-tags.ts:25-37](projects/domainspec-v2/impl/governance/tags/tools/extract-code-tags.ts:25)), and emits timestamp/root-bearing JSON ([extract-code-tags.ts:62-78](projects/domainspec-v2/impl/governance/tags/tools/extract-code-tags.ts:62)). The default committed extraction input is absent, so composability is excluded from aggregate validation ([CODE-TAG-COMPOSABILITY-PATTERNS.md:167-173](projects/domainspec-v2/impl/governance/tags/CODE-TAG-COMPOSABILITY-PATTERNS.md:167)). Body War has no code tags. | Canonical implementation-graph schema; declared roots must exist; AST/symbol/import extraction; completeness denominator over supported code; comment/dead-code and missing-root negatives; deterministic normalized output. | Blocks implementation graph and code/spec conformance. |
| Cross-graph traceability/equivalence | **Absent** | No executable mapping relates ontology, specification, architecture, obligation, test, and implementation graphs; current tools issue separate local verdicts. | Typed correspondence registry, preservation algorithms, orphan/missing/incompatible-relation checks, per-graph digests, bounded verdict taxonomy. Mutate each graph independently and require failure at the correct relation. | Hard blocker. |
| Machine-readable evidence and failure semantics | **Partial** | Code-tag tools can emit JSON; engine CLI mainly prints prose and has ad hoc exit codes. No unified result schema or evidence bundle. | Stable JSON result with tool/profile/input/output digests, counts, skipped/missing classifications, solver counterexamples, mutation receipts, exit taxonomy. Any partial/unknown/applicable gap fails release verdict. | Blocks automation and release receipt. |
| Packaging / reproducibility | **Absent / partial** | Packages are private `0.0.0`; engine `main` points to `src/index.ts`, has no `bin`, and build merely targets `dist` ([engine package](projects/domainspec-v2/impl/test-derivation-engine/package.json:1), [tsconfig](projects/domainspec-v2/impl/test-derivation-engine/tsconfig.json:1)). Provenance hashes present docs but omits absent required docs ([provenance/index.ts:20-58](projects/domainspec-v2/impl/test-derivation-engine/src/provenance/index.ts:20)). | Immutable candidate tag, compiled CLI, pinned Node/npm/solver manifest, clean arbitrary-path install/smoke, byte/digest repeatability. | Blocks release artifact identity. |
| State writes / recovery | **Partial / unsafe** | `derive --out` writes id-map then spec directly, allowing torn state ([cli.ts:218-235](projects/domainspec-v2/impl/test-derivation-engine/src/cli.ts:218)); hybrid tests and generated instances also use direct writes. Containment is lexical and does not establish symlink/concurrency safety ([containment.ts:7-20](projects/domainspec-v2/impl/test-derivation-engine/src/paths/containment.ts:7)). Empty instance corpus exits 0 ([instances.ts:186-192](projects/domainspec-v2/impl/tools/instances.ts:186)). | Staged writes, fsync/atomic rename, collision policy, rollback journal, symlink/TOCTOU/concurrency/failure-injection tests. Missing expected state must fail. | Retained roadmap blocker. |
| CI | **Absent for v2 release chain** | Root workflow checks v1 `implementation/domainspec`, not `projects/domainspec-v2/impl` ([drift-check.yml:21-30](.github/workflows/drift-check.yml:21)). Poker-team CI runs backend tests, where skipped generated tests still pass. No v2 release workflow gates formal, tags, coverage, equivalence, Body War, or clean candidate. | One pinned release workflow with seeded negative job and artifact upload; exact local/CI command parity. | Hard blocker. |
| Body War production witness | **Absent; current packs nonconformant** | TROQAR `lint` returned CLEAN but derived only three spurious event obligations from prose H2 headings; Parque lint rejected three noncanonical Rules tables. Static content/relationship validation rejected TROQAR with 16/6 violations and Parque with 12/4. Body War app depends on auth package, not the v2 engine ([Body War package:7-24](projects/body-war/app/package.json:7)); no Body War binding, code tags, implementation graph, generated suite, or candidate-tied receipt exists. | Normalize one exact Body War profile; ontology/spec/architecture/formal artifacts; bindings and code tags; generated full suite; implementation graph; equivalence verdict; end-to-end pilot + rollback receipt bound to candidate digest. | Final end-to-end blocker. |

## Coverage calculation

For release profile \(P\):

- \(O(P)\): all unique obligations derived from every required profile artifact.
- \(W(o)\): an executed positive witness plus every required negative/mutation witness, with no skip/todo/placeholder/missing target for obligation \(o\).
- `coverage = |{o ∈ O(P) : W(o)}| / |O(P)|`.
- Also report per obligation kind and graph-preservation relation.
- Any missing required input, zero-obligation pack, duplicate/orphan key, skipped test, unsupported applicable relation, or unexecuted artifact is blocking and cannot enter the numerator.

Current financial-settlement generated file has 79 unique keys, 13 real test bodies, 67 skips, and one duplicated property+gap key. Thus fully generated assertion coverage is **12/79 = 15.2%**. No mutation-kill evidence was found, so this is not release-contract full coverage.

## Dependency graph

```text
accepted product decision
  → machine supported-profile/product contract
  → canonical ontology/spec/architecture/formal/code/result schemas
  → fail-closed profile loader + complete typed graph extraction
      ├→ architecture/layer/pattern validator
      ├→ formal model extractor + pinned solver
      └→ obligation derivation
            → implementation bindings + deterministic test generator
Body War code roots → code tags + AST/import analysis → implementation graph
all graphs + generated/running evidence
  → bounded correspondence/preservation validator
  → unified machine verdict/evidence bundle
  → clean reproducible candidate + atomic state/rollback + release CI
  → controlled Body War pilot receipt
  → independent owner authorization
```

Architecture, formal, generator, and Body War normalization can proceed in parallel only after the profile and graph contracts stabilize. Equivalence cannot precede all mapped graph schemas.

## Proposed proof protocol

1. Bind candidate SHA, clean status, pinned Linux/Node/npm/solver versions, profile digest, and exact input roots.
2. Require every declared target/root/doc to exist and be nonempty; reject zero nodes/obligations/tags.
3. Emit canonical graph artifacts with source anchors and digests; re-run in two clean arbitrary paths and compare normalized bytes.
4. Run positive and seeded negative fixtures for every supported type, relation, layer, pattern, formal construct, and mapping.
5. Run the pinned model checker; preserve counterexamples for violated invariant/transition/satisfiability mutants.
6. Generate tests; statically reject `skip`, `todo`, placeholders, duplicate/orphan keys, and non-runnable imports.
7. Execute generated tests against Body War; mutation-test each supported obligation class and preserve kill/survivor receipts.
8. Extract Body War implementation graph with AST/symbol/import evidence; reject comments/dead text as call proof.
9. Compare all mapped graphs; fail separately on missing node, orphan obligation, relation mismatch, forbidden edge, invariant failure, unsupported code claim, or non-discriminating witness.
10. Inject write failure, collision, symlink, concurrency, and rollback cases.
11. Run identical commands in release CI and preserve one machine-readable evidence bundle.
12. Execute the candidate-tied Body War pilot and recovery/rollback scenario; external verifier and owner decide release.

## Frontier inventory

| Frontier | Exact target | Dependency | Closure witness | Timing |
|---|---|---|---|---|
| E1 Profile/result contracts | `product-contract.yml`, supported-profile schema, result schema | decision | malformed/missing/empty negatives | first |
| E2 Fail-closed graph loader | ontology/spec/architecture graph JSON + CLI | E1 | no empty-success; corpus mutation matrix | first |
| E3 Formal backend | model IR, extractor, pinned solver adapter | E1/E2 | invariant/transition/sat counterexamples | parallel after E2 |
| E4 Architecture/layer/pattern engine | layer/import/call graph validator | E1/E2 | forbidden edge/import/comment-only-call mutants | parallel after E2 |
| E5 Coverage-safe generator | binding schema, generator verdict, runnable suites | E1/E2 | zero skips/todos; per-class mutations | parallel after E2 |
| E6 Body War implementation graph | tags + AST/import extractor over declared roots | E1 + normalized Body War pack | complete tagged-root receipt; missing-tag mutant | parallel |
| E7 Cross-graph conformance | mapping registry + preservation validator | E3-E6 | independent mutations at each graph boundary | after E3-E6 |
| E8 State/package/release CI | atomic writer, compiled CLI, manifest, workflow | E1; can parallelize | failure injection, arbitrary path, reproducible digest, seeded CI red | before pilot |
| E9 Body War pilot | exact scenario suite and rollback receipt | E7/E8 | end-to-end success plus controlled failure/recovery | final |

## Commands and observed outcomes

- `git status --short` → only pre-existing `M telemetry/agents/subagents-dispatch.yaml`; no audit writes.
- Missing-target `lint`, `emit-tests`, and `derive` using the direct v2 `tsx` CLI → all exit **0**; CLEAN, empty test suite, empty obligation table.
- TROQAR `lint`/`derive` → exit **0**, only 3 derived event obligations. Parque `lint`/`derive` → exit **4**, 3 parser violations.
- Body War `validate-content --file ...` → TROQAR exit **1**, 16 violations; Parque exit **1**, 12.
- Body War `validate-relationships --features-root ...` → TROQAR exit **1**, 6 violations; Parque exit **1**, 4.
- `npm --prefix projects/domainspec-v2/impl run validate` → exit **1**: structural validators passed, but tools suite ended 67 pass/2 fail due retired-Saga manifest-count drift.
- `npm --prefix projects/domainspec-v2/impl run engine:test` → **97/97 pass**, exit 0.
- `npm --prefix projects/domainspec-v2/impl run tags:test` → **15/15 pass**, exit 0.
- `npm --prefix projects/domainspec-v2/impl run typecheck` → exit 0.
- `validation/poker-team/node_modules/.bin/vitest run backend/src/domain/__derived__/financial-settlement.derived.test.ts --root validation/poker-team` → **13 passed, 67 skipped**, exit 0.
- `instances.ts validate` with valid schemas and nonexistent instance directory → `no instances to validate`, exit **0**.

No files were edited.

## Agent 3 — Body War pilot and critical path

# Goldratt explorer return — Body War value path and binding constraint

## Verdict

The binding constraint is not “finish the engine” or “finish Body War.” It is the missing, machine-valid **Body War pilot/profile bridge contract** that selects the exact business slice, maps it into the DomainSpec-v2 supported profile, and defines the acceptance obligations across every graph.

Without that contract:

- engine/generalization work cannot know which Body War constructs must be supported;
- Body War cannot know which document grammar, architecture laws, formal obligations, tags, or bindings constitute conformance;
- “100% coverage” has no finite denominator;
- a pilot receipt could pass a technically green but irrelevant path.

This is already an executable failure, not merely a planning gap. Against the current clean checkout:

```text
node projects/domainspec-v2/impl/test-derivation-engine/dist/cli.js \
  lint projects/body-war/docs/features/parque-taquaral-online-mvp
```

returns RC `4`, identifying three non-canonical rule tables in `operations.md`. The engine expects `ID | Rule | Formal`, while Body War authors `Rule | Description` ([operations.md:16-23](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/features/parque-taquaral-online-mvp/operations.md:16), [operations.md:37-45](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/features/parque-taquaral-online-mvp/operations.md:37), [operations.md:58-63](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/features/parque-taquaral-online-mvp/operations.md:58)).

The release decision demands an ontology → specification → architecture/formal → generated obligations → implementation graph → cross-graph verdict chain ([release contract:14-23](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:14)), but explicitly forbids inferring the exact profile and interfaces from that high-level decision ([release contract:69](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:69)).

## Evidence posture

- **Current executable evidence:** the Body War pack fails the current DomainSpec-v2 engine lint at the first boundary.
- **Historical executable evidence:** the June 29 Task Session reports local fake-Strava Node, Postgres E2E, and Playwright passes, but leaves real activity, source-backed geometry, and promotion open ([Task Session:21-36](/home/vrondelli/projects/domainspec-core/projects/body-war/development/task-sessions/20260629T061500Z-suggested-track-one-go-build/TASK-SESSION-RESULT.md:21)).
- **Authored intent:** Body War’s currently bounded feature owns suggestions and consented activity candidates, but excludes geometry, scoring, and pilot-ready promotion ([SPEC.md:3-7](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/features/parque-taquaral-online-mvp/SPEC.md:3), [SPEC.md:76-81](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/features/parque-taquaral-online-mvp/SPEC.md:76)).
- **Project-management state:** Craft and work-pack statuses are routing evidence only. They do not establish runtime, conformance, or release proof.

## End-to-end acceptance matrix

| Frontier | Current evidence | Exact missing artifact | Owner route and dependencies | Observable acceptance and recovery | Timing / omission consequence |
|---|---|---|---|---|---|
| **BW-00 Release decision** | Product form, Body War role, inclusions, exclusions, bounded coverage/equivalence are accepted ([contract:10-38](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:10)). | None at decision altitude. | External owner decision; already closed. | Reopen only under the contract’s stated triggers. | **Closed prerequisite.** |
| **BW-01 Pilot/profile bridge — binding constraint** | Body War is named as witness, but scenario, thresholds and rollback are explicitly deferred ([contract:141-154](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:141)). | `product-contract.yml`, machine schema, `supported-profile.yml`, `pilot/body-war-scenario.yml`, source selectors, claim/negative/rollback matrix. | `invoke` define/design; decision-gate for scenario choices; semantic and claim owners. Depends BW-00. | Validator rejects placeholders and unselected obligation kinds; every downstream node names the profile digest. Roll back by restoring the prior accepted contract/profile pair. | **Blocks first release and all semantic downstream work.** Omission makes coverage/equivalence undefined. |
| **BW-02 Business-ontology graph** | Body War has feature concepts and a local framework reference bundle, but the bundle declares itself a thin reference rather than a full framework or Body War business ontology ([bundle README:12-22](/home/vrondelli/projects/domainspec-core/projects/body-war/domainspec/README.md:12)). | Governed Body War business graph plus ontology→spec mapping and contradiction/reliance rules. | `ontology-harness`/`ontology-vault`, then DomainSpec semantic-owner review. Depends BW-01. | Machine graph contains the selected actors, consent, suggestion, activity evidence, identities and business rules; missing/orphaned mappings reject. Recovery preserves the prior graph and mapping digest. | **Blocks first release.** Without it the first link of the accepted chain is fictional. |
| **BW-03 Canonical v2 feature-pack boundary** | Current pack has the intended vertical slice, but live lint rejects its rule grammar. The app and docs are still rooted in Body War/v1-era conventions. | Decision-backed external-pack manifest or normalized v2 pack; source-of-truth rule; grammar-conformance receipt; no silent duplicated authority. | DomainSpec profile/content-validation owner via `task-session`. Depends BW-01/BW-02. | Current v2 lint/content/relationship validators pass; deliberate malformed tables, missing concepts and illegal edges fail. Recovery is non-destructive normalization or adapter rollback. | **Blocks first release.** |
| **BW-04 Architecture and pattern contract** | Body War’s earlier decision references private v1 `implementation/domainspec/architecture/*` and asks for path aliases/static checks ([architecture audit:30-63](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/features/parque-taquaral-online-mvp/ARCHITECTURE-AUDIT.md:30)); current `tsconfig.json` has no DomainSpec method alias ([tsconfig:1-15](/home/vrondelli/projects/domainspec-core/projects/body-war/app/tsconfig.json:1)). APE itself says layering is post-hoc and full-program evidence remains open ([APE SPEC:48-56](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/architecture-pattern-enforcement/SPEC.md:48)). | `body-war-architecture-manifest.yml`, selected v2 pattern set, layer/edge laws, admissibility obligations, v1→v2 supersession decision. | APE + definitions/layering owners. Depends BW-01/BW-03; can run parallel with BW-05. | Positive architecture graph passes; forbidden import/edge and unsupported pattern mutations fail. Recovery removes generated projections without changing authored code/spec. | **Blocks first release.** Old method references are not v2 enforcement proof. |
| **BW-05 Formal model** | Body War declares states and transitions, including unimplemented operator transitions ([states.md:3-30](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/features/parque-taquaral-online-mvp/states.md:3)); no Body War TLA+/Alloy-like model or extraction receipt exists. | Supported-profile model/extraction contract, model file, solver manifest, invariant/satisfiability/negative receipts. | Formal-validation capability; experiment before implementation if language/solver remains undecided. Depends BW-01/BW-03. | Valid model passes; impossible transition, consent bypass, illegal promotion, and contradictory invariant fail under pinned solver. Preserve model/input/output digests for replay. | **Blocks first release.** |
| **BW-06 Generated executable verification** | Engine pipeline exists (`parse → G → δ → key → emit`) ([engine README:10-21](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/test-derivation-engine/README.md:10)), but its own Craft state records generalization and genuine δ gaps ([engine CRAFT:18-21](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/test-derivation-engine/CRAFT.md:18), [engine CRAFT:38-50](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/test-derivation-engine/CRAFT.md:38)). Legacy emission produces `it.todo` cases ([tests.ts:71-90](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts:71)). | Body War binding map; executable generated suite; obligation manifest; positive/negative/mutation/self-check receipts; zero-placeholder gate. | Test-derivation engine owner. Depends BW-03/BW-04/BW-05. | Two generations byte-identical; every applicable obligation has runnable evidence; deleted obligation, all-todo/skip, bad binding, and non-discriminating mutation reject. Generation failure leaves prior artifacts intact. | **Blocks first release.** A list of obligations is not an executable verification engine. |
| **BW-07 Code tags and implementation graph** | Body War has UI `data-od-id` selectors and imports the auth package, but no governed DomainSpec concept/edge tags were found. Code tags are explicitly the spec↔implementation bridge ([tag README:16-24](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/governance/tags/README.md:16)). Current code-tag plan still has schema, waiver and unified-gate work open ([code-tag work-pack:24-30](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/code-tag-conformance/WORK-PACK.md:24), [code-tag work-pack:85-94](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/code-tag-conformance/WORK-PACK.md:85)). | Body War tag plan, tagged implementation, extraction manifest, `implementation-graph.json`, tag/structural negative fixtures. | Code-tag conformance + APE; Body War task-session owns app annotations. Depends BW-03/BW-04; can proceed parallel with BW-06 after contracts freeze. | Every supported spec node/edge maps to an implementation node/edge or an explicit non-code disposition; missing/bad/orphaned tags and forbidden calls reject. Annotation rollback must not change runtime behavior. | **Blocks first release.** |
| **BW-08 Cross-graph preservation/equivalence** | High-level meaning exists, but exact mappings and algorithms remain deferred ([contract:34-38](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:34)). | Graph schemas, correspondence map, preservation relations, verdict taxonomy, cross-graph CLI output and mutation suite. | Cross-graph conformance owner. Depends BW-02/BW-04/BW-05/BW-06/BW-07. | Ontology, spec, architecture, formal, obligation, test and implementation graph digests reconcile; orphan node, wrong relation, forbidden edge, unsupported claim or non-discriminating witness fails. | **Blocks first release.** This is the actual equivalence claim. |
| **BW-09 Completed bounded Body War behavior** | Local fake-provider tests historically passed. Current implemented slice covers creation and `needs_evidence → evidence_submitted`; operator review/source-backed/accepted/rejected are explicitly not implemented ([states.md:15-30](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/features/parque-taquaral-online-mvp/states.md:15)). Real activity remains open ([Task Session:31-36](/home/vrondelli/projects/domainspec-core/projects/body-war/development/task-sessions/20260629T061500Z-suggested-track-one-go-build/TASK-SESSION-RESULT.md:31)). | Real consenting-activity receipt; exact release scenario runtime receipt; decision whether operator promotion belongs to the profile. | Body War product owner/operator; `task-session`. Depends BW-01 and executable app environment; informs BW-12. | Selected scenario completes with redacted real activity and no authority escalation. Failure or consent revocation removes the fixture/marks receipt revoked ([consent template:19-36](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/validation/FRIEND-ACTIVITY-CONSENT-TEMPLATE.md:19)). | **Blocks first release if “end-to-end Body War” retains real-provider meaning.** Narrowing to fake-only requires owner-approved claim narrowing. |
| **BW-10 Release safety, pinned RC, operator/support** | Old roadmap already makes self-containment, state safety, security, operability, integrated gate and clean RC prerequisites ([old roadmap:230-248](/home/vrondelli/projects/domainspec-core/implementation/domainspec/research/2026-07-12-first-production-release/findings.md:230)). Contract requires named best-effort support and diagnostic/hotfix/EOS routes ([contract:46-51](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:46)). | Pinned runtime manifest, safe-write/recovery proof, threat/dependency package, operator docs, diagnostic bundle, support policy, immutable RC receipts. | Existing R3–R9 routes; parallel side rail after BW-01. | Non-author operator runs without source reading; induced interruption recovers prior state; same SHA/artifact passes twice; support contact and withdrawal are exercised. | **Blocks first release.** |
| **BW-11 Controlled pilot receipt** | Only receipt templates/local task receipts exist. The activity receipt explicitly supports import only, not geometry, scoring, leaderboard or verification ([activity receipt:58-61](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/validation/ACTIVITY-IMPORT-RECEIPT.md:58)). | `pilot/protocol.yml`, immutable input/output manifests, machine `pilot/receipt.json`, redacted observation log, rollback receipt, independent-verifier disposition. | Pilot operator + independent verifier + support owner. Depends BW-08/BW-09/BW-10. | A non-author operator runs the entire scenario from clean checkout; every critical step passes; failures name the upstream frontier; rollback and support contact succeed. | **Final release blocker before claim acceptance.** |
| **BW-12 Claim acceptance and authorization** | Authority separation is already decided ([contract:87-102](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:87)). | Exact release manifest, independent verification, claim-acceptance and release-authorization records. | Claim owner, separate proposer/approver, external owners group. Depends BW-11. | Exact SHA, digests, claims, limits, support and withdrawal route are bound. | **Blocks release act, not implementation exploration.** |

## Critical-path DAG

```text
BW-00 accepted decision
  → BW-01 supported profile + Body War pilot scenario                 ← binding constraint
      → BW-02 business ontology
          → BW-03 canonical v2 pack / adapter
              ├→ BW-04 architecture + pattern contract ─┐
              └→ BW-05 formal model ─────────────────────┤
                                                        ├→ BW-06 generated executable verification
                                                        └→ BW-07 code tags + implementation graph
                                                              ↓
                                                   BW-08 cross-graph preservation
                                                              ↓
BW-09 real bounded Body War behavior ────────────────────────┤
BW-10 safety + RC + operator/support side rail ──────────────┤
                                                              ↓
                                                   BW-11 controlled pilot
                                                              ↓
                                         BW-12 claim acceptance/authorization
```

BW-10 runs in parallel after BW-01 but must join before the pilot. BW-09 can progress alongside the engine lanes once the scenario is frozen.

## Pilot scenario and coverage proposal

Use the existing SuggestedTrack slice because it is the only implemented coherent vertical witness. Do not silently expand the release pilot into the entire TROQAR game.

### Positive journey

1. Operator obtains the immutable DomainSpec-v2 candidate and Body War source revision.
2. CLI validates the supported profile, Body War ontology/spec, architecture and formal model.
3. CLI deterministically emits the obligation suite and executable test engine.
4. Body War implementation tags produce the implementation graph.
5. Integrated validation proves all mapped graphs and artifacts correspond.
6. A consenting runner authenticates, sees a redacted real Strava activity, creates or selects `Volta do Taquaral`, and attaches that activity as an evidence candidate.
7. State changes from `needs_evidence` to `evidence_submitted` without claiming `source_backed`, `verified`, scoring or pilot-ready authority.
8. Independent verifier reruns the same candidate and checks the pilot receipt.

### Required discriminating negatives

- missing/invalid consent;
- unauthenticated creation or evidence attachment;
- CSRF/origin failure;
- raw token/private-payload leakage;
- illegal `evidence_submitted → source_backed` promotion;
- removed business rule or state transition;
- malformed Formal cell or unsatisfiable invariant;
- forbidden architecture edge/import;
- missing/bad/orphan code tag;
- deleted obligation or binding;
- all-todo/all-skip emitted suite;
- interrupted artifact emission with prior-state recovery;
- changed Body War source SHA after evidence creation.

### Coverage denominator

For the frozen profile:

```text
coverage =
  obligations with executable positive witness
  + obligations with required discriminating negative witness
  -------------------------------------------------------------
  every applicable obligation derivable from the frozen profile
```

Pass only at 100%, with zero skipped, placeholder, orphaned, unexecutable or non-discriminating obligations, matching the contract’s binding definition ([contract:28-32](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:28)).

## Craft-ready frontier set

| Node | Relation | Classification |
|---|---|---|
| `FR-DSV2-BW-PROFILE-BRIDGE` | parent; blocks all below | blocks-first-release |
| `FR-DSV2-BW-BUSINESS-ONTOLOGY` | depends-on profile bridge | blocks-first-release |
| `FR-DSV2-BW-V2-PACK-COMPAT` | depends-on ontology/profile | blocks-first-release |
| `FR-DSV2-BW-ARCH-PATTERN` | depends-on pack | blocks-first-release |
| `FR-DSV2-BW-FORMAL-MODEL` | depends-on pack; parallel with architecture | blocks-first-release |
| `FR-DSV2-BW-GENERATED-ENGINE` | depends-on pack/architecture/formal | blocks-first-release |
| `FR-DSV2-BW-IMPLEMENTATION-GRAPH` | depends-on pack/architecture; parallel with generation | blocks-first-release |
| `FR-DSV2-BW-CROSS-GRAPH` | joins ontology/spec/architecture/formal/obligation/test/implementation | blocks-first-release |
| `FR-BW-REAL-CONSENTED-ACTIVITY` | joins pilot; Body War-owned | blocks-first-release under end-to-end claim |
| `FR-DSV2-BW-OPERATOR-SUPPORT-RC` | parallel side rail | blocks-first-release |
| `FR-DSV2-BW-PILOT-RECEIPT` | joins cross-graph, real behavior, RC | blocks-first-release |
| `FR-DSV2-BW-AUTHORIZATION` | final gate | blocks-release-act |
| `FR-BW-HOSTED-ORIGIN-ROUTE` | choose deployment route only if real callback needs hosting; current operator gate is blocked ([deployment decision:141-148](/home/vrondelli/projects/domainspec-core/projects/body-war/docs/decisions/vps-deployment-readiness.md:141)) | parallel/conditional |
| `FR-BW-GEOMETRY-SCORING` | source-backed geometry, scoring, controller authority | deferred Body War hardening unless added to pilot profile |
| `FR-BW-OPERATOR-PROMOTION` | review/source-backed/accepted/rejected lifecycle | deferred unless selected in BW-01 |
| `FR-DSV2-SHARED-METHOD-PACKAGE` | replace v1 path-reference method with reusable typed package | deferred hardening |
| `FR-DSV2-UI-HOSTED-PUBLIC-SDK-SATURN` | DomainSpec UI/service/public SDK/multi-language/full-app generation/runtime convergence | excluded by release contract ([contract:71-85](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md:71)) |

The DomainSpec-v2 Craft ledger does not yet contain the proposed first-production-release child context; its current index stops at existing authority, APE, code-tag and agent-conformance contexts ([ledger:16-35](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/.craft/ledger.yml:16)). These nodes should therefore be added under the already-proposed `CTX-DSV2-FIRST-PRODUCTION-RELEASE`, not distributed into the old subsystem contexts or treated as proof that any frontier has passed.

<oai-mem-citation>
<citation_entries>
MEMORY.md:3149-3152|note=[used only to route the live Body War evidence sweep and recheck current artifacts]
</citation_entries>
<rollout_ids>
019ec46b-f9bb-7ce2-ba2e-4501a4a47ca8
</rollout_ids>
</oai-mem-citation>
