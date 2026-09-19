# Dispatch Technique Trace

Full dispatch: `DISPATCH.json`; deterministic validation: `DISPATCH-VALIDATION.json`.

| Technique | Activation trigger | Affected phase/artifact | Validation expectation |
| --- | --- | --- | --- |
| `sequence` | context, selection, Design, Distill, and validation have ordered dependencies | all run artifacts | every non-first phase consumes an explicit prior artifact/receipt |
| `delegation_boundary` | user authorized route 2 through one bounded helper | helper receipt and write scope | helper writes only this run root; parent owns join/final claims |
| `owner_boundary_check` | EVF, factory, provider, adapter, and primary-owner surfaces differ | architecture, source contracts, risks | no artifact assigns people or transfers lifecycle/promotion authority |
| `artifact_contract_bridge` | adapter must join owner-held contracts without schema equivalence assumptions | source contracts, architecture, planned witnesses | each translation names source/target identities and typed failure |
| `concrete_path_evidence` | Design claims must bind actual current sources | context, inventory, manifest | every selected source has an exact path and digest |
| `validation_loop` | closed denominator and total two-pass selection are mandatory | manifest, denominator, selection, final validation | schemas, digests, owners, dispositions, fixed point, and exact files pass |
| `residue_ledger` | exact schemas, assignees, provider runtime, and current invocation remain absent | decisions/risks, Distill, result | each residue has an owner gate or deferred route |
| `state_namespace_boundary` | private run-local Design must not mutate product, authority, Arcanum, telemetry, or Git | dispatch boundaries and validation | changed files remain exactly under this run root |
| `execution_receipt_handoff` | parent must receive a bounded helper result | `HELPER-RECEIPT.json` | receipt names artifacts, validation, blockers, residue, and authority ceiling |

Skipped techniques:

- `tournament`: the accepted decision already compared and selected topology B.
- `route_menu`: no unresolved route choice remains in this Design scope.
- `scu_swu_reduction`: no SWU may be authored in Design; Distill instead selects the smallest coherent Design unit.
- `observability_grouping`: considered, but telemetry writes are forbidden; dispatch/run IDs remain in run-local artifacts only.
- `approval_semantics_map`: owner gates are named, but no acceptance request or approval receipt is emitted by this helper.
