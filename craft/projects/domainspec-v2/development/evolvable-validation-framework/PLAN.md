---
artifact: invoke-plan
status: candidate-local-l2-reachability-validated-with-flags
updatedAt: 2026-08-21
docType: plan
sourceDefine: DEFINE.md
sourceDesign: DESIGN.md
complexity: high
nextRoute: decision-gate
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

## Candidate-Local Evidence Reconciliation

The finite fast-lane implementation has now crossed L0, L1, and one bounded L2
reachability instance. This is an observed-evidence overlay; it does not
retroactively create Task Session, precloseout, or Invoke Refresh receipts for
the fast-lane units.

| Boundary | Current evidence | Result |
| --- | --- | --- |
| L0 key-and-door | `evidence/SWU-GCP-001/attempt-001/validation-receipt.json` | PASS, candidate-local |
| L1 Financial Settlement | `evidence/L1-GCP-COMPOSITE/attempt-001/composite-validation-receipt.json` | PASS, candidate-local |
| L2 C0-C3 | `evidence/SWU-GCP-004-C0` through `evidence/SWU-GCP-007-C3` | four unit receipts PASS |
| L2 provider join | `evidence/SWU-GCP-007-C3/attempt-001/join-receipt.json` | Souffle and Alloy agree on no counterexample for the selected exact instance |
| Independent closure | `development/refinement-runs/20260821T044428Z-evf-l2-one-shot-work-pack/closure-runs/attempt-001/INDEPENDENT-CLOSURE-RECEIPT.json` | FLAG, zero blockers, 35/35 exact refs fresh |

The maximum supported L2 claim is
`property-specific-consistency-over-one-exact-shared-fact-snapshot-only`.
It covers the selected reachability property only. The canonical S3 wording
also names cycle and closure; those properties remain deferred and S3 is not
complete as a whole.

The independent closure retains three non-product flags: the repository pnpm
supply-chain wrapper stops the declared `pnpm exec` surfaces before tool
launch; a separate untracked `impl/tools/tests/format-honesty.test.ts` affects
the broad TypeScript command; and fast-lane governance reconciliation was
deferred. Authority effect remains `none` and release admission remains
`not-granted`.

## Delivery Slices

| Slice | Layer | Outcome | Dependency | Exit evidence |
| --- | --- | --- | --- | --- |
| S0 contract freeze | L0 | contract fields, v1 aspect adapter, and authority split reviewed | define/design | contract review note |
| S1 enforces proof | L0 | one positive and one negative end-to-end receipt | S0 | graph, obligation, binding, test, evaluator, receipt |
| S1C IOLM consumer proof | L0C, independent sibling lane | private IOLM consumes the exact successful S1 handle without semantic/view drift | S1 plus IOLM candidate substrate | fresh narrow IOLM consumer receipt; failure does not change S1 verdict |
| S2 repeatability | L1 | same path works for a second admitted edge/profile fixture | S1 | replay comparison and digest stability |
| S3 graph laws | L2 | one selected reachability property validated; cycle and closure remain deferred | S2 | exact provider and join receipts plus independent closure |
| S4 breadth/hardening | L3 | handoff to the current backend denominator and consumers | selected L2 result plus owner-ratified breadth scope | denominator, mutation, and consumer evidence |

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

The next route is a material decision gate, not another implementation run.
The old breadth wording names 16 relationship signatures, while the live Craft
blocker records 17 after `creates` entered the denominator. The owner must
ratify the exact 17/17 membership and corpus boundary before Refine can author
an executable L3 pack. No L3 implementation is admitted by this reconciliation.

Accepted `DEC-GCP-002` also hands the exact successful L0 handle to the private
IOLM owner. IOLM owns the consumer run and receipt; EVF does not run the map or
write its evidence. S2 remains dependent on S1 only, so an IOLM substrate block
cannot block core evolution. Later, the BTE core triggers a separate fresh IOLM
breadth run for terminal consumer validation.

## Dispatch Technique Trace

See [DISPATCH-SPEC.json](DISPATCH-SPEC.json) for the original governed route.
The observed candidate-local route was serialized L0 -> L1 -> C0 -> C1 -> C2
-> C3 -> independent closure. The historical dispatch trace is not rewritten
as if it authorized that fast-lane execution.
