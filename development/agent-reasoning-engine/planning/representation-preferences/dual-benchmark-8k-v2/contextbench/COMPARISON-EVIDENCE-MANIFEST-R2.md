# Campaign evidence reconciliation R2

Status: additive correction; five integration tests pass. Independent R2 review pending.

[comparison-evidence-manifest-r2.mjs](comparison-evidence-manifest-r2.mjs) supersedes the rejected campaign reconciler. Original R1 source, tests, contract and [83-binding rejection](COMPARISON-EVIDENCE-MANIFEST-REVIEW.md) remain unchanged.

R1 could mark all_run_evidence_reconciled true when a coherently pinned usage summary reported 230 tokens but the ledger reported 120. The raw-accounting component correctly retained 230 and marked accounting incomplete, but its disposition was not used in the success decision. The new regression reproduced this before the fix.

R2 requires raw accounting to be complete and provider-healthy before a row becomes reconciled. Known lower bound, conservative total, input/output totals and model receipt count must equal durable reconciliation. A conflict leaves the row as reconciliation-failed with original raw costs; it does not normalize the higher witness down to ledger spend.

Five tests now pass. The added group exercises a contradictory usage summary, hidden unknown count, explicit unknown-usage flag and unresolved phase reservation. Each retains twelve rows and blocks all-run reconciliation; the 230-token witness remains visible. No provider calls or benchmark scores occurred.

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-evidence-manifest-r2.test.mjs

## Open questions and next work

The [original component contract](COMPARISON-EVIDENCE-MANIFEST.md) owns manifest pinning, fixed run paths and remaining production/file/process assumptions. Production wiring must explicitly import R2, collect/persist exact pins and configured identities, and prove outer process settlement before isolated scoring. Prospective experiment amendment and exact execution freeze remain required. Coordinator owns integration and independent review. D:/WSL admission applies, C: is excluded, and full quality/token goals and untouched confirmation remain open.
