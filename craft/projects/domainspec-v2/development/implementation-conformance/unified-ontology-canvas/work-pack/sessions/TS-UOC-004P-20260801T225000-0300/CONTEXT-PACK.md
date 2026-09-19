# Task Session Context Pack — SWU-UOC-004P

- Mode: standard, strict.
- Files selected: 12.
- Obligations: 10/10 covered.
- Handoff pack: none; local Task Session execution.
- Fallback search: only named gaps inside the exact product write scope.

| Obligation | Controlling evidence | Resolution |
| --- | --- | --- |
| Execute exactly one selected SWU | `WORK-PACK.md#control-fields`; 004P task | 004P only; 005 cannot run. |
| Preserve historical results | 004 BLOCK result; 001-003 Refresh receipts | Do not edit them; rerun behavior for changed bytes. |
| Remove browser Node dependency | 004 BLOCK exact diagnosis | Remove `node:crypto` and `createHash` from model/layout. |
| Remove generated checksums | 004P task; SPEC prototype boundary | Remove generated digest fields and assertions only. |
| Preserve raw source metadata | 004P task | Keep raw fixture `source_digest` fields untouched. |
| Preserve deterministic structure | model/layout validators | Deep-equal replay, stable IDs, positions, routes, counts. |
| Prove native browser rendering | browser harness | Static mode, five bands, 95 nodes, 147 edges, no errors/external requests. |
| Bound writes | 004P task product and receipt scopes | Six product files plus one Task Session result. |
| Enable deterministic closeout | closeout inventory and contract | Baselines and owner receipt contract preflighted before mutation. |
| Preserve claim ceiling | SPEC, EXECUTION-PACK, Invoke Refresh report | Local static prototype only. |

Selected sources:

- `work-pack/tasks/TASK-UOC-004P-PROTOTYPE-NO-CHECKSUM.md` — complete task contract;
- `WORK-PACK.md`, `EXECUTION-PACK.md` — selected frontier and serial stop;
- `SPEC.md#local-prototype-evidence-boundary` and
  `ARCHITECTURE.md#unified-graph-contract` — fixed-ID/no-checksum contract;
- `work-pack/results/SWU-UOC-004-RESULT.md` — exact blocker;
- `closeout/SWU-UOC-003-REFRESH-RECEIPT.json` — predecessor evidence;
- six exact product targets — live baseline and implementation surface;
- `work-pack/shared/closeout-inventory.md#swu-uoc-004p` and
  `work-pack/shared/closeout-contract.md` — synchronization boundary.

Excluded:

- later SWU task files, because 005 and later remain blocked;
- research execution, CAV2, ontology definitions, Git, publication, and server
  work, because none can close a 004P obligation.
