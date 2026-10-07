# G01 RRF BugsInPy confirmation cohort r54

Status: source-only cohort selection fixed before source acquisition, packets,
provider calls, or label access  
Claim target: bounded BugsInPy trace-to-file superiority only

## Purpose

Create a third fresh 24-case BugsInPy cohort for independent confirmation of
the r51 counterbalanced-order plus fixed `RRF(k=60)` mechanism. The population
contains 312 exact-commit, fail/pass, source-eligible cases. R1 and r2b used 48
cases total.

## Selection rule

1. Exclude every r1 and r2b `(repository, bug ID)` and every corresponding
   `(repository, buggy commit)`.
2. Retain repositories with at least two distinct remaining commits.
3. Order eligible repositories by `SHA256(seed || repository)` and take 12.
4. Within each selected repository, order cases by
   `SHA256(seed || repository/bug ID)` and take the first two distinct commits.

The fixed seed is `are-g01-bugsinpy-rrf-confirm-r54\0`. No patch, changed-file,
fixed-output, or evaluator label is read during selection.

## Intended frozen treatment

For every admitted case, construct the unchanged deterministic ARE file
ranking and chunk ranking, then generate three entity-card GLM rankings from
original, reverse, and half-rotated candidate orders. Complete partial lists
with the ARE ranking and fuse the ARE ranking plus the three GLM rankings using
unweighted `RRF(k=60)`. Response parsing prospectively accepts numeric IDs or
exact candidate paths.

The exact source, packet, cost, metric, and superiority gates must be frozen
before provider calls. Publication still requires a separate decision and
review.

## Open questions

- Do all 24 selected commits still admit reproducible source snapshots?
- Does fixed RRF beat the stronger of the ARE and chunk baselines with a
  positive repository-bootstrap lower bound?
