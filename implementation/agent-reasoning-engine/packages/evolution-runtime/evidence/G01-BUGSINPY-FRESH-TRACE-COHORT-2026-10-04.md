# G01 fresh trace-to-code cohort: source-only feasibility

Status: **24-case source-only cohort frozen and tested.** The prospective
[r1 result](G01-BUGSINPY-FRESH-R1-RESULT-2026-10-04.md) passed its bounded
file-retrieval quality gate. This remains distinct from the original
ContextBench Span-F1 benchmark, an exact-Git/live ARE episode, or a general
product superiority result.

The private WSL archive is the public
[reproducing-research-projects BugsInPy](https://github.com/reproducing-research-projects/BugsInPy/tree/316b95e2353ecda832bad9b42f86fa7c2fcec8ac)
snapshot pinned at commit `316b95e2353ecda832bad9b42f86fa7c2fcec8ac`:
`/home/vlad_/are-benchmark-archive/bugsinpy-trace-candidate-20261004/BugsInPy-316b95e2353ecda832bad9b42f86fa7c2fcec8ac.tar.gz`.
Its measured SHA-256 is
`8b242a0a62b91002fedaff64e112ba8b761d15e805d4635098f51b173fff5548`
(1,241,750 compressed bytes). The archive contains gold patches and fixed
outputs, so source-only scripts read only the reproducibility index,
`bug.info`, and `bug_buggy.txt`. Gold and fixed outputs were not opened.

The [exact-commit census](../research/arb-trace2code-r1/census-bugsinpy-traces-r2.py)
found 501 indexed bug IDs, including 477 buggy-fail/fixed-pass pairs. Of
these, **312** have nonempty buggy logs and exact 40-character buggy commit
IDs across 16 repositories. The other **165** use abbreviated commit IDs
(all observed in pandas) and are excluded from this exact-snapshot protocol;
they have not been silently expanded. The source-only metadata SHA-256 is
`5cf0241fa5d50118007f55e937ef0e74c7e7ea427c807f6819266378e7256523`.
The previous r1 census admitted only 302 because its parser was too strict;
the r2 census supersedes it.

The [source-only selector](../research/arb-trace2code-r1/select-bugsinpy-exact-cohort-r1.py)
used fixed SHA-256 ordering to choose the first 12 repositories with at least
two eligible cases, then two distinct-commit cases in each. Its private WSL
freeze is `source-only-r2/EXACT-COHORT-24-FREEZE.json` under the archive
directory above, SHA-256
`888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33`.
The selected repositories are tqdm, spaCy, luigi, scrapy, tornado,
matplotlib, thefuck, black, keras, fastapi, httpie, and sanic. This cohort
does not overlap the seven repositories in the 101-case ARB development set.
Read-only checks of the projects' GitHub commit endpoints returned HTTP 200
for all 24 exact buggy commits on 2026-10-04. The corresponding codeload
source archives were then acquired to private WSL `source-snapshots/` under
the archive directory above. The
[archive auditor](../research/arb-trace2code-r1/audit-bugsinpy-source-snapshots-r1.py)
verified all 24 against the frozen exact commit suffix, safe relative member
paths, gzip integrity, and per-archive caps: **109,749,666 compressed bytes**
and **208,854,385 regular-file bytes** in total; largest compressed archive
39,588,801 bytes. Four archives contain links, which were counted but not
extracted. These checks establish source acquisition feasibility, not full
Git object equivalence, link-safe projection, or benchmark validity.

The [source-only materializer](../research/arb-trace2code-r1/materialize-bugsinpy-source-r1.py)
then projected and Git-indexed eligible regular text files for **24/24**
cases under private WSL `source-projection-r1/`. It followed no links and
read no gold or fixed output. Its `SOURCE-PROJECTION-RECEIPT.json` SHA-256 is
`d5e909aa9d2250e437bc5f9ad8b6c0845204ad9bbe86c1e465b2dccbe8fc350e`.
The prospective [comparison protocol](G01-BUGSINPY-FRESH-R1-PROTOCOL.md)
fixes the case denominator, arms, scoring boundary, and failure treatment
before model dispatch.

The cohort selection and model packets remained **private and label-blind**
until predictions were sealed. Only eligible regular source files were
materialized; no archive was blindly extracted or delivered to VPS. The
GLM run, post-seal scoring, and independent metric audit are documented in
the r1 result. No official RepoMap comparator has been run. The public BugsInPy project
metadata did not declare a license in the checked repository API, so this
work does not assume public redistribution rights for the archive or its
derived traces. Any product-page claim needs separate review.

## Open Questions

- Can a new source-only acquisition method raise the 15/24 candidate-union
  ceiling on a separately frozen untouched cohort?
- Does the bounded rerank gain hold against official RepoMap and inside
  exact-Git, live ARE episodes under full cost accounting?
