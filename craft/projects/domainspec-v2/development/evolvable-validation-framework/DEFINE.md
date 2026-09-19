---
artifact: invoke-define
status: candidate
updatedAt: 2026-07-18
docType: define
owner: DomainSpec-v2 evolvable-validation-framework
invokeMode: define
---

# Define: Graph Composability Evidence Spine

## Intent

Define the smallest reusable contract set that can describe a graph, its nodes
and edges, the obligations derived from it, a test case, an execution binding,
an evaluator, and a receipt. The first proof target is the existing key-and-door
example with one `Rule --enforces--> Operation` edge. This is a candidate
research design, not a promotion of a new canonical vocabulary.

## Approved Goal And Boundary

- **Goal:** make graph composability and test derivation observable as a chain
  of typed artifacts rather than as an implicit test-run side effect.
- **In scope:** source and normalized graph identity, relationship admission,
  obligation derivation, binding, test generation/execution, evaluator result,
  and evidence receipt.
- **First proof:** one `enforces` edge, one derived obligation, one binding,
  one generated assertion, one typed receipt, plus one negative mutation.
- **Deferred:** all 13 backend kinds and 16 backend signatures, all 30 active
  relationship signatures, cross-graph FOL/Cedar/Datalog solving, temporal
  semantics, and release-state promotion.

## Discovery And Source Evidence

The discovery-existence gate is satisfied by the existing research and runtime
artifacts; no new upstream discovery was needed.

| Source | What it establishes | Authority role |
| --- | --- | --- |
| [findings.md](../../research/evolvable-validation-framework/findings.md) | structural substrate, witnesses, and known gaps | research evidence |
| [relationships.md](../../definitions/relationships/relationships.md) | active relationship signatures and removal/non-collapse rule | relationship authority |
| `impl/test-derivation-engine/src/ir/types.ts` | current graph, edge, and obligation shapes | implementation evidence |
| `impl/test-derivation-engine/src/rules/index.ts` | deterministic `δ(G, Δ) -> Obligation[]` rule boundary | implementation evidence |
| `impl/test-derivation-engine/src/emit/spec.ts` | deterministic specification emission and tiers | implementation evidence |
| `impl/test-derivation-engine/src/emit/tests.ts` | generated assertions and honest gaps | implementation evidence |
| `impl/test-derivation-engine/src/residue/receipt.ts` | structural receipt boundary | implementation evidence |
| `implementation/domainspec/docs/features/test-derivation-engine/operations.md` | v1 formal operation/rule/calculation/postcondition pattern | adapted source pattern |
| `implementation/domainspec/docs/features/test-derivation-engine/interfaces.md` | v1 request/response and exit-code boundary | adapted binding/evaluator pattern |
| `implementation/domainspec/docs/features/test-derivation-engine/SPEC.md` | v1 self-derivation and fixpoint rationale | selective conceptual reference |
| [backend-type-test-engine-completeness](../first-production-release/backend-type-test-engine-completeness/PLAN.md) | existing broad backend execution lane | related execution package |

## Candidate Contract Set

The names below are stable for this package only until a later authority review.
Every artifact has a deterministic identifier and an explicit provenance link.

| Object | Required identity | Required meaning |
| --- | --- | --- |
| `NodeSource` | `node_id`, `kind`, `source_anchor`, `content_digest` | authored node and where it came from |
| `EdgeSource` | `edge_id`, `signature`, `from`, `to`, `source_anchor` | authored relation between two nodes |
| `RelationshipSignature` | `signature_id`, endpoint kinds, admission rule | typed relation contract from the registry |
| `Graph` | `graph_id`, node/edge lists, `source_digest`, `normalization_version` | normalized composable graph fragment |
| `Obligation` | `obligation_id`, `rule_type`, `source_anchor`, `canonical_params` | deterministic consequence of graph plus rule set |
| `TestCase` | `test_id`, `obligation_id`, input fixture, expected predicate | executable claim generated from an obligation |
| `Binding` | `binding_id`, `test_id`, adapter, runtime target, fixture digest | bridge from a logical test to a runnable harness |
| `Evaluator` | `evaluator_id`, scope, input contract, verdict vocabulary | checker for local or graph-level claims |
| `Receipt` | `receipt_id`, inputs, verdict, evidence, residue, digests | append-only result; never an authority promotion |

## v1 Aspect Reuse Decision

The v1 test-derivation feature is an evidence source for this contract set.
Reuse is selective: `operations.md` supplies the formal rule/calculation/
postcondition pattern, `interfaces.md` supplies the observable binding and
verdict boundary, and `SPEC.md` supplies self-derivation rationale. `states.md`
and `events.md` are intentionally deferred because the v1 engine itself models
the pipeline as stateless. The full decision and field mapping are in
[V1-ASPECT-ADOPTION.md](V1-ASPECT-ADOPTION.md).

## Invariants To Preserve

1. A graph cannot contain an edge whose endpoints fail its registered signature.
2. An obligation must cite both its source anchor and the rule-set version.
3. A test case cannot invent an expected value; it uses the authored formal
   predicate or reports a typed `needs_formal` gap.
4. A binding cannot hide a missing runtime adapter or stale source digest.
5. A receipt records structural, execution, and evaluator evidence separately;
   it must not claim semantic satisfiability when only structure was checked.
6. Inventory remains a generated read model and cannot become source authority.

## Open Gaps Carried Forward

- Current IR uses closed `NodeType` and `EdgeType` unions; extensible profile
  admission is not yet proven for every backend kind.
- The current relationship checker maps only a subset of active signatures;
  unsupported signatures are coverage gaps, not proof.
- A complete `TestCase -> evaluator -> ReceiptEnvelope` path is missing.
- Cross-graph formal engines and Alloy/TLA validation remain unvalidated.
- Saga/Workflow alignment is still an open research question.

## Template And Technique Selection

- **Selected:** DomainSpec architecture-bundle, implementation-layering,
  work-pack, and execution-pack templates, composed additively under this
  research package.
- **Not selected:** upstream SPEC mutation, canonical definition promotion,
  or broad implementation execution.
- **Dispatch Spec trace:** `sequence`, `artifact_contract_bridge`,
  `owner_boundary_check`, `concrete_path_evidence`, `scu_swu_reduction`,
  `recomposition_proof`, `validation_loop`, `execution_receipt_handoff`, and
  `residue_ledger` are recorded in [DISPATCH-SPEC.json](DISPATCH-SPEC.json).
- **Context Builder:** planned for the later Task Session handoff; this plan
  stores selectors, not a pre-generated execution context pack.
- **Structured interview:** skipped as a live interview because the user gave
  an explicit artifact list and a concrete example. The unanswered questions
  are recorded as gaps rather than guessed.
- **Inventory:** existing inventory entries were used to locate the findings
  and plain-language explanation; no inventory authority is changed here.
- **Distill:** local Proposer/Balancer role simulation selects one first unit;
  see [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md).

## Next Route

`design` is the next route. It must consume this candidate contract set and
produce the six-view architecture without creating executable tasks.
