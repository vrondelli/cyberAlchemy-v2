# G01 BugSwarm cohort B — full-log unique file-stem acquisition

Status: fixed before r6 source-only acquisition and evaluator scoring. This
is private, evaluator-exposed development on the same cohort B; it cannot be
used as independent confirmation. The earlier sealed r5 r2/r3 union reaches
only 19/24 gold cases, below its fixed 20/24 advancement condition, so no
r5 GLM call will be made. This r6 rule is a separate candidate-acquisition
hypothesis, not a retrospective repair of r5.

Use the exact 24 sealed cohort-B cases, code-only roots, graph-r2 rankings,
failure-side queries, and original job-ID-matched failure logs. For each
case, tokenize the **complete** original log as ASCII identifiers matching
`[A-Za-z_][A-Za-z0-9_]{5,}`; lowercase and count exact tokens. Consider a
source file only if it is a non-test `.py`/`.java` file in the exact failing
commit, its stem matches that identifier shape, and that lowercase stem is
unique among non-test source files in the repository. Retain stems with at
least one exact token occurrence. Sort by decreasing full-log occurrence
count, then graph-r2 rank, then path. Admit at most 20 extra paths not
already in the sealed r2/r3 top-30 union. Preserve all r2/r3 union paths and
their order; do not change the graph ranker or score. Seal the complete
candidate list before opening evaluator labels.

Evaluator-only screening reports per-case and cohort reach, additions,
losses, maximum candidate count, and the exact newly reached cases. A
candidate-acquisition success for *development continuation* requires at
least 20/24 union reach, zero previously reachable losses, no source/gold
identity defect, at most 80 candidates per case, and no unbounded or
credential-bearing log text in a model packet. These are not product-claim
criteria. The next GLM packet would include only bounded query text,
candidate paths/ranks, and source excerpts; full logs stay private.

Original logs and diffs are unauthenticated HTTP payloads, so even a
successful r6 screen is transport-provisional. Reserved confirmation remains
unopened, and no superiority claim follows.

## Open Questions

- Does exact unique-stem lookup reach the four diagnosed cases without
  flooding packets with irrelevant files?
- What source-only mechanism can reach cases whose correct file stem is
  absent from the failure log?
- Can the provisional original logs/diffs be independently authenticated?
