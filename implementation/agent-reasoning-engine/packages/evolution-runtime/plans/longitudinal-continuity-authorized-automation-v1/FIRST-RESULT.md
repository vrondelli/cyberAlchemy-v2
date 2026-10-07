# First Fixed-Replay Result

Status: qualified bounded milestone  
Authority effect: none  
Result digest: `1f5f921e89a9642e3715828190fcea4d521d3ce9d5afbda7cb454ec3949037fe`  
Run receipt: `de978c946a6bf19a2f6972c96e4ca0d1f3ac8c60688507be7980ae2c3b966251`

## Result

| Cycle | Baseline | Candidate | Improvement | Protected failures | Disposition |
| --- | ---: | ---: | ---: | ---: | --- |
| Longitudinal preference continuity | 24/48 (50%) | 48/48 (100%) | +50 points | 0 | fixed-replay-qualified |
| Authorized automation completion | 0/48 (0%) | 48/48 (100%) | +100 points | 0 | controller-qualified; awaiting continuity handoff |

The automation candidate also matched the expected controller decision in all
48 scenarios, versus 20/48 for the per-action-approval baseline. Its outcomes
were balanced across 12 `execute`, 12 `ask`, 12 `abstain`, and 12 `stop`
scenarios. Unnecessary approval on authorized cases fell from 100% to 0%.

The continuity candidate passed all six eight-case families: explicit revision,
explicit revocation, objective boundary, same-scope recall, scoped exception,
and temporal or ambiguous evidence. Restart and index-loss reconstruction
produced the same derived projection.

## What this establishes

- Typed scope, time, revision, revocation, exception, and ambiguity rules solve
  the frozen continuity cases that the legacy interaction-scope baseline misses.
- A typed standing-grant controller can distinguish execution, clarification,
  abstention, and stopping on the frozen automation cases.
- Both results can be reconstructed deterministically through the existing ARE
  durable kernel and coordinator.

## What this does not establish

This does not settle either evolution cycle. It does not measure live user
interactions, independent evaluator labels, cross-thread product behavior,
VPS/GLM execution, or real external effects. The automation score is controller
qualification only; it is not a linked treatment result until Cycle 1 produces
and Cycle 2 accepts the exact supported continuity handoff.

## Next frontiers

1. `cycle:il-lpc-01`: `lpc.shadow-revise`; the first shadow cohort was
   rejected because it contained no resolver-discriminating longitudinal
   boundary. See [SHADOW-RESULT.md](SHADOW-RESULT.md).
2. `cycle:ei-aa-01`: wait at `aa.accept-handoff` for the typed supported Cycle 1
   handoff.
3. Collect the predeclared stratified prospective shadow cohort, then run the
   separately receipted canary only after shadow support. VPS/GLM work is owned
   by a different thread and is outside this program frontier.

## Evidence

Machine-readable artifacts are under
`../../evidence/longitudinal-continuity-authorized-automation-v1/fixed-replay-v1/`.
The run receipt binds 14 artifacts by SHA-256 and records activation as `none`.

## Open Questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
