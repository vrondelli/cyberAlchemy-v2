---
artifact_kind: task-session-closeout-sync-contract
status: complete
authority_effect: none
---

# Task Session Closeout Synchronization Contract

## Common contract

All fifteen mutation-capable SWUs have an exact terminal source receipt and closeout
receipt path below. At Task Session admission, Context Builder records SHA256 and
size for `WORK-PACK.md`, `SWU-MANIFEST.json`, the parent task file, and every
existing declared target. A not-yet-created receipt uses the exact
`absent-before-session` sentinel. Closeout rejects a target whose live baseline
does not match that capture.

Allowed closeout deltas are limited to:

- `evidence_added` — add the exact terminal/closeout receipt;
- `status_changed` — only the named SWU/task status;
- `blocker_opened` or `blocker_resolved` — only evidence produced by the SWU;
- `route_changed` — only to the exact successor named below; and
- `receipt_superseded` — only with old/new digests and an owner-approved repair.

Lifecycle owner route: `invoke:refresh:apply-approved`. It may update only the
declared target inventory. Validation must parse all JSON, re-run the terminal
receipt's declared critical checks or verify exact immutable command receipts,
join captured baselines to admitted deltas, verify no unrelated SWU changed, and
confirm the deterministic successor. Expected closeout schema:
`arcanum.task-session-closeout/v1` with `authority_effect:none`.

No closeout route admits another implementation, semantic change, authority
promotion, publication, deployment, destructive cleanup, or inferred successor.

### Exact shared inventory sets

- `INV-L0`: `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/WORK-PACK.md`; `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/SWU-MANIFEST.json`; `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/EXECUTION-ENTRY.json`; `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/tasks/TASK-ARE-L0-CONTRACTS.md`.
- `INV-L1`: the same exact Work Pack, manifest, and execution-entry paths above,
  plus `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/tasks/TASK-ARE-L1-COMPILER.md`.
- `INV-L2`: the same exact Work Pack, manifest, and execution-entry paths above,
  plus `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/tasks/TASK-ARE-L2-PROOF.md`.
- `INV-INTEGRATION`: the same exact Work Pack, manifest, and execution-entry paths
  above, plus `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/tasks/TASK-ARE-L2-INTEGRATION.md`.

Each row's declared target inventory is its named exact set plus the exact
terminal source receipt and exact owner receipt on that row. No glob is allowed.

## Exact rows

| Anchor | Terminal source receipt | Declared synchronization targets | Expected owner receipt | Successor |
|---|---|---|---|---|
| <a id="swu-are-001"></a>SWU-ARE-001 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-001.red.json` | `INV-L0` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-001.json` | `SWU-ARE-002` |
| <a id="swu-are-002"></a>SWU-ARE-002 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-002.json` | `INV-L0` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-002.json` | `SWU-ARE-003` |
| <a id="swu-are-003"></a>SWU-ARE-003 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-003.json` | `INV-L0` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-003.json` | `SWU-ARE-004` |
| <a id="swu-are-004"></a>SWU-ARE-004 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-004.json` | `INV-L0` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-004.json` | `SWU-ARE-015` |
| <a id="swu-are-015"></a>SWU-ARE-015 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-015.json` | `INV-L0` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-015.json` | `SWU-ARE-005` |
| <a id="swu-are-005"></a>SWU-ARE-005 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-005.json` | `INV-L0` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-005.json` | `SWU-ARE-006` |
| <a id="swu-are-006"></a>SWU-ARE-006 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-006.json` | `INV-L1` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-006.json` | `SWU-ARE-007` |
| <a id="swu-are-007"></a>SWU-ARE-007 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-007.json` | `INV-L1` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-007.json` | `SWU-ARE-008` |
| <a id="swu-are-008"></a>SWU-ARE-008 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-008.json` | `INV-L1` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-008.json` | `SWU-ARE-009` |
| <a id="swu-are-009"></a>SWU-ARE-009 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-009.json` | `INV-L1` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-009.json` | `SWU-ARE-010` |
| <a id="swu-are-010"></a>SWU-ARE-010 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-010.json` | `INV-L2` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-010.json` | `SWU-ARE-011` |
| <a id="swu-are-011"></a>SWU-ARE-011 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-011.json` | `INV-L2` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-011.json` | `SWU-ARE-012` |
| <a id="swu-are-012"></a>SWU-ARE-012 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-012.json` | `INV-L2` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-012.json` | `SWU-ARE-013` |
| <a id="swu-are-013"></a>SWU-ARE-013 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-013.json` | `INV-L2` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-013.json` | `SWU-ARE-014` |
| <a id="swu-are-014"></a>SWU-ARE-014 | `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-014.json` | `INV-INTEGRATION` + exact terminal + exact owner receipt | `projects/domainspec-v2/development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/stages/09-invoke-plan/work-pack/closeout/SWU-ARE-014.json` | `TASK-ARE-VERIFY` |

## Successor policy

The listed successor is unique and dependency-ready only after both terminal and
closeout receipts pass. A blocked or flagged receipt has no automatic successor.
After `SWU-ARE-014`, the only successor is the non-mutating verification task;
there is no automatic L3 implementation.
