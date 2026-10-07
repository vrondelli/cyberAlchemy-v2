# G01 BugSwarm cohort B — stratified failure-context acquisition

Status: fixed before r7 source-only candidate generation and evaluator
scoring. This is another private, score-exposed development hypothesis on
cohort B, not independent confirmation. R5 and r6 remain terminal failed
reach screens. No GLM or reserved-confirmation access is authorized by this
screen alone.

For each exact failed-commit case, retain the entire sealed r2/r3 top-30
union in its original order. Tokenize the complete job-ID-matched failure
log as ASCII identifiers `[A-Za-z_][A-Za-z0-9_]{5,}`. Candidate source
files must be unique non-test `.py`/`.java` stems in the exact code-only
root. Build three source-only strata:

1. Failure-context exact stems: a stem appears as an exact identifier on a
   log line containing `error`, `fail`, `exception`, `traceback`, `assert`,
   `caused by`, or ` at ` (case-insensitive). Order by descending number of
   distinct matching lines, then descending stem length, r2 rank, path.
   Take up to 12 new paths.
2. Test-class aliases: an exact log identifier is `Test<Stem>`, `<Stem>Test`,
   `<Stem>Tests`, `<Stem>IT`, or `<Stem>IntegrationTest`, ignoring case. Order
   by descending number of exact alias occurrences, then descending stem
   length, r2 rank, path. Take up to 10 new paths.
3. Rare general exact stems: the stem occurs as an exact log identifier
   between one and eight times inclusive. Order by descending stem length,
   then ascending occurrence count, r2 rank, path. Fill the remaining
   allowance after strata 1–2.

All strata exclude paths already selected. Total additions are at most 31;
the final list is at most 80 paths, preserving every original union path.
No evaluator paths, patch diff, passing-commit code, or score may enter this
selection. Seal all 24 lists, code/rule hashes, and maximum size before
opening evaluator labels. The evaluator-only development gate is complete
24/24 identity, zero prior-reach losses, at least 20/24 candidate reach,
and at most 80 paths per case. A pass permits a separately frozen bounded
GLM packet, not a superiority claim.

Original logs and diffs remain HTTP-transport-provisional; this cohort is
already evaluator-exposed. Any later superiority claim requires independent
provenance and untouched confirmation, with full end-to-end quality and cost
accounting.

## Open Questions

- Does failure-context and test-name evidence increase bounded candidate
  reach without importing incidental full-log chatter?
- What source-only signal can reach log-silent gold files?
- Can the original BugSwarm payload provenance be authenticated?
