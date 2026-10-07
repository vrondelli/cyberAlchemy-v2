# G02 r11 source-relation union: exposed candidate-generation audit

Status, 2026-10-03: **sealed source-only pool and separate evaluator-only
coverage audit; no model call, delivered read, native score, or fresh claim**.

The source-only generator combines the already sealed same-directory pool
(SHA-256 `58977faf143e620d3f6695d79a58b37c01669a3d7ae239992833d97f37c38dc1`),
Python direct-import pool
(`777f9d69cc65be69d472ed3a7633f75483e01134c5298527b99fd22f5c490384`),
and C++ direct-include pool
(`031c44de02388b89261a921ef3def5a17eecae5c5faa8f308594e9b3a645c15d`).
It verifies exact task, base-commit, issue, and ARE-delivered-path identity
before unioning each file path with its channel provenance and source byte
size. Gold labels, DSH outputs, and scores are absent from this generator.
The [generator](../research/g02-product-r4/seal-g02-r11-relation-union-exposed-r1.py)
created the private write-once
`/home/vlad_/are-benchmark-archive/g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json`
at SHA-256 `7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291`.

Only after that seal did the separate
[evaluator-only audit](../research/g02-product-r4/audit-g02-r11-relation-union-exposed-r1.py)
open the pinned native Parquet (SHA-256
`2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8`).
It exports counts, not gold paths. Its private `EVALUATOR-COVERAGE.json`
receipt is SHA-256
`2e8646ca1828eb5fc7352a8d02763100d640b43ee5d7474c766ba8589dbcf025`.

Across 12 exposed r11 tasks, ARE had missed **22** native gold files. The
unranked relation union contains **2,732** unique candidates and **13/22**
missing gold files, with **2,719** non-gold candidates. A 256 KiB read-size
ceiling leaves 2,728 candidates and **12/22** missing gold files. Eight of
the 13 union hits were absent from the prior raw/structured BM25 top-30
union; combining both broad pools reaches 15/22 at any size. The relation
channels contribute 7/1,266 same-directory, 8/1,633 Python-import, and
5/71 C++-include gold candidates before cross-channel deduplication. The
Python pool alone contributes two gold files unique among the three channels;
the C++ pool contributes four; the same-directory pool contributes none
uniquely because of overlap. Task 7's Python-import pool has 875 candidates,
illustrating the ranking burden.

This supports a relation-aware candidate-generation hypothesis but **not**
delivery of the union, a three-read policy, or an ARE quality gain. Nine of
22 missing gold files are absent even from the unbounded union, and ten are
unreachable under the 256 KiB cap. A next exposed development policy must
first choose or abstain within the union under a predeclared three-read and
all-in cost budget, then be audited separately. A fresh matched cohort is
required before any G02 superiority claim.

## Open Questions

- Can issue-to-code-element ranking recover several of the 12 eligible hits
  within three reads without the severe false-positive losses already seen
  for filename, declaration-link, and direct-include ranks?
- What source-only graph edge or retrieval stage can reach the ten missing
  files still unavailable under the 256 KiB relation-union ceiling?
