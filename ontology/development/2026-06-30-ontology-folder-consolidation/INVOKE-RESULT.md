# Invoke Result - Ontology Folder Consolidation Plan

- Mode: plan
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: flag
- Mode contract: `spells/invoke/plan.md`
- Target artifact: CyberAlchemy v2 ontology folder consolidation

## Summary

The plan turns the recommendations into a gated execution packet. The key
decision is to avoid collapsing the ontology folders wholesale. Instead, later
execution should clarify folder roles, harvest useful witness material into the
CAV2 package, and route challenge-contract semantic changes through the proper
owners.

## Outputs

| Output | Role |
| --- | --- |
| `CONTEXT-PACK.md` | Planning source summary and delivery boundary. |
| `IMPLEMENTATION-LAYERING.md` | L0-L3 decision model. |
| `WORK-PACK.md` | Canonical executable plan and SWU manifest. |
| `EXECUTION-PACK.md` | Wave schedule and receipt expectations. |
| `PLAN-DISPATCH.json` | Dispatch route for cross-owner handoff. |
| `work-pack/tasks/` | Task-local SWU contracts. |
| `work-pack/waves/` | Layer-mapped waves. |

## Template And Profile Selection

Selected standalone invoke plan companions:

- implementation-layering companion, because plan mode requires L0-L3 layer
  decisions;
- split work-pack, because scope is medium complexity;
- execution-pack, because medium complexity needs wave scheduling;
- full dispatch JSON, because the route crosses owner routes and private/public
  state boundaries.

## Dispatch Technique Trace

Selected techniques:

- `sequence`
- `scu_swu_reduction`
- `recomposition_proof`
- `validation_loop`
- `owner_boundary_check`
- `handle_handoff`
- `residue_ledger`
- `execution_receipt_handoff`
- `authority_split_gate`
- `delegation_boundary`
- `artifact_contract_bridge`
- `concrete_path_evidence`
- `state_namespace_boundary`

Full dispatch path: `PLAN-DISPATCH.json`. Validation result: pass.

## Distill Validation

Verdict: flag.

Smallest coherent executable unit: SWU-OCON-001, the folder-role bridge. It is
small enough to execute now and large enough to reduce the authority confusion:
it marks `projects/ontology` as witness/incubator evidence and links that role
from the CAV2 ontology package.

Recomposition proof: SWU-OCON-001 plus the later harvest, challenge-contract,
domain-instantiation, and verification SWUs recompose into the recommendation:
do not collapse the folders; clarify roles; harvest safely; gate semantic and
schema changes.

Flag reason: challenge-contract confidence wording is a real owner-gated
tension. It does not block L0, but it blocks schema/doc mutation in
TASK-OCON-003 until decision-gate or definitions-governance records the owner
decision.

## Decisions

| Decision | Status | Rationale |
| --- | --- | --- |
| Do not delete or merge `projects/ontology` in the first layer. | selected | It contains useful witness material and existing guardrails. |
| Treat `cyberAlchemy-v2/ontology` as the current base ontology package. | selected | Live CAV2 docs already carry that boundary. |
| Keep challenge-contract meaning in definitions. | selected | `CAV2-D40` is active and ontology files should instantiate it, not redefine it. |
| Treat specs as gated contract targets. | selected | `cyberAlchemy-v2/specs/README.md` already says not to write specs directly from candidates. |

## Unresolved Gaps

| Gap | Owner | Route |
| --- | --- | --- |
| Challenge-contract confidence wording and placement. | decision-gate plus definitions-governance | SWU-OCON-003. |
| Exact DomainSpec v2 instantiation path. | ontology route plus project owner | SWU-OCON-005 after L1. |
| Whether inventory needs refresh after execution. | inventory | Only after a task creates new durable evidence. |

## Invoke Result

- Mode: plan
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: flag
- Mode contract: `spells/invoke/plan.md`
- Outputs: `CONTEXT-PACK.md`, `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, `EXECUTION-PACK.md`, `PLAN-DISPATCH.json`, `work-pack/tasks/`, `work-pack/waves/`
- Design views: source design refs present via CAV2 ontology package and `projects/ontology/ARCHITECTURE.md`
- Glossary consistency: flag; `projects/ontology/GLOSSARY-CONSISTENCY.md` still has OD-1/OD-2/OD-3 naming flags
- Dispatch techniques: selected in `PLAN-DISPATCH.json`; validation pass
- Distill validation: flag; L0 passes, challenge-contract schema mutation owner-gated
- Implementation layering: `IMPLEMENTATION-LAYERING.md`, L0-L3 complete
- Work-pack: `WORK-PACK.md`, split
- Complexity: medium
- Per-layer planning: layer-mapped waves
- Implementation detail: task specs complete for current plan level; owner-gated mutation detail recorded
- Smallest working units: complete for planned tasks; SWU-OCON-003 and SWU-OCON-004 blocked by owner gate
- Template/profile selection: standalone implementation-layering, split work-pack, execution-pack, dispatch JSON
- Validation strategy: dispatch validation, diff check, link/path review, owner receipts for semantic mutation
- Decisions: non-collapse, CAV2 package as current base model, definitions own challenge contract, specs remain gated targets
- Unresolved gaps: challenge-contract confidence wording, DomainSpec v2 instantiation path, optional inventory refresh
- Next route: task-session on SWU-OCON-001
