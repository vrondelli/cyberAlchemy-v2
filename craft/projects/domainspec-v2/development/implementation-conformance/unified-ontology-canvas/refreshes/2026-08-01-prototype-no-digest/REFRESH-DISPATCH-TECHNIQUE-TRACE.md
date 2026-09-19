# Invoke Refresh Dispatch Technique Trace

No full dispatch JSON is required: this is one direct-user Invoke owner route
followed by one explicitly requested Task Session owner route, with no delegated
execution graph.

| Technique | Trigger | Affected phase/artifact | Validation expectation |
| --- | --- | --- | --- |
| `sequence` | Refresh must precede execution. | Refresh material package -> selected 004P task -> Task Session. | Task Session reads only the applied, validated Refresh frontier. |
| `owner_boundary_check` | Invoke authors planning; Task Session owns product mutation. | Refresh target inventory and 004P product write scope. | No product file changes during Refresh; no planning mutation directly inside Task Session. |
| `artifact_contract_bridge` | The user decision changes the executable prototype contract. | SPEC, ARCHITECTURE, Work Pack, task, and closeout inventory. | Every target is present in the material package and validated after apply. |
| `concrete_path_evidence` | Historical 004 BLOCK must remain auditable. | Source signal and 004P source anchors. | Paths exist; 004 task/result/receipt remain unchanged. |
| `residue_ledger` | Checksums and Node server are deferred, not silently deleted as requirements forever. | Prototype evidence boundary and claim ceiling. | Deferred integrity/server work is named without becoming a selected task. |
| `execution_receipt_handoff` | Task Session and Refresh have different owners. | 004P result and later closeout receipt. | One terminal Task Session result and one joined Invoke Refresh receipt are required. |

Skipped techniques:

- `scu_swu_reduction`: already expressed by the new 004P task and its split
  analysis; a separate Distill run is not required for this narrow Refresh.
- `validation_loop`: owned by 004P Task Session; Refresh validates only planning
  material and does not execute product checks.
- `observability_grouping`: no multi-agent dispatch or reusable composition
  graph is created.
