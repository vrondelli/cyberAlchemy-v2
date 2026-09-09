# Runtime Context Pack — SWU-OEW-004 Option-A Refresh

Session evidence only; not a canonical planning source.

## Identity

- Task: amend SWU-OEW-004 after `DG-OEW-004-VALIDATION-ENTRYPOINT`
- Capability: `invoke:refresh:apply-approved`
- Mode: lean, strict
- Owner: `ontology-evidence-workbench-plan-owner`

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| REF-A-01 | Persist the direct user selection of option A | `decision-gate/decision-receipt.json` | covered |
| REF-A-02 | Add only `package.json` to SWU-004 implementation targets | manifest SWU-004 selector | covered |
| REF-A-03 | Preserve the original terminal blocked receipt | root SWU-004 `receipt.json` | covered |
| REF-A-04 | Give the resumed attempt a distinct receipt path | manifest/task closeout selectors | covered |
| REF-A-05 | Reactivate the serial chain without duplicating the selector | `chain-state.json` state selectors | covered |
| REF-A-06 | Do not write implementation bytes in Invoke Refresh | decision scope and target inventory | covered |

## Selected Sources

- `decision-gate/decision-receipt.json`: selected option, exact authorization,
  historical receipt binding, and bounded next route.
- `planning/work-pack/swu-manifest.json`: SWU-OEW-004 target inventory,
  validation command, and expected receipt.
- `planning/work-pack/tasks/TASK-OEW-ADAPTER-001.md`: human task contract and
  execution-state table.
- `planning/WORK-PACK.md`: global next-route and residue statements.
- `planning/work-pack/chain-state.json`: stopped chain, captured frontier, and
  receipt history.
- root `SWU-OEW-004/receipt.json`: immutable terminal source result.

## Write Scope

Exactly four planning targets:

1. `planning/WORK-PACK.md`
2. `planning/work-pack/tasks/TASK-OEW-ADAPTER-001.md`
3. `planning/work-pack/swu-manifest.json`
4. `planning/work-pack/chain-state.json`

## Constraints and Non-Goals

- The option-A Refresh does not add the npm script or any implementation file.
- The original blocked Task Session remains a valid historical terminal result.
- Authority, promotion, publication, deployment, and source adoption remain
  outside scope.
- The Poker Team and upstream repositories remain read-only.

## Done and Validation

- Staged outputs are byte-bound in an Invoke material package.
- JSON targets parse.
- Manifest SWU-004 has ten unique targets including `package.json`.
- The expected receipt points to `attempt-002/receipt.json`.
- Chain state is active, preserves the old receipt, and names attempt 002.
- Live targets exactly equal admitted staged outputs after apply.

Strict coverage: **PASS**. Blockers: **0**.
