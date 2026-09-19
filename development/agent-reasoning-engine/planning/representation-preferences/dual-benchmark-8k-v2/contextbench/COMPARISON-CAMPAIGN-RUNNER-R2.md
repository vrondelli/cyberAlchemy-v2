# Comparison campaign runner R2

Status: additive correction; five orchestration tests pass. Independent R2 review pending.

[comparison-campaign-runner-r2.mjs](comparison-campaign-runner-r2.mjs) succeeds the rejected original runner. The original module/test/contract and [92-binding R1 rejection](COMPARISON-CAMPAIGN-RUNNER-REVIEW.md) remain unchanged.

The original containment test rejected any relative string starting with two dots as being outside an ancestor. A legitimate child named ..source therefore bypassed source/evidence separation. The new regression demonstrated the original runner reaching twelve synthetic executions with source_root nested beneath outcome_root.

R2 recognizes parent traversal by path components: exactly .. or the prefix .. followed by the platform separator. A descendant named ..source remains inside its parent and is rejected before admission, factory construction or execution. All five tests pass, including the original full cohort, admission denial, paid failure and post-generation metadata failure cases.

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-campaign-runner-r2.test.mjs

## Open questions and next work

The [original runner contract](COMPARISON-CAMPAIGN-RUNNER.md) owns composition and its limits. Live integration must import R2 explicitly after independent review. Exact freeze/storage callbacks, outer process settlement, twelve-outcome isolated scoring and prospective experiment amendment remain required. Coordinator owns integration/review. No provider calls or native quality/savings results follow from these tests; D:/WSL admission applies and C: is excluded.
