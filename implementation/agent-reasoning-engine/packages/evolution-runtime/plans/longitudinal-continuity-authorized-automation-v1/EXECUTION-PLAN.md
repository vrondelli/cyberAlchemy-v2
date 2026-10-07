# Reviewed Construction and Benchmark Plan

Status: candidate plan; Goals registration remains blocked  
Authority effect: none

## Outcome

Produce a reproducible first result for the linked continuity and authorized
automation program without activating a cycle definition or performing a live
external effect. A clear first result means:

1. the 48-case `IL-LPC-01` fixed replay has exact baseline and candidate scores;
2. all protected failure counts are reported, including zero counts;
3. injected restart reconstruction has digest parity;
4. the result states whether the candidate clears the fixed-replay portion of
   the frozen settlement contract; and
5. `EI-AA-01` has a frozen 48-case baseline and controller qualification, but
   treatment execution remains gated by the exact Cycle 1 handoff.

This is a first empirical milestone, not full cycle settlement. The prospective
20-episode/workflow cohorts, independent reproduction, and live GLM/VPS canary
remain required for final settlement.

## Product-construction lane

| Stage | Work | Completion evidence |
| --- | --- | --- |
| P1 | Bind predecessor IL-H04 evidence and freeze fixture oracles | Exact digests and provenance manifest |
| P2 | Implement typed longitudinal preference events and derived projection | Closed contracts plus unit tests for revise, revoke, suspend, exception, freshness, and recovery |
| P3 | Implement the closed automation controller and typed standing grant | Unit tests for `execute`, `ask`, `abstain`, `stop`, relation scope, environment ceiling, revocation, and recovery |
| P4 | Implement 48 continuity and 48 automation fixed scenarios | Frozen fixture digest and deterministic scorers |
| P5 | Bind all task validator references used by the first milestone | Missing or mismatched evidence fails closed |
| P6 | Execute the Cycle 1 replay and adversarial frontier through the construction-only coordinator | Durable receipts, metric result, restart and SQLite-loss parity |
| P7 | Execute Cycle 2 freeze, baseline, and controller qualification in parallel | Durable receipts and baseline result; no handoff acceptance |
| P8 | Review implementation and result integrity | Test report, source diff review, claim-ceiling review |

## First-run hypotheses

- `LPC-H1`: typed scope layers plus explicit revise/revoke/suspend precedence
  increase longitudinal continuity success by at least 0.15 over the frozen
  current-ARE policy on the 48 fixed cases, with no protected failure.
- `LPC-H2`: append-only events reconstruct the same preference projection after
  restart and index loss.
- `AA-H1`: the closed controller reduces unnecessary approval/clarification on
  the 48 fixed automation cases by at least 0.20 while producing zero invalid
  grant reuse, revoked-grant use, unauthorized action, duplicate effect, or
  false completion.

`AA-H1` may be measured as a controller qualification, but it cannot become a
linked treatment result until Cycle 2 accepts the exact supported Cycle 1
handoff.

## Execution graph

```text
predecessor + oracle freeze
       |
       +--> preference projection --> IL fixed replay --> IL adversarial/recovery
       |                                      |
       |                                      +--> first result
       |
       +--> automation baseline --> controller qualification --> wait for handoff
```

Only the currently knowable frontier is materialized. A later prospective run
is a new receipted epoch, not an implicit continuation of this fixed replay.

## Operational-support lane

| Task | Owner | Affected stage | Causal blocker now? |
| --- | --- | --- | --- |
| Keep the VPS runtime and GLM gateway available | Local operator | prospective run | No |
| Enable an exact VPS launch configuration | Cycle operator | prospective dispatch | No; current config remains disabled |
| Supply the existing secret reference inside the VPS gateway | VPS operator | prospective dispatch | No |
| Independently label the 20 prospective cases | Independent evaluator | final settlement | No |
| Issue a typed standing grant for any real-effect canary | User | live automation canary | No |

## Verification

- New focused tests must pass.
- The complete evolution-runtime suite must pass.
- Both generic cycle definitions must remain disabled in the production-default
  kernel.
- Evidence must exclude raw reasoning, raw conversation text, tool payloads,
  credentials, and environment dumps.
- The benchmark runner must reproduce byte-identical result digests on a second
  execution with the same fixture and implementation digests.

## Stop conditions

Stop and preserve counterevidence if a protected failure occurs, reconstruction
changes state, fixtures or scorer are not frozen before execution, or a result
would require a live effect not covered by an exact typed grant.

## Deferred residue

- Prospective GLM/VPS validation.
- Independent evaluator reproduction.
- Cycle 1 settlement and continuity-contract handoff.
- Cycle 2 linked treatment, sandbox, and canary.
- Any controlled-upgrade or serving activation.

## Open Questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
