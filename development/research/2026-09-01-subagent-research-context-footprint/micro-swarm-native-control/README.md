# Native Micro-Swarm Control Candidate

Status: unconfirmed experiment proposal candidate  
Authority effect: none  
Selected route: `CA2-ROUTE-DELEGATE`

This package prepares, but does not register or run, a falsifiable native Codex
control for the micro-swarm harness. It separates the model outputs from the
scientific verdict:

1. two sequential waves of three `gpt-5.6-luna` explorers answer the six frozen
   atomic tasks;
2. one `gpt-5.6-sol` reference runner answers the same six tasks without seeing
   Luna outputs;
3. the parent runs `score_parity.mjs` over both preserved result sets and the
   frozen control cards;
4. the criterion's mechanical rule returns `SURVIVED`, `FALSIFIED`, or
   `INVALID`.

Sol is a reference arm, not the scientific adjudicator. The proposal-stage
dispatch has three independent design roles: criterion designer, arm-
equivalence auditor, and blind validity skeptic. The seven-runner topology is
preserved in `RUN-BLUEPRINT.json` for a later `experiment/run` sheet after this
criterion has been validly proposed, confirmed, registered, executed, and
closed as `frozen`.

## Strategy summary

- P1 triggers: synthesis, context protection, isolation, and parallelism.
- Proposal wave 1: one writer validates criterion mechanics while one auditor
  independently validates equal task/source exposure.
- Proposal wave 2: one skeptic attacks falsifiability and the five-minute and
  quality-parity thresholds using only admitted wave-1 receipts.
- Deferred run wave 1: Luna explorers for `MAP-001` through `MAP-003`, parallel.
- Deferred run wave 2: Luna explorers for `MAP-004` through `MAP-006`, parallel
  after wave 1 because native Codex exposes three child slots.
- Deferred run wave 3: one Sol reference runner answers all six tasks, blind to
  Luna returns.
- Parent-only step: deterministic scoring and mechanical verdict derivation.
- Stop conditions: source-boundary breach, missing terminal output, invalid
  schema, scorer failure, or absent timing evidence makes the run `INVALID`.

## Current gates

The candidate must pass schema-v0.10.0 readiness. Its subject group also
requires two independent check-tension verdicts. Those helpers have not been
spawned: `CA2-FANOUT-SHEET.json` is the exact approval envelope for that
two-helper gate. No human dispatch confirmation has been requested, no ledger
row exists, and no model run has occurred.

## Local deterministic checks

```sh
python3 render_criterion.py --check
python3 validate_criterion.py
python3 verify_guide_equivalence.py
node test_score_parity.mjs
```

Passing these checks proves only candidate consistency and scorer behavior. It
does not prove Luna/Sol parity or completion within 300 seconds.

The non-authoritative strategy-result inventory entry is
[`inventory-strategy-result-record.json`](inventory-strategy-result-record.json).

## Raw CA2 fan-out lane

`CA2-RAW-EXPERIMENT-FANOUT-SHEET.json` provides a separate seven-helper lane
that does not depend on DomainSpec proposal preconfirmation or frozen-proposal
lineage. Its results are raw experimental observations, not governed benchmark
evidence. The repository-wide requirement for exact approval of a multi-helper
sheet remains in force.

