# Gap ledger

| ID | State | Evidence or required resolution |
| --- | --- | --- |
| PLAN-BLOCK-001 | resolved | `prerequisites/PLAN-ARTIFACT-BOUNDARY-REPAIR-RECEIPT.json` validates the packaged Plan artifact-boundary contract. |
| PLAN-BLOCK-002 | resolved | Owner selected EVF target paths, namespace, immutable-v1 compatibility, and the scoped manifest registry. |
| PLAN-BLOCK-003 | resolved | Owner selected the EVF evidence-chain lifecycle owner and preserved the relationship-validation semantic owner. |
| PLAN-BLOCK-004 | resolved-in-plan | Exact target paths, absent baselines, typed validation commands, execution receipts, closeout receipts, and successor order are frozen in `machine/PLAN-EVIDENCE.json` and `machine/AUDIT-CONFIG.json`. |
| PLAN-BLOCK-005 | resolved | Byte-current Work Pack Readiness and proof-only Implementation Readiness pass; the receipts remain non-reusable for execution and mutation-ready false. |
| PLAN-BLOCK-006 | blocked-dependent | Final digest-bound implementation acceptance remains required, but no acceptance request may be emitted until PLAN-BLOCK-008 closes. |
| PLAN-BLOCK-007 | resolved | The authorized canonical repair admits a nonempty fully typed homogeneous owner frontier, preserves fail-closed owner/schema matching, passes independent review and 12/12 broad integration tests, and has exact canonical/generated parity. |
| PLAN-BLOCK-008 | open | The exact nine-file EVF candidate postimage package, complete consumer validation, frozen preacceptance graph, and independent graph review are absent. Request-emission eligibility therefore remains blocked. |

## Current stop

The immediate route is bounded preacceptance candidate authoring: materialize the nine EVF postimages only in the staged candidate surface, run every declared consumer and hostile probe, freeze the exact graph, and obtain independent graph review. Until that evidence exists, no implementation-acceptance request, `SWU-CCE-002` selection, canonical EVF contract write, or execution authority is permitted.
