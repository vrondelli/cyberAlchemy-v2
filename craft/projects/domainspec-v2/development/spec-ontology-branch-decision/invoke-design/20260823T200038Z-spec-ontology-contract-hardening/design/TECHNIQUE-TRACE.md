# Invoke Design Technique Trace

| Technique | Trigger and inspected state | Emitted output | Validation/readiness effect |
| --- | --- | --- | --- |
| `sequence` | Context, template, authoring, selection, Distill, and parent review are ordered dependencies | validated dispatch plus artifact order | blocks out-of-order claim expansion |
| `delegation_boundary` | private protected context is delegated to one helper | exact helper read/write/forbidden scopes | parent retains final claims and Balancer role |
| `owner_boundary_check` | Rondelli holds many proposed roles and Victor is verifier-only | role schemas, OAR slices, non-scopes | blocks role collapse and semantic verifier effects |
| `concrete_path_evidence` | all Design inputs must be exact and current | context index and package manifest hashes | stale or missing inputs block |
| `artifact_contract_bridge` | prose decisions need machine-exact candidate shapes | seven JSON Schemas and candidate instances | establishes authored contract shape only |
| `validation_loop` | closed scope and total selection require an immutable second pass | denominator plus identical pass digests | enables `design-validator-pass` only if parent confirms |
| `residue_ledger` | authentication, V1 implementation, V2 receipts, and owner admission are absent | risks/gaps and transport | prevents false Plan/admission claims |
| `observability_grouping` | Invoke and Distill child evidence need one run lineage | run-local prepared observability envelope | no authority or readiness effect |

Full dispatch required: yes, because the route delegates work, crosses
capabilities, and carries protected private context.

Dispatch validation before helper spawn: parent-reported `pass`; the dispatch
document is outside this helper's write scope and remains parent-owned.

Obvious but skipped: `frame_handoff` and `handle_handoff` are unnecessary
because the validated dispatch already binds the exact run-local route;
`authority_split_gate` is represented by the selected `owner_boundary_check`
and protected package gates. No technique authorizes execution.
