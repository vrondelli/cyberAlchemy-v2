# Goal

Recompose the accepted DomainSpec-v2 first-production-release path around the full intended product: a private repository-local system-builder and conformance CLI that governs business meaning, produces a typed specification projection, enforces architecture and composable patterns, performs bounded TLA+/Alloy-like validation, generates executable verification, derives an implementation graph, and proves directional conformance across those artifacts using Body War as the first production witness.

The result must be strict enough to reject false-green evidence and incomplete graph chains, but bounded enough to avoid turning the first release into a general proof system, hosted product, public ecosystem, or universal hardening program.

# TL;DR

The product direction is decided; the release is not ready to execute and production is not authorized. The accepted decision makes architecture enforcement, formal validation, generated verification, structural code analysis, and bounded cross-graph conformance mandatory. The current repository has useful components—13 active backend schemas, 30 typed relationship signatures, deterministic obligation derivation, 97/97 engine tests, 15/15 tag tests, and executable Alloy/TLA research—but it does not have a sound, owned, candidate-bound chain from business authority to implementation evidence. The strongest observed generated suite passes with 13 tests and 67 skips, only 12 of 79 unique obligation keys are fully asserted, missing targets can exit cleanly, and the selected Body War pack currently fails the v2 grammar/content/relationship boundary. [Agent 1 — Executive verdict](./research.md#executive-verdict), using `projects/domainspec-v2/definitions/meta-types/meta-types.yml`, `projects/domainspec-v2/definitions/relationships/relationships.yml`, and `projects/domainspec-v2/research/alloy-tla-modeling/`; [Agent 2 — Verdict and Commands](./research.md#verdict), using `projects/domainspec-v2/impl/test-derivation-engine/`, `validation/poker-team/backend/src/domain/__derived__/financial-settlement.derived.test.ts`, and the observed command receipts; [Agent 3 — Verdict](./research.md#verdict-1), using `projects/body-war/docs/features/parque-taquaral-online-mvp/`.

The strictest sufficient route is therefore:

1. reconcile the authority baseline;
2. freeze one machine product/profile/pilot contract;
3. govern `B=(BO,BK,provenance,authority)` and its mapping into authoritative `Spec`;
4. prove the deterministic `Spec→Sg` projection and bounded `Sg→G→Sg_canonical` retraction;
5. build architecture, formal, structural-code, generated-verification, Body War behavior, and release-substrate lanes in parallel only after those contracts stabilize;
6. join them through a directional `cross_graph_conformance_vector`;
7. produce one clean reproducible release candidate and a `14/14` controlled Body War pilot receipt;
8. instantiate exact Craft continuation state; and
9. separate technical verdicts, implementation acceptance, claim acceptance, and external release authorization.

This route is **REPAIR-THEN-GATE**. Current claims of profile conformance, full coverage, formal validity, architecture/implementation conformance, cross-graph equivalence, pilot acceptance, Craft closure, release readiness, or production authorization are **KILL** until exact candidate-bound receipts exist. The old findings remain immutable history; their strict authority, state, security, operability, CI, clean-candidate, pilot, support, rollback, and release-authority gates are retained, while their narrower Option-A capability exclusions are superseded by the accepted decision. [Accepted product contract](../../decisions/2026-07-12-product-release-contract.md); [Agent 1 — Dependency-critical conclusion](./research.md#dependency-critical-conclusion); [Agent 2 — Dependency graph](./research.md#dependency-graph); [Agent 3 — Critical-path DAG](./research.md#critical-path-dag).

# Context and evidence boundary

This document is the durable findings artifact for dispatch `2026-07-13-domainspec-v2-expanded-production-frontiers`. It synthesizes, without promoting authority:

- the accepted [product-release contract](../../decisions/2026-07-12-product-release-contract.md);
- the frozen [three-agent explorer transcript](./research.md);
- the converged synthesis proposal after precedent, non-vacuity, and definitional review; and
- the prior closed findings at `implementation/domainspec/research/2026-07-12-first-production-release/findings.md`, used only to preserve history and map its gates.

It does not create canonical definitions, ratify graph schemas, implement validators, mutate the DomainSpec-v2 Craft ledger, establish conformance, accept Body War behavior, authorize a pilot, or authorize a release. Every target path and command below is proposed unless current evidence explicitly identifies it as existing.

## Provenance key

Every matrix below uses these codes; each code expands to an Agent section and its exact repository evidence:

- **A1** — [Agent 1 — formal semantics and graph equivalence](./research.md#agent-1--formal-semantics-and-graph-equivalence): `projects/domainspec-v2/authority/AXIOMS.md`, `projects/domainspec-v2/authority/AUTHORITY-MODEL.md`, `projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md`, `projects/domainspec-v2/definitions/DEFINITIONS.md`, `projects/domainspec-v2/definitions/meta-types/meta-types.yml`, `projects/domainspec-v2/definitions/relationships/relationships.yml`, `projects/domainspec-v2/impl/test-derivation-engine/src/ir/types.ts`, `projects/domainspec-v2/impl/governance/tags/`, `projects/domainspec-v2/development/architecture-pattern-enforcement/SPEC.md`, and `projects/domainspec-v2/research/alloy-tla-modeling/`.
- **A2** — [Agent 2 — executable generator and conformance engine](./research.md#agent-2--executable-generator-and-conformance-engine): `projects/domainspec-v2/impl/tools/validate-content.ts`, `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/index.ts`, `src/formal/`, `src/rules/`, `src/emit/`, `src/cli.ts`, `projects/domainspec-v2/impl/governance/tags/tools/`, `validation/poker-team/backend/src/domain/__derived__/financial-settlement.derived.test.ts`, `.github/workflows/drift-check.yml`, and the command outcomes recorded under Agent 2.
- **A3** — [Agent 3 — Body War pilot and critical path](./research.md#agent-3--body-war-pilot-and-critical-path): `projects/body-war/docs/features/parque-taquaral-online-mvp/SPEC.md`, `operations.md`, `states.md`, `ARCHITECTURE-AUDIT.md`, `projects/body-war/docs/validation/`, `projects/body-war/development/task-sessions/20260629T061500Z-suggested-track-one-go-build/TASK-SESSION-RESULT.md`, `projects/body-war/app/`, and the current Body War lint/content/relationship receipts.
- **D** — accepted owner decision in [the product-release contract](../../decisions/2026-07-12-product-release-contract.md). It settles product scope and claim meaning, not implementation truth.
- **S** — converged synthesis proposal after reviewer repair. It is the source of target names, node IDs, proposed paths, and ordering where the Agents established the need but not a canonical implementation contract.
- **P** — prior closed findings at `implementation/domainspec/research/2026-07-12-first-production-release/findings.md`; preserved only for strict gate mapping and historical precedent.

# Confirmed product contract

The following decisions are binding at product-scope altitude:

| Contract field | Confirmed meaning | Consequence for this roadmap | Provenance |
|---|---|---|---|
| Product | Private repository-local DomainSpec-v2 CLI, first target `0.1.0`, operated by authorized internal engineering teams in one pinned Linux environment | Require a compiled self-contained CLI, immutable tagged checkout, exact toolchain, private-boundary audit, operator/support package, CI, rollback, and controlled private release; do not add registry, hosted-service, or public-product work | D §§Decision, Product and operating boundary; A2 packaging/CI |
| Capability | Business ontology/knowledge, typed spec projection, architecture/pattern enforcement, bounded formal validation, generated test/conformance engine, code-tag/structural graph, directional cross-graph conformance | All are first-release blockers; current fragments cannot be relabeled as an integrated system | D §§Decision, First-release inclusions; A1 Required graph chain; A2 Capability matrix |
| Coverage | 100% of the exact profile-derived obligation universe, with executable positive evidence and every required negative/mutation class; zero skipped, placeholder, orphaned, absent, or unexecutable obligations | Denominator must be independently owned and nonempty; generator cannot define and certify its own oracle | D §Full coverage; A1 §5; A2 Coverage calculation |
| Equivalence | Declared-property traceability and preservation across mapped graphs under explicit finite bounds | Use directional predicates and proof-kind-specific results; reserve round-trip equivalence for the bounded `Sg/G` retraction; never claim universal code↔meaning identity | D §Equivalence; A1 §7; S reviewer-repaired vector |
| Pilot | Body War is the first end-to-end production witness | Freeze one exact SuggestedTrack/Parque Taquaral scenario, not the whole TROQAR product; bind consent, redaction, origin, rollback, support, and candidate digests | D §§Decision, Pilot; A3 Pilot scenario |
| Authority | DomainSpec defines meaning and derives obligations but cannot accept implementation conformance or authorize release | Keep machine verdict, implementation/platform acceptance, claim acceptance, independent verification, and external release authorization separate | D §§Release authority, Evidence and release rule; A1 §7 |
| Exclusions | No DomainSpec UI, hosted DomainSpec service, public distribution/SDK, multi-language implementation, Saturn actuation, arbitrary app generation, universal proof, undeclared-requirement proof, or automatic promotion/authorization | These are not missing hardening. Reopen only when the accepted product boundary changes | D §Binding exclusions; A1 boundaries; A3 Frontier set |

# Current-to-target atlas

| Capability | Current evidence | Current verdict | Exact target | Omission consequence | Provenance |
|---|---|---|---|---|---|
| Authority/profile | Active machine surfaces report 13 backend types and 30 relationship signatures while prose/read models retain 13/14, 24/25 and 30/31 conflicts | Partial and contradictory | One ratified `authority-baseline.yml`, then machine `product-contract.yml` and `supported-profile.yml` | Every downstream denominator and projection can be circular or false | A1 Executive verdict, using `definitions/DEFINITIONS.md`, `meta-types.yml`, `relationships.yml`; S FPR-01/02 |
| Business plane | `projects/domainspec-v2/ontology/` is a candidate authoring lens with no authority effect; no CLI constructs the accepted business plane | Absent | `BO`, `BK`, provenance, authority receipt, contradiction policy, and total `B→Spec` mapping | The first link of the declared requirements chain is fictional | A1 §1, using `ontology/README.md` and `definitions/DEFINITIONS.md`; A2 Business-ontology graph |
| Typed spec projection | Root definitions and feature packs exist; engine `G` uses a different local alphabet and accepts missing aspect files | Partial / false-green | Total `Spec→Sg` projection plus independently checked `Sg→G→Sg_canonical` retraction under approved quotients | Formal, obligation, and conformance evidence can silently omit semantics | A1 §2, using `ir/types.ts`; A2 Typed specification graph, using `grammar/index.ts`; S FPR-04 |
| Architecture/pattern | DS-D8 checks typed endpoints; APE is post-hoc and code-call evidence is whole-file regex; 26 active signatures are unsupported/nonblocking | Partial | Finite `A_req` layer/pattern/path catalogs, exact Body War source roots, structural extractor, and fail-closed conformance against `I_struct` | Architecture and composability claims are unsupported | A1 §4, using APE SPEC and category-law route; A2 Architecture laws; S FPR-05 |
| Formal | Executable Alloy/TLA research exists; Alloy found no counterexample in one scope and TLA found a freshness violation; integration was explicitly not ready | Research evidence only | Pinned `F_struct`/`F_state` translation, exhaustive bounded exploration, non-vacuity witness, failure taxonomy, source maps, counterexamples, replay | Formal-validation claim is absent; one safe trace would still be vacuous | A1 §3, using `research/alloy-tla-modeling/`; A2 Formal-model extraction; S FPR-06 |
| Obligations/tests | Deterministic derivation and 97/97 engine tests; legacy output can emit `todo`, hybrid output can emit `skip`, and parser violations can still return success | Partial / false-green | Independent nonempty `O_spec`, exact `O_gen` comparison, generated `T_gen`, executed `E_run`, per-key mutations, zero gaps | “Full coverage” can be self-certified by the generator | A1 §5; A2 Generated executable tests and Coverage calculation; S FPR-07 |
| Implementation structure | Tags carry IDs/claims, but missing roots are dropped, current call analysis is regex-led, and Body War has no governed DomainSpec tags | Partial / false-green | Frozen code roots/dispositions, pinned AST/symbol/import/call analysis, `I_struct`, complete tag reconciliation, runtime evidence policy | Annotation agreement is mistaken for implementation semantics | A1 §6; A2 Code tags and implementation graph; S FPR-08 |
| Cross-graph conformance | Separate local tools exist; no owned correspondence registry, preservation algorithms, integrated receipt, or bounded result taxonomy exists | Absent | Named directional contract predicates plus separate internal-assurance predicates in `cross_graph_conformance_vector` | No technical basis for the accepted equivalence claim | A1 §7; A2 Cross-graph traceability; S FPR-09 |
| Release substrate | Packages remain private `0.0.0`, engine entry points at source, writes can tear, empty instance corpus can pass, root CI does not gate v2 | Absent/partial | Compiled self-contained CLI, safe state lifecycle, bounded security/privacy/dependency audit, docs/support, one release workflow, clean reproducible RC | Green component tests cannot identify safe releasable bits | A2 Packaging, State writes, CI; P R3/R5/R6/R7/R8/R9; S FPR-11/12 |
| Body War | Current Parque pack fails v2 lint with three noncanonical Rules tables; content/relationship validators also fail; historical fake-provider tests do not prove real-provider pilot | Absent / currently nonconformant | Exact SuggestedTrack API journey, profile bridge, graphs, generated engine, implementation graph, conformance receipt, rollback/revocation/support, independent pilot | End-to-end production witness is missing | A2 Body War production witness; A3 Verdict and acceptance matrix; S FPR-10/13 |

The current 13-passed/67-skipped generated test result is narrow component evidence, not release proof. Agent 2 found 79 unique keys, only 12 fully generated assertions, and no mutation-kill receipt: `12/79 = 15.2%` assertion coverage before the stricter release denominator is applied. Missing-target `lint`, `emit-tests`, and `derive` also exited `0`. [Agent 2 — Coverage calculation and Commands](./research.md#coverage-calculation), using `validation/poker-team/backend/src/domain/__derived__/financial-settlement.derived.test.ts` and `projects/domainspec-v2/impl/test-derivation-engine/src/cli.ts`.

# Authority and graph flow

## Candidate vocabulary

These are candidate operational definitions, not canonical definitions. They must be registered through definitions governance or remain `Open / to-ground` with the named owner before a dependent node is executable. This prevents ontology, graph projection, generated program, and evidence from collapsing into one false authority. [A1 Required graph chain; S definitional-review repair; `projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md` C(meta-4).]

| ID | Candidate term | Operational meaning | Owner/status |
|---|---|---|---|
| `FPR-D01` | `BO` | Finite governed schema/vocabulary of in-profile business concept types, relations, rules, and constraints, with stable IDs, provenance, contradiction policy | Semantic owner + definitions governance; Open/to-ground |
| `FPR-D02` | `BK` | Profile-scoped asserted business nodes, edges, rules, and constraints that instantiate `BO`; not a synonym for ontology | Business semantic owner; Open/to-ground |
| `FPR-D03` | `B` | Contract business plane `(BO,BK,provenance,authority_receipt)` | Authority-direction decision required; Open/to-ground |
| `FPR-D04` | `Spec` | Owner-promoted authoritative DomainSpec definitions, registries, and selected feature-pack source surfaces | Existing authority boundary; exact release sources Open/to-ground |
| `FPR-D05` | `Sg` | Deterministic total typed projection `normalize(Spec,P)` with source anchors; never parallel authority | Semantic + validation owners; Open/to-ground |
| `FPR-D06` | `G` | Internal compiler IR produced by `encode:Sg→G`; not a contract semantic plane | Engine + validation owners; Open/to-ground |
| `FPR-D07` | `A_req` | Normative architecture requirements graph: layers, admissible/forbidden dependencies, selected patterns, finite path obligations; no observed imports/calls | Layering governance; Open/to-ground |
| `FPR-D08` | `F_struct` | Bounded relational structural/satisfiability projection with source map, abstraction, solver, bounds, timeout, and result taxonomy | Formal-validation + semantic owners; Open/to-ground |
| `FPR-D09` | `F_state` | Bounded state/transition projection for reachability, invariants, deadlock, and declared liveness/fairness | Formal-validation + semantic owners; Open/to-ground |
| `FPR-D10` | `O_spec(P)` | Independent authority-owned expected obligation set for exact profile `P` | Semantic + validation owners; Open/to-ground |
| `FPR-D11` | `Expected(o)` | Expected predicate/value rooted in promoted `Spec`, possibly referencing accepted `B`; never inferred from tests or implementation | Semantic owner; Open/to-ground |
| `FPR-D12` | `Req_spec(o)` | Closed set of required positive, negative, mutation, static, formal, runtime, or self-check evidence classes and expected outcomes | Validation governance + semantic approval; Open/to-ground |
| `FPR-D13` | `T_gen` | Generated executable verification program/artifacts; not evidence of execution and not its own oracle | Generation owner; Open/to-ground |
| `FPR-D14` | `E_run` | Candidate/profile/tool-bound static, formal, execution, and mutation receipts; evidence, not contract graph or authority | Validation owner + verifier; Open/to-ground |
| `FPR-D15` | `I_struct` | Observation graph over frozen roots under pinned parser/tool semantics; tags are correspondence claims | Implementation/platform owner; Open/to-ground |
| `FPR-D16` | `cross_graph_conformance_vector` | Machine vector of named directional predicates across contract planes, with internal-assurance predicates segregated and no owner-judgment pass bit | Existing validation-governance capability composes; predicate ownership remains distributed |
| `FPR-D17` | profile/structural conformance verdict | Machine result that required sources satisfy the frozen profile and structural rules; it does not accept an implementation or authorize release | Validation governance; Open/to-ground |
| `FPR-D18` | mapping-predicate verdict | Machine result for one named directional preservation/realization predicate under explicit bounds, algorithm version, and result taxonomy | Predicate owner + validation governance; Open/to-ground |
| `FPR-D19` | implementation-conformance acceptance | Implementation/platform-owner decision made only after all applicable technical predicates and evidence pass; it cannot be issued by DomainSpec semantic authority | Implementation/platform owner; candidate grounded in the Authority Model |
| `FPR-D20` | release authorization | External-owner authorization of exact SHA, artifacts, claims, channel, compatibility, support, and withdrawal route after independent verification | External DomainSpec-v2 Owners; grounded by the accepted contract |
| `FPR-D21` | node-ready | One named roadmap node has closed dependencies, present inputs, an assigned execution owner, and no inbound block | Node owner + Craft owner; candidate operational definition |
| `FPR-D22` | roadmap-ready-for-execution | Every first executable node is `FPR-D21 node-ready`, candidate definitions are tracked, and the Craft expected-state manifest is instantiated and validated | Execution owners + Craft owner; candidate operational definition |
| `FPR-D23` | release-ready | Every contract-required pre-release node and gate has passed for one exact candidate | Claim owner + verifier; candidate operational definition |
| `FPR-D24` | production-authorized | `FPR-D20 release authorization` exists for one exact artifact/configuration under named actors, environment, compatibility, support, and withdrawal boundaries | External DomainSpec-v2 Owners; currently false |

## Required flow

```text
FPR-00 accepted product decision
  → FPR-01 reconciled authority baseline
  → FPR-02 machine product/profile/pilot contract P
  → FPR-03 B=(BO,BK,provenance,authority) ─owned mapping─► authoritative Spec
  → FPR-04 Spec ─normalize(Spec,P)─► Sg
                      │
                      ├─ encode ─► G ─manifest─► Sg_canonical
                      │             internal bounded retraction
                      ├─ translate ─► F_struct / F_state
                      ├─ derive ────► A_req
                      └─ ground ────► O_spec(P)
                                           │ exact-set comparison
                                           ▼
                                      O_gen(P) ─► T_gen

Body War frozen roots ─AST/symbol/import/call analysis─► I_struct
T_gen + tools + candidate ─execute/formal/static/mutate─► E_run

contract comparison: {B, Sg, A_req, O_spec, T_gen, I_struct}
internal assurance:  {G, F_struct, F_state, E_run}
```

Generated JSON is a deterministic source-linked projection, not a new semantic authority. `BO/BK` gain authority only through explicit owner promotion. `Sg`, `A_req`, and `O_spec` trace to promoted source owners. `G`, `F_*`, and `E_run` remain internal proof artifacts unless the machine product contract explicitly exposes them. This separation is the reviewer-repaired interpretation of the accepted contract. [A1 §§1–7, using the Authority Model and constitution; D capability chain; S precedent and definitional repairs.]

The only relation named equivalence is the bounded retraction:

```text
for each supported s in Sg:
  manifest(encode(s)) = canonicalize(s, quotient_registry)
```

An independent comparator consumes `graphs/spec-graph.json`, `graphs/compiler-ir.json`, `graphs/semantic-manifest.json`, and `registries/quotient-registry.yml`. Every quotient names source IDs, preserved properties, owner approval, and a negative mutant. This is not symmetric semantic authority or graph identity. [A1 §2, using `impl/test-derivation-engine/src/ir/types.ts`; S FPR-04.]

# Bounded coverage and directional conformance semantics

For exact supported profile `P`:

```text
O_spec(P) = independently authored expected obligation records
O_gen(P)  = engine-derived obligation records

coverage_precondition:
  O_spec(P) is nonempty
  keys(O_spec(P)) = keys(O_gen(P))
  each generated record preserves source anchor, predicate, applicability,
  evidence requirement, and derivation-rule version

W(o) := every evidence class e in Req_spec(o)
        executed against the exact candidate
        and Outcome(e,o) = Expected(e,o)

coverage(P) = |{o in O_spec(P) : W(o)}| / |O_spec(P)|
```

Pass is exactly `1.0`. Any absent required input/binding, ignored construct, unsupported applicable relation, parser violation, duplicate, orphan, skip, todo, placeholder, unexecutable test, indeterminate formal result, or surviving required mutant blocks. Mutations are keyed per obligation, not merely per broad class. The claim is profile-relative obligation coverage, not runtime-path coverage or proof of undiscovered requirements. [D §Full coverage; A1 §5; A2 Coverage calculation; S independent-oracle repair.]

The minimum contract predicate registry is directional:

| Predicate | Direction and preserved property | Proof kind / failure posture | Owner | Provenance |
|---|---|---|---|---|
| `CG-BS-TOTAL` | `B→Sg`: every in-profile business ID/rule/constraint maps to typed source-anchored specification content; approved quotients only | Finite totality, identity, type, relation, constraint checks; omission/collision/mistype fail | Business + semantic owners; validation checks | A1 §1; A3 BW-02; S FPR-03 |
| `CG-S-A` | `Sg→A_req`: every selected architecture/pattern law is source-backed and obligation-producing | Finite catalog comparison; orphan law/path fails | Layering governance | A1 §4; A2 Architecture; S FPR-05 |
| `CG-A-I` | `I_struct satisfies A_req`; no reverse certification | Static approximation under frozen roots; forbidden/missing/unknown fails or is indeterminate by declared policy | Layering law + implementation/platform acceptance | A1 §§4,6; A2 Code tags; S FPR-08/09 |
| `CG-S-O` | `Sg→O_spec`: every obligation has a source anchor and expected result | Exact finite comparison; orphan/missing expectation fails | Semantic + validation owners | A1 §5; S FPR-07 |
| `CG-O-T` | `O_spec→T_gen`: exactly the required executable realization/binding exists | Exact set and binding checks; skip/todo/duplicate/orphan/unrunnable fails | Validation + generation owners | A1 §5; A2 Generator; S FPR-07 |
| `CG-T-E` | `T_gen→E_run`: each generated artifact executed under declared tools/candidate and produced expected receipts | Executed witness and per-key mutation; missing/survivor fails | Validation owner; verifier reproduces | A2 Proof protocol; S FPR-07/09 |
| `CG-S-I` | `Sg→I_struct`: every required code realization has verified correspondence or explicit non-code disposition | Finite mapping plus static observation; tags alone never pass structure | Semantic mapping + implementation/platform owner | A1 §6; A2 Implementation graph; S FPR-08 |

Internal-assurance predicates are separate: `IA-SG-RETRACT`, `IA-SF-STRUCT`, `IA-SF-STATE`, and `IA-EVIDENCE-INTEGRITY`. Each registry row must name domain, codomain, algorithm path/version, preserved property, allowed quotient/abstraction, proof kind, finite bound, inputs, output, pass/fail/indeterminate codes, negative fixture, owner, and independent-verification rule. A digest match proves identity/provenance only. Owner judgment is downstream and cannot make a failed or indeterminate technical predicate pass. [A1 §7; S reviewer-repaired conformance vector.]

Formal validation is exhaustive only inside the declared finite scope/state space. `formal/formal-profile.yml` must bind literal languages, solver executables/versions, supported source constructs, translation versions, relational scopes, integer/sequence bounds, state constants/configuration, workers, timeout/resource ceilings, safety/reachability/deadlock/fairness/liveness policy, result taxonomy, normalization, source maps, counterexamples, and replay. Timeout, translation gap, tool error, or truncated exploration is indeterminate and blocks. SAT means one model/trace exists under named bounds; it does not mean business correctness. [A1 §3, using the Alloy/TLA tower; A2 Formal-model extraction; S formal reviewer repairs.]

# Contract-relative roadmap node matrix

| Node | Object and current state | Applicability | Release timing | Work kind | Primary owner/route | Provenance |
|---|---|---|---|---|---|---|
| `FPR-00` | Accepted product decision; closed at decision altitude | applies | closed prerequisite | decision | External DomainSpec-v2 Owners | D; S |
| `FPR-01` | Authority baseline; unresolved count/status/direction conflicts | applies | blocks-first-release | capability + owner decision | Definitions, validation, layering owners through existing gates | A1 Executive; P R1; S |
| `FPR-02` | Machine product/profile/pilot contract; absent | applies | blocks-first-release | decision + capability | Claim + semantic owners via invoke/decision-gate | D deferred items; A2 E1; A3 BW-01; S |
| `FPR-03` | Governed business plane and `B→Spec`; absent | applies | blocks-first-release | capability | Business/semantic owners; ontology-harness + definitions governance | A1 §1; A2 ontology; A3 BW-02; S |
| `FPR-04` | `Spec→Sg` and internal retraction; absent/partial parser precedent | applies | blocks-first-release | capability | Semantic, validation, engine owners | A1 §2; A2 graph loader; S |
| `FPR-05` | Finite architecture/pattern contract and enforcement; partial | applies | blocks-first-release | capability | Layering governance; FPR integration uses APE evidence | A1 §4; A2 architecture; S |
| `FPR-06` | Formal profile and `F_struct/F_state` integration; research only | applies | blocks-first-release | research + capability | Formal-validation + semantic owners; experiment then promotion task | A1 §3; A2 formal; S |
| `FPR-07` | Independent obligations, generated verification, execution/mutation evidence; partial/false-green | applies | blocks-first-release | capability | Semantic, validation, generation owners | A1 §5; A2 generator/coverage; S |
| `FPR-08` | Frozen-root structural implementation graph and tags; partial | applies | blocks-first-release | capability | Implementation/platform owner; uses code-tag context | A1 §6; A2 implementation graph; S |
| `FPR-09` | Directional conformance vector; absent | applies | final technical blocker | capability | Existing validation-governance capability composes distributed owners | A1 §7; A2 conformance; S |
| `FPR-10` | Exact Body War runtime behavior; historical fake-only evidence | applies under end-to-end profile | blocks-first-release | capability + operation | Body War product/operator owner via task-session | A3 BW-09; A2 Body War; S |
| `FPR-11` | Runtime/state/security/operability/support substrate; partial/absent | applies | blocks-first-release | capability + hardening + operation | Runtime, state, security, support owners | A2 package/state; P R3/R5/R6/R7; S |
| `FPR-12` | One clean reproducible RC and CI gate; absent | applies | blocks-first-release | operation | Runtime + validation owners, release operator, verifier | A2 CI; P R8/R9; S |
| `FPR-13` | Controlled `14/14` Body War pilot; absent | applies | final pre-claim blocker | operation | Pilot operator, verifier, support owner | A3 BW-11; P R10; S |
| `FPR-14` | Craft expected-state equality and continuation; context absent | applies | blocks claim acceptance; then ongoing | operation | Craft owner | A3 Craft-ready frontier; P R12a/b; S |
| `FPR-15` | Claim acceptance, external authorization, exact release act; authority shape decided, act absent | applies | blocks release act | decision + operation | Claim owner, distinct proposer/approver, verifier, external owners, release operator | D Release authority; A1 §7; A3 BW-12; S |

# Per-node operational table

Every path below is literal. `projects/domainspec-v2/development/first-production-release/` contains planning, contracts, proposed tools, and pre-release evidence; `projects/domainspec-v2/releases/RELEASE-ID/` contains the immutable release-candidate and authorized-release records. Every named artifact is a target unless identified as existing.

| Node | Exact artifacts/paths | Dependencies | Positive proof and required negative controls | Exit condition | Consequence if omitted | Provenance |
|---|---|---|---|---|---|---|
| `FPR-00 ACCEPTED-DECISION` | Existing `projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md`; proposed `projects/domainspec-v2/development/first-production-release/tools/check-decision-reopen.cjs` | none | Decision receipt remains accepted; reopen only on recorded product-boundary triggers | Decision branch remains closed | Product direction becomes ambiguous; production still cannot be inferred | D §Reopen conditions; S FPR-00 |
| `FPR-01 AUTHORITY-BASELINE` | Proposed `projects/domainspec-v2/development/first-production-release/authority-baseline.yml` and `projects/domainspec-v2/development/first-production-release/evidence/authority-baseline-ratification.json` | FPR-00 | Existing validation/noncollapse checks; reconcile 13/14, 24/25, 30/31, composability, stale projections, ontology direction; mutate one authority count/reference | One clean non-contradictory owner-ratified baseline | Later contracts become circular or select stale authority | A1 Executive, exact definitions/meta-type/relationship sources; P R1; S |
| `FPR-02 PRODUCT-PROFILE-PILOT` | Proposed `projects/domainspec-v2/development/first-production-release/product-contract.yml`, `projects/domainspec-v2/development/first-production-release/schemas/product-contract.schema.json`, `projects/domainspec-v2/development/first-production-release/supported-profile.yml`, `projects/domainspec-v2/development/first-production-release/schemas/supported-profile.schema.json`, `projects/domainspec-v2/development/first-production-release/pilot/body-war-scenario.yml`, `projects/domainspec-v2/development/first-production-release/pilot/claim-matrix.yml`, `projects/domainspec-v2/development/first-production-release/pilot/negative-matrix.yml`, `projects/domainspec-v2/development/first-production-release/pilot/rollback-matrix.yml`, `projects/domainspec-v2/development/first-production-release/pilot/allowed-redacted-fields.yml`, and `projects/domainspec-v2/development/first-production-release/evidence/profile-digest.json` | FPR-01 | One validator consumes every listed path; empty profile, unknown type, absent root, placeholder owner, unselected obligation kind, unresolved callback/origin, and empty redaction allowlist reject | One stable profile digest consumed by every downstream artifact | Denominators, behavior, interfaces, and pilot relevance stay undefined | D deferred product work; A2 E1; A3 BW-01; S FPR-02 |
| `FPR-03 BUSINESS-PLANE` | Proposed `projects/domainspec-v2/development/first-production-release/graphs/business-ontology.json`, `projects/domainspec-v2/development/first-production-release/graphs/business-knowledge.json`, `projects/domainspec-v2/development/first-production-release/graphs/business-graph-manifest.json`, `projects/domainspec-v2/development/first-production-release/graphs/b-s-map.json`, `projects/domainspec-v2/development/first-production-release/schemas/business-ontology.schema.json`, `projects/domainspec-v2/development/first-production-release/schemas/business-knowledge.schema.json`, `projects/domainspec-v2/development/first-production-release/schemas/business-graph-manifest.schema.json`, `projects/domainspec-v2/development/first-production-release/schemas/b-s-map.schema.json`, and `projects/domainspec-v2/development/first-production-release/decisions/ontology-spec-direction.md` | FPR-02 | Real mappings include `parque-taquaral-online-mvp.CreateSuggestedTrack`+`CT-1` and `ActivityEvidenceCandidate`+`EC-3/EC-4`; deletion, mistyped endpoint, orphan rule, and collapsed identities each return distinct nonzero codes | Total owner-promoted `B→Spec` mapping plus contradiction policy and prior authority-direction reconciliation | Requirements chain begins from an unowned fiction | A1 §1; A3 BW-02; S FPR-03 |
| `FPR-04 SPEC-PROJECTION` | Proposed `projects/domainspec-v2/development/first-production-release/registries/required-documents.yml`, `projects/domainspec-v2/development/first-production-release/registries/quotient-registry.yml`, `projects/domainspec-v2/development/first-production-release/graphs/spec-graph.json`, `projects/domainspec-v2/development/first-production-release/graphs/compiler-ir.json`, `projects/domainspec-v2/development/first-production-release/graphs/semantic-manifest.json`, `projects/domainspec-v2/development/first-production-release/schemas/spec-graph.schema.json`, `projects/domainspec-v2/development/first-production-release/schemas/compiler-ir.schema.json`, `projects/domainspec-v2/development/first-production-release/schemas/semantic-manifest.schema.json`, `projects/domainspec-v2/development/first-production-release/manifests/spec-source-manifest.json`, and `projects/domainspec-v2/development/first-production-release/tools/verify-spec-projection.cjs` | FPR-03 | Missing/empty source or graph, formation-deferred type, every supported field/type/edge/document mutation, and unapproved quotient reject | Zero unmapped profile elements and retraction equality by the separately implemented comparator | All later derivations can silently lose source meaning | A1 §2; A2 Typed spec graph; S FPR-04 |
| `FPR-05 ARCHITECTURE` | Proposed `projects/domainspec-v2/development/first-production-release/catalogs/architecture-layers.yml`, `projects/domainspec-v2/development/first-production-release/catalogs/architecture-patterns.yml`, `projects/domainspec-v2/development/first-production-release/catalogs/composition-paths.yml`, `projects/domainspec-v2/development/first-production-release/graphs/architecture-graph.json`, `projects/domainspec-v2/development/first-production-release/manifests/body-war-architecture-sources.yml`, `projects/domainspec-v2/development/first-production-release/manifests/architecture-extractor-toolchain.json`, and `projects/domainspec-v2/development/first-production-release/tools/validate-architecture.cjs` | FPR-04; parallel FPR-06/FPR-08 | Catalog IDs form denominator; forbidden import, reversed edge, comment/dead-code call, invalid path grouping, unsupported applicable signature reject; report `detected` separately from `unconstructible` | Every applicable catalog item enforced with no unapproved v1/runtime dependency | Architecture/pattern claim is false; shared-method frontier becomes blocking if v2 is not self-contained | A1 §4; A2 architecture; S FPR-05 |
| `FPR-06 FORMAL` | Proposed `projects/domainspec-v2/development/first-production-release/formal/formal-profile.yml`, `projects/domainspec-v2/development/first-production-release/schemas/formal-profile.schema.json`, `projects/domainspec-v2/development/first-production-release/formal/source-map.json`, `projects/domainspec-v2/development/first-production-release/formal/toolchain-lock.json`, `projects/domainspec-v2/development/first-production-release/formal/result-manifest.json`, `projects/domainspec-v2/development/first-production-release/evidence/formal/counterexamples/`, `projects/domainspec-v2/development/first-production-release/evidence/formal/receipts/`, and `projects/domainspec-v2/development/first-production-release/tools/run-formal-profile.cjs`; exact generated model filenames/extensions remain the uniquely tracked Open/to-ground path decision `FR-FPR-SOLVER-PROFILE`; approved upstream research assets remain under `projects/domainspec-v2/research/alloy-tla-modeling/` | FPR-04; parallel FPR-05/FPR-08 | Exhaust declared finite scopes/state spaces; reachable non-vacuity witness; consent bypass, direct `needs_evidence→source_backed`, impossible constraint, contradictory invariant mutants; timeout/gap/error is indeterminate | All declared formal obligations adjudicated with pinned tools/bounds and no indeterminate | Formal claim absent or vacuous; research examples cannot substitute | A1 §3; A2 formal; S FPR-06 |
| `FPR-07 OBLIGATION-VERIFICATION` | Proposed `projects/domainspec-v2/development/first-production-release/registries/obligation-registry.yml`, `projects/domainspec-v2/development/first-production-release/registries/evidence-requirements.yml`, `projects/domainspec-v2/development/first-production-release/obligations/obligation-expectations.json`, `projects/domainspec-v2/development/first-production-release/obligations/obligations.generated.json`, `projects/domainspec-v2/development/first-production-release/bindings/body-war-obligation-bindings.yml`, `projects/domainspec-v2/development/first-production-release/schemas/obligation-binding.schema.json`, `projects/domainspec-v2/development/first-production-release/generated-tests/body-war.generated.test.ts`, `projects/domainspec-v2/development/first-production-release/evidence/generated-suite-validation.json`, `projects/domainspec-v2/development/first-production-release/evidence/execution/execution-receipt.json`, and `projects/domainspec-v2/development/first-production-release/evidence/mutations/mutation-receipts.json` | FPR-04/05/06; generic mechanism may start after FPR-04 but cannot close early | Independent exact-set comparator; mutate every obligation key; parser violation, absent binding, zero obligations, todo/skip, duplicate/orphan, unrunnable test, or survivor returns nonzero | `coverage=1.0`, nonempty exact set equality, expected outcomes satisfied | Generator self-certifies an incomplete test universe | A1 §5; A2 Generator/Coverage; S FPR-07 |
| `FPR-08 IMPLEMENTATION-STRUCTURE` | Proposed `projects/domainspec-v2/development/first-production-release/manifests/body-war-code-roots.yml`, `projects/domainspec-v2/development/first-production-release/registries/code-root-dispositions.yml`, `projects/domainspec-v2/development/first-production-release/manifests/implementation-analysis-toolchain.json`, `projects/domainspec-v2/development/first-production-release/registries/code-tag-grammar.yml`, `projects/domainspec-v2/development/first-production-release/graphs/implementation-graph.json`, `projects/domainspec-v2/development/first-production-release/schemas/implementation-graph.schema.json`, and `projects/domainspec-v2/development/first-production-release/evidence/implementation/tag-reconciliation.json` | FPR-04/05; parallel FPR-06/07 | Candidate roots requiring owner decision: `projects/body-war/app/server.ts`, `projects/body-war/app/src/**/*.ts`, `projects/body-war/app/static/app.js`; explicit tests/generated dispositions; missing root, unresolved symbol, comment/dead code, stale/missing/orphan tag, forbidden import and unanalyzed runtime case reject/indeterminate | Complete frozen-root denominator bound to candidate SHA | Annotation claims are mistaken for code structure and behavior | A1 §6; A2 implementation graph; S FPR-08 |
| `FPR-09 CROSS-GRAPH` | Proposed `projects/domainspec-v2/development/first-production-release/registries/correspondence-predicates.yml`, `projects/domainspec-v2/development/first-production-release/manifests/correspondence-algorithms.json`, `projects/domainspec-v2/development/first-production-release/fixtures/cross-graph/`, `projects/domainspec-v2/development/first-production-release/schemas/cross-graph-conformance-vector.schema.json`, and `projects/domainspec-v2/development/first-production-release/evidence/cross-graph-conformance-vector.json` | FPR-03–08 | Each identity, relation, invariant, architecture, obligation, test, tag, and runtime mutant fails at its named boundary/code; verifier reproduces | Every required contract predicate and internal-assurance predicate passes | Accepted equivalence/conformance claim has no machine basis | A1 §7; A2 conformance; S FPR-09 |
| `FPR-10 BODY-WAR-BEHAVIOR` | Proposed `projects/domainspec-v2/development/first-production-release/pilot/body-war-scenario.yml`, `projects/domainspec-v2/development/first-production-release/pilot/body-war-api-fixtures/`, `projects/domainspec-v2/development/first-production-release/pilot/provider-origin-redaction-decision.yml`, and `projects/domainspec-v2/development/first-production-release/pilot/body-war-runtime-receipt.json` | FPR-02 + executable app environment; parallel FPR-04–09 | Auth, consent, redaction, CSRF/origin, token/private payload leak, illegal promotion, removed rule/transition negatives; real-provider path required unless claim is explicitly narrowed | Exact API journey succeeds and callback/origin/redaction applicability is closed | Pilot can be green but irrelevant or authority-inflating | A3 BW-09 and Pilot scenario; A2 Body War; S FPR-10 |
| `FPR-11 RELEASE-SUBSTRATE` | Existing build target `projects/domainspec-v2/impl/test-derivation-engine/dist/cli.js`; proposed `projects/domainspec-v2/development/first-production-release/runtime-manifest.json`, `projects/domainspec-v2/development/first-production-release/evidence/release-substrate/clean-cli-smoke.json`, `projects/domainspec-v2/development/first-production-release/schemas/state-format.schema.json`, `projects/domainspec-v2/development/first-production-release/state/journal-design.md`, `projects/domainspec-v2/development/first-production-release/state/recovery-protocol.md`, `projects/domainspec-v2/development/first-production-release/security/threat-data-flow.md`, `projects/domainspec-v2/development/first-production-release/security/dependency-license-inventory.json`, `projects/domainspec-v2/development/first-production-release/security/vulnerability-dispositions.yml`, `projects/domainspec-v2/development/first-production-release/security/release-allowlist.yml`, `projects/domainspec-v2/development/first-production-release/security/security-policy.yml`, `projects/domainspec-v2/development/first-production-release/QUICKSTART.md`, `projects/domainspec-v2/development/first-production-release/CLI.md`, `projects/domainspec-v2/development/first-production-release/RECOVERY.md`, `projects/domainspec-v2/development/first-production-release/UPGRADE.md`, `projects/domainspec-v2/development/first-production-release/ROLLBACK.md`, `projects/domainspec-v2/development/first-production-release/SUPPORT.md`, `projects/domainspec-v2/development/first-production-release/DEPRECATION.md`, and `projects/domainspec-v2/development/first-production-release/operator-checklist.yml` | FPR-02 side rail | Arbitrary-path run; interruption/collision/concurrency/symlink/stale-state/migration; secret/private leak/dependency policy; unaided operator, support acknowledgement, rollback/withdrawal; all bind one candidate | Self-contained recoverable supported CLI for named actors | Exact bits may be coupled, corrupting, leaking, or unusable | A2 package/state; P R3/R5/R6/R7; S FPR-11 |
| `FPR-12 CI-CLEAN-RC` | Proposed `.github/workflows/domainspec-v2-release.yml`, `projects/domainspec-v2/development/first-production-release/schemas/release-receipt.schema.json`, `projects/domainspec-v2/releases/RELEASE-ID/evidence/`, `projects/domainspec-v2/releases/RELEASE-ID/semantic-manifest.json`, `projects/domainspec-v2/releases/RELEASE-ID/artifact-manifest.json`, `projects/domainspec-v2/releases/RELEASE-ID/toolchain-manifest.json`, and `projects/domainspec-v2/releases/RELEASE-ID/normalization-policy.yml`; the `projects/domainspec-v2/releases/` authority is distinct from the development directory | FPR-04–11 | One local `release:verify` and seeded-red CI; two arbitrary-path runs use same SHA/lock/profile/solver/toolchain; declared timestamps/absolute paths normalized before byte/digest comparison | Exact clean candidate supersedes dirty/conflicting snapshots | No identifiable set of bits has passed the release contract | A2 CI; P R8/R9; S FPR-12 |
| `FPR-13 CONTROLLED-PILOT` | Proposed `projects/domainspec-v2/development/first-production-release/pilot/protocol.yml`, `projects/domainspec-v2/development/first-production-release/pilot/critical-steps.yml`, `projects/domainspec-v2/development/first-production-release/pilot/receipt.json`, `projects/domainspec-v2/development/first-production-release/pilot/redacted-observation-log.jsonl`, `projects/domainspec-v2/development/first-production-release/pilot/rollback-receipt.json`, `projects/domainspec-v2/development/first-production-release/pilot/revocation-receipt.json`, `projects/domainspec-v2/development/first-production-release/pilot/support-receipt.json`, and `projects/domainspec-v2/development/first-production-release/pilot/verifier-identity.json` | FPR-09/10/11/12 | Exact 14-step matrix below; controlled negatives and Body War source-SHA mutation | `14/14`, rollback, revocation, support, and independent reproduction pass; otherwise route upstream | Tests do not prove the selected system can be operated and recovered | A3 BW-11; P R10; S FPR-13 |
| `FPR-14 CRAFT-CONTINUATION` | Tracked context ID `CTX-DSV2-FIRST-PRODUCTION-RELEASE`; proposed `projects/domainspec-v2/development/first-production-release/craft/expected-node-edge-manifest.yml`, `projects/domainspec-v2/development/first-production-release/evidence/craft/craft-equality-receipt.json`, and `projects/domainspec-v2/development/first-production-release/tools/validate-craft-release-context.cjs`; actual authority remains `projects/domainspec-v2/.craft/ledger.yml` | Seed before claim acceptance; operate continuously | Expected nodes/edges/fields equal actual; omitted or extra release node is typed failure | Exact Craft equality and no known release residue only in prose/Inventory | Strategy cannot persist or reopen frontiers safely | A3 Craft-ready set; P R12a/b; S FPR-14 |
| `FPR-15 CLAIM-AUTH-RELEASE` | Proposed immutable release records `projects/domainspec-v2/releases/RELEASE-ID/release-manifest.json`, `projects/domainspec-v2/releases/RELEASE-ID/claim-acceptance.json`, `projects/domainspec-v2/releases/RELEASE-ID/release-authorization.json`, `projects/domainspec-v2/releases/RELEASE-ID/manifest.sha256`, and `projects/domainspec-v2/releases/RELEASE-ID/distribution-receipt.json`; exact tag ref `refs/tags/RELEASE-ID` | FPR-13/14 | Bind SHA, every contract plane, internal evidence, profile/tool/solver/receipt digests, claims/limits, roles, support/withdrawal; proposer≠approver; verifier did not author evidence; any change invalidates | Exact private bits and claims authorized then released append-only | Technical system self-authorizes or wrong bits ship | D Release authority; A1 §7; A3 BW-12; S FPR-15 |

# Old roadmap mapping

The prior findings are immutable history. This mapping supersedes only their executable route under the accepted broader capability contract.

| Earlier object | New disposition |
|---|---|
| Old `G0` / candidate `C0` | `FPR-00`; product branch closed. Late-bound release membership moves to FPR-15 and is not planning theater. |
| Prior `R1` / candidate `C2` authority work | `FPR-01` authority baseline, then `FPR-03` governed business plane. Authority must precede profile. |
| Prior `R2` / candidate `C1` | `FPR-02`; exact machine profile/pilot contract after FPR-01. |
| Candidate `C3` | `FPR-04`; separate authoritative `Spec`, projected `Sg`, internal `G`, and independent bounded retraction. |
| Candidate `C4` / `F-APE` | `FPR-05`; finite release enforcement mandatory. APE is dependency/evidence, not complete implementer; general mint/inheritance/cross-project propagation remains excluded. |
| Candidate `C5` / old `F-FORMAL` | `FPR-06`; split profile experiment from integration and `F_struct` from `F_state`; bounded formal validation mandatory, universal proof excluded. |
| Candidate `C6` / old `F-CODEGEN` | `FPR-07`; verification/test generation mandatory; arbitrary application generation remains excluded. |
| Candidate `C7` / prior code-tag conditional | `FPR-08`; tags mandatory as correspondence claims, structural analyzer is new implementation/platform-owned work. |
| Candidate `C8` | `FPR-09`; existing validation-governance capability composes directional predicates whose owners remain distributed. |
| Candidate `C9` | `FPR-10`; exact Body War API/consent/redaction/origin behavior. |
| Candidate `C10` / prior `R3,R5,R6,R7` | `FPR-11`; retained without weakening. |
| Candidate `C11` / prior `R8,R9` | `FPR-12`; expanded to bind profile, solvers, tools, normalization, generated outputs, and seeded-red CI. |
| Candidate `C12` / prior `R10` | `FPR-13`; exact `14/14` critical-step denominator. |
| Candidate `C13` / prior `R12a,R12b` | `FPR-14`; expected-state manifest and exact equality; current closure remains KILL. |
| Candidate `C14` / prior `G1,G2,R11` | `FPR-15`; separation retained; current release act remains KILL. |
| `FR-01` | Feeds FPR-04/FPR-12; frozen construct/failure/corpus matrix remains required. |
| `FR-02` | Feeds FPR-11 self-containment. |
| `FR-03` | Feeds FPR-11 safe state lifecycle. |
| `FR-04` | Feeds FPR-12 performance envelope. |
| `FR-05` | Feeds FPR-10/FPR-13 operator and pilot evidence. |
| `FR-06/07/08/09` | Remain dormant: Saturn/runtime convergence, supported DomainSpec UI, public derivative, hosted DomainSpec service. A Body War callback host does not turn DomainSpec into a hosted service. |
| `FR-DSV2-SHARED-METHOD-PACKAGE` | Dormant only if FPR-05 is self-contained and has no private-v1 method dependency; otherwise promote to blocker. |
| `F-HERMETIC/F-SBOM/F-ATTEST`, tabletop, central telemetry | Trigger-bound. FPR-11 records the threat/distribution rationale; exact output normalization and candidate digests remain mandatory. |
| `V1-FREEZE` | Separate authority gate; first release requires self-containment, not silent Import Manifest mutation. |

Mapping provenance: prior closed roadmap `implementation/domainspec/research/2026-07-12-first-production-release/findings.md`; A1–A3 dependency findings; D supersession statement; S reviewer-repaired mapping.

# Dependency DAG and parallel lanes

```text
FPR-00 accepted decision
  → FPR-01 authority baseline
      → FPR-02 product/profile/pilot contract
          → FPR-03 B=(BO,BK) + B→Spec
              → FPR-04 Spec→Sg + internal G retraction
                  ├─ FPR-05 A_req / architecture integration ─┐
                  ├─ FPR-06 F_struct/F_state integration ─────┤
                  ├─ FPR-08 I_struct extraction ──────────────┤
                  └─ FPR-07 O_spec→T_gen* ────────────────────┤
                                                              ▼
                                                    FPR-09 conformance vector
FPR-10 exact Body War behavior ───────────────────────────────┤
FPR-11 runtime/state/security/operability side rail ──────────┤
                                                              ▼
                                                    FPR-12 clean RC/CI
                                                              ▼
                                                    FPR-13 controlled pilot
                                                              ▼
                                                    FPR-14 Craft equality
                                                              ▼
                                                    FPR-15 claims/auth/release
```

FPR-05, FPR-06, FPR-08, FPR-10, and FPR-11 are the principal parallel lanes after their named contracts exist. FPR-07 can build generic machinery after FPR-04 but cannot close until FPR-05/FPR-06 have contributed their obligation classes. FPR-09 is the technical join. FPR-13 is the runtime/human join. Parallelism before FPR-02/FPR-04 would create mutually inconsistent denominators and graph schemas. [A1 Dependency-critical conclusion; A2 Dependency graph; A3 Critical-path DAG; S ordering repairs.]

# Proposed exact proof commands

Except for the FPR-01 repository commands explicitly labeled existing, every command below is a **proposed target command**. Its absence today is evidence that the corresponding node is not `FPR-D21 node-ready`; this block does not claim the proposed tool is deployed.

```sh
# FPR-01 — existing baseline checks
npm --prefix projects/domainspec-v2/impl run validate
npm --prefix projects/domainspec-v2/impl run instances:validate
projects/domainspec-v2/impl/node_modules/.bin/tsx projects/domainspec-v2/impl/tools/validate-meta-types-noncollapse.ts
git status --porcelain -- projects/domainspec-v2

# FPR-02 — proposed target command
node projects/domainspec-v2/development/first-production-release/tools/validate-product-contract.cjs \
  --contract projects/domainspec-v2/development/first-production-release/product-contract.yml \
  --schema projects/domainspec-v2/development/first-production-release/schemas/product-contract.schema.json \
  --profile projects/domainspec-v2/development/first-production-release/supported-profile.yml \
  --profile-schema projects/domainspec-v2/development/first-production-release/schemas/supported-profile.schema.json \
  --scenario projects/domainspec-v2/development/first-production-release/pilot/body-war-scenario.yml \
  --claims projects/domainspec-v2/development/first-production-release/pilot/claim-matrix.yml \
  --negatives projects/domainspec-v2/development/first-production-release/pilot/negative-matrix.yml \
  --rollback projects/domainspec-v2/development/first-production-release/pilot/rollback-matrix.yml \
  --redaction-allowlist projects/domainspec-v2/development/first-production-release/pilot/allowed-redacted-fields.yml \
  --emit-digest projects/domainspec-v2/development/first-production-release/evidence/profile-digest.json

# FPR-03/FPR-04 — proposed target commands
node projects/domainspec-v2/development/first-production-release/tools/validate-business-plane.cjs \
  --manifest projects/domainspec-v2/development/first-production-release/graphs/business-graph-manifest.json
node projects/domainspec-v2/development/first-production-release/tools/verify-spec-projection.cjs \
  --profile projects/domainspec-v2/development/first-production-release/supported-profile.yml \
  --quotients projects/domainspec-v2/development/first-production-release/registries/quotient-registry.yml

# FPR-05/FPR-06 — proposed target commands
node projects/domainspec-v2/development/first-production-release/tools/validate-architecture.cjs \
  --requirements projects/domainspec-v2/development/first-production-release/graphs/architecture-graph.json \
  --sources projects/domainspec-v2/development/first-production-release/manifests/body-war-architecture-sources.yml
node projects/domainspec-v2/development/first-production-release/tools/run-formal-profile.cjs \
  --profile projects/domainspec-v2/development/first-production-release/formal/formal-profile.yml

# FPR-07 — proposed target generation, rejection, execution, mutation, and coverage commands
node projects/domainspec-v2/development/first-production-release/tools/generate-obligations-and-tests.cjs \
  --profile projects/domainspec-v2/development/first-production-release/supported-profile.yml \
  --expected projects/domainspec-v2/development/first-production-release/obligations/obligation-expectations.json \
  --bindings projects/domainspec-v2/development/first-production-release/bindings/body-war-obligation-bindings.yml \
  --binding-schema projects/domainspec-v2/development/first-production-release/schemas/obligation-binding.schema.json \
  --out-obligations projects/domainspec-v2/development/first-production-release/obligations/obligations.generated.json \
  --out-tests projects/domainspec-v2/development/first-production-release/generated-tests/body-war.generated.test.ts
node projects/domainspec-v2/development/first-production-release/tools/validate-generated-test-suite.cjs \
  --tests projects/domainspec-v2/development/first-production-release/generated-tests/body-war.generated.test.ts \
  --expected projects/domainspec-v2/development/first-production-release/obligations/obligation-expectations.json \
  --reject skip,todo,placeholder,duplicate,orphan,unexecutable \
  --receipt projects/domainspec-v2/development/first-production-release/evidence/generated-suite-validation.json
node projects/domainspec-v2/development/first-production-release/tools/run-generated-verification.cjs \
  --tests projects/domainspec-v2/development/first-production-release/generated-tests/body-war.generated.test.ts \
  --candidate-sha SHA \
  --body-war-sha BODY_WAR_SHA \
  --receipt projects/domainspec-v2/development/first-production-release/evidence/execution/execution-receipt.json
node projects/domainspec-v2/development/first-production-release/tools/run-obligation-mutations.cjs \
  --expected projects/domainspec-v2/development/first-production-release/obligations/obligation-expectations.json \
  --tests projects/domainspec-v2/development/first-production-release/generated-tests/body-war.generated.test.ts \
  --require-per-key \
  --receipts projects/domainspec-v2/development/first-production-release/evidence/mutations/mutation-receipts.json
node projects/domainspec-v2/development/first-production-release/tools/validate-obligation-coverage.cjs \
  --expected projects/domainspec-v2/development/first-production-release/obligations/obligation-expectations.json \
  --generated projects/domainspec-v2/development/first-production-release/obligations/obligations.generated.json \
  --suite-receipt projects/domainspec-v2/development/first-production-release/evidence/generated-suite-validation.json \
  --execution-receipt projects/domainspec-v2/development/first-production-release/evidence/execution/execution-receipt.json \
  --mutation-receipts projects/domainspec-v2/development/first-production-release/evidence/mutations/mutation-receipts.json

# FPR-08/FPR-09 — proposed target commands
node projects/domainspec-v2/development/first-production-release/tools/extract-implementation-graph.cjs \
  --roots projects/domainspec-v2/development/first-production-release/manifests/body-war-code-roots.yml
node projects/domainspec-v2/development/first-production-release/tools/validate-cross-graph-conformance.cjs \
  --registry projects/domainspec-v2/development/first-production-release/registries/correspondence-predicates.yml

# FPR-10 — proposed target Body War scenario and runtime-receipt command
node projects/domainspec-v2/development/first-production-release/tools/run-body-war-scenario.cjs \
  --scenario projects/domainspec-v2/development/first-production-release/pilot/body-war-scenario.yml \
  --fixtures projects/domainspec-v2/development/first-production-release/pilot/body-war-api-fixtures/ \
  --provider-origin-redaction projects/domainspec-v2/development/first-production-release/pilot/provider-origin-redaction-decision.yml \
  --profile-digest projects/domainspec-v2/development/first-production-release/evidence/profile-digest.json \
  --candidate-sha SHA \
  --body-war-sha BODY_WAR_SHA \
  --receipt projects/domainspec-v2/development/first-production-release/pilot/body-war-runtime-receipt.json

# FPR-11/FPR-12/FPR-13/FPR-14 — proposed target commands
node projects/domainspec-v2/development/first-production-release/tools/run-clean-cli-smoke.cjs --source-sha SHA --checkout-root ARBITRARY-ABSOLUTE-PATH
npm --prefix projects/domainspec-v2/impl run release:test:state-safety
node projects/domainspec-v2/development/first-production-release/tools/release-audit.cjs --contract projects/domainspec-v2/development/first-production-release/product-contract.yml
node projects/domainspec-v2/development/first-production-release/tools/validate-operability-package.cjs projects/domainspec-v2/development/first-production-release/operator-checklist.yml
npm --prefix projects/domainspec-v2/impl run release:verify
node projects/domainspec-v2/development/first-production-release/tools/verify-release-candidate.cjs --release-id RELEASE-ID
node projects/domainspec-v2/development/first-production-release/tools/validate-pilot-receipt.cjs projects/domainspec-v2/development/first-production-release/pilot/receipt.json
node projects/domainspec-v2/development/first-production-release/tools/validate-craft-release-context.cjs \
  --expected projects/domainspec-v2/development/first-production-release/craft/expected-node-edge-manifest.yml \
  --actual projects/domainspec-v2/.craft/ledger.yml

# FPR-15 — proposed target release checks
git rev-parse refs/tags/RELEASE-ID^{}
sha256sum -c projects/domainspec-v2/releases/RELEASE-ID/manifest.sha256
node projects/domainspec-v2/development/first-production-release/tools/validate-distribution-receipt.cjs projects/domainspec-v2/releases/RELEASE-ID/distribution-receipt.json
```

Closed-world denominators are the literal IDs in the supported profile, architecture catalogs, required-document/quotient/obligation/evidence/correspondence/code-root registries, formal profile, pilot critical-step manifest, and Craft expected-node/edge manifest. No “all”, “complete”, “full”, or “ready” claim is meaningful without naming its exact object and denominator. [A2 Proof protocol; A3 Coverage denominator; S command/manifest proposal.]

# Exact bounded Body War acceptance journey

The candidate witness is the SuggestedTrack/Parque Taquaral slice, not the whole TROQAR system. [A3 Pilot scenario, using `projects/body-war/docs/features/parque-taquaral-online-mvp/SPEC.md` and `states.md`; D Pilot.]

## API journey

1. Authenticate a consenting runner under the FPR-02 actor/origin policy.
2. Load only fields enumerated in `pilot/allowed-redacted-fields.yml`. The allowlist is currently Open/to-ground, so a real-provider pass is currently KILL.
3. `POST /api/suggested-tracks` with the profile-bound `volta-do-taquaral` payload and expectation `CT-1`.
4. Capture the created SuggestedTrack ID.
5. `POST /api/suggested-tracks/{id}/evidence-candidates` with explicit consent and the profile-bound ActivityEvidenceCandidate payload satisfying `EC-3` and `EC-4`.
6. Assert only `needs_evidence→evidence_submitted`.
7. Assert absence of `source_backed`, verified geometry, scoring, leaderboard, accepted/rejected, or pilot-ready promotion.
8. Revoke consent/fixture and verify the receipt becomes revoked without mutating immutable historical evidence.

The callback/deployment/origin route is decided at FPR-02 before behavior work begins. A required Body War callback host does not widen the DomainSpec product into a hosted DomainSpec service. [A3 BW-01/BW-09 and Pilot scenario; S Body War reviewer repair.]

## Critical-step denominator

`pilot/critical-steps.yml` must contain exactly these 14 IDs and expected results:

| Step | Required result |
|---|---|
| `CP-01 candidate-identity` | DomainSpec SHA, Body War SHA, lock, toolchain, and profile digests match |
| `CP-02 profile-contract` | FPR-02 validator passes and its red fixture fails |
| `CP-03 business-spec` | B, Spec/Sg, CT-1, EC-3, and EC-4 mappings pass |
| `CP-04 architecture` | `A_req` passes; forbidden-import mutant fails |
| `CP-05 formal` | Bounded `F_struct/F_state` pass; consent/illegal-transition mutant yields expected counterexample |
| `CP-06 obligations` | `O_spec=O_gen`, nonempty; per-key mutations discriminate |
| `CP-07 generated-engine` | `T_gen` has zero skip/todo/orphan and executes |
| `CP-08 implementation` | `I_struct` and tags reconcile over every declared root/disposition |
| `CP-09 cross-graph` | Every contract predicate and required internal-assurance predicate passes |
| `CP-10 auth-consent-redaction` | Authenticated consent succeeds; forbidden field/token/CSRF negatives fail |
| `CP-11 create-track` | Exact `POST /api/suggested-tracks` returns expected `volta-do-taquaral` result |
| `CP-12 attach-evidence` | Evidence-candidate POST satisfies EC-3/EC-4 and reaches only `evidence_submitted` |
| `CP-13 rollback-revocation` | Induced artifact failure restores prior state; consent revocation marks receipt revoked |
| `CP-14 independent-operation-support` | Non-author verifier repeats candidate and exercises diagnostics, support acknowledgement, and withdrawal |

Pass is `14/14`; no critical step can be waived. Each step records exact command, input/output path, expected code/value, negative, candidate/profile/tool digests, operator/verifier identity, redaction rule, and receipt. Failure returns to the owning FPR node and blocks FPR-15. [A3 BW-11 and Required negatives; S FPR-13 denominator.]

# Craft-ready delta and expected node-edge manifest

Create one child context, `CTX-DSV2-FIRST-PRODUCTION-RELEASE`, under `CTX-DSV2-ROOT`. It is absent now; therefore no Craft-closure claim passes. Inventory remains a derived linked view, never authority. [A3 Craft-ready frontier set, using `projects/domainspec-v2/.craft/ledger.yml`; P Craft continuation; S reviewer repair.]

`craft/expected-node-edge-manifest.yml` must enumerate exact equality for:

- nodes `FPR-00` through `FPR-15` with owner, applicability, release timing, work kind, dependencies, exact artifacts, proof, omission, next move, evidence provenance, and reopen trigger;
- `depends-on` edges exactly matching the DAG;
- `uses-evidence-from` edges from FPR-03/FPR-04 to `CTX-DSV2-SPEC-ONTOLOGY` and `CTX-DSV2-META-TYPE-FORMALIZATION`;
- `depends-on`/`uses-evidence-from` edges from FPR-05 to `CTX-DSV2-APE`, never `implemented-by`;
- `depends-on`/`uses-evidence-from` edges from FPR-08 to `CTX-DSV2-CODE-TAG-CONFORMANCE`, never `implemented-by`;
- artifact links for the accepted decision, frozen research, converged findings, every registry/manifest/schema, and every candidate-bound receipt; and
- stable unresolved frontiers and their state/owner/trigger.

Stable unresolved frontier IDs:

| Frontier | Exact unresolved condition | Effect |
|---|---|---|
| `FR-FPR-ONTOLOGY-DIRECTION` | Reconcile active contract→authoring ontology lens with accepted business-plane→spec chain | Blocks FPR-03 |
| `FR-FPR-SOLVER-PROFILE` | Select literal languages, solver versions, bounds, timeout, and fairness/liveness policy | Blocks FPR-06 |
| `FR-FPR-BW-ORIGIN-ROUTE` | Decide real-provider callback/deployment/origin and redaction allowlist | Blocks real-provider FPR-10 |
| `FR-FPR-I-ROOT-DISPOSITIONS` | Ratify production/test/generated root inclusion and non-code dispositions | Blocks FPR-08 |
| `FR-FPR-APE-SELF-CONTAINMENT` | Prove v2 catalogs sufficient or promote shared-method dependency | Blocks FPR-05 if v1 dependency remains |
| `FR-01`–`FR-09` | Preserve prior retained/conditional states and triggers | Feed mapped FPR nodes; do not rewrite history |

The Craft validator compares exact expected node/edge IDs and required fields against the live ledger; “no frontier only in prose” is otherwise untestable. [A3 Craft set; P persistent protocol; S FPR-14.]

# Persistent frontier and reopen protocol

```text
observed → triaged → researching | proposed | rejected | deferred
researching → proposed | rejected | deferred
proposed → accepted → scheduled → verified → closed
rejected | deferred | verified | closed → triaged on trigger
```

Severity remains contract-relative:

- **S0** — candidate/contract falsification, private leakage, supported-state corruption, or false-green applicable obligation; block immediately.
- **S1** — credible material in-boundary harm; resolve before the next release gate.
- **S2** — bounded operability/quality issue; review at the affected gate.
- **S3** — advisory or scope expansion; dormant until trigger.

Evidence expires when candidate SHA, profile, authoritative `Spec/B`, mapping, toolchain, solver bounds, source roots, normalization policy, or relevant implementation changes. Deduplicate by affected contract clause plus normalized observation signature; contradictory evidence remains a typed conflict. Research/experiment dispatch is warranted only when a node or applicability materially depends on it, the subagent trigger holds, and a human confirms a tensioned sheet. No owner means gated; no reproduction means undetermined; no sufficient proof means block or narrow the claim. [A1 Dependency-critical conclusion; A2 Proof protocol; A3 Craft/frontier set; P Persistent frontier protocol.]

# Binding exclusions

The following remain outside the first production release unless the accepted product contract reopens:

- DomainSpec graphical UI;
- hosted DomainSpec service;
- public distribution or public SDK ecosystem;
- multi-language implementation support;
- automatic Saturn actuation or runtime-convergence claim;
- arbitrary full-application generation;
- universal formal proof of arbitrary programs;
- proof of undeclared requirements;
- automatic promotion or release authorization;
- general category identity/closure/associativity/functor theorems; finite catalogued release-path laws remain mandatory;
- generic APE mint/inheritance/cross-project propagation;
- hermetic build, SBOM, SLSA level, broad attestation, central dashboards, and tabletop exercises unless FPR-11 records a threat/distribution trigger.

Body War’s own application UI and any callback hosting remain part of the pilot application boundary, not the DomainSpec product surface. Exact normalized generated output, candidate identity, bounded security review, state safety, rollback, support, and external authorization are not optional hardening; they remain inside the accepted private CLI contract. [D Binding exclusions and operating boundary; A1 boundaries; A2 release substrate; A3 frontier set; P R3–R11.]

# Risks, preserved dissent, and typed unknowns

- **Ontology direction remains unresolved.** Current D5 treats ontology as an authoring lens with contract→authoring authority, while the accepted contract starts from a governed business plane. FPR-03 must reconcile or supersede this through an owner decision; no synthesized diagram can do so. [A1 §1, using `definitions/DEFINITIONS.md` and `ontology/README.md`; S preserved dissent.]
- **Authority counts/status conflict.** Live 13/14, 24/25, and 30/31 projections disagree. FPR-01 establishes the baseline; later work may not choose the favorable count. [A1 Executive, using meta-type/relationship definitions.]
- **`G/F` product exposure is not settled by the accepted decision.** Formal validation is included, but compiler IR and formal model files remain internal assurance unless FPR-02 explicitly exposes them. [D capability list; A1 graph chain; S precedent repair.]
- **Post-hoc detection and unconstructibility differ.** FPR-01/FPR-02 must state which architecture claim is binding; FPR-05 reports them separately. [A1 §4, using APE SPEC; A2 architecture matrix.]
- **Formal profile is Open/to-ground.** Language, solver, versions, scope, state bounds, timeouts, and fairness/liveness policy require literal values. Liveness/fairness applies only to declared progress obligations. [A1 §3; S FPR-06.]
- **Real-provider Body War evidence is absent.** Allowed fields, callback/origin route, and consent/redaction receipt remain unresolved. Fake-only is possible only through explicit claim narrowing. [A3 BW-09/BW-11; A2 Body War.]
- **Implementation roots and dynamic analysis are unresolved.** Every exclusion requires a disposition; unanalyzed dynamic behavior is failure/unknown, never pass. [A1 §6; A2 implementation graph; S FPR-08.]
- **UI formation is conditional.** UI DS-D1 becomes release-critical only if FPR-02 claims UI semantic coverage; Body War UI does not create a DomainSpec UI product. [A1 boundaries; D exclusions.]
- **Shared method dependency is conditional.** If FPR-05 still needs private v1 architecture references, `FR-DSV2-SHARED-METHOD-PACKAGE` must become a blocker rather than remain harmlessly deferred. [A3 BW-04; S reviewer repair.]
- **Historical green/red snapshots do not adjudicate each other.** Only FPR-12’s exact clean candidate supersedes them. [A2 Commands; P FR-01/R9.]
- **Role membership is intentionally late-bound, but authority is not optional.** Planning proceeds now; the release manifest must bind actual governed owner references, distinct proposer/approver, and an independent verifier before authorization. [D Release authority and G0-13.]

# Verdict matrix

| Object-qualified question | Current verdict | Closure condition | Provenance |
|---|---|---|---|
| Product-scope decision closed? | **YES** | Existing accepted decision; production remains unauthorized | D |
| Authority baseline reconciled? | **NO — KILL current** | FPR-01 clean non-contradictory owner receipt | A1 Executive; P R1; S |
| `FPR-D22 roadmap-ready-for-execution`? | **NO — REPAIR-THEN-GATE** | FPR-01/FPR-02 satisfy `FPR-D21 node-ready`; candidate definitions tracked; Craft expected state instantiated | S object-qualified readiness repair |
| Contract planes and internal artifacts separated? | **YES in this candidate model only** | Owner/reviewer promotion of `{B,Sg,A_req,O_spec,T_gen,I_struct}` versus `{G,F_struct,F_state,E_run}` | A1 graph chain; D; S |
| `FPR-D17 profile/structural conformance verdict` established? | **NO — KILL current** | FPR-02/FPR-04 candidate-bound machine receipts | A1 §2; A2 graph loader |
| Full obligation coverage established? | **NO — KILL current** | Independent nonempty `O_spec`, exact equality, 100% expected evidence, per-key mutation receipts | D coverage; A1 §5; A2 Coverage |
| Formal validation established? | **NO — KILL current** | Literal formal profile, exhaustive bounded receipts, non-vacuity, discriminating mutants | A1 §3; A2 formal |
| `FPR-D19 implementation-conformance acceptance` established? | **NO — KILL current** | Finite `A_req` catalogs, complete `I_struct` denominator, all applicable `FPR-D18` directional verdicts pass, implementation owner accepts | A1 §§4,6; A2 architecture/tags |
| Cross-graph `FPR-D18 mapping-predicate verdicts` established? | **NO — KILL current** | Every named FPR-09 predicate passes; verifier reproduces; no judgment override | A1 §7; A2 conformance |
| Body War real-provider behavior established? | **NO — KILL current** | FPR-02 fields/origin closed and FPR-10 exact API receipt passes | A3 BW-09; A2 Body War |
| Release candidate clean/reproducible? | **NO — KILL current** | FPR-12 same SHA/lock/profile/solver/toolchain and normalized bytes/digests with seeded-red CI | A2 CI; P R8/R9 |
| Controlled pilot accepted? | **NO — KILL current** | FPR-13 `14/14` plus rollback, revocation, support, independent reproduction | A3 BW-11; P R10 |
| Craft continuation instantiated? | **NO — KILL current** | FPR-14 expected/actual node-edge equality | A3 Craft; P R12 |
| `FPR-D23 release-ready`? | **NO** | FPR-00–14 applicable nodes pass for one exact candidate | D release rule; S |
| `FPR-D24 production-authorized`? | **NO** | FPR-15 produces `FPR-D20 release authorization` binding exact bits, claims, actors, support, and withdrawal | D authority; A1 §7; A3 BW-12 |
| Findings package ready for final audit? | **YES** | All explorer claims are bounded, reviewer repairs are represented, and every unresolved definition/choice remains a named blocker | S converged proposal |

Final findings verdict: **REPAIR-THEN-GATE.** Product direction is closed, but production, profile conformance, full coverage, formal validity, architecture/implementation conformance, cross-graph conformance, Body War acceptance, clean RC status, Craft closure, release readiness, and production authorization remain unestablished.

# Dispatch Closeout

<!-- DISPATCH-CLOSEOUT-BEGIN: parent fills this block only after final audit. -->

- dispatch_id: `2026-07-13-domainspec-v2-expanded-production-frontiers`
- final_approver: `Brandenburg`
- final_verdict: `APPROVE after one bounded writer repair`
- exit_reason: `resolved`
- agents_spawned: `9 total — 3 explorers, 1 synthesizer, 3 adversarial reviewers, 1 findings writer, 1 final auditor; 2 bounded synthesis/review turns; 0 helpers`
- reviewer_repair_summary: `Restored authority-baseline ordering; separated contract planes from proof artifacts, A_req from I_struct, and T_gen from E_run; replaced universal equivalence with directional predicates; grounded independent obligations, exact falsifiability surfaces, Body War denominator, Craft manifest, and object-qualified readiness.`
- auditor_to_writer_revision_used: `yes — exact paths, FPR-02/FPR-07/FPR-10 proof commands, and distinct FPR-D17..FPR-D24 authority/readiness definitions`
- synthesizer_to_explorer_feedback_fired: `no — reviewer repairs required convergence, not new explorer evidence`

<!-- DISPATCH-CLOSEOUT-END -->

# Connections

- derives-from → [frozen explorer transcript](./research.md)
- accepts-product-scope-from → [accepted product-release contract](../../decisions/2026-07-12-product-release-contract.md)
- supersedes-executable-route-of-but-does-not-rewrite → `implementation/domainspec/research/2026-07-12-first-production-release/findings.md`
- expected-continuation → `projects/domainspec-v2/.craft/ledger.yml`
- first-production-witness → `projects/body-war/`
- formal-upstream-evidence → `projects/domainspec-v2/research/alloy-tla-modeling/`
- architecture-upstream-evidence → `projects/domainspec-v2/development/architecture-pattern-enforcement/`
- implementation-correspondence-upstream-evidence → `projects/domainspec-v2/development/code-tag-conformance/` and `projects/domainspec-v2/impl/governance/tags/`

# Open Questions

1. **OQ-01 — BLOCKER, FPR-01/FPR-03:** Which owner-ratified authority rule reconciles the current contract→authoring ontology lens with the accepted governed business-plane→specification chain? Recommendation: decide the direction and supersession semantics before authoring `B→Spec`. Owner: semantic owner + definitions governance. [A1 §1.]
2. **OQ-02 — BLOCKER, FPR-01:** What is the single clean active baseline for 13/14 types, 24/25 candidate types, and 30/31 relationship signatures? Recommendation: reconcile machine/prose/projection counts through existing authority gates; do not choose by convenience. Owner: definitions + validation owners. [A1 Executive.]
3. **OQ-03 — BLOCKER, FPR-02:** Which exact concepts, relations, documents, commands, writes, languages, obligation kinds, code roots, generated artifacts, and failure codes form the first supported profile? Recommendation: enumerate literal IDs in `supported-profile.yml` and its registries. Owner: semantic + claim owners. [D Deferred; A2 E1.]
4. **OQ-04 — BLOCKER, FPR-02/FPR-10:** Does the Body War witness require a real provider, which redacted fields are allowed, and what callback/origin/deployment route applies? Recommendation: decide before FPR-10; fake-only requires explicit claim narrowing. Owner: Body War product/security owners + DomainSpec claim owner. [A3 BW-01/BW-09.]
5. **OQ-05 — BLOCKER, FPR-03:** What are the canonical `BO`, `BK`, contradiction policy, stable business IDs, and minimum Body War mapping beyond CT-1/EC-3/EC-4? Recommendation: start with the named minimal slice, reject unowned expansion, and promote only through semantic authority. Owner: business semantic owner. [A1 §1; A3 BW-02.]
6. **OQ-06 — BLOCKER, FPR-04:** Which quotients/abstractions are permitted in `Sg→G→Sg_canonical`, and how is the comparator independent of the parser implementation? Recommendation: enumerate owner-approved quotients and maintain a separately implemented comparator plus mutants. Owner: semantic + validation owners. [A1 §2.]
7. **OQ-07 — BLOCKER, FPR-05:** Can v2 architecture catalogs be self-contained, or must the shared-method package be promoted as a dependency? Recommendation: require zero runtime/proof dependency on private v1 paths; promote the frontier if that cannot be met. Owner: layering governance + runtime owner. [A1 §4; A3 BW-04.]
8. **OQ-08 — BLOCKER, FPR-06:** Which exact formal languages, solver versions, scopes, state constants, timeouts, and liveness/fairness rules are supported? Recommendation: use the existing Alloy/TLA tower in a bounded experiment, then promote through its approved integration task. Owner: formal-validation + semantic owners. [A1 §3.]
9. **OQ-09 — BLOCKER, FPR-07:** Who independently authors `O_spec(P)`, `Expected(o)`, and `Req_spec(o)` so the generator cannot certify its own output? Recommendation: semantic expectations plus validation-owned evidence policy, with per-key mutations. Owner: semantic + validation owners. [A1 §5; A2 Coverage.]
10. **OQ-10 — BLOCKER, FPR-08:** Which Body War roots, tests, generated files, static JS, and dynamic behaviors are included, excluded, or non-code-disposed? Recommendation: freeze all roots/dispositions and pinned parser versions before completeness claims. Owner: implementation/platform owner. [A1 §6; A2 Implementation graph.]
11. **OQ-11 — BLOCKER, FPR-09/FPR-D18:** What exact algorithm, proof kind, bound, and failure code implements each correspondence predicate and its mapping-predicate verdict? Recommendation: start with the seven minimum contract predicates and keep internal assurance segregated. Owner: distributed predicate owners, composed by validation governance. [A1 §7.]
12. **OQ-12 — BLOCKER, FPR-11/FPR-12:** What bounded threat/data-flow decision activates or keeps dormant SBOM, hermetic, attestation, tabletop, and dashboard controls, and what normalization rule makes two runs comparable? Recommendation: document the rationale; require candidate digests and normalized generated output regardless. Owner: security + runtime owners. [A2 release substrate; P R6/R9.]
13. **OQ-13 — BLOCKER, FPR-14:** Can the current Craft schema express every expected node, edge, proof, omission, applicability, timing, work-kind, receipt, and reopen trigger without inventing a parallel registry? Recommendation: model with existing fields first and propose a Craft-owned extension only on demonstrated schema failure. Owner: Craft owner. [A3 Craft set; P R12.]
14. **OQ-14 — RELEASE BLOCKER, FPR-15/FPR-D20:** Which people or governed owner references bind proposer, different approver, independent verifier, operators, and capability owners for the exact candidate? Recommendation: bind them in the release manifest only when a real candidate exists; do not block planning on ceremonial roster creation. Owner: DomainSpec-v2 Owners. [D Release authority and G0-13.]
