# G01 BugSwarm failure-anchored graph development r1 — admission stop

Status, 2026-10-04: a **new repository-disjoint metadata split** is sealed,
but its 24-case development cohort is **not source-admitted**. This is private
G01 preparation, not a ranking result, ContextBench, live ARE, or superiority
evidence. No graph ranking or GLM request has run on these cases.

The [deterministic selector](../research/arb-trace2code-r1/select-bugswarm-graph-dev-r1.py)
used the pinned BugSwarm 1.3.1 metadata and earlier sealed failure-side order.
It excluded all 24 repositories in the prior exposed BugSwarm cohort, used a
fixed repository-hash parity split, and selected the first twelve
metadata-eligible Python and twelve Java repositories in each partition.
Thus **24 development and 24 reserved-confirmation repositories** are mutually
disjoint and disjoint from the exposed 24. It used no patch path, model score,
or original log to select them. The private mode-600 cohort receipt is at
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-r1/METADATA-COHORTS-R1.json`,
SHA-256 `6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85`.
These are metadata candidates, not yet source-, log-, or label-admitted cases.
The reserved-confirmation source, logs, and labels remain unopened.

The [source/log preflight](../research/arb-trace2code-r1/preflight-bugswarm-graph-dev-r1.py)
looked only at the 24 development cases. **24/24** original failed-job logs
were nonempty, job-ID-matched, below the 8 MiB response cap, and archived
privately. They came from the unauthenticated BugSwarm **HTTP** endpoint and
remain transport-provisional. GitHub HTTPS returned exact failing commits for
**22/24** cases; `yt-dlp/yt-dlp` (development position 11) and `pgjdbc/pgjdbc`
(position 21) returned HTTP 404 for their metadata failing SHAs. The private
receipt is `graph-dev-r1/DEV-PREFLIGHT-R1.json`, SHA-256
`03ec15d02446aef5d47d1a190b640a16876732d2498f1ebcb59578ef22aecd34`.
No source tarballs, evaluator-only patch labels, or VPS copies were acquired.

The r1 24-case development admission therefore **stops**. Do not silently
discard the two failures or score only 22 as if it were a complete denominator.
The next source-only step is a separately versioned r2 development candidate:
retain the 22 exact-source cases and replace only the two unavailable commits
using the same fixed order, eligibility rule, development partition, and
repository exclusions. Preflight replacements before any ranking; preserve
this r1 receipt and keep the reserved-confirmation partition untouched.
Only after exact source, original logs, and source/gold projection are admitted
may the failure-anchored graph mechanism receive a frozen development gate.

## Open Questions

- Can the two missing commits be recovered independently instead of replaced?
- Will score-blind replacements pass exact-source, log, and later label
  admission without changing the development denominator?
- How can HTTP log/diff provenance be independently authenticated or
  reproduced before a fresh superiority claim?
