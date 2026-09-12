# Prototype construction mapping

Status: candidate; authority effect none. Open questions: PLAN.md.

| Concept | Product behavior | Implementation | Evidence |
| --- | --- | --- | --- |
| Bound simulation | Run exact initial/profile/engine | worker.py and contracts.schema.json | Source mismatch and bounds tests |
| Checked world transition | Preserve ownership/resources/clock | Existing InteractionWorld; verifier.py oracle | Illegal rehashed history tests |
| Verified result | Bind actions, memory, frames and traces | verifier.py | Direct equality and tampering tests |
| Execution ownership | Leases, command/fence, accepted receipt/event | Sibling world_contracts.rs and OrchestratorService | Native process integration tests |
| Replay | Read accepted immutable output without rerun | Driver replay and replay.html | Duplicate/restart tests |
| Stop | Between-tick cancellation; no uncertain retry | Worker attempt ledger and driver | Cancellation and interrupted attempt tests |

DomainSpec authored Entity and Rule nodes carry this contract and budget into a
deterministically compiled graph. They are navigation/formation scaffolds, not an
executable schema generator or admitted ontology.
