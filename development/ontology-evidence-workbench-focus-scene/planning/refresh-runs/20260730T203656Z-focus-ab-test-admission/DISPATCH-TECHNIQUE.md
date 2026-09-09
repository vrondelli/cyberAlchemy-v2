# Invoke Refresh Dispatch Technique Trace

Full dispatch document: not required. This is one local sequential owner route
with one read-only audit helper, not a reusable multi-agent composition.

| Technique | Effect on this refresh | Validation |
| --- | --- | --- |
| `sequence` | Resolve notice, validate material package, apply three refresh targets, then hand off one selected SWU to Task Session. | Later steps consume the prior receipt. |
| `handle_handoff` | Consume `HN-75D3CBED57D2`, FOCUS-002 receipt, build handle, and browser receipt by path and digest. | All handles resolve and their digests are recorded. |
| `owner_boundary_check` | Invoke owns planning/runner materialization; Task Session owns the browser execution outputs. | Material and execution-output sets are disjoint. |
| `artifact_contract_bridge` | Bind the runner contract to exact PNG/JSON outputs and Task Session evidence. | Material and admission validators pass. |
| `validation_loop` | Run schema checks, live browser assertions, artifact checks, protected hashes, and cleanup checks. | Every acceptance-critical obligation passes. |
| `concrete_path_evidence` | Use exact repository paths and one fixed UTC attempt ID. | No globs or placeholder output paths enter admission. |
| `residue_ledger` | Preserve the novice study as pending rather than converting automation into comprehension evidence. | Terminal report keeps the human verdict pending. |

Observability grouping: the refresh run ID is
`20260730T203656Z-focus-ab-test-admission`; the Task Session ID is separately
recorded in its receipt.

