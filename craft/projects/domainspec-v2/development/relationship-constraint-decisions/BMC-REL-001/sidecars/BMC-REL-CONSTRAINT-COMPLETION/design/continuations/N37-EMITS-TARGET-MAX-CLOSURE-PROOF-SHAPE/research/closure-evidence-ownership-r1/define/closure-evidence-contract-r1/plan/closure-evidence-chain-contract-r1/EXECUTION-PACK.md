# Execution Pack: closure-evidence-chain-contract-r1

Status: proof-only execution candidate; exact acceptance and unit selection are pending.

| Wave | Layer | Units | Purpose | Entry condition | Exit evidence |
| --- | --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0.md) | L0 | none | Bind resolved placement/lifecycle prerequisite | Owner A receipt exact | Immutable prerequisite binding |
| [W1](work-pack/waves/W1.md) | L1 | SWU-CCE-002, SWU-CCE-003 | Materialize envelope then receipt | Final candidate accepted; unit selected through fresh Task Session | Per-unit terminal and Invoke closeout receipts |
| [W2](work-pack/waves/W2.md) | L2 | SWU-CCE-004, SWU-CCE-005 | Materialize manifest then validate complete chain | W1 joined closeouts | Manifest and validator terminal/closeout receipts |
| [W3](work-pack/waves/W3.md) | L2 | closure-only | Audit final Plan bytes and prepare acceptance | Plan generation and preacceptance closure complete | WPRA/readiness and one exact owner request |

Scheduling is descriptive. `machine/EXECUTION-ENTRY.json` controls the candidate routes. Its state is `selection-ready`, not `task-ready`; no selected unit, mutation admission, successor execution, publication, release, or deployment is implied.
