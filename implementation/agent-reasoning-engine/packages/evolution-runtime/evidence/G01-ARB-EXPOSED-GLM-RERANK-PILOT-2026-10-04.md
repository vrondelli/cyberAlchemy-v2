# G01 ARB exposed chunk/file union GLM rerank pilot

Status: **12/12 valid; fixed development gate passed; no superiority claim.**
This is a distinct source-only ARB trace2code retrieval mechanism, not the
original GLM 8K / ContextBench Span-F1 campaign or a live ARE episode.

## Frozen test

The [gold-blind packet builder](../research/arb-trace2code-r1/build-exposed-rerank-pilot-r1.py)
(`c469c124bf505b24d910f6b47dc0d5b1513a0bdce3e783a9acb8886e3e46f1c8`)
used the verified ARB source-only corpus, sealed matched 1,024-byte edge
failure queries, the already sealed ARE file rankings and ARB chunk BM25
rankings. A SHA-256 sort of case ID selected up to two cases per repository:
12 cases from seven repositories, with no gold-aware choice. The candidate
union was top ten from each arm (maximum 19 distinct files), with one
query-overlap-selected, 420-character source excerpt per file. The script did
not open ARB gold or comparator scores. All prompts were below 10,196 bytes.

The private WSL `SOURCE-SEAL.json` and `PACKETS.jsonl` live under
`/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004/exposed-rerank-pilot-r1/`.
Packet SHA-256 is
`d0ef532a085fbb00333c2083b025a079bbbb84d1c9dd3f2d25377bb11537dce7`.
The 12 packets were transferred to the VPS without gold. The
[VPS runner](../research/arb-trace2code-r1/run-exposed-rerank-pilot-r1.mjs)
(`106616219760bde3d8c65f4e86c1ed1b8b5524ef21eda11f4cdb6f916c36711a`)
froze at `FREEZE.json` SHA-256
`2024c0e88c683995515cc40251ef4bba001760608f155a81f4d2597050b5f1e3`.
It fixed GLM-5.3-flash, `reasoning_effort: low`, `max_tokens: 512`, no
automatic retries, 8,192-token prompt-plus-reserve admission, up to eight
ordered candidate IDs, and an all-12-valid gate. The quality gate required
nonnegative mean MRR@8 versus *both* standalone arms and gains versus ARE
in at least three repositories. Source text was explicitly treated as
untrusted data.

## Raw run and evaluator result

All 12 exact tokenizer checks passed (maximum 2,938 prompt tokens) after a
successful same-account readiness check. All **12/12** zero-retry GLM
responses completed HTTP 200, stopped normally, parsed as valid distinct
candidate IDs, and were within output cap. Total task-call usage was
**28,049 prompt + 670 completion tokens**, excluding readiness and tokenizer
calls; summed task-call wall time was 30,089 ms. Raw VPS files have a
checksum-identical private WSL cold copy (zero rsync differences).

The [independent evaluator wrapper](../research/arb-trace2code-r1/audit-exposed-rerank-pilot-r1.py)
(`61270323a1ab6d72408b3d2a617dd5bd9c3fd1074c76640e40143944e7fcbfbc`)
first sealed all 12 full-file rankings **before** opening gold at
`RANKING-SEAL.json` prediction SHA-256
`315dfa2e006900e5e2d5cf700d3ebac8bded6ff0c60d5d59faeaff682c721512`.
The fixed policy places the GLM-selected candidate paths first in model order,
then preserves the original ARE file order. The separate evaluator then
opened only the matching ARB references and checked identity, denominator,
candidate universe and published archive SHA-256. `EVALUATOR-AUDIT.json`
SHA-256 is
`65918b6db77adbc71727ea440999b304ce5e1ab5bb3026e25fdd449575b848b9`.

| Matched 12-case exposed pilot | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| ARB chunk BM25 | 0.23889 | 5/12 | 0.63889 |
| ARE file ranker | 0.28274 | 4/12 | 0.77778 |
| Chunk/file union + GLM rerank | **0.51667** | **9/12** | **0.88889** |

The proposal gained MRR@8 over ARE in Caddy, etcd, Gin, Click and pytest;
Tokio tied, and the single Clap case remained at zero. All three frozen
advancement conditions passed. A separate receipt consistency check verified
12/12 provider response JSON values matched the sealed selected IDs.

## Claim boundary and next experiment

These 12 cases came from an already exposed 101-case release; the model may
benefit from visible rank hints, and the sample is too small for a stable
repository-level inference. The source snapshots are ARB projections, not
exact Git worktrees. There is no official RepoMap comparison, full 101-case
replication, independent population, live ARE read, ContextBench Span-F1,
or all-in episode cost comparison. The result is **development evidence that
a query-conditioned second stage can exploit complementary file/chunk
candidates**, not product or G01 superiority.

Next, keep this exact prompt, candidate construction, model parameters and
ranking-fill rule unchanged on the remaining 89 already-exposed ARB cases,
with source-only sealing before any score. Compare all 101 against both
standalone arms and, once the separately gated official source is available,
matched-query RepoMap. Any tuned successor needs a genuinely independent,
repository-separated trace population. Do not use this pilot to claim
ContextBench improvement.

## Open Questions

- Does the unchanged mechanism retain gains across all 101 exposed cases,
  including the weak Click and one-case repository strata?
- How does it compare with official RepoMap on exactly matched queries and
  source snapshots?
- Which fresh trace population can validate a frozen successor without
  reusing any of these 101 exposed labels?
