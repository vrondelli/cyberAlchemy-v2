---
mode: refresh
phaseStatus: pass
mutationMode: apply-approved
handoffStatus: gated
refreshed_at: 2026-07-20
source_decision: DEC-GCP-002
target_posture: applied
---

# Invoke Refresh Report: IOLM Two-Proof Chain

## Result

The accepted `DEC-GCP-002` two-proof topology is now applied across EVF, the
private DomainSpec/IOLM integration home, the IOLM work-pack, BTE consumer
validation, and the derived architecture x-ray.

The executable core and private IOLM consumer remain independently closable.
Only the combined “executable proof used by a real application” claim requires
both exact receipts. This refresh did not start a Task Session, select either
new consumer SWU, implement a predicate or consumer adapter, execute tests, or
change FPR, authority, release, production, or publication state.

## Applied Proof Topology

```text
Lane A — executable core, independently closable
  DEC-GCP-001
    -> SWU-GCP-001
    -> graph/obligation/TestCase/binding/evaluator/receipt + negative mutation
    -> EVF core receipt

Lane B — private application consumer, independently closable
  IOLM candidate contract
    -> cross-feature support receipt
    -> SWU-IOLM-00C-B and 00C-C substrate receipts
    -> exact EVF core handle
    -> SWU-IOLM-DSC-A
    -> fresh IOLM narrow-consumer receipt

Later breadth
  SWU-BTE-008 / verify:bte:core
    -> SWU-IOLM-DSC-B fresh breadth rerun
    -> fresh Body War consumer run
    -> SWU-BTE-010 / verify:bte:consumers
    -> terminal verify:bte
```

A missing or failed IOLM receipt cannot change the upstream EVF or BTE core
verdict. The narrow `DSC-A` receipt is not eligible for the BTE breadth slot.

## Applied Changes

### EVF core package

- Recorded the accepted two-proof boundary in design, layering, plan, work-pack,
  task, decision, gap, and traceability artifacts.
- Preserved `SWU-GCP-001` as the atomic core proof and kept IOLM outside its
  exit gate.
- Distinguished the narrow IOLM receipt from the later BTE breadth rerun.

### Private DomainSpec/IOLM integration

- Added `iolm-consumer/consumer-contract.yml` as the machine handoff contract.
- Added `iolm-consumer/receipt.schema.json` as the receipt shape.
- Bound the integration manifest to separate `evf_l0_consumer` and
  `bte_breadth_consumer` slots.
- Kept Markdown explanatory; YAML/JSON are the machine sources.

### IOLM package

- Added L0D and `TASK-IOLM-DOMAINSPEC-EVIDENCE-CONSUMER`.
- Added `SWU-IOLM-DSC-A` for one exact EVF handle and `SWU-IOLM-DSC-B` for the
  later 13-kind/16-signature BTE rerun.
- Added W0D, task/gap/decision/traceability ownership, operations, architecture,
  Distill, execution, and Dispatch coverage.
- The work-pack now contains ten tasks, eighteen SWUs, and seven routed waves.
  Both new consumer SWUs remain unselected.

### BTE and derived x-ray

- Bound `SWU-BTE-010` to the versioned contract and fresh `DSC-B` receipt; it
  explicitly rejects `DSC-A` as wrong-stage evidence.
- Refreshed the x-ray lane model, result, and HTML to show the accepted sibling
  consumer proof without hiding the still-missing runtime evidence.

## Rebase Against Newer Target State

Four IOLM sources advanced after the original proposal. The operator had
selected the upstream-support option for 00C-B, and a separate BTE refresh later
reconciled the contradictory readiness order. The apply preserved those newer
facts: the decision and BTE planning contradiction are resolved, while the
actual cross-feature-support receipt remains absent. That missing receipt blocks
only IOLM substrate-dependent work, not the EVF core lane.

## Typed Refresh Signals

| Signal | Type | Applied consequence |
|---|---|---|
| `RS-GCP-IOLM-001` | `blocker_resolved` | `DEC-GCP-002` accepted the two-proof role. |
| `RS-GCP-IOLM-002` | `route_changed` | EVF core and IOLM consumer receipts close independently. |
| `RS-GCP-IOLM-003` | `artifact_drift` | IOLM now has an owning task and two exact consumer SWUs. |
| `RS-GCP-IOLM-004` | `evidence_added` | YAML contract and JSON receipt schema now define the machine boundary. |
| `RS-GCP-IOLM-005` | `route_changed` | Narrow EVF and BTE breadth consumption are separate fresh runs. |
| `RS-GCP-IOLM-006` | `no_op` | BTE core-first ordering remains unchanged. |
| `RS-GCP-IOLM-007` | `artifact_drift` | BTE now requires the concrete `DSC-B` breadth handle. |
| `RS-GCP-IOLM-008` | `evidence_added` | The x-ray now projects the accepted sibling consumer branch. |
| `RS-GCP-IOLM-009` | `no_op` | Candidate, `G-DSV2-SG`, FPR, release, production, and public boundaries remain unchanged. |
| `RS-GCP-IOLM-010` | `blocker_resolved` | The 00C-B route decision and BTE readiness contradiction are resolved; only the upstream support receipt remains missing. |

## Blockers By Lifecycle Scope

| ID | Scope | State | Effect |
|---|---|---|---|
| `GCP-B-005` / `DEC-GCP-001` | target-lifecycle | open | Blocks the executable EVF core assertion and receipt. |
| `B-IOLM-CROSS-FEATURE` | target-lifecycle | open | Blocks 00C-B/C and therefore DSC-A/B, but not the EVF core. |
| `IOLM-DSC-IMPLEMENTATION` | target-lifecycle | deferred | The consumer adapter, checks, and fresh runs do not exist yet. |
| `BTE-CORE-IMPLEMENTATION` | target-lifecycle | deferred | DSC-B waits for green `verify:bte:core`. |
| `CONSUMER-INDEPENDENT-VERIFY` | audit | deferred | Every fresh consumer receipt still requires independent validation. |

Apply-authorization blockers: `0`. Refresh-authoring blockers: `0`.

## Validation

- IOLM consumer YAML and integrated manifest parse: `PASS`.
- Receipt JSON Schema parses and passes its Draft 2020-12 metaschema check:
  `PASS`.
- IOLM Dispatch JSON and refresh Dispatch JSON parse and validate: `PASS`.
- X-ray library and example validation, using explicit canonical schema/library
  paths because the generated skill copy omits them: `PASS`.
- Required artifact paths and task/wave links: `PASS`.
- Apply receipt freezes 34 target postimages:
  [apply-receipt.json](apply-receipt.json).
- Scoped `git diff --check`: `PASS`.
- Invoke observation recorded at central ledger line `257`; the
  `severe-gap` / `reflect-now` signal is caused by the still-missing EVF formal
  predicate and IOLM support receipt, not by refresh output-contract drift.
- No Task Session, runtime execution, new receipt, authority change, or public
  mutation occurred.

## Next Route

The lanes can proceed independently:

1. Core lane: resolve `DEC-GCP-001`, then resume exactly `SWU-GCP-001` through
   Task Session to produce positive and causal-negative receipts.
2. IOLM substrate lane: execute the independently accepted BTE predecessor chain
   through separately authorized Task Sessions until the cross-feature-support
   receipt exists; then resume 00C-B and later 00C-C.
3. Narrow consumer: only after both the candidate-substrate handle and exact EVF
   core receipt exist, select `SWU-IOLM-DSC-A` in its own Task Session.
4. Breadth consumer: only after green BTE core and a separate selection, run
   `SWU-IOLM-DSC-B`; return that fresh handle to `SWU-BTE-010`.
