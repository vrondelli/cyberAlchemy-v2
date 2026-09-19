# Auth remote-staging ORODI DAG

```mermaid
flowchart TD
  Z0[Reconcile ORODI dependency and fail-closed validator] --> S0[Seal predecessors]
  S0 --> B0[Bind profile and owner decisions]
  S0 --> P0[Assess product-byte gaps]
  B0 --> X0[Remote isolated experimental rehearsal]
  P0 --> X0
  X0 --> XSTOP[Retain typed rehearsal evidence only]
  P0 -->|no product change| G0{Deployable product}
  P0 -->|product change| P1[Build successor and rerun affected V3 routes]
  P1 --> G0
  B0 --> P1
  B0 --> O0[Bind remote environment and effect envelope]
  G0 --> O1[Build exact artifact and provenance]
  B0 --> B1[Close exact evaluation binding]
  O0 --> B1
  O1 --> B1
  B1 --> G1{Effect authorization gate}
  G0 --> O2[Materialize isolated staging]
  G1 --> O2
  O1 --> O2
  B1 --> O2
  O2 --> O3[Admit observers, retention, and redaction]
  O3 --> G2{Observation gate}
  G2 --> O4[Observe stable baseline]
  O4 --> O5[Deploy 5% candidate canary]
  O5 --> C1[Live Auth correctness replay]
  O5 --> C2[Candidate-only fault and recovery]
  O5 --> C3[Load, burst, and soak]
  O5 --> C4[Telemetry conservation and alerts]
  O5 --> C5[Isolated backup restore]
  C1 --> O6[Ordered rollback]
  C2 --> O6
  C3 --> O6
  C4 --> O6
  C5 --> O6
  O6 --> O7[Independent restoration and residual-state check]
  O7 --> E0[Seal complete evidence ledger]
  E0 --> R0[Independent technical replay]
  R0 --> G3{Remote-staging verdict}
  G3 -->|all required passed| G4[Prepare no-effect production-canary decision package]
  G3 -->|otherwise| STOP[Retain typed failure and stop]
```

## Execution waves

| Wave | Nodes that may run in parallel | Join |
| --- | --- | --- |
| 0 | `Z0`, then `S0` | current ORODI dependency and predecessor seal |
| 1 | `B0`, `P0` | owner profile and product-gap assessment |
| 2 | conditional `P1`; `O0` after B0; optional lower-claim `X0` | `G0`, environment/effect envelope; `X0` cannot satisfy them |
| 3 | `O1`, then `B1`; `G1` | exact binding and authorized artifact identity |
| 4 | `O2`, `O3` | `G2` |
| 5 | `O4`, then `O5` | live canary established |
| 6 | `C1`, `C2`, `C3`, `C4`, `C5` | all campaign states recorded |
| 7 | `O6`, `O7`, `E0`, `R0` | `G3` |
| 8 | `G4` or `STOP` | no production effect |

## Open Questions

See [PLAN.md](PLAN.md#open-questions).

`authority_effect: none`
