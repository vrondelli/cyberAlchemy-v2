# Dispatch technique trace — ACI-subordinate conformance plan

| Technique | Trigger | Concrete effect | Validation |
|---|---|---|---|
| `sequence` | approved design must precede plan and Distill | Context Builder → Inventory → Invoke Plan → Distill | every later step consumes prior artifacts |
| `frame_handoff` | plan inputs must stay bounded | `CONTEXT-PACK.md` carries the strict planning frame | 9/9 obligations covered |
| `concrete_path_evidence` | evidence spans private and external roots | exact paths, commits, digests, and maturity labels | no floating compatibility claim |
| `scu_swu_reduction` | prior protocol SWU still implied a second writer | retire `SWU-ARE-002`; split containment from conformance | each retained/new unit owns one reviewable behavior |
| `recomposition_proof` | smaller units must still implement option A | local containment + fixture admission + pure mappings recompose around the unchanged evaluator | no hidden journal/effect owner |
| `authority_split_gate` | semantic and runtime authorities differ | plan gates ACI, evaluator, Bus, artifact, effect, and APT owners independently | unresolved owner or owner receipt blocks |
| `state_namespace_boundary` | local-only and integrated state can be confused | explicit local-only, ACI, semantic-artifact, and projection namespaces | no cross-boundary write without handoff |
| `artifact_contract_bridge` | semantic receipt content crosses ACI by reference | conformance fixtures validate artifact ref/digest mapping | no second canonical receipt |
| `approval_semantics_map` | design acceptance is not execution authorization | plan, external maturity, SWU selection, and exact-effect gates remain distinct | no inherited approval |
| `residue_ledger` | external contracts remain blocked/draft/FIX | blocker table retains owner and closure evidence | no maturity inflation |
| `validation_loop` | every lane needs falsifiers | fixture admission, canonical vectors, negative mappings, replay, and zero-effect checks are explicit | evidence precedes promotion |
| `execution_receipt_handoff` | future Task Session must close one SWU deterministically | receipt shape remains in `EXECUTION-PACK.md`; closeout sync remains blocked until exact contracts exist | no mutation handoff while incomplete |
| `owner_boundary_check` | Invoke Plan must not execute or promote | source, Craft, external, public, and promotion owners remain untouched | plan-only mutation |

## Considered and skipped

- `delegation_boundary`: skipped because this authoring route does not delegate
  or execute subagents.
- `tournament` and `dialectic`: skipped because option A is already selected;
  reopening alternatives would violate the accepted decision.
- `route_projection_boundary`: skipped because the plan references ACI handles
  conditionally and does not project itself into an external runnable plan.
- `memory_promotion_split`: skipped because no Inventory/Ontology/Definitions
  promotion occurs.

## Subagent strategy

Status: `none`. This revision is one bounded owner-aware synthesis over an
accepted design and current planning artifacts. No independent evidence lane can
open the external owner gates, and the user did not authorize delegated
execution. No subagent was dispatched.
