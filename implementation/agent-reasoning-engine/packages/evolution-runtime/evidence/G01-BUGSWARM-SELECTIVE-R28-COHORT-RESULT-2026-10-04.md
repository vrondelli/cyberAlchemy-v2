# G01 BugSwarm selective-GLM r28 — untouched metadata census result

Status: passed the prospectively fixed metadata census. This is an untouched
population definition, not source/log admission, a model run, a benchmark
score, or a superiority result.

The pinned selector
`select-bugswarm-selective-r28-cohort.py`, SHA-256
`66d091d3b584e26d45479161630bdd42e194745b3c5c4cf73edeb176598738fa`,
replayed the complete fresh-r11 exclusion construction and then excluded all
24 fresh-r11 selected repositories plus all repositories occurring in the 22
ordered r14 replacement attempts. The fixed protocol SHA-256 is
`8d170a7177e10ef184c0f0b240898bf84a81fdac6466840e9a23e30b3aa777c9`.

The private WSL census is:

`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28/METADATA-CENSUS.json`

Its SHA-256 is
`f4aead7a1201f114fe89d6da36226c4aeab5f4712f6114d1165632f9b2f2258a`.
It contains 24 unique repositories: twelve Python and twelve Java, selected in
the pinned BugSwarm failure-side order after 180 conservative repository
exclusions. The twelfth Python selection occurs at source position 467 and
the twelfth Java selection at position 1350.

An independent read-only identity audit confirmed:

- 24 selected rows and 24 unique repositories;
- exactly 12 Python and 12 Java rows;
- every image tag, failure job, failed commit, repository, and recorded source
  position matches the pinned ordered-candidate source;
- zero overlap with the 24 fresh-r11 repositories or 22 r14 attempt files;
- `gold_opened=false`, `logs_opened=false`, `network_calls=0`, and
  `model_calls=0`.

The next separately frozen stage is authenticated failed-source/log admission
with score-blind replacements, if needed, in the same source order. Only after
source projection may unchanged ARE and graph-r2 rankings determine the
prospective disagreement-router dispatch count. Gold remains closed until the
selective and always-GLM prediction arms are sealed.

## Claim boundary

This result proves that a third 24-repository metadata population exists under
the declared exposure exclusions. It proves no availability, accuracy,
efficiency, ContextBench, end-to-end ARE, G02/G03, or product-superiority
claim.

## Open Questions

- How many of the 24 metadata rows pass authenticated source/log admission
  without replacement?
- How many replacements remain available without reducing the fixed
  denominator or reusing an exposed repository?
- What prospective fraction of the admitted cohort triggers GLM under the
  ARE/graph top-1 disagreement rule?
