# Current-ARE prediction reconstruction integration

Status: one actual prepared-runner integration test passes; independent supplemental review pending. No provider/evaluator calls.

[comparison-current-prediction.test.mjs](comparison-current-prediction.test.mjs) closes the direct current-ARE coverage gap documented in the [prediction contract](COMPARISON-PREDICTION.md). It reuses the existing current-ARE scoring fixture with a fresh temporary Git repository and actual recovery-v2 prepared runner, repository tools, native recycler, guarded evidence writer and scripted transport.

The episode makes three scripted model calls: source reads, completion response and native terminal evidence selection. The new comparison reconstructor reproduces its saved native prediction exactly. Deliberately changing the prediction commit, removing the terminal packet, corrupting snapshot bytes or changing the pinned base file rejects reconstruction. Temporary source/evidence trees are removed after the test; no historical checkout was restored.

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-current-prediction.test.mjs

## Open questions and next work

All three arms now have direct prepared-runner reconstruction tests with scripted model transport. Actual isolated evaluator integration, before/after source/evidence integrity checks, outer process settlement, prospective experiment amendment and exact live freeze remain required. No correctness or savings claim follows from the scripted fixture. Coordinator owns integration and independent supplemental review; D:/WSL admission applies, C: is excluded, and broader confirmation remains open.
