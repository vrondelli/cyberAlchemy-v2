# Raw token accounting for twelve outcomes

Status: implemented with nine passing synthetic test groups; independent review pending. No provider/evaluator calls or accepted savings claim.

[comparison-accounting.mjs](comparison-accounting.mjs) accounts for every slot in the exact reconstructed schedule. Unstarted slots require attempted=false, status=not-started and null result. Missing, duplicate or reordered outcomes reject. Attempted failures cannot be relabeled as zero-cost unstarted slots.

For each model receipt, every valid nonnegative input/output token field contributes to the observed known sum, even when another field is missing or dispatch state is contradictory. Identical receipt objects retain multiplicity: they can represent separate attempts. Tokenizer families affect provider health but are not added to model token spend. Higher usage summaries or phase-known totals remain lower-bound witnesses rather than being discarded or added twice. Individually valid positive summary fields survive even when the summary is partial or incoherent; disagreements require reconciliation. Present accounting flags, phase containers and pending reservations are checked explicitly, including malformed falsy values. Initial independent review identified partial-summary loss and malformed-field acceptance; both now have focused regressions.

Each unknown/contradictory model receipt retains an 8K reservation minus its already observed partial usage. Missing receipt families, unresolved phase reservations, unrepresented unknown counts or conflicting usage summaries additionally retain at least the full 96K arm reservation. Conservative totals preserve known witnesses above that ceiling and add unresolved receipt reservations. These are conservative reservations, not claims about actual usage. Unsafe integer sums reject instead of overflowing.

Raw-accounting completeness and provider health are separate: a failed request can have fully reported token usage. Neither flag proves task success, budget conformance, durable receipt agreement or valid scoring. The aggregate preserves twelve rows and separate totals for all three arms, and always reports durable_reconciliation_pending=true, accepted_savings=null and benchmark_cleared=false.

## Verification

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-accounting.test.mjs
```

Nine groups cover partial known usage and repeated attempts; missing/contradictory evidence; higher coherent known-usage witnesses; twelve-row/three-arm aggregation without accepted savings; denominator identity and unstarted-state rejection; malformed receipts and integer overflow; and unmatched unknown counters with reservations retained above high known-cost witnesses; partial/incoherent summary witnesses; and malformed falsy flags/phase containers.

## Product frontier and open questions

Coordinator owns bounded durable campaign output, immutable generation sealing and reconciliation against transport ledgers, index events and dispatch captures. Caller-supplied raw result objects remain evidence requiring that reconciliation; this module does not authenticate them. The reconciler must enforce each arm's token/call/window bounds and the twelve-outcome comparison before native scoring. Native experiment continuity, exact freeze, real tokenizer qualification and D:/WSL admission remain prerequisites for live dispatch; C: is excluded. Perfect quality, at least 15% savings against both comparators and untouched confirmation remain unproved. Release/deployment remain deferred residue.
