---
artifact_id: CDSC-GAPS-v0.1
status: planning-baseline
---

# Gap Ledger

| ID | Gap | Severity | Owner | Repair path | Blocks first SWU? |
| --- | --- | --- | --- | --- | --- |
| `GAP-CDSC-001` | Source content digests and selectors are frozen in generation 1. | resolved | SWU-CDSC-001 | accepted fixture manifest | no |
| `GAP-CDSC-002` | Fixture-specific `A`, `Q`, `S`, `D`, and `U` values are frozen in reviewed receipts. | resolved | SWU-CDSC-003..005 | accepted immutable receipts | no |
| `GAP-CDSC-003` | Independent evaluator replay agrees with generation 1. | resolved | SWU-CDSC-007 | accepted replay and audit | no |
| `GAP-CDSC-004` | Portability beyond three fixtures is untested. | expected | later research owner | route only after a calibration pass | no |
| `GAP-CDSC-005` | Page/Layout architecture-pattern pressure remains unreplicated. | expected | later architecture-pattern research | preserve as residue; no promotion | no |

All gaps are experiment evidence gaps, not Invoke-authoring blockers.
