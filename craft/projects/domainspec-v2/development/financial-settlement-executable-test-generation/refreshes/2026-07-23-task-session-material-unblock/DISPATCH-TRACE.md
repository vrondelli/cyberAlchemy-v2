# Dispatch Technique Trace

The refresh is a two-owner sequence: Invoke materializes and validates exact
post-images, then returns a receipt-bound handoff to Task Session. No subagents
or external runtime are used.

| Technique | Applied To | Effect | Validation |
| --- | --- | --- | --- |
| `sequence` | Materialization then Task Session return | Prevents execution before producer validation. | Dispatch dependencies and gates validate. |
| `artifact_contract_bridge` | Material package and receipt | Binds staged outputs to the Invoke schemas. | Producer validator must pass. |
| `execution_receipt_handoff` | Invoke to Task Session | Makes the consumer re-read exact package and receipt identities. | Task Session admission remains mandatory. |
| `owner_boundary_check` | Cross-capability route | Invoke stages outputs; Task Session applies and validates them. | Boundary evidence blocks ownership collapse. |
| `concrete_path_evidence` | Three write targets and context controls | Eliminates globs and ambient scope. | Digests and sizes are validated. |
| `validation_loop` | Producer and handoff resolvers | Rejects stale or mismatched material before return. | Both deterministic scripts must pass. |
| `residue_ledger` | Prior blocker and downstream execution | Preserves that no implementation is applied or complete yet. | Refresh report retains the Task Session route. |

Full dispatch:
[`EXECUTION-DISPATCH.json`](EXECUTION-DISPATCH.json).
