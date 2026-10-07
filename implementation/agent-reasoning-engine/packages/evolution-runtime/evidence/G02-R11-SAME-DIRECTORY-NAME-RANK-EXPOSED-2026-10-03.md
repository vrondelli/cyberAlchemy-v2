# G02 r11 same-directory filename rank — exposed rejection

Status, 2026-10-03: **rejected before model calls or actual ARE reads**.

The source-only [ranker](../research/g02-product-r4/seal-g02-r11-same-directory-name-rank-exposed-r1.py)
used the previously sealed 1,266-file same-directory pool. For each of the
12 scored r11 tasks, it ranked candidates by exact issue mention of the
filename stem and non-generic filename-component matches, then proposed at
most three positive-score paths. It verified the pinned issue digest and
task identity and read no native gold, comparator output, or score. The
write-once source seal SHA-256 is
`8f01c6e8bec918f49e0a2a0a9ee727c23175e5d14db1cadcff81aeae1cf62baa`
at `/home/vlad_/are-benchmark-archive/g02-r11-same-directory-name-rank-exposed-r1-20261003/SOURCE-SEAL.json`.

The subsequent [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-same-directory-name-rank-exposed-r1.py)
checked task/base identity, candidate membership, the maximum-three-read
bound, and archived native File-F1 counts. Of **22** proposed files, only
**one** was a newly reached native-gold file; **21** were false positives.
Adding all proposals to the archived ARE selected-file sets would lower
12-task mean File-F1 **0.535975 → 0.441112**. One task improves, seven
regress, and four tie; all four repository mean deltas are negative.
The counts-only audit SHA-256 is
`1256bbc455a376061225e0e9dad3009c157d4c78560345080807b74603124485`.

This is a post-hoc exposed development counterfactual, not a full episode.
It did not deliver these files to ARE, score spans, measure model cost, or
test an untouched cohort. The filename-only rule is **not eligible for fresh
G02 dispatch** and supplies no superiority evidence. The remaining same-
directory coverage requires a different, source-grounded selection mechanism;
another filename-only rank or a chooser over this unchanged broad pool is
not justified by this result.

## Open Questions

- Can a source relation with bounded precision recover the pool's remaining
  six undelivered gold files across exposed tasks without label access?
- Will any independently frozen rule deliver native quality and cost gains
  on a genuinely untouched cohort?
