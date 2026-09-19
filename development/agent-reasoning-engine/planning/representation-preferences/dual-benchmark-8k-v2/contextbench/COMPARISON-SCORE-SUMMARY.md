# Three-arm native score summary

Status: six offline decision tests pass; independent review and isolated scorer integration pending. No native evaluation or provider calls occurred.

[comparison-score-summary.mjs](comparison-score-summary.mjs) consumes the exact fixed schedule, twelve score rows and twelve corresponding reconciliation rows. It derives Span-F1/File-F1 using the existing native metric adapter. Row order and identities must match. Missing rows and malformed valid native metrics reject.

Quality and efficiency remain separate gates. Every alternative task requires exact native span/file coverage and precision of one; rounded F1 cannot create perfection. All twelve score rows must be valid. Mean scores retain the fixed four-task denominator per arm, with invalid rows contributing zero to the displayed means.

Efficiency requires complete matched accounting, returned/reconciled attempts, bounded model calls/tokens, verified <=8K request records, long trajectories (more than one model call and >8K cumulative tokens in each arm), outer process settlement and post-score integrity. Relative token reductions are null if those prerequisites fail. Alternative spend must be at most 85% of each comparator, checked with integer arithmetic rather than floating-point threshold comparison.

A passing summary only marks the fixed exposed development target. benchmark_cleared and campaign_goal_achieved remain false; full scope and untouched confirmation are still pending. Native context scores are not patch-correctness verdicts.

## Verification

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-score-summary.test.mjs

Six groups test exact15% success, one-token threshold failure, savings against only one comparator, nearly-perfect task rejection, invalid/unknown/oversized/short/unsettled evidence and missing/reordered/malformed score rows. Fixtures use the actual prospective schedule but synthetic scores and accounting; no live performance claim follows.

## Open questions and next work

This pure function does not authenticate supplied reconciliation or settlement booleans. The isolated scoring adapter must reconstruct exact model-selected predictions from sealed captures/source snapshots, call the existing bounded native scorer, recheck source integrity afterward, and supply verified settlement evidence. It must not let evaluator references enter generation. Independent review, prospective experiment amendment and exact freeze remain required before live comparison. Coordinator owns integration; D:/WSL admission applies and C: is excluded. Broader confirmation and original quality/token goals remain open.
