# Paired assessment

Author: primary Codex agent, 2026-09-12. Candidate evidence; authority effect none.

Author attempt 003 reproduces original order divergence and the repaired common order using the exact frozen source exports. Both historical and common CBMC comparisons yield COUNTEREXAMPLE for original and NO_COUNTEREXAMPLE_AT_BOUND for repair. Native original runs abort on the declared order assertion; repaired native runs pass. All five concrete regression groups pass. See author-attempt-003/result.json for commands, hashes, limits and measured process durations.

The original merge appends missing source elements at the destination tail, so destination order changes the result. The existing repair replicates placement metadata and deterministically rematerializes order. The recovered patch applies to the original exports and exactly produces all changed repaired files; see patch-correspondence.json.

The common harness uses the same allocator shim and bounds for both subjects, requires successful merges and retention of both members, and checks order equivalence. Its fixture fixes IDs A/1 and B/1 and payloads 1/2; this is not arbitrary-input verification. Historical harness differences are preserved and disclosed in PROPERTY.md. Current GCC15 establishes a fresh compiler epoch; the historical GCC13 environment was not reproduced.

Eight verifier fault injections are rejected, including modified output, stale freeze, timeout, missing regression command, weakened selection or bounds, and a different failed assertion. A process closing both output streams is also killed at the test deadline. These tests are targeted evidence, not comprehensive verifier assurance. The first two author attempts and the first reviewer attempt are retained as superseded verifier epochs. The reviewer found a pipe-EOF timeout bypass; the primary found acceptance of the wrong original assertion. Both were corrected before attempt 003.

## Open Questions

Production reachability, arbitrary identifiers and payloads, general operation sequences, every auxiliary CBMC property, malicious wholesale receipt forgery and independent-host reproducibility remain outside this milestone. The successor independent reviewer supports this bounded comparison; see REVIEW.md and COMPLETION.md. No certification, product admission or deployment follows from these results.
