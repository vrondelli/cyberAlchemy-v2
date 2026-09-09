# Synthesis round 2 — bounded repair

This delta repairs `synthesis.md` against `review-round-1.md`. Earlier conflicting claims are superseded by this file. It remains candidate research with `local_witness=none` throughout.

## Provenance and ownership

Use these claim classes: `paper_position`, `paper_reported_product`, `local_owned_candidate`, `integration_inference`, `local_witness`. Yu’s hierarchy and consistency questions and Dadhich’s lifecycle are `paper_position`. Synap behavior and benchmarks are `paper_reported_product` and killed as ARE evidence. The local invariant chain is `local_owned_candidate`. Protocol fields and fixtures are `integration_inference`. No `local_witness` exists.

Ownership is split: ARE product owner owns projection taxonomy; source/Context owners own source-memory lifecycle; route owners own route-specific projection policy; governance owns authority/event vocabulary; experiment owner owns thresholds. OPEN-001 belongs to ARE plus definitions-governance owners; OPEN-002 to ARE plus ontology owners; OPEN-003 to Codex integration plus Context owners.

## Repaired state and operation model

```text
CodexRequestContext
  → CodexPreflightDecision
      → CodexRouteDirective when direct
      → CodexDecisionGate when gated
      → TypedBlocker when blocked

source acquisition
  → retrieval (candidate records only)
  → provenance binding (source/transformation identity only)
  → dependency selection (declared set, exclusions, gaps)
  → basis construction (frozen candidate or not_evaluable)
  → projection (derived artifact, not yet consumer-bound)
  → view binding (consumer/purpose/window/epoch)
  → reasoning (non-authorizing judgment or route strategy candidate)
```

Route, directive, gate, blocker, and owner decision are distinct. Retrieval does not prove relevance or closure. Provenance does not prove correctness or permission. Dependency selection cannot prove closure before OPEN-001 or selector sufficiency before OPEN-002. Projection cannot route, decide, admit, or authorize. Reasoning cannot grant continuation or effect authority.

## Invalidation and succession

1. Unknown, missing, ambiguous, or conflicting selected dependency → `not_evaluable`; do not construct a current successor.
2. Known selected dependency change → immutable successor basis/view candidates with predecessor references.
3. Unchanged bindings → reuse only under the later OPEN-003 decision.
4. Unrelated drift → diagnostic only, no invalidation.
5. Cold regeneration is a construction method, not a semantic state.

OPEN-003 alternatives remain unresolved:

- A: retain view identity for unchanged bindings and emit a per-turn reuse receipt;
- B: create a per-turn successor view and record equality through digests/predecessors.

No experiment may silently select either alternative.

## Full ontology-runtime suspension

Python ontology-runtime output is diagnostic candidate evidence only. It cannot admit or reject ontology records; admit, block, authorize, or route work; select architecture; satisfy definition or selector closure; grant an owner decision; alter continuation; or grant implementation, publication, deployment, or effect authority. Only changed, missing, conflicting, or ambiguous dependencies inside the explicitly declared dependency set may fail selected work closed. Ambient drift is diagnostic.

## Fixture boundary

Every fixture must freeze exact request, profile, route-registry, source, mutation, dependency-set, expected identity/reason-code, repetition, tokenizer/token-accounting, causal-event, and machine-oracle data. A hand-authored dependency set may test plumbing, but not discovered definition closure, selector sufficiency, or general basis completeness.

Predecision plumbing fixtures may test exact-one route, route tie, zero route, unknown effect, stale selected routing dependency, and byte-identical repeated classification.

The following remain `not_evaluable` until their owner decisions:

- definition-closure completeness and missing-bridge oracle until OPEN-001;
- selector-lock sufficiency and required-edge oracle until OPEN-002;
- general Necessary Context Basis sufficiency, plus dependent compaction/retrieval-sufficiency metrics, until both.

Still-unexecuted candidate fixtures are:

- succession plumbing over a hand-authored dependency set;
- immutable multi-agent causal log with publication distinct from acceptance and deterministic conflict-set digest;
- two-scope leakage case with forbidden, excluded, superseded, and permitted records plus missing-access-metadata fail-closed behavior;
- frozen 120-turn compaction corpus with protected fields and exact metric formulas.

No fixture result or performance number exists.

## Typed outcome matrix

| Item | State |
|---|---|
| Paper hierarchy/lifecycle/access/visibility/provenance/compaction vocabulary | `candidate` |
| Operation taxonomy and protocol-field sketches | `candidate` |
| Frozen predecision fixture schema and hand-authored succession plumbing | `candidate` |
| General definition closure | `not_evaluable` pending OPEN-001 |
| General selector-lock sufficiency | `not_evaluable` pending OPEN-002 |
| General basis sufficiency and semantic benchmarks | `not_evaluable` pending OPEN-001/002 |
| Python runtime as any admission/block/routing/continuation/authority mechanism | `killed` |
| Paper product/benchmark results as ARE evidence | `killed` |
| Millisecond latency, savings, fidelity, consistency, isolation, context-rot, warm/cold equivalence, or production readiness | `killed` until witnessed |
| Cache/retrieval/provenance/consensus/publication as route, decision, admission, or effect authority | `killed` |
| OPEN-001, OPEN-002, OPEN-003 and the split taxonomy/lifecycle/policy/event/threshold choices | `owner_decision_required` |

This repair does not make the research ready for Product Capability construction. It makes the paper-use findings ready to report with their blockers and candidate experiments intact.
