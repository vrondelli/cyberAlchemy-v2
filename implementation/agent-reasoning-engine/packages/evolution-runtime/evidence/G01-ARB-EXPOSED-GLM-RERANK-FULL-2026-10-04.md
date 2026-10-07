# G01 ARB exposed 101-case GLM rerank development result

Status: **unchanged remaining-89 transfer and combined 101-case development
screen passed their fixed gates; no superiority claim.** This is ARB
trace2code source-projected file retrieval, not the original ContextBench
Span-F1 campaign or a live ARE episode.

The [12-case pilot](G01-ARB-EXPOSED-GLM-RERANK-PILOT-2026-10-04.md)
was sealed and scored first. The
[remaining-89 source sealer](../research/arb-trace2code-r1/build-exposed-rerank-remaining-r2.py)
(`fe578279b0e3497756d6e35b84f4c40584cdcce8bc6d85c7f0bd12b5670e961f`)
then excluded exactly the pilot's 12 IDs and kept its matched 1,024-byte
query, top-ten-per-arm file/chunk union, lexical source-excerpt selection,
and rank-hint packet construction unchanged. It accessed no gold or scores.
The 89-case packet SHA-256 is
`d61a29b6fdf1fcea16e8fc078e190fc99bdb56efe4af2e4ddaa8da1d0c7fd960`;
the largest prompt was 10,479 bytes and the largest union had 20 files.

The [VPS runner](../research/arb-trace2code-r1/run-exposed-rerank-remaining-r2.mjs)
(`743cddcc56e43810c17aea970938be50402775867d3103716df3e2f0b943abd3`)
froze at `FREEZE.json` SHA-256
`55d5720cc6d14144dbe01fa4614fbb708f3bf4859eb388c0574874c20214c13c`.
It used the same GLM-5.3-flash prompt, `reasoning_effort: low`, 512-token
output cap, 8K prompt-plus-reserve admission, zero automatic retries,
up-to-eight ordered candidate IDs, and unchanged ARE-order fill. Its fixed
advancement gate required all 89 valid, mean MRR@8 no worse than either
standalone ranker, and MRR gains over ARE in at least three repositories.

All **89/89** tokenizer admissions and zero-retry generation calls succeeded;
all responses were valid JSON, stopped normally, and matched their sealed
selected IDs. Task calls used **207,273 prompt + 4,434 completion tokens**
and summed **204,475 ms**, excluding readiness and tokenizer calls. The
full private VPS run at
`/opt/are/evolution-runtime/arb-exposed-rerank-remaining-r2/` has a
checksum-identical WSL cold copy under
`/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004/exposed-rerank-remaining-r2/`.

The [r2 evaluator wrapper](../research/arb-trace2code-r1/audit-exposed-rerank-remaining-r2.py)
(`93fe6a2ec6c288a22630ae79df3f8f7f4a89e58c05cafb0f55762ce169db7c44`)
sealed all 89 model-proposed full-file rankings before opening evaluator
gold. The prediction SHA-256 is
`5cb9e5530d586ddeb0ff5b40cc0eff22f78576e4612d8a1cf8ba934225527d1f`;
the numeric `EVALUATOR-AUDIT.json` SHA-256 is
`7b4815ee74c36b28225ef232b00bf6dff9045e8b361a896884c35e6f6542c24c`.
The unchanged 89-case gate passed: MRR@8 was **0.59925** for the GLM
rerank versus **0.35312** ARE file ranker and **0.17528** ARB chunk BM25.

The [counts-only 101-case join](../research/arb-trace2code-r1/join-exposed-rerank-101-r1.py)
verified the disjoint 12+89 denominator and both immutable numeric audit
hashes. Its output is privately archived as `EXPOSED-RERANK-101-JOIN.json`.

| Matched-edge, fully exposed 101-case ARB set | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| ARB chunk BM25 | 0.18284 | 28/101 | 0.57261 |
| ARE file ranker | 0.34475 | 43/101 | 0.72112 |
| Chunk/file union + GLM rerank | **0.58944** | **71/101** | **0.77393** |

Against ARE, the rerank gained MRR@8 in 44 cases, lost in five, and tied
in 52. Repository-level MRR gains occurred in six of seven repositories;
Clap's single case tied at zero. An **exploratory, post-development** exact
equal-repository sign-flip gives two-sided `p=0.03125`. This is not an
independent confirmatory test: these 101 labels had already been exposed in
earlier work, Gin contributes 56 cases, and two repositories have only one
case. The combined task-call cost is **235,322 prompt + 5,104 completion
tokens** and **234,564 ms summed GLM call time**, excluding readiness and
tokenizer calls. The standalone source-only baselines make no GLM calls;
the quality gain is therefore **not** an efficiency gain.

The 101-case join output SHA-256 is
`29f04a7639b8743abfe4a81aa402acfbdc709242361d788b450047fd608ab59b`;
no published page or claim has been changed. The result exceeds the two fixed
standalone rankers *on this exposed, source-projected set only*. This run
did not test official RepoMap, exact-Git snapshots, actual ARE read delivery,
ContextBench Span-F1, end-to-end episode cost, or a fresh independent
repository-separated trace population. The later matched official RepoMap
check is linked below; the other comparisons remain mandatory before any
meaningful product superiority claim.

## Open Questions

- The later [matched official RepoMap check](G01-ARB-OFFICIAL-REPOMAP-MATCHED-EXPOSED-2026-10-06.md)
  found lower MRR@8 but higher Recall@20 with no model calls. Can that
  quality/cost tradeoff survive a fresh, repository-separated population?
- Can an exact-Git, live ARE episode retain this ranking gain under 8K
  prompt admission, actual read semantics, and all-in cost accounting?
- Which genuinely fresh repository-separated trace set can confirm a frozen
  version without reuse of any of the 101 exposed ARB labels?
