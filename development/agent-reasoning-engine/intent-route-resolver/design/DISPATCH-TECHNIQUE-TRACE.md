# Design Dispatch Spec technique trace

| Technique | Applied to | Readiness effect |
|---|---|---|
| `sequence` | projection -> resolve -> display/clarify -> host decision -> owner execution | prevents early execution |
| `x_ray` | resolver/host/Augmentor/Arcanum seams | exposes duplicate-owner risks |
| `artifact_contract_bridge` | `IntentRecord` into `RouteRequest@1` | preserves upstream meaning |
| `authority_split_gate` | disposition versus decision/approval/effect | requires `authority_effect: none` |
| `state_namespace_boundary` | request, disposition, host decision, run | forbids state collapse |
| `validation_loop` | planned fixtures and design validator | blocks Plan without fixed-point selection |
| `residue_ledger` | projection quality and live catalog compiler | keeps deferred claims visible |

The design route is sequential and single-owner. No governed multi-agent
dispatch is required.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
