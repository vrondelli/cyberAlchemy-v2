---
capability: invoke
mode: refresh
status: pass
mutation_mode: apply-approved
---

# Invoke Result

The approved refresh is complete and validated as a bounded artifact package.
It reconciles the accepted FPR-02B decision with the BTE plan and applies the
required IOLM, Body War, integrated-manifest, Craft, and inventory handoffs.

No engine implementation or test execution was performed. No SWU was selected
or executed. IOLM `G-DSV2-SG` remains blocked and production authorization
remains `false`.

## Outputs

- `REFRESH-REPORT.md`
- `refresh-report.json`
- `REFRESH-PATCH-PROPOSAL.md`
- `REFRESH-DISPATCH.json`
- `context/CONTEXT-PACK.md`
- `context/context-pack.json`

## Applied targets

- BTE plan, work-pack, task, wave, contract, dispatch, and receipt surfaces.
- IOLM consumer handoff surfaces, with its own gate preserved.
- Private Body War redacted fixture and adapter contract under the shared
  DomainSpec v2 working home.
- Integrated evidence manifest, Craft continuation pointers, and the inventory
  entry/index/log backfill.

## Next route

Route exactly one dependency-ready BTE SWU through a separate authorized Task
Session. Preserve IOLM `G-DSV2-SG` as an independent gate and keep the UI lane
independent.
