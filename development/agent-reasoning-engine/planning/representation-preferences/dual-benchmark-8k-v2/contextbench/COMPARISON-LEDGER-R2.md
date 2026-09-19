# Ledger reconciliation R2

Status: additive correction, six offline tests pass; independent R2 review pending.

[comparison-ledger-r2.mjs](comparison-ledger-r2.mjs) supersedes the rejected original module for future integration. The original source, four-test suite and [R1 rejection](COMPARISON-LEDGER-REVIEW.md) remain unchanged.

Two independent counterexamples were reproduced before this correction: an index-tokenizer receipt inserted into the transport ledger bypassed family-specific counts; and a receipt/captured wire request consistently using high reasoning passed despite a low configured profile. The new test file failed both cases against the original module. R2 restricts transport ledger receipts to model/tokenizer and requires model receipt reasoning effort to equal the configured cell profile. All six tests now pass, including both binding formats and all three arms.

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-ledger-r2.test.mjs

## Open questions and construction frontier

The [original contract](COMPARISON-LEDGER.md) still defines the pure parsed-evidence scope and limits. File binding, writer/process settlement, twelve-outcome campaign integration, measured-window verification and index lifecycle reconstruction remain pending. The next caller must import R2 explicitly; no existing campaign is silently rebound. Coordinator owns integration; independent review precedes exact live freeze. No provider call, native score, accepted savings or benchmark clearance follows from these tests.
