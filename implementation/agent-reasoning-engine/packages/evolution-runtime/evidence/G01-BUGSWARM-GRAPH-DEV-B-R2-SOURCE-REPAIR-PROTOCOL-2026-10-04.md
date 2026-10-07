# G01 BugSwarm second development cohort r2 — source repair protocol

Status: fixed after the r1 source/log preflight and before any r2 replacement
source/log request. R1 remains a 24-case metadata candidate with **23/24**
exact failing commits and **24/24** job-matched original logs. The one
failed source slot is Python position 12, `numpy/numpy`, HTTP 404 for its
pinned failed commit. No ranking, evaluator label, GLM call, or reserved
confirmation artifact has been opened for this cohort.

Keep the other 23 candidates fixed. For position 12 only, traverse the
existing pinned Python source order *after* the original Python selection
floor (source-order position 325). Require the graph-development r1 metadata
eligibility predicate, the original development parity, and a repository
outside all original exposed, r1 development, r1 reserved-confirmation, r2
repaired-development, and second-development r1 selected repositories.
For each candidate in order, request its exact failed commit from GitHub
HTTPS; only if the returned SHA matches, request its original failed-job
log from BugSwarm under the existing 8 MiB response cap and require a
nonempty job-ID match. Choose the first candidate satisfying both. Preserve
all attempts and the replacement log in private storage. Never use patch
paths, gold scores, ranker output, or model responses to choose a replacement.

R2 remains a source/log-preflight candidate. A separate exact source archive,
code-only projection, evaluator-only gold admission, and frozen method are
required before ranking or model calls. HTTP logs remain transport-provisional.

## Open Questions

- Will the first eligible disjoint candidate after position 325 pass both
  exact-source and original-log checks?
- Can all 24 repaired cases pass source projection and evaluator-only label
  admission without score-dependent changes?
- How can the HTTP log/diff provenance be authenticated or reproduced?
