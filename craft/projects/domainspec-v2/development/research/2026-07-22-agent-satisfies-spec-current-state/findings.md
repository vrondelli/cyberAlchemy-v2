---
artifact: research-findings
dispatch_id: 2026-07-22-agent-satisfies-spec-current-state-research
dispatch_type: research
status: research-complete
authority: non-authority-research-synthesis
semantic_authority: none
source_transcript: research.md
claim_scope: current checkout plus one bounded proposed access-conformance target
---

# Agent Satisfies Spec — Current State And First Provable Target

## Status of this file

This Markdown file is a research synthesis. It is not a DomainSpec source, an
`AccessSpec`, a semantic predicate, a compiler input, a test oracle, a receipt,
an admission record, or an implementation plan. Machine authority must come
from separately owned and admitted machine contracts. The terms proposed below
do not become canonical vocabulary merely by appearing here. [C1]

## Verdict

**There is no implemented or proved general relation `agent ⊨ spec` in the
current repository.**

What exists is narrower:

1. Lean proves that an executable decision over one encoded request agrees with
   an independently defined layered-policy predicate. It also proves
   composition, deny precedence, confinement, path-normalization properties,
   and bounded recorded-trace properties under explicit assumptions. The
   theorem subject is a request or trace, not an agent. [F1][K1]
2. The current DomainSpec runtime-conformance package is a candidate
   `DEFINE.md` and `DESIGN.md`. It proposes a core/plug-in shape, but there is
   no implementation, machine plug-in contract, work pack, runtime bridge, or
   conformance receipt. [A1]
3. BTE has a live, passing L0A contract-publication slice. It publishes nine
   evidence-contract schemas and a closed diagnostic registry, but explicitly
   grants no admission and emits no `ValidationReceipt`. L0B and all later
   graph-to-test, binding, execution, mutation, proof, replay, aggregate, and
   consumer stages are absent or planned. [B1][B2]
4. IOLM has useful projection-fidelity evidence, including exact fixture
   binding, stable IDs, deterministic projection, and
   `authority_effect: none`. That evidence cannot define or establish semantic
   satisfaction. [I1]

The strongest defensible present claim is:

> For every Lean-encoded request and layered policy, `decidePolicy` agrees with
> the independently defined `Satisfies` predicate. The recorded-trace guards
> additionally prove declared-label properties over faithfully recorded traces
> under their stated source-label, egress-catalogue, and observation
> assumptions.

That is valuable proof substrate. It is not arbitrary agent correctness,
hidden-reasoning correctness, DomainSpec/code equivalence, non-bypassable
application behavior, or general `agent ⊨ spec`. [K1][K2]

The live evidence characterizes a dirty, partly untracked current checkout, not
a released baseline. The L0A execution receipt is stronger than the stale BTE
planning status, but it remains non-admitting. [B2]

## What the symbol must not hide

`agent ⊨ spec` currently compresses several different questions into one
symbol. They need separate subjects, predicates, evidence, and claim ceilings.

| Judgment | Plain meaning | Minimum evidence | Does not imply |
| --- | --- | --- | --- |
| `ShapeValid(x)` | The selected schema accepts the representation. | Schema plus exact validator result. | Correct meaning, correct decision, or correct execution. |
| `BytesMatch(x,h)` | The bytes resolved by a handle match its digest and declared identity. | Independent byte/digest recomputation. | The bytes are true or semantically adequate. |
| `OutputObligationsHold(o,S)` | One produced output meets a frozen set of output obligations. | Independent obligations, exact binding, raw output, comparator result. | The action was authorized or the whole agent is correct. |
| `RequestedActionAuthorized(S,E,r)` | The intended request is permitted by the independently defined access semantics. | Admitted spec and environment plus independent `AccessAuthorized`. | The runtime made that decision or enforced it. |
| `DecisionMatchesSpec(b,S,E,r,d)` | The bound runtime decision equals the independent semantic decision for this exact request. | Exact binding, independent predicate, runtime observation, comparator, replay. | The permitted action was actually executed or a denied action was prevented. |
| `ExecutedActionMatchesDecision(b,r,d,x)` | The exact execution effect `x` obeyed the mediated decision `d`. | Non-bypass mediation and effect observation. | All future actions or all environments satisfy the policy. |
| `RecordedTraceMeets(S,E,t)` | A captured finite trace meets a declared trace predicate. | Faithful ordered trace, trace predicate, explicit horizon and trust assumptions. | Unobserved behavior, covert channels, or whole-agent satisfaction. |
| `PolicyRefinesWithin(P,Q,D)` | Policy `Q` preserves or narrows `P` over the declared denominator `D`. | Explicit relation, exact denominator, counterexample-sensitive comparison. | Correctness outside `D` or correctness of the implementation bridge. |
| `agent ⊨ spec` | A whole agent satisfies a spec over a family of environments and time. | Frozen agent denominator, environment family, observation semantics, temporal horizon, quantifier, threshold, and owner-admitted comparator. | Nothing current supplies this API or evidence. |

The first useful runtime target should therefore drop “agent” from the subject.
Agent identity may remain in provenance—who or what produced the request—but it
must not increase the theorem. The first claim is about one bound decision.

## The first admissible target

The smallest honest target is:

```text
DecisionMatchesSpec(
  binding,
  AccessSpec,
  AccessEnvironment,
  AccessRequest,
  observedRuntimeDecision
)
```

Its maximum initial claim is:

> For every owner-admitted, well-formed, nonempty `AccessSpec`; every exact
> admitted `AccessEnvironment`; and every canonical `AccessRequest` in one
> explicit bounded-exhaustive denominator, the decision observed from the
> content-addressed runtime equals the decision produced by the independently
> defined `AccessAuthorized` relation under that exact environment.

“Bounded-exhaustive” must name the complete finite universe being checked:
principal IDs, resources, actions, conditions, environment states, and request
normal forms. It cannot mean “the fixtures we happened to write.” A manifest
must make the denominator nonempty and exact, and exact-set comparison must
prove that every member produced one pre-run `TestCase`, one post-run
`ExecutionResult`, and the required mutation and replay evidence. [B1][B3]

This is not yet whole-agent satisfaction. It is also not automatically a formal
proof of the TypeScript runtime. If any parser, compiler, matcher, runtime,
observation, mediation, or denominator bridge below is missing, the result
downgrades to an **integration demonstration**.

### The equality to prove

The target is not “the spec graph equals the code graph.” A graph can preserve
IDs and relations while the runtime makes the wrong decision. The required
comparison is a commuting decision chain:

```text
                         independently defined
AccessSpec + Environment + Request -----------> AccessAuthorized ----------+
       |                                                                  |
       | parse + validate + typed compile                                equal
       v                                                                  |
LayeredPolicy + canonical request -> Satisfies <-> decidePolicy            |
       |                                               |                  |
       | content-addressed runtime bridge              | formal decision  |
       v                                               v                  |
runtime input --------------------------------> observed runtime decision --+
```

The graph, source handles, and receipts preserve identity and causality around
this chain. They do not supply the semantic equality.

## Required semantic chain

The full first-target chain is:

```text
source bytes
  -> parse
  -> WellFormedAccessSpec
  -> independent AccessAuthorized
  -> typed compileAccess
  -> LayeredPolicy
  -> Satisfies
  <-> decidePolicy
  -> content-addressed runtime
  -> observed decision
```

Every arrow is a separate obligation:

1. **Bytes to parse.** The exact source bytes and parser version are bound.
   Missing, extra, unknown, or ignored material fails closed.
2. **Well-formed access spec.** The outer policy and every required layer are
   nonempty; identities are unique; effects, matchers, and condition domains are
   closed; unsupported constructs are rejected. This is essential because the
   current Lean kernel allows an empty outer policy by vacuous truth. [K1]
3. **Independent semantics.** `AccessAuthorized(S,E,r)` is owned independently
   from `compileAccess`, `decidePolicy`, the TypeScript runtime, the fixture
   expected values, and the receipt producer. It states the domain meaning.
4. **Typed compilation.** `compileAccess` cannot silently drop or invent rules.
   It emits a `LayeredPolicy` plus a complete source-to-policy map and typed
   residue.
5. **Matcher/compiler adequacy.** For every admitted canonical request, the
   compiled matcher fires exactly when the independent access condition holds.
   The current Lean theorem is parametric in `Rule.applies`; it does not prove
   this bridge. [K1]
6. **Kernel agreement.** Lean already proves
   `decidePolicy P r = allow ↔ Satisfies P r`, plus the append/meet law,
   deny precedence, and restriction properties. [K1]
7. **Runtime bridge.** The executed runtime is identified by code digest,
   module/export, runtime version, configuration, and environment. A bounded
   exhaustive cross-check can establish agreement for the admitted denominator;
   it must not be described as general Lean-to-TypeScript equivalence.
8. **Observation fidelity.** The observed value comes from the bound runtime
   invocation, not from a fixture, expected value, receipt field, or replayer
   summary.
9. **Non-bypass mediation.** Every access attempt inside the claim boundary
   passes through the decision point, and deny prevents the scoped effect.
   Without this, only the decision function—not application enforcement—is
   tested.
10. **Denial-reason soundness.** The current Lean decision is only
    `allow | deny`; it does not return a structured reason. If the runtime
    claims a reason, a separate relation must prove that a reported forbid,
    missing permit, malformed spec, or indeterminate cause really occurred.
11. **Exact denominator.** The declared finite universe is independently
    frozen, nonempty, fully enumerated, and exactly recomposed. “All requests”
    means all members of this named universe, not all possible future requests.

The path-normalization theorem proves that its pure canonicalizer removes
empty, `"."`, and `".."` segments and is idempotent. It explicitly leaves
realpath/symlink, TOCTOU, filesystem case, and Unicode normalization as caller
preconditions. Those assumptions must be carried into `AccessEnvironment`
rather than erased. [K2]

## How test derivation fits

Test derivation is useful only after independent semantics and the exact
denominator exist:

```text
admitted AccessSpec + AccessEnvironment + denominator manifest
  -> derive exact request coverage keys
  -> exact-compare with validation-owned expected obligation keys
  -> materialize one TestCase bundle per key
  -> resolve one exact role-typed runtime/evaluator binding
  -> execute and capture raw decision
  -> evaluate against AccessAuthorized
  -> mutate source/runtime/binding
  -> independently replay raw artifacts
```

A `TestCase` is the pre-run instruction: exact request, fixtures, runtime,
evaluator, and expected semantic reference. An `ExecutionResult` is the
post-run observation: what the bound runtime actually returned and how the
independent evaluator judged it. They must remain separate; a result cannot
rewrite its test, and a test cannot count as execution evidence. [B3]

The derivation engine may generate coverage keys and runnable instructions. It
may not generate its own semantic truth. Expected meaning remains owned by
`AccessAuthorized` and the independently frozen catalogue.

## Collapse tests

The target fails if it reduces to any of these weaker mechanisms:

1. **Schema-only:** both spec and request parse, so the relation says only
   `ShapeValid(spec) ∧ ShapeValid(request)`.
2. **Renamed `decidePolicy`:** `AccessAuthorized` is defined as whatever
   `decidePolicy` returns, so the claimed semantic bridge is an identity.
3. **Fixtures-only:** a finite hand-picked fixture list passes, but no exact
   denominator or adequacy bridge exists.
4. **Implementation-defined predicate:** the runtime, compiler, generator, or
   result builder defines both the observed answer and the oracle.
5. **Receipt/replay as truth:** a valid receipt or successful replay is treated
   as proof that the underlying semantics are correct. Receipts preserve
   causality; replay recomputes declared checks; neither authors the predicate.

The permission kernel avoids the most direct renamed-function collapse because
`Satisfies` and `decidePolicy` are separately defined and connected by a
theorem. The proposed access layer must preserve that separation rather than
wrapping both under a new name. [K1]

## Mandatory falsifiers

The first target is not admissible until all of these are executable and fail
for the intended reason:

| Falsifier | Required discrimination |
| --- | --- |
| Empty policy | Reject in `WellFormedAccessSpec`; do not inherit vacuous allow. |
| Empty layer | Reject as malformed rather than letting an accidental empty layer stand for a domain decision. |
| Same-shape allow/deny | Two schema-valid requests with the same shape must receive opposite semantic decisions because one exact value changes. |
| Permit plus forbid | Matching forbid wins, and the reason identifies the forbid when reason claims are enabled. |
| Missing permit | Default deny because one required layer supplies no permit; distinguish it from explicit forbid. |
| Flattening | A two-layer case must preserve intersection-of-authority and disagree with a flattened single-set policy where expected. |
| Source mutation | Change one source rule or condition; stale compiled/runtime/evidence handles fail and the affected decision changes or reopens. |
| Normalization mutation | `..`, `.`, empty segments, prefix confusion, case/Unicode posture, symlink, and TOCTOU assumptions produce the declared result or typed residue. |
| Runtime flip | A mutant reverses one runtime verdict while spec and evaluator remain fixed; comparison kills it. |
| Invalid/stale/ambiguous binding | Zero, duplicate, first-match, wildcard, digest-mismatched, or stale bindings fail before execution. |
| Declared-determinism disagreement | Repeating identical bound inputs yields different raw decisions; no passing receipt is emitted. |
| Tampered receipt | Change a handle, digest, join, count, status, or output path; independent replay rejects it. |
| Circular replayer | A replayer that trusts producer `pass`, imports the runtime decision helper, or reads expected output from the result is rejected by dependency and mutation controls. |

Positive fixtures are necessary but not sufficient. The negative and mutation
family establishes non-vacuity and shows which bridge actually detects a wrong
decision.

## BTE relationship

BTE should be treated as an **evidence-production and exact-recomposition
route**, not as the source of access semantics.

The current BTE v1 architecture is explicitly bounded to structural,
provenance, and causal evaluators. It types semantic/temporal/SMT/FOL/Datalog/
Cedar scopes as unsupported residue and explicitly excludes arbitrary semantic
satisfiability. Its present L0A publishes evidence contracts only. L0B is
intended to validate evidence primitives such as IDs, digests, producer
separation, exact sets, containment, and recomposition; it still does not define
`AccessAuthorized`. [B1][B3]

The safest first implementation route is therefore:

> Build a separate, non-admitting access-conformance precursor inside
> DomainSpec v2 that consumes validated BTE evidence primitives but owns its
> independent access semantics, compiler bridge, runtime adapter, and bounded
> evaluator.

Only a later explicit BTE version/admission decision may add this semantic
scope to BTE. Reusing BTE contract, binding, raw-result, mutation, receipt, and
replay shapes does not silently widen current BTE v1.

The four evidence roles should remain distinct:

1. `BuildReceipt`: exact spec/environment/compiler/runtime inputs and derived
   handles;
2. `ProofReceipt`: causal index over TestCase, binding, raw result, evaluator,
   and mutation handles;
3. `ReplayResult`: independent recomputation from allowlisted raw artifacts;
4. `AggregateResult`: exact nonempty recomposition of required successful
   replay scopes.

None admits a spec, makes a predicate authoritative, or promotes a lifecycle
state. [B1][C1]

## IOLM relationship

IOLM is an independent projection-fidelity consumer:

```text
IOLM receipt
  => bound input identity, deterministic projection, provenance and view parity
  != semantic satisfaction
  != policy satisfaction
  != agent ⊨ spec
```

It may later visualize the access spec, request, decision, counter-witness,
binding, mutation, and replay chain. It must consume exact upstream handles and
preserve IDs, provenance, semantic bytes, and graph/hierarchy/table parity.
It cannot define `AccessAuthorized`, manufacture upstream evidence, substitute
a fixture or schema for a run, or upgrade an upstream verdict. Existing IOLM
receipts explicitly retain candidate posture and `authority_effect: none`.
[I1]

## Current design gaps

These are owner decisions or repair obligations, not decisions made by this
research:

1. **Witness-order conflict.** `AV-D1` freezes
   dosage → data-access → robot, but data access is now the strongest available
   first proof witness because the Lean permission kernel already supplies the
   independent relational/executable split. [A1][K1]
2. **Two legitimate AV-D1 routes remain.**
   - **Amendment:** reopen `AV-D1`, make access the first admitted witness, and
     record why the stronger proof substrate changes the 2026-07-06 sequence.
   - **Non-admitting precursor:** preserve dosage → access → robot, but build
     access first as proof-mechanics research. It may later feed witness #2;
     it cannot close dosage, the formal sequence, or the generality gate.
3. **Generality wording conflicts with its own gate.** The DEFINE title and
   intent call the target a “general agent⊨spec verifier,” while the same file
   says only the distant robot witness may earn “general,” and the actual
   interface observes actions rather than whole agents. Until robot passes, the
   accurate term is **candidate action-conformance framework**. [A1]
4. **Execution package is missing.** `DESIGN.md` points to `WORK-PACK.md` and
   `implementation-layering.md`, but neither file exists in
   `development/agent-spec-conformance/`. No bounded implementation route is
   currently selectable.
5. **BTE boundary is unresolved.** Current BTE v1 excludes this semantic scope.
   The owner must confirm separate precursor now versus explicit future BTE
   admission; reuse of primitives alone does not answer that choice. [B1]
6. **The access contracts do not exist.** No machine `AccessSpec`,
   `AccessEnvironment`, `AccessRequest`, `WellFormedAccessSpec`,
   `AccessAuthorized`, `compileAccess`, runtime adapter, denominator manifest,
   or decision-conformance receipt was found in the searched live sources.
7. **No non-bypass application bridge exists.** The kernel decides encoded
   requests, but no current evidence proves that an application routes every
   relevant effect through it.
8. **Denial reasons are unproved.** The Lean kernel returns only
   `allow | deny`; structured counter-witness and denial-reason soundness remain
   new work.
9. **BTE planning/read models are stale.** `WORK-PACK.md` and the L0 task still
   say L0A is unselected/planned, while the live execution receipt records
   selected/pass. Inventory also retains the older state. The live receipt
   wins as evidence, but the continuation surfaces must be reconciled before
   selecting L0B. [B2]

## Exact next route

This is the shortest route from current evidence to the bounded claim. It is
not authorization to implement before Gate 0.

### Gate 0 — owner decisions

1. Choose AV-D1 amendment or non-admitting access precursor.
2. Name the access-semantics owner and admit the first finite spec/environment/
   request denominator.
3. Confirm that the first slice remains outside BTE v1 and consumes BTE
   primitives, with any future BTE semantic admission handled separately.
4. Freeze the exact first claim as `DecisionMatchesSpec`; explicitly defer
   `ExecutedActionMatchesDecision`, trace, policy, and whole-agent claims.

### Reconcile current artifacts

1. Refresh BTE planning and Inventory projections to record L0A selected/pass,
   non-admitting, and L0B owner-freeze gated.
2. Repair the agent-conformance DEFINE/DESIGN wording so “action conformance”
   and “general after robot” cannot be confused.
3. Create the missing work pack and layering only after Gate 0 records the
   selected AV-D1 route and BTE boundary.

### Establish fail-closed evidence primitives

1. Complete BTE L0B with independently frozen, nonempty red fixtures.
2. Prove shape and semantic validation of IDs, digests, authority classes,
   containment, exact sets, diagnostic closure, and producer separation.
3. Keep its `ValidationReceipt` non-admitting.

### Build independent access semantics

1. Define machine `AccessSpec`, `AccessEnvironment`, and `AccessRequest`
   contracts.
2. Define and validate `WellFormedAccessSpec`, including nonempty outer policy
   and nonempty required layers.
3. Define `AccessAuthorized` independently and freeze its owner/version/digest.
4. Freeze the exact bounded-exhaustive denominator and derive exact coverage
   keys without reading runtime output.

### Build and check the bridges

1. Implement typed `compileAccess` and source-to-policy mapping.
2. State and discharge matcher/compiler adequacy relative to
   `AccessAuthorized`.
3. Bind the existing Lean `Satisfies ↔ decidePolicy` theorem without claiming
   it proves the TypeScript runtime.
4. Implement a content-addressed runtime adapter and observation boundary.
5. Add non-bypass mediation or keep the claim strictly at decision-function
   agreement.
6. Add denial-reason soundness only if reason-bearing verdicts enter the claim.

### Produce evidence and try to break it

1. Materialize separate TestCase and ExecutionResult records through exact
   role-typed bindings.
2. Run every mandatory falsifier, including runtime mutants and binding drift.
3. Emit BuildReceipt, ProofReceipt, independent ReplayResult, and exact
   AggregateResult.
4. Reject empty, missing, duplicate, stale, ambiguous, nondeterministic,
   surviving-mutant, tampered, or circular evidence.

### Admit only the bounded result

If every bridge and falsifier passes, admit only:

```text
DecisionMatchesSpec
  over <exact AccessSpec set>
  × <exact AccessEnvironment set>
  × <exact canonical request denominator>
  using <exact runtime/evaluator/compiler versions and digests>
```

Then, and only then, expand separately:

1. IOLM projection/inspection of the proof chain;
2. `RecordedTraceMeets` over a declared finite trace model;
3. `ExecutedActionMatchesDecision` with non-bypass effect mediation;
4. `PolicyRefinesWithin` over declared environment families;
5. robot continuous/temporal work for the generality gate;
6. a future whole-agent judgment only after its agent, environment, horizon,
   observation, and quantification contracts exist.

## KEEP / FIX / KILL

### KEEP

- The independent `Satisfies` / executable `decidePolicy` split and its Lean
  theorems.
- The explicit matcher and environment assumptions.
- BTE exact identities, exact-set comparison, TestCase/result separation,
  unique bindings, raw observations, mutations, receipts, and independent
  replay as reusable evidence mechanics.
- IOLM as an independent read-only consumer.
- Claim ≤ proof and fail-closed residue.

### FIX

- Replace the first operative phrase `agent ⊨ spec` with the exact named
  decision judgment.
- Reconcile AV-D1 with the newly strongest access witness through an owner
  decision.
- Repair premature “general” wording and create the missing execution package.
- Add every semantic/runtime/observation/mediation/denominator bridge.
- Refresh stale L0A planning and Inventory read models.

### KILL

- Any present claim that a general agent satisfies a DomainSpec.
- Schema-valid, graph-preserved, test-green, receipt-valid, or replay-green as
  semantic proof by itself.
- A predicate defined by the same runtime it judges.
- A finite fixture list presented as an unbounded theorem.
- A claim of Lean-to-TypeScript equivalence without a real translation or
  bounded runtime bridge.
- BTE or IOLM treated as semantic authority.
- A general/moat claim before the robot generality witness.

## Evidence key

- **[F1]** `projects/domainspec-v2/development/research/2026-07-22-agent-satisfies-spec-current-state/research.md` — **Agent 1 — Formal Semantics Reconstruction**, **Agent 2 — Live Executable Evidence Audit**, and **Agent 3 — Operational Grounding**.
- **[K1]** `domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean` — `Satisfies`, `decidePolicy`, `decidePolicy_allow_iff`, `decidePolicy_sound`, `deny_precedence`, `add_layer_restricts`, `layered_not_flattenable`; `domainspec-lean-formalization/lean-engineer/AgentPermissionKernelComposition.lean` — `satisfies_append`, `decidePolicy_append_allow`.
- **[K2]** `domainspec-lean-formalization/lean-engineer/AgentPermissionKernelArgs.lean` — declared preconditions, `normalize_clean`, `normalize_idempotent`, `mkCanonRule`; `domainspec-lean-formalization/lean-engineer/AgentPermissionKernelTaint.lean` — declared assumptions, `egressGuard_refines`, `egressGuard_nonvacuous`; `domainspec-lean-formalization/lean-engineer/AgentPermissionKernelTaintTrace.lean` — `clean_trace_no_secret_read`, `egress_allowed_no_prior_secret_read`, non-vacuity witnesses.
- **[A1]** `projects/domainspec-v2/development/agent-spec-conformance/DEFINE.md` — **The falsifiable claim**, **Scope & sequence**, **Open decisions**; `projects/domainspec-v2/development/agent-spec-conformance/DESIGN.md` — **The boundary**, **plural certify substrate**, **Design decisions**, and frontmatter references to missing execution artifacts.
- **[B1]** `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/DEFINE.md` — **Goal And Proof Claim**, **Scope**, **Contract Objects**, **Required Invariants**; `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/DESIGN.md` — **Frozen Architecture Decisions**, **Proof and evidence components**, **Receipt, replay, and aggregates**, **Consumer and lifecycle components**, **Required Machine Contract Families**.
- **[B2]** `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/session-evidence/SWU-BTE-L0A-001/20260723T020759Z-contract-publication/execution-receipt.json`; `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/runs/20260723T020759Z/l0a/contract-publication-receipt.json`; `projects/domainspec-v2/impl/test-derivation-engine/src/bte/contract-publication.ts`; `projects/domainspec-v2/impl/test-derivation-engine/src/bte/validation/diagnostics.ts`; stale selectors in `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md` **Control Fields** and **Candidate SWU Manifest**.
- **[B3]** `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/REQUIREMENTS.md` — **Acceptance Equation**, **Binding, Evaluation, Execution, And Mutation**, **Receipts, Replay, And Aggregates**, **Explicit Non-Requirements**; `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md` — **L0A Contract Publication** and **L0B Semantic Validation Execution**; `projects/domainspec-v2/impl/test-derivation-engine/src/README.md` — **What this implies for DomainSpec**.
- **[I1]** `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-DOMAINSPEC-EVIDENCE-CONSUMER.md` — both consumer SWUs and claim boundaries; `cyberAlchemy-v2/development/interactive-ontology-learning-map/prototype/contracts/candidate/candidate-view.schema.json` — `authority_effect: none` and forbidden gate evidence; `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A2/execution-receipt.json` — candidate posture and eligibility fence.
- **[C1]** `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` — `CAV2-D37 Gate` and `CAV2-D38 Claim-Proof Bound`; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md` — **Authority Rule**, **Authority Kinds**, and **Non-Collapse Rules**.
