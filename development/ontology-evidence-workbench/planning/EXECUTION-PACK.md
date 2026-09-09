# Execution Pack

## Choreography

```text
W0 / L0
  SWU-001 source admission
  -> SWU-002 node projection
  -> SWU-003 relation/sidecar projection
  -> SWU-004 create-only adapter receipt/determinism
  -> SWU-005 pinned upstream build
  -> SWU-006 native viewer + Poker/local-boundary proof
  -> G-OEW-L0

W1 / L1
  SWU-006P isolated toolchain/materializer + fixture-patch verification [PASS]
  -> SWU-007 exact sidecar/receipt UI store [PASS]
  -> SWU-008F complete Poker evidence-review UI source
  -> SWU-013B final clean build + independent build verification
  -> SWU-014 browser/a11y producer receipt
  -> SWU-014V independent acceptance verification
  -> G-OEW-L1

W2 / L2 (explicit scope approval required)
  SWU-015 scoped UA graph intake receipt
  -> SWU-016 explicit evidence-code mapping
  -> SWU-017 separate code-context UI lane + non-interference
  -> G-OEW-L2

W3 / L3
  SWU-018 upstream update compatibility verifier
  -> SWU-019 measured performance/large-graph hardening
  -> SWU-020 local package artifact
  -> TASK-OEW-VERIFY closure
  -> G-OEW-L3
```

## Execution Rule

One selected SWU per Task Session. Later eligibility is derived only from
passing predecessor receipts. Task completion never auto-selects a successor.
The historical 007, consumed 006B, and blocked 008 selections are invalid for
this changed graph. Superseded 008–013 component records are planning history,
not executable selectors.

## Parallelization

No mutation parallelism is planned:

- several UI SWUs touch the shared upstream overlay entrypoint/store;
- adapter outputs and receipts have strict dependency order;
- L2 must consume the exact L1 evidence-only baseline;
- minimizing merge/receipt ambiguity is worth more than speculative latency.

Read-only audits may run concurrently only if their receipts are independently
joined by the active Task Session and they write no shared evidence.

## Handoff Result Shape

```yaml
swu_id: SWU-OEW-NNN
result: pass | flag | block | interrupted
capability_ref: task-session
receipt_kind: native-stage | local-fallback | blocked
receipt_artifact: <path or none>
files_touched: []
validation: []
blockers: []
residue: []
reroute: <next eligible unit or none>
handoff_note: <what the coordinator needs>
```

## Stop Conditions

- missing/ambiguous selected SWU;
- baseline or Design digest drift;
- write target outside exact inventory;
- protected-source drift;
- authority effect other than `none`;
- upstream pin/license drift;
- external model/network action without the SWU's explicit human approval;
- browser/manual evidence inflated beyond its receipt;
- undeclared network/cache mode, workspace fallback, tool/lock drift, patch
  drift/reapplication, or retained workroot residue;
- browser server reuse, non-owned process termination, missing PID/port ledger,
  occupied port after teardown, or producer self-acceptance;
- failure to produce the expected owner receipt.

## Current Handoff

No SWU is selected. The unique dependency-ready candidate is
`SWU-OEW-008F`. After `G-OEW-L1-FIRST-WORKING-VERSION-SELECTION`, Task Session
must perform a fresh preflight against the frontier-readiness receipt. This
Invoke Refresh does not authorize implementation.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
