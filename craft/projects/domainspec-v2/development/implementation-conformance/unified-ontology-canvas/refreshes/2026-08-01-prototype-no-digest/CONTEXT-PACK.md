# Invoke Refresh Context Pack

- Mode: standard, strict.
- Target: local unified-canvas prototype planning frontier.
- Obligation coverage: 8/8.
- Runtime handoff: none; Task Session builds its own context pack.

| Obligation | Evidence | Resolution |
| --- | --- | --- |
| Preserve the historical 004 BLOCK | `work-pack/results/SWU-UOC-004-RESULT.md`; `closeout/SWU-UOC-004-REFRESH-RECEIPT.json` | Keep 004 task/result/receipt unchanged. |
| Remove the Node-only browser blocker | 004 result, exact blocker section | Select corrective 004P. |
| Treat this as a local prototype | direct-user signal in `SOURCE-SIGNALS.md` | Fixed prototype IDs; no generated checksum fields. |
| Preserve deterministic structure | SPEC and ARCHITECTURE | Require repeated deep equality, stable IDs, positions, and routes. |
| Bound planning mutation | material package target inventory | Exactly eight Refresh targets. |
| Bound implementation mutation | new 004P task | Exactly six product files plus its result receipt. |
| Preserve later sequencing | WORK-PACK, EXECUTION-PACK, task 005 | 005 remains blocked until passing 004P Refresh. |
| Preserve claim ceiling | SPEC, Invoke result, source signals | Local static prototype only. |

Selected source selectors:

- `WORK-PACK.md#control-fields`, `#task-board`, `#gates`;
- `work-pack/results/SWU-UOC-004-RESULT.md#blocker-and-smallest-unblock-route`;
- `SPEC.md#portable-invariants`, `#local-prototype-evidence-boundary`;
- `ARCHITECTURE.md#unified-graph-contract`, `#dependency-and-interface-rules`;
- `work-pack/shared/closeout-inventory.md#swu-uoc-004`;
- Inventory entry
  `domainspec-v2-uoc-browser-neutral-digest-research-strategy-result-synthesis`
  as a non-authority prior option map.

Excluded:

- completed 001-003 candidate copies, because they are historical byte evidence,
  not planning mutation targets;
- CAV2 authority sources, because this refresh changes no ontology authority;
- the unlaunched research dispatch, because the user has now made the prototype
  decision directly.
