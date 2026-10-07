# G02 normalized clauses, 16-call exposed screen — all four gates passed

This screen retained the normalized, clause-diverse source hints from the
20-call predecessor and reduced only the model-call cap to sixteen. It ran
on the already-exposed NodeBB task `e31ec45c`, so it remains development
evidence. The first model request contained all twenty intended hints.

ARE completed a valid native selection in 15 model calls, 158,744 known
model tokens, zero unknown-usage requests, and 151.72 seconds. Native
Span/File-F1 was `0.4157597465`/`0.7058823529`. The pinned same-task DSH
control scored `0.3161899079`/`0.5555555556` in 260,281 tokens and
157.15 seconds. Both accuracy metrics improved, tokens fell, and time fell
by 5.43 seconds. The [native screen](native-screen/screen.json) passed its
quality/token gates; wall time was checked separately. The latency margin
is narrow and not a general efficiency claim.

The [receipt archive](G02-NORMALIZED-CLAUSES-16-R1-RECEIPTS.tar.gz) has
SHA-256 `8248798369c1a70e83db6918768bed2cc0c5e77180010f83b80c512fa57cbdee`.
It excludes source checkouts and credentials. VPS run root:
`/opt/are-benchmark-runs/g02-normalized-clauses-16-r1`.

Decision: advance this frozen candidate to another source-only task from the
cached Go repository. A single exposed-task pass does not promote G02.

## Open Questions

Does the candidate retain joint quality, token, and wall-time gains on
unseen Go work and across a broader cohort?
