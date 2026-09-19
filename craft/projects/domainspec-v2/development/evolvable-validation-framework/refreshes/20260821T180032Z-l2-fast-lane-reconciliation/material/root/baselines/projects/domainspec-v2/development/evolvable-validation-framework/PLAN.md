---
artifact: invoke-plan
status: candidate-awaiting-task-session
updatedAt: 2026-07-20
docType: plan
sourceDefine: DEFINE.md
sourceDesign: DESIGN.md
complexity: high
nextRoute: task-session
---

# Plan: Graph Composability Evidence Spine

## Invoke Result

| Required output | Path | Status |
| --- | --- | --- |
| Define contract and gaps | [DEFINE.md](DEFINE.md) | candidate complete |
| Beginner vocabulary | [GLOSSARY.md](GLOSSARY.md) | candidate complete |
| Six-view architecture | [DESIGN.md](DESIGN.md) | candidate complete |
| Glossary consistency | [GLOSSARY-CONSISTENCY.md](GLOSSARY-CONSISTENCY.md) | partial, no promotion |
| v1 aspect adoption | [V1-ASPECT-ADOPTION.md](V1-ASPECT-ADOPTION.md) | decision recorded |
| Implementation layering | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | complete |
| Split work-pack | [WORK-PACK.md](WORK-PACK.md) | ready after selection |
| Execution choreography | [EXECUTION-PACK.md](EXECUTION-PACK.md) | handoff only |
| Distill validation | [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md) | pass with named future flags |
| Dispatch trace | [DISPATCH-SPEC.json](DISPATCH-SPEC.json) | pending validator run |

## Objective

Produce the first replayable composability proof for the key-and-door example:
`Rule --enforces--> Operation` must become a normalized graph, an independently
identified obligation, a bound executable test, an evaluator verdict, and a
typed receipt. The proof must include a negative mutation and must distinguish
structural evidence from semantic satisfiability.

## Delivery Slices

| Slice | Layer | Outcome | Dependency | Exit evidence |
| --- | --- | --- | --- | --- |
| S0 contract freeze | L0 | contract fields, v1 aspect adapter, and authority split reviewed | define/design | contract review note |
| S1 enforces proof | L0 | one positive and one negative end-to-end receipt | S0 | graph, obligation, binding, test, evaluator, receipt |
| S1C IOLM consumer proof | L0C, independent sibling lane | private IOLM consumes the exact successful S1 handle without semantic/view drift | S1 plus IOLM candidate substrate | fresh narrow IOLM consumer receipt; failure does not change S1 verdict |
| S2 repeatability | L1 | same path works for a second admitted edge/profile fixture | S1 | replay comparison and digest stability |
| S3 graph laws | L2 | bounded reachability/cycle/closure evaluator | S2 | independent graph-law receipts |
| S4 breadth/hardening | L3 | handoff to 13-kind/16-signature backend lane and consumers | S3 | denominator, mutation, and consumer evidence |

## Explicit Non-Goals

This plan does not implement all backend types, solve arbitrary FOL/Cedar/
Datalog queries, prove business semantics, repair Saga/Workflow alignment,
change release state, or promote any receipt into authority.

## Validation Strategy

- Validate relationship admission with the existing relationship validator.
- Compare independently authored expected obligations with generated obligations;
  never let the generator define its own `O_spec` denominator.
- Reject an endpoint/signature mutation and a stale-digest binding.
- Run the existing test-derivation engine tests and composability checker as
  regression surfaces after Task Session authorizes implementation.
- Reject completeness if any `it.skip`, `it.todo`, `needs_formal`, orphan, or
  unrunnable binding remains in the selected proof slice.
- Finish with `git diff --check` and a receipt whose input digests are replayable.

## Ownership And Handoff

The next route is `task-session`; Invoke does not execute the SWU. The existing
backend-type-test-engine-completeness package owns broad 13-kind/16-signature
execution. This package hands it a composability-first contract and the L0
receipt shape.

Accepted `DEC-GCP-002` also hands the exact successful L0 handle to the private
IOLM owner. IOLM owns the consumer run and receipt; EVF does not run the map or
write its evidence. S2 remains dependent on S1 only, so an IOLM substrate block
cannot block core evolution. Later, the BTE core triggers a separate fresh IOLM
breadth run for terminal consumer validation.

## Dispatch Technique Trace

See [DISPATCH-SPEC.json](DISPATCH-SPEC.json). The trace is intentionally
sequential: define -> design -> plan -> one Task Session SWU -> independent
verification. No subagent or parallel execution is authorized.
