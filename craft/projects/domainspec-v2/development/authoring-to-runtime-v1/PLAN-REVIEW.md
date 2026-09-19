---
title: Authoring-to-Runtime DAG Review
status: reviewed-planning-candidate
updatedAt: 2026-09-17
reviewer: primary planning agent
authority_effect: none
---

# Plan review

## Revision 5 — current implementation and plan self-review

See [current review, DAG and exit criteria](CURRENT-REVIEW-AND-PLAN.md).
Reviewer: primary agent, separate review pass; not an independent reviewer.

Result: suitable as a planning candidate after two corrections: I03 now requires
typed same-source messaging closure, not identity/policy checks alone; I04 owns
the observed public Mapping v3 runtime-consumer gap. Existing node identities,
dependencies and product decisions remain unchanged. Fresh focused suites pass
23/23 in total, zero skips, and both full typechecks pass. Historical I00 build
failures below are superseded, not erased.

Review checks: no backend rewrite; no new parser; no arrow-as-control-flow;
no provider-defined meaning; no implicit Entity lookup; no early full-runtime
claim; no optional-Query first-row fallback; no hand-authored backend JSON in
the I07 public flow; and no operational repair gating unrelated construction.
The structural DAG validator passes after this edit: 37 nodes, five layers,
one root and one terminal. P05 still requires
independent review of the final frozen candidate; this self-review does not
satisfy P05. No current product decision is required to start I03.

Remaining 26 nodes are obligation counts, not an effort percentage. The broad
cross-language/runtime/installed checks were not rerun in this bounded review.

## Revision 4 — live working-tree review

Current review: [implementation findings and next DAG](LIVE-REVIEW-AND-NEXT-DAG.md).
Fresh focused evidence: 24/24 tests pass, zero skips; Alch typecheck fails with
five diagnostics. Interface support is present; qualified public Mapping
lowering is unfinished. I00 starts there, not at already implemented Queries.
I06/I07 now explicitly own optional Query protocol-consumer compatibility and
public verification, because the inspected observer rejects valid null absence.
All 37 nodes and dependency edges remain. No status is promoted and no historical
receipt is resealed. This is self-review, not independent P05 review or approval.
Earlier sections below retain their historical evidence and scheduling context.

## Current frontier review — after Query formation, 2026-09-17

See [Remaining implementation and reviewed execution plan](REMAINING-WORK-REVIEW.md)
for the latest source-backed review and detailed L1 dependency decomposition.
I01 is complete for grammar; I00 remains partial. The next executable work is
Query projection/cardinality and the combined I00 proof, alongside I05.
The review adds explicit I07 authoring-contract preparation without changing
the canonical 37-node graph or promoting any completion status. Earlier
reviews below remain dated evidence. This is self-review, not P05.

## Revision 3 review — after L0 completion, 2026-09-17

**Disposition: suitable to continue with L1 after the corrections below.**
This is a primary-agent self-review, not an independent review or product
approval. Implementation was inspected and eight focused tests plus typecheck
were rerun; implementation code was not changed.

| Finding | Correction and review result |
| --- | --- |
| Current recommendations conflicted with the L0 completion ledger. | Recommended next layer is L1. Earlier findings and test counts are labeled historical. |
| Persistence `serves FindOrder` required a Query absent from I00 and deferred to C02. | I00 includes a bounded Query; I02 now depends on I00 and I01. No cycle or new product role introduced. |
| CLI wiring alone could leave authors assembling interpretation/action backend JSON. | I07 explicitly requires source-driven internal contracts, bounded evidence-file loading and unchanged destinations on failure. No fabricated approvals or business defaults. |
| 39 domain cells alone do not prove three-language integration behavior. | C05 adds the L1 integration scenario for each target; P02 still proves clean installed flows. |
| Guide arrows could be mistaken for canonical edge identifiers. | I01 must map each path to actual typed contracts. `delivers`/`transformed-by` prose is not relationship authority. Current authority restricts `invokes` to inbound-endpoint → Operation; subscription paths cannot reuse it without an existing typed binding. |
| Rich SFOL syntax could be mistaken for full executable support. | C03/E02 must distinguish runtime projection from formal-provider evaluation; unsupported constructs remain explicit. No general FOL runtime is promised by L0. |

### Dependency review

I00/I01/I05 are independently ready. I02/I03/I04 join I00 and I01 before I06
joins all integration branches with I05. I07 proves the public user flow.
C02/C03/C04 can progress against the shared C01 model, but C05 joins their
concrete results before any full-coverage claim. E03 and E04 join at E05.
O01 remains separate operational support owned by the implementation agent;
its sole downstream dependency is P02. No current construction blocker was
found by this review. P03–L4X preserve exact candidate and D65 boundaries.

### Acceptance and cost review

- Preserve all 37 node IDs and five layers; no completed node is reopened just
  to improve its presentation, and no historical baseline digest is refreshed.
- Use focused parser/lowering tests while constructing I00–I05; run the full
  generated application at I06/I07, not for every syntax edit.
- Exercise semantic rejection, stale inputs, provider separation and cleanup
  at each relevant boundary; a skipped prerequisite cannot become a pass.
- Compare normalized behavior across targets, not generated text.
- Product decisions, provider admission, production credentials, publication
  and deployment remain outside automatic implementation.

Validation: revision-3 DAG validator passes (37 nodes, five layers, one root,
one terminal, no cycle). The Mermaid dependency set is checked against the
JSON graph. These checks establish plan consistency, not missing implementation.

## Revision 2 review — 2026-09-17

Historical pre-L0 review. Revision 3 above owns current scheduling.

**Disposition: suitable as a planning candidate after the corrections below.**
This is a primary-agent self-review against inspected source and focused test
results, not independent product review. P05 remains a separate future
independent review of the frozen candidate. No implementation was changed in
this planning turn, and no node was promoted on the strength of this review.

### Findings corrected in the plan

1. **Premature integration dependency:** I03/I04 need Event/Mapping and
   request/response realization, absent from the target slice and previously
   deferred to C02 after L1. New I00 supplies the bounded prerequisites after
   L0X. I03/I04 depend on I00 and I01. This avoids an implicit dependency cycle
   without pulling full breadth into L1.
2. **Formation mistaken for executable completion:** S06 now explicitly owns
   consuming operation shapes and interpreting FormalClaim symbols through
   current typed executable contracts. Positive, negative, unsupported and
   hostile cases are required; TypeScript typechecking alone is insufficient.
3. **Trace completeness overstated:** S04 remains partial. It must cover all
   emitted files, including condition bindings and operation shapes, and stop
   authored enum variant meaning from being silently discarded.
4. **Outdated next step:** the plan now starts at S04, not S01. The old baseline
   and historical tests are retained as dated evidence, not rerun claims.
5. **Public integration left implicit:** I07 explicitly owns the target CLI/API
   flow and bounded companion-file resolution. Existing separate profiles do
   not count as completing this user path.

### Dependency and completeness audit

| Check | Result / boundary |
| --- | --- |
| All original obligations retained | Original 36 IDs retained; I00 is the only added node, 37 total. |
| Next useful milestone | S04 → S05 → S06 → L0X gives an executable bounded TypeScript proof before provider work. |
| Domain prerequisites precede integration | I00 → I03/I04; C02 still owns complete thirteen-type coverage. |
| Safe parallel opportunities | After L0X: I00, I01, I05; after I01: I02; after I00 and I01: I03/I04. No agents dispatched by this review. |
| Source / meaning / executable evidence separate | Exact-byte joins do not prove proposition validity or executable equivalence. |
| New programming language avoided | Existing typed contracts and declarative graph composition only; no imperative operation body introduced. |
| Three-language breadth retained | C05 still requires 39 realization cells, with native and semantic evidence. |
| Operational work isolated | O01 joins only at P02 and needs fresh diagnosis before repair. |
| D65 ceiling preserved | P03 freezes tested bytes; P04 prepares binding; P05 reviews; L4X hands off, without approval or release. |
| Test cost controlled | Focused tests per changed obligation, layer joins for integrated regressions, installed qualification at P02; no full suite per edit. |

### Verification policy for execution

Revision-2 structural validation passes: five layers, 37 nodes, one root and
one terminal, acyclic dependencies and operational-lane isolation. A separate
check confirms that all 36 original IDs remain and that the human Mermaid
diagram has exactly the same dependency edges as `EXECUTION-DAG.json`.
Focused implementation evidence: Alch 29/29, DomainSpec binding 4/4, and Alch
typecheck pass. These checks do not prove the unimplemented DAG nodes.

Every node must name its exact inputs, output artifacts, test obligation and
failure semantics before it is marked complete. Preserve source-byte evidence
and record changed bytes separately from the historical baseline. Keep test
temporary directories owned and cleaned. Do not regenerate whole applications
to validate a pure parsing or hashing change.

S06 must define a bounded interpretation before execution: an uninterpreted
predicate name is not a function implementation, and a universal proposition
cannot silently become a per-record check or finite-domain proof. If the
selected contract cannot represent the required interpretation, surface that
specific product decision before changing behavior.

Open implementation questions are owned by S04/S06/I07 and the later named
nodes; no new product decision was selected in this revision. Independent
review, installed qualification, formal-provider execution and product approval
are not claimed by this document.

## Historical planning review — 2026-09-16

The original review below describes the first revision, including its former
S01 starting point. Revision 2 above takes precedence for current scheduling.

## Review outcome

**PASS as a non-authoritative planning candidate.** The DAG is implementable in
dependency order, preserves the working backend, exposes the real semantic
frontier, and keeps operational support from hiding runnable product work.

It is not admitted execution state. CyberAlchemy Goals validation is currently
blocked, and implementation still requires an exact separately routed scope.

## Review criteria

| Criterion | Result | Review note |
| --- | --- | --- |
| Starts at the real frontier | PASS | L0 starts with FormalClaim/Rule semantics and lowering, not another backend generator. |
| Minimum useful L0 | PASS | One Entity–FormalClaim–Rule–Operation slice proves the new semantic path before integrations. |
| Reuses live implementation | PASS | Existing Alch parser, DomainSpec lowering, thirteen-type compiler, integration graph, providers, and whole-application composer are predecessors. |
| Preserves product boundaries | PASS | Domain, integration, provider, verification, runtime evidence, and authority remain separate. |
| Avoids a new programming language | PASS | Operations remain declared capabilities; graph arrows remain relationships, not imperative statements. |
| Handles multiple entries | PASS | Generalization follows the one-entry vertical and retains explicit entry selection. |
| Cross-language denominator | PASS | TypeScript, Python, and Rust converge at L2; Kotlin is absent by decision. |
| Verification depth | PASS | Non-collapse, semantic, orthogonality, property/oracle, mutation, determinism, and currentness checks are explicit at L3. |
| Two-lane planning | PASS | Container toolchain repair is operational and does not block L0–L3. |
| Acyclic dependency structure | PASS | `validate_dag.py` checks unique nodes, closure, acyclicity, reachability, layer exits, and one terminal. |
| Authority ceiling | PASS | Every terminal stops at product-review handoff; approval, admission, publication, release, deployment, and operation stay outside. |

## Corrections applied during review

### 1. Do not restart the DomainSpec backend

An earlier interpretation could have treated the thirteen meta-types and
three-language generation as remaining construction. Live evidence shows that
work already exists and passes its focused host suite. The reviewed DAG treats
it as a predecessor and spends new work on authoring convergence.

### 2. Do not reseal the stale candidate first

The historical whole-application L4 candidate is no longer current. Resealing it
before changing the language would immediately invalidate it again. Candidate
freeze is therefore P03, after the target authoring/evidence product is complete.

### 3. Put FormalClaim semantics before parser changes

Changing `parser.ts` first would let implementation convenience define the
language. S01 and S02 establish identity, ownership, and the cross-partition
binding before S03 changes the parser/model.

### 4. Lower integration syntax into existing contracts

Persistence, messaging, and external API semantics already have validated
DomainSpec contracts. I02–I04 extend AlchLang authoring and traceability; they do
not introduce replacement DomainSpec schemas or new domain meta-types.

### 5. Keep runtime and verification profiles orthogonal

Runtime profiles choose executable target/provider capabilities. Verification
profiles choose FormalClaims, contexts, formal providers, bounds, and ceilings.
The plan prevents either profile from redefining the other.

### 6. Keep test-harness repair out of the product frontier

The focused suite passes 52/52 on pinned host tools but 49/52 through the
container wrapper because the wrapper cannot see its expected TypeScript/Cargo
paths. O01 is real work, but it joins only at clean installed qualification.

## Dependency review

- S01 → S06 is intentionally serial because each node fixes the semantic input
  of the next.
- I02, I03, and I04 are safe parallel branches after I01.
- I05 can proceed in parallel with integration lowering after L0.
- C02, C03, and C04 are independent after the shared profile architecture C01.
- E01–E03 form the formal-evidence chain; E04 is a parallel runtime-evidence
  branch; E05 is their non-collapse join.
- O01 is independent from product construction until P02.
- P03 freezes only after all installed flows pass; P04 and P05 cannot run on
  mutable candidate bytes.

## Risk review

| Risk | Plan control |
| --- | --- |
| Profile proliferation leaves several incompatible AlchLangs | C01 establishes one shared parser/model and bounded capabilities. |
| FormalClaim becomes a renamed Rule expression | S01/S02 identity and cross-partition contract; S06 semantic mutations. |
| Arrow syntax turns into imperative orchestration | I01 closed graph grammar and hard stop. |
| Provider configuration leaks into business meaning | I05 separate runtime profile and I06 typed join. |
| Multi-entry service selects a default silently | C04 explicit entry identity and collision tests. |
| Cross-language code passes typechecks but changes meaning | C05 normalized semantic corpus and native observers. |
| Formal provider result is inflated into proof | E03 typed outcomes and E05 non-collapse suite. |
| Runtime stage inflation | E04 separate commit/acceptance/delivery/completion evidence. |
| Historical receipts are refreshed over changed bytes | P03 requires a successor candidate and non-mutating currentness. |
| Operational tasks delay runnable product work | Two-lane plan; O01 joins only at P02. |

## Completeness review against the user-facing guide

| Guide concern | Owning DAG nodes |
| --- | --- |
| Define and target semantic contract | S01–S02 |
| AlchLang target syntax | S03, I01, I05, C02–C04, E01 |
| DomainSpec typed graph | S04, I06 |
| FormalClaim and Rule composition | S01–S06, C03 |
| Integration arrows | I01–I04 |
| Runtime/provider profiles | I05–I07 |
| Multiple entry points | C04 |
| TypeScript/Python/Rust | C05 |
| Runtime observations | E04 |
| Formal providers and EVF | E01–E03 |
| Semantic/non-collapse/orthogonality tests | E05 |
| Installation and first-release candidate | O01, P01–P05 |
| D65 construction accounting | P04 |

No described product surface is left without an owning node. Publication,
release, deployment, production operation, and product approval are deliberately
outside because they are later decisions, not missing implementation nodes.

## Recommended execution start

Start with **S01**, then **S02**. Before implementation, capture current
preimages and declare exact files for the AlchLang semantic contract,
FormalClaim bridge, and relationship authority. Do not start I01/I05 syntax
implementation until the S01/S02 meanings are frozen as one candidate epoch.

## Claim ceiling

This review validates the plan's structure and evidence coverage only. It does
not approve the plan, authorize implementation, accept product semantics,
admit a profile or ontology, or authorize publication, release, deployment, or
runtime operation.
