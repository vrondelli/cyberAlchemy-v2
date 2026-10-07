# G01 r63 — exposed 16-case BugSwarm diagnostic

Status: separate post-r62 diagnostic, frozen before r63 scoring.  
Population: all 16 Python cases in the sealed r62 ranking set whose pinned r41
direct Git-tree label is admissible for failed-source localization. Exclude
the one added-file case, ordinal 15, by that objective label-admission rule.
Do not select by r62 rank, score, or GLM output.

Compare r62's unchanged A (ARE + raw chunk BM25) and D (expanded
functionality pool + fixed three-channel RRF) using MRR@8, Hit@3, and
recall@20. Use 100,000 repository-bootstrap draws with seed 6301 for D–A
MRR@8. Verify the r62 source seal, rank hash, r41 label census, source
projection, 16/16 source-path presence, and exact case identity before
scoring. Preserve the ordinal-15 failure in r62's own record.

This diagnostic has no advancement gate and no fresh-confirmation or
superiority claim. It can only decide whether a newly sourced,
pre-label-screened cohort is worth running under an unchanged or separately
revised mechanism.

## Open questions

- Is the direction of D–A consistent on this different exposed dataset?
- What exact source and label preflight is needed before a fresh 24-case run?
