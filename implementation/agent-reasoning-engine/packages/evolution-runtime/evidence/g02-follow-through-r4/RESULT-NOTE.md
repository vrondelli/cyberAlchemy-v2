# G02 follow-through R4 exposed development screen

Status: task 3 failed the predeclared quality gate on 2026-09-26; task 2 was
not dispatched. [Manifest](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-follow-through-r4/RUN-MANIFEST.json).

The valid native export used **16 model calls and 49,188 tokens**. Native
Span-F1 was **0.3478655393** and File-F1 **0.6666666667**, below the fixed
task-3 requirements of 0.5125361243 and 0.8 respectively. All model usage
was known, no retry occurred, and the token ceiling held.

The terminal-review prompt was actually exposed in one recorded provider
request. The proposed conditional checkpoint, inherited from R3, was **not**
exposed in either run; live history projection prevented its trigger. The final selection included an adjacent test source, but excluded
another relevant implementation file. This distinguishes exposure from
success: a generic test-evidence nudge is insufficient, and the R3/R4 score
difference is not a controlled causal estimate because model trajectories
varied from their first calls. Neither candidate authorizes task 2 under its
declared sequence rule.

The [generation receipts](generation-receipts-v1.tar.gz) preserve the exact
overlay, manifest, source session and full run (SHA-256
`ce903e7f2049032be1b50c66063f639b44808cd213a2ffa6933e2115bba78353`).
Separate native [score](task3-score/native-score.json) and
[screen](task3-score/screen.json) are local. Original generation evidence
remains at `/opt/are-benchmark-runs/g02-follow-through-r4/` on the VPS.

## Open Questions

Can a source-evidence coverage rule improve joint recall and precision across
the two G02 tasks without overfitting these exposed tasks? A new hypothesis
must be declared and screened; do not treat either result as untouched
confirmation.
