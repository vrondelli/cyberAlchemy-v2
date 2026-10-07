# G02 r11 same-directory declaration links — exposed rejection

Status, 2026-10-03: **rejected as a three-read policy before GLM calls or
actual ARE reads**.

The source-only [proposal rule](../research/g02-product-r4/seal-g02-r11-same-directory-declaration-links-exposed-r1.py)
started from the previously sealed 1,266-file same-directory pool. It
verified each task's pinned base commit, issue digest, and candidate content
hash. A candidate was eligible when one of its non-generic top-level
declarations appeared as a whole identifier in source ARE had already read.
It ranked linked candidates by inverse local declaration frequency,
normalized by declaration count, and proposed at most three per task. It
opened no native gold, comparator output, or score. The write-once
12-task source seal SHA-256 is
`788e963dc96ee82ff93451771fd86b74592ef1437b924ae3dbcbdbebc74e69a3`.

The later [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-same-directory-declaration-links-exposed-r1.py)
checked task identity, candidate membership, maximum-three-read bounds,
and parity with archived native file counts before its additive replay. Of
**36** proposed files, **3** newly hit native gold (one each on exposed tasks
3, 4, and 7) and **33** were false positives. The 12-task mean File-F1
counterfactual fell **0.535975 → 0.353914**: three tasks improved, eight
regressed, one tied. Audit SHA-256 is
`e81a4c79f701d551ed0e0d928bcf298d5af0f30885b9ce532a3f46242691ecdb`.
Both private receipts are under
`/home/vlad_/are-benchmark-archive/g02-r11-same-directory-declaration-links-exposed-r1-20261003/`.

The linked-declaration relation does retrieve some missing candidates but
does not discriminate them sufficiently at a three-read cap. It is not
eligible for fresh G02 dispatch. This is exposed, set-based development
evidence only: no added file was delivered to ARE, and no Span-F1, token/time
cost, untouched-cohort, or superiority result follows. Any later filter
derived from this audit would be post-hoc and must be frozen for independent
testing before a claim.

## Open Questions

- What source-only signal can distinguish the three relevant linked files
  from the 33 irrelevant proposals without access to r11 labels?
- Can a prospective policy improve both native quality and all-in cost on
  an untouched paired G02 cohort?
