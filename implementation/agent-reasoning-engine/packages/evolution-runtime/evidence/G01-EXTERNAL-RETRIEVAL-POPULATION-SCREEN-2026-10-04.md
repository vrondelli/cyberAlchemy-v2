# G01 external retrieval-population screen — research only

Status, 2026-10-04 UTC: **candidate external-validity source, not a G01
ContextBench cohort, protocol, freeze, run, or superiority result**. No
dataset bundle was downloaded, gold opened, model called, or VPS storage used.
The current G01 r8 eight-task transfer remains development-only; frozen r17
remains terminal failed. This screen does not repair either result or fill the
missing fresh 24-pair ContextBench population.

## Source check

The [official Agent Retrieval Bench (ARB) repository](https://github.com/eyuansu62/agent-retrieval-bench)
describes 427 workflow samples across 25 repositories: 345 positive retrieval
samples in `code2test`, `comment2context`, `trace2code`, and `edit2ripple`, plus
82 no-gold cases for a separate selective-retrieval track. Its positive
reference is the file needed next at a frozen base commit; the primary
retrieval metrics are file-level MRR, Recall@k, Precision@k/F0.5, and
budgeted-context yield. Span diagnostics exist for the first three positive
workflows, but not for `edit2ripple`. Five self-contained versioned releases
include JSONL, referenced snapshots, checksums, and evaluator artifacts.
The released gold is public. Its benchmark explicitly says that better
retrieval is not proof of a correct function/span or a test-passing patch.

This is a **good candidate for a separately predeclared, matched, file-level
ARE-versus-baseline retrieval study**, particularly because its signal types
include failure traces and review comments that G01's issue-only cohort does
not cover. It is **not** a drop-in source for ContextBench native Span-F1,
the 24-pair G01 denominator, or a claim that ARE beats DSH or GLM on the
original ContextBench population. Public gold also requires a strict
source-only policy and a provenance/exposure audit before selecting any
independent confirmation slice. The released corpus spans approximately
392,000 files and 7.9 million chunks; at the current VPS disk and memory
pressure, a full bundle download is not admitted by this screen.

## Bounded release-size check

The author's [public dataset release manifest](https://huggingface.co/datasets/eyuansu71/agent_retrieval_bench/blob/main/reports/v2_subset_releases_manifest.json)
and file listing were checked without downloading a bundle or opening gold.
The five compressed subset archives are `code2test` 443,641,745 bytes,
`comment2context` 278,591,728 bytes, `trace2code` **39,295,446 bytes**,
`edit2ripple` 128,720,663 bytes, and `abstention` 171,536,521 bytes.
The 101-sample `v2_trace2code` release is the smallest positive subset and
the closest workflow analogue to G02's failure-to-root-cause acquisition.
Its published archive SHA-256 is
`19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4`.
The checked public dataset revision is
`5901e1ee3aff048290db72edf9c63bc498b79ea3`.

This establishes **compressed transfer size only**, not expanded WSL/VPS
storage, source snapshot integrity, adapter compatibility, label quality,
or an approved comparison. A bounded WSL acquisition and manifest-only
inspection is the next feasibility step; a VPS transfer must wait for its
expanded-size and capacity check. The public gold must remain outside the
source-only selector even though the release bundles package it together.
The ARE effect assessment for the proposed exact WSL download returned an
external-effect/persistent-mutation **owner gate**. The bundle was therefore
not downloaded or extracted in this screen; the metadata check alone does
not satisfy that gate or authorize a new ARB campaign.

## Owner-approved WSL acquisition and manifest-only audit

Vlad subsequently approved the **exact** public `v2_trace2code` archive
download to private WSL storage, with no VPS transfer or GLM call. The pinned
revision URL was fetched to
`/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004/agent_retrieval_bench_v2_trace2code.tar.zst`.
Its measured length is **39,295,446 bytes** and local SHA-256
`19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4`,
matching the [author's release manifest](https://huggingface.co/datasets/eyuansu71/agent_retrieval_bench/blob/main/reports/v2_subset_releases_manifest.json).
The WSL destination filesystem had 792 GB free before acquisition. No VPS
copy was made.

Python 3.14's built-in zstd tar reader listed the verified archive without
extracting it: **120 members**, **300,175,960 uncompressed member bytes**,
and zero absolute/traversal paths, links, or device members. The two duplicate
release/benchmark manifests were read; no `samples.jsonl`, gold field,
scorer result, or source chunk content was opened. The release manifest
declares **101** `trace2code` samples, **98** repository/base-commit corpus
rows, **24,883** snapshot file entries, and **356,074** chunks across seven
repositories. Its `all_gold_in_corpus` and `all_samples_have_corpus` flags
are publisher claims, not yet an independent local validation. The archive
physically separates `benchmark/`, `corpus/`, `eval/`, and `reports/` paths;
that makes source/evaluator isolation feasible in principle, but extraction,
sample-schema inspection, adapter qualification, and any run remain undone.

This acquisition supersedes only the earlier no-download status, not its
claim boundary. The current G02 three-read episode does not emit the official
all-file ranking or BCY budget packer; neither metric nor superiority can be
inferred from having the bundle locally.

## Source-only isolation and score-blind development split

The [guarded extractor](../research/arb-trace2code-r1/isolate-source-r1.py)
(SHA-256 `ba2f48551cbdd5d9131736bacfe0ed5f9bef0b23c81863838da1500a5297aa8e`)
verified the archive hash and all 120 tar paths, then copied only the 98
corpus chunk files, corpus manifest, and release manifest to the separate
private `source-only-r1/` directory. It copied **100 source-side files,
299,191,545 bytes**, and no `benchmark/`, `eval/`, samples or gold file.
Its receipt SHA-256 is
`ab302e0f8de3c20d65d5584d526c82b85612cec4445264bf80e4c3e0edc104d1`.
The [source-only auditor](../research/arb-trace2code-r1/audit-source-corpus-r1.py)
(SHA-256 `1e4df25b661cead733a4f6a51eb1dd4322c9b06e42ae8357750806bf6979532b`)
rehash-checked every extracted file and matched **98/98** snapshot
identities, **356,074/356,074** chunk rows and **24,883/24,883** snapshot
file entries against the release manifest. It found **11** file-level rows
with empty text, admitted as metadata-only; empty symbol text remains rejected. Audit
SHA-256 is
`1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f`.

An evaluator-only schema pass established that each sample's intended query
has `command`, `failure_excerpt`, `run_strategy`, and `source_type`; gold,
spans and hard negatives are separate top-level fields. The sample's
`candidate_corpus.type` is `repo_at_base_commit`; the official `all_files`
candidate filter is a **later evaluator setting**, not that field's value.
The [allowlisted projector](../research/arb-trace2code-r1/project-dev-queries-r1.py)
(SHA-256 `d9c12cc8c995c3a3f52c7cd1f240253445c954388a5032a26235c9be4e863f38`)
then fixed a repository-grouped, score-blind split: **56 Gin cases for
development; 45 cases across the other six repositories withheld**. Only
the Gin task identity and four query strings were exported to private
`query-only-dev-r1/DEV-QUERIES.jsonl` at SHA-256
`19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a`.
The 45 holdout IDs are bound only by a set digest in `SPLIT-RECEIPT.json`
(SHA-256 `dc562df2664fcab9bca079ab502d4402aefec1f1eba48f366ad093bd9c783107`);
their queries and all gold values were **not exported**. An independent
`jq` shape check found 56 Gin rows and zero gold/negative/metadata fields.

This is logical source/evaluator separation, not an operating-system security
boundary: the original archive still contains the public labels and must
never be mounted or passed to the source-side adapter. The Gin-only
development set can qualify a retrieval mechanism; the 45-case holdout must
remain unopened until that mechanism, comparator, metrics, and claim scope
are frozen. The holdout is small and repository-imbalanced, so even a positive
result would support only an appropriately bounded ARB `trace2code` claim,
not ContextBench Span-F1 or broad ARE superiority. No ranking, score,
provider call, or held-out query read occurred in this step.

## Gin development retrieval result — source-only mechanism signal

The [fixed source-only r1 ranker](../research/arb-trace2code-r1/rank-gin-dev-r1.py)
(SHA-256 `427e04451bcedd5c42ffa48fecee5131345fa84b38ec347382a5cf92a1249997`)
ran on the sealed **56 Gin development queries** and all files in their
**54** pinned snapshots. Its local baseline is BM25 over the release's
file-level text and path. Its separate trace-aware variant uses the same
complete candidate set and adds fixed bonuses for Go error identifiers
found in source symbol names, file text, or paths, plus a fixed `_test.go`
penalty. Both full-file rankings were sealed before native gold access at
`SOURCE-RANKINGS.jsonl` SHA-256
`0ea333c9305e037df600c108b8fc67bfb67e26f686a352e518fe9b996e5e5b01`;
the private source receipt SHA-256 is
`af6bbee214743814c5d841763d7ed9b7944de4e015f28d040870c8006f05b2ee`.
There were zero provider calls, ARE episode reads, held-out queries, or
source-side label accesses.

Only then did the separate [evaluator-only auditor](../research/arb-trace2code-r1/audit-gin-dev-rankings-r1.py)
(SHA-256 `4297a50eb48ec872b48300167403f65e01cb25c6f2e96360db32108a180eaa9c`)
inspect the **56 Gin labels** (68 root-cause file entries). It skipped all
other-repository rows before accessing their gold fields, verified both
rankings had the same complete candidate set and every development gold
file was present, then reported these **local development diagnostics**:

| Metric | Local BM25 | Trace-aware r1 | Difference |
| --- | ---: | ---: | ---: |
| Mean reciprocal rank | 0.43753 | 0.48529 | +0.04776 |
| Mean Recall@3 | 0.48214 | 0.52381 | +0.04167 |
| Mean Recall@20 | 0.89583 | 0.94048 | +0.04464 |
| Hit-any@20 | 0.92857 | 0.96429 | +0.03571 |

Per-case MRR improved on **23**, regressed on **0**, and tied on **33**.
Independent `jq` arithmetic reproduced the 56-case denominator, 68 gold
entries, two MRR means, and gain/loss counts. The private evaluator receipt
SHA-256 is
`46254322449d937ffdfc0a9731a5872168df3862de28685bf10c72f2cebd14fb`.

This is a **positive development mechanism signal**, not an official ARB
score, a fair comparison to the author's BM25/RepoMap implementations,
or actual ARE runtime performance. It does not justify opening the 45-case
cross-repository holdout yet. Next, the mechanism must be implemented as
an ARE retrieval adapter with explicit all-file ranking and cost accounting,
checked against the official evaluator/baselines on development data, and
frozen without holdout feedback before any independent confirmation.

## ARE eight-hint development probe — equal-input diagnostic

The [source-only ARE probe](../research/arb-trace2code-r1/probe-are-gin-acquisition-r1.mjs)
ran the archived G02 `rank_sources` implementation itself (code SHA-256
`842e52a88c5b10542a55bb2c43ddc4d0e24adbec2ba0f8c2320fed6b1b6d07bb`)
against all 56 exposed Gin query-only cases and 54 corpus snapshots. It
materialized the ARB file-level snapshot text in private WSL Git indexes,
verified every expected file was indexed without omissions, and sealed
`ARE-HINTS.jsonl` before any evaluator access at SHA-256
`62272a5ca0cf2a3f4e7fc80c18c03b07725c882b93684ae64a5f6039bc51c92d`.
This is **not** an exact pinned Git checkout: the benchmark release's
file-level text is a snapshot/projection, and no full ARE model episode ran.
The probe used both the implementation's initial primer and an explicit
`rank_sources` query formed from the final 1,024 bytes of the failure excerpt.
There were no GLM calls, holdout queries, or source-side gold reads.

An initial evaluator-only [eight-hint audit](../research/arb-trace2code-r1/audit-are-gin-hints-r1.py)
found the ARE primer hit a gold file in 7/56 cases and its tail-query hints
in 8/56. Comparing these directly with the full-query local BM25/trace
rankings is **not input-budget matched**. A second source-only
[tail-1,024-byte ranker](../research/arb-trace2code-r1/rank-gin-tail1024-r2.py)
therefore fed the *same query window* to local BM25 and trace-aware scoring,
sealing `TAIL1024-RANKINGS.jsonl` at SHA-256
`541791cf826edb8bb3be7e4aa71981a6f01e517abeeee8470b709c1bcf41fff5`
before its [separate evaluator-only audit](../research/arb-trace2code-r1/audit-are-gin-tail1024-r2.py).
The latter skipped all non-Gin rows before accessing gold, found 68 gold file
entries, and independently checked the same all-file candidate count. Its
private receipt SHA-256 is
`dff3824a6cd69a597799f778a18a8a50e04ed05e6548680c324426cf67006a0e`.

| Equal tail-query development metric | Existing ARE line hints | Local file BM25 | Local trace-aware |
| --- | ---: | ---: | ---: |
| MRR@8 | 0.04035 | 0.35493 | 0.40659 |
| Hit-any@8 | 8/56 | 38/56 | 41/56 |
| Mean Recall@8 | 0.11905 | 0.65476 | 0.70833 |

Against the existing ARE hints, the local trace-aware rank improved
per-case MRR@8 on 38, regressed on three, and tied on 15. Against local BM25
with the same input window and corpus, it improved on 13, regressed on zero,
and tied on 43. A separate `jq` check reproduced 56 cases, 68 gold entries,
and 8/38/41 hit counts. The large ARE-to-file-ranker gap is a useful
development mechanism finding, **not an ARE treatment result**: local file
rankings are not yet wired into `rank_sources`, line-hint generation and
read-file delivery differ, the source is a projection rather than exact Git,
and the official ARB comparator/evaluator has not run. No held-out data or
superiority claim follows.

## Versioned ARE-compatible file-ranker candidate

The [private BM25 acquisition candidate](../research/arb-trace2code-r1/ranked-source-acquisition-bm25-r1.mjs)
(SHA-256 `52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788`)
implements the existing `rank_sources` tool schema and
`are.ranked-source-hints/v2` output while also exposing a complete ranked-file
list for development evaluation. It defaults to requiring an exact, clean
Git `HEAD` equal to `base_commit`; the ARB snapshot probe explicitly used
`allow_projection: true`. It retains the 64 MiB total/1 MiB per-file index
limits, eight hints, source line ranges, and the rule that hints are **not**
delivered source evidence. This is a versioned research candidate, not wired
into a campaign runner or released product. A clean exact-Git fixture test
passed, including rejection of a changed tracked file. The test had to use
private WSL archive storage because WSL `/tmp` was full; no existing `/tmp`
data was removed.

The [score-blind parity probe](../research/arb-trace2code-r1/probe-bm25-are-gin-r1.mjs)
used the same 56 exposed Gin tail-1,024-byte queries and 54 materialized
source snapshots. Its BM25 complete ranking and top eight matched the sealed
Python implementation **56/56**. The separate `trace-text` mode omits the
ARB-only symbol metadata and therefore matched the Python trace-aware top
eight on **47/56**, not 56/56. The candidate ranking seal SHA-256 is
`b2dbdbfc3145d0d313aa9aa3bf70162e97467f7f6bf51bd286bb0a82968335b7`;
the source receipt SHA-256 is
`5a29584761f219e3d7d6a02e12184ebc7fd2481c6e2210ec0f943625bff0f1aa`.
The candidate read no labels or held-out queries and made no model calls.

The [evaluator-only candidate audit](../research/arb-trace2code-r1/audit-are-bm25-candidate-r1.py)
then scored the sealed outputs on the same 56 exposed Gin cases (68 gold
file entries), skipping the other 45 cases before gold access. Its private
receipt SHA-256 is
`6f840684d4e3b3aecda9c62022beaa286f1b03ba2ad6176bd8e90990df6b3589`.

| Development metric | Archived ARE line hints | Candidate BM25 | Candidate trace-text |
| --- | ---: | ---: | ---: |
| MRR@8 | 0.04035 | 0.35493 | 0.40021 |
| Hit-any@8 | 8/56 | 38/56 | 41/56 |
| Mean Recall@8 | 0.11905 | 0.65476 | 0.70833 |
| Full-file MRR | not emitted | 0.37723 | 0.41942 |
| Mean Recall@20 | not emitted | 0.84226 | 0.90476 |

Trace-text improved MRR@8 over candidate BM25 on 13 cases, regressed on
zero, and tied on 43. An independent `jq` check reproduced the denominator,
68 gold entries, and 8/38/41 hit counts. This is **substantial development
retrieval improvement on a projected, single-repository population**, not a
live ARE episode, independent confirmation, or superiority over official ARB
baselines. Exact pinned Git checks, actual `read_file` delivery/cost, current
runner wiring, official evaluator parity, and a frozen cross-repository
confirmation remain open.

The archived G02 initial-source packet selects the first three ranked
non-generated hints before optional neighbor/focused reads. A read-only
check of the sealed candidate hints found **zero** generated-path exclusions
on these 56 Gin cases. Thus the evaluator's per-case MRR@8 values imply
top-three *path reach* of **3/56** for existing ARE line hints, **27/56** for
candidate BM25, and **28/56** for candidate trace-text. This is an inference
about the selection rule, **not** observed `read_file` delivery, byte cost,
or a full episode. The [official ARB repository](https://github.com/eyuansu62/agent-retrieval-bench)
separates static ranked-file metrics from closed-tool/trajectory context
metrics; these top-three counts cannot be placed on its static leaderboard.

The subsequent [source-only packet simulator](../research/arb-trace2code-r1/simulate-gin-initial-packet-r1.mjs)
reproduced the archived top-three selection and 50-line read windows against
the 54 materialized Gin source projections. Its sealed delivery ledger SHA-256
is `dd08238e038cdb7431fb8c0943a6bdf2dafeb0a6a43a91204f727448789e2c79`.
The separate [evaluator-only packet audit](../research/arb-trace2code-r1/audit-gin-initial-packet-r1.py)
(script SHA-256 `d948e85aa79bc4fda73466eecb9d03143869bdc0e7fcd2e1a00c4ecdc9bfa371`)
verified the 56-case denominator, 68 gold file entries, selected-path/read
agreement, summed delivered bytes, and the 49,152-byte packet cap. The private
audit SHA-256 is
`4092469a5aab60cc73a8796ee98ded6e3adce7faefa6bb1dfd55539063a2c540`.

| Simulated initial packet, exposed Gin | Archived ARE | Candidate BM25 | Candidate trace-text |
| --- | ---: | ---: | ---: |
| Gold-path hit in first three reads | 3/56 | 27/56 | 28/56 |
| Mean gold-file Recall@3 | 0.05357 | 0.42857 | 0.45238 |
| Mean delivered bytes | 4,379 | 4,672 | 4,797 |
| Maximum delivered bytes | 6,999 | 7,840 | 7,840 |

Independent `jq` arithmetic reproduced the 3/27/28 counts. This upgrades
the prior top-three *path inference* to a simulated source-read packet with
measured bytes, **not** an observed live `read_file` episode: no model was
called, and the source is still a file-text projection rather than the exact
pinned Git checkout. The ARB holdout and its gold remain uninspected.

## Bounded query-window development experiment

The fixed, source-only [edge-window probe](../research/arb-trace2code-r1/probe-gin-edge-window-r1.mjs)
(script SHA-256 `f1402974080624016ca274c430d30d39c7d551a63ee8e3a2ba1847c0604ea0c0`)
kept the same ARE-compatible BM25/trace-text candidate, corpus snapshots,
all-file candidate sets, and 1,024-byte query ceiling. For the 28 longer
failure excerpts, it replaced the tail-only window with a fixed first 509
bytes, `\n...\n`, and last 509 bytes; the other 28 queries were unchanged.
It sealed 56 score-blind complete rankings at SHA-256
`1e6d8d4170163318b05a693950db6609c21f7aef2d11911747e4f29c0cc30bcd`
before evaluator access, with zero gold, holdout, model, or VPS access.

The separate [evaluator-only audit](../research/arb-trace2code-r1/audit-gin-edge-window-r1.py)
(script SHA-256 `87796612564b779f98d594e2d14c0a77cd4a5e5fcd90573f3a5356f892e5c5a3`)
verified the pinned inputs, identical all-file candidate sets, 56 exposed Gin
cases, and 68 gold entries; its private receipt SHA-256 is
`6bac22a2d8ed6368b65e466277cd6c4472360c84d441c6fa078e461fc04e2ab5`.

| Exposed Gin source-projection metric | Tail BM25 | Edge BM25 | Tail trace-text | Edge trace-text |
| --- | ---: | ---: | ---: | ---: |
| Gold-path hit@3 | 27/56 | 30/56 | 28/56 | 31/56 |
| MRR@8 | 0.35493 | 0.43486 | 0.40021 | 0.47713 |
| Full-file MRR | 0.37723 | 0.45290 | 0.41942 | 0.49144 |
| Mean Recall@20 | 0.84226 | 0.84226 | 0.90476 | 0.88690 |

An independent `jq` check reproduced 28→31 trace-text top-three hits and
0.40021→0.47713 MRR@8. Edge trace-text improved per-case MRR@8 on 12,
regressed on six, and tied on 38. The loss in Recall@20 and these regressions
mean this is a **development tradeoff**, not a promoted policy or a superiority
result. The source remains projected rather than exact pinned Git; no live ARE
read/model episode, official comparator, or cross-repository confirmation ran.

The subsequent [edge-window packet simulator](../research/arb-trace2code-r1/simulate-gin-edge-packet-r1.mjs)
(script SHA-256 `281f182a85b89fc4293b665548aa7daa3c9f56aa8c692f71d7b0dcdc84686326`)
recomputed candidate hints, required exact agreement with the sealed edge
rankings, and simulated the same top-three, 50-line source reads. Its sealed
delivery SHA-256 is
`017f65598750edf88eef5ebfd0de94c76569c76613a8365d60fd2295f3e804a2`.
The separate [evaluator-only packet audit](../research/arb-trace2code-r1/audit-gin-edge-packet-r1.py)
(script SHA-256 `68d25d5c17053fe98b63f58c6658ed8a8f1ba17ff2d94979522351dbafb69bcf`)
verified 56/56 packet contracts and 68 gold file entries, with receipt
SHA-256 `8bfe36a9f0207a580505ca6a91b4aee976b192b2e3cfacc659154fd9d8d2aa3c`.

| Simulated first-three-read packet | Tail BM25 | Edge BM25 | Tail trace-text | Edge trace-text |
| --- | ---: | ---: | ---: | ---: |
| Gold-path hit | 27/56 | 30/56 | 28/56 | 31/56 |
| Mean gold-file Recall@3 | 0.42857 | 0.48214 | 0.45238 | 0.50595 |
| Mean delivered bytes | 4,672 | 4,691 | 4,797 | 4,777 |

For trace-text, four cases gained and one lost a top-three hit; average
delivered bytes fell by 20.1. Independent `jq` arithmetic reproduced the
28→31 hit counts and byte means. The bounded 49,152-byte packet cap passed
in every case (maximum edge packet 8,359 bytes). The gain survives this
**simulated** delivery contract but remains development-only; it neither
repairs the Recall@20 regression nor proves live ARE or official ARB
superiority.

The separate [evaluator-only BCY audit](../research/arb-trace2code-r1/audit-gin-bcy-r1.py)
(script SHA-256 `13418251da59fab67a985bafdef78597eee0fd4470b17c1a7241dcb7bb57bc43`)
applied a local replica of the pinned official `bcy_curve.py` regex tokenizer,
top-20 ranked-file packing, file-header accounting, and one-content-token
coverage rule to the same sealed rankings and isolated corpus file rows.
It is **not the official ARB executable**. The private audit SHA-256 is
`519c5729f13c757bd7e40f87059c86f9c68dab460847d34e52b6e3859344357f`;
56 exposed cases, 68 gold entries, full candidate-set agreement, and zero
held-out gold access passed. Independent `jq` arithmetic reproduced the
trace-text means below.

| Local canonical-formula BCY | Tail BM25 | Edge BM25 | Tail trace-text | Edge trace-text |
| --- | ---: | ---: | ---: | ---: |
| BCY@4K | 0.37500 | 0.41071 | 0.41667 | 0.45238 |
| BCY@8K | 0.52976 | 0.58333 | 0.58333 | 0.63690 |
| BCY@16K | 0.70833 | 0.72619 | 0.78869 | 0.78869 |
| BCY@32K | 0.84226 | 0.84226 | 0.90476 | 0.88690 |

The edge trace-text window improves the **8K development objective** by
0.05357 absolute BCY (five cases improve, two regress) but loses 0.01786
at 32K (one case regresses). This is a budget-dependent tradeoff, not a
uniformly better policy, official leaderboard score, or independent claim.
It is also distinct from the simulated three-read packet, whose delivered
bytes are not the official ranked-full-file token packing.

An evaluator-side [paired uncertainty audit](../research/arb-trace2code-r1/audit-gin-paired-uncertainty-r1.py)
(script SHA-256 `fa9b0cb57ebb8c8d9fa72e10ef93652fb4b675c4f4af5aebd26cd1d42d7d6dfe`)
joined only the sealed numeric audits and exposed query-only lengths. It
verified that all 28 unchanged-window cases had **exactly zero** metric
delta; all measured changes came from the 28 long excerpts. With 20,000
deterministic paired resamples of the 54 base-commit clusters, its private
receipt SHA-256 is
`ca3c5abc25da6e64ab8626083677a071835b7d95515cbc2278d0ed13763d39fa`.
On all 56 exposed cases, edge-minus-tail trace-text mean deltas and
descriptive percentile 95% intervals were:

| Development contrast | Mean delta | Cluster bootstrap 95% interval |
| --- | ---: | ---: |
| BCY@8K | +0.05357 | −0.03571 to +0.14545 |
| First-three-read gold-path hit | +0.05357 | −0.01818 to +0.13793 |
| MRR@8 | +0.07691 | +0.01495 to +0.14819 |
| BCY@32K | −0.01786 | −0.05556 to 0 |

The 8K BCY and packet-hit intervals include zero. The MRR interval does not,
but these 56 cases were already used to develop the candidate, and all are
from one repository. None of these descriptive intervals is independent
confirmation, a predeclared superiority test, or a substitute for live ARE
and official comparator execution.

## Projected read-tool semantics qualification

The actual [repository `read_file` tool](../../../benchmarks/contextbench-v1/repository-tools.mjs)
(source SHA-256 `ea85151b55462ec1a294162a8f38f95a9fd0290fb44e018abd7f27315425bb66`)
requires Git `HEAD` to equal the pinned base commit. The materialized ARB
file-text projections are not those exact Git checkouts, so passing them
through a synthetic commit would not be a valid live pinned-base test.
The [source-only semantics auditor](../research/arb-trace2code-r1/audit-gin-read-semantics-r1.mjs)
(script SHA-256 `9325c627342d1cb880cbe9bf4ee86a135e52994e6c6ce8623a67917364827e9c`)
instead applied the tool's exact UTF-8 decoder, newline/end-line rules,
2,000,000-byte file cap, and 32,768-byte result cap to each previously
sealed simulated read. Its private receipt SHA-256 is
`220f226b2268335a09b0af55da7fd094faba3408eff7d52d920158add16db009`.

Across the archived ARE and tail/edge candidate variants, **840/840** reads
matched the simulated content hash, byte count, and end line; all 840 were
within the actual tool's per-file and per-read limits. An independent `jq`
sum reproduced those counts. This qualifies the projection's read-window
semantics only. It does not satisfy the tool's Git-base guard, confirm model
delivery, measure native score, or establish superiority.

## Trace-to-code comparability check

A read-only inspection of the official
[`baseline.py`](https://github.com/eyuansu62/agent-retrieval-bench/blob/07014c986f3deadb1548c62b32c0ffbe6a81465d/src/agent_retrieval_bench/baseline.py),
[`repomap_eval.py`](https://github.com/eyuansu62/agent-retrieval-bench/blob/07014c986f3deadb1548c62b32c0ffbe6a81465d/src/agent_retrieval_bench/repomap_eval.py), and
[`bcy_curve.py`](https://github.com/eyuansu62/agent-retrieval-bench/blob/07014c986f3deadb1548c62b32c0ffbe6a81465d/src/agent_retrieval_bench/bcy_curve.py)
at Git commit `07014c986f3deadb1548c62b32c0ffbe6a81465d` found a consequential input
and metric mismatch. Its `query_text_for_eval` serializes the **entire** sample
`query` object, while our current ARE-compatible development probe sends only
the tail 1,024 bytes of `failure_excerpt` through the existing
`rank_sources` tool limit. The official RepoMap evaluator also adds
trace2code-specific source/test affinity and graph propagation. Its canonical
BCY uses regex-tokenized, rank-ordered full-file packing with a possible
token-boundary prefix of the first file that exceeds the remaining budget;
our simulated 50-line, three-read packet is a different closed-tool object.
An independent `jq` check of the already exposed 56 Gin query-only records
found **28/56** failure excerpts above 1,024 UTF-8 bytes (median 1,174;
maximum 4,019), so the tail window actually discards input in half the
development cases. The full query JSON has median 1,321 and maximum 4,480
bytes. This is a measured mismatch, not merely a theoretical one.
Therefore neither the published RepoMap leaderboard number nor an official
BCY value can be compared directly with our present development scores.
Before a superiority comparison, freeze a common input contract and run both
arms under it, then report official static metrics and the distinct live
packet/episode metrics separately.

The [official dataset card](https://huggingface.co/datasets/eyuansu71/agent_retrieval_bench/blob/main/README.md)
shows that `trace2code` is not repository-balanced: **56 of its 101 cases are
from `gin-gonic/gin`**, 26 are from `pallets/click`, seven from Caddy, six from
Tokio, four from etcd, and one each from Clap and pytest. A random case-level
split would therefore make a seemingly independent result heavily dependent
on Gin. Any claimed cross-repository transfer needs repository-grouped
development/confirmation separation and per-repository results; a 101-case
overall estimate alone would not establish broad superiority.

The official positive-retrieval protocol ranks against **`all_files`** and
reports file-level MRR, Recall@k, Precision/F0.5 and token-budgeted BCY.
For `trace2code`, its published RepoMap baseline leads MRR and Recall@20;
this makes RepoMap, alongside its official lexical/BM25 baselines, a relevant
comparison for an ARB-native study. ARE's current three-read G02 episode
cannot be relabeled as an official ranked-file evaluation: an adapter must
first emit a complete score-blind file ranking or declare a distinct
closed-tool/trajectory track, and use the benchmark's own evaluator and
budget packing. These are compatibility requirements, not observed ARE
performance. This comparability check used only the already exposed Gin
query-only projection; it opened no new sample, held-out query, or gold file.

Two other primary-source candidates are weaker for this exact purpose.
[RepoContextBench v1](https://github.com/CodeAlive-AI/repo-context-bench)
publishes 20 questions with evidence spans from one pinned repository, but
its primary result is judged answer quality rather than matched file/span
retrieval; its v2 40-task dataset was described as not yet published when
checked. [CodeQueries](https://github.com/thepurpleowl/codequeries-benchmark)
has answer/supporting spans inside an already supplied source file, not
repository-wide context acquisition. Neither should silently substitute for
G01's current metric or population.

## Source-only ARB BM25 comparator replica (exposed Gin development)

The [pinned ARB baseline implementation](https://github.com/eyuansu62/agent-retrieval-bench/blob/07014c986f3deadb1548c62b32c0ffbe6a81465d/src/agent_retrieval_bench/baseline.py)
scores **all source chunks** with BM25 and deduplicates ranked chunks to file
paths. A local [source-only replica](../research/arb-trace2code-r1/rank-gin-official-bm25-replica-r1.py)
(script SHA-256 `f74e618066629b843ecd4e8fe1c7ccea87bcb86cd6860da58716299811ca6cf1`)
applied that method to the pinned 54 Gin base-commit corpora and 56 already
exposed Gin development queries. It emitted complete rankings for (a) the
official full query JSON, (b) the 1,024-byte failure-excerpt tail used by the
ARE-compatible candidate, and (c) the fixed 1,024-byte edge excerpt. The
source-only rankings SHA-256 is
`1d8b81e146fa0d01911e4a03d75db64e79af8020030cbead889beadb44505e78`.
No model was called and no gold or held-out query was opened by the ranker.
The later [pinned-function parity check](../research/arb-trace2code-r1/check-gin-official-bm25-parity-r1.py)
(script SHA-256 `c527cf97be4e0d3279367a35002a9fc4e09108c38476304e9329da4bcaafb65f`)
verified the exact official `baseline.py` source SHA-256
`5a82f9a087eb90f9ada2ad6b6047fe8b9781b013749f3d176b1cbdbe7b7f05d1`,
executed only its tokenization, chunk BM25, and unique-path functions in
memory, and found **168/168 identical complete file rankings** across all
56 cases and three inputs. The private parity audit SHA-256 is
`772fbd5500973bd88bcb76a532540399ae35ff4c0885283c3b9ff358ed9a7d1a`.
This proves rank-order parity for the exposed source-only inputs, not official
package evaluation or live ARE behavior.

The separate [evaluator-only comparison](../research/arb-trace2code-r1/audit-gin-official-bm25-replica-r1.py)
(script SHA-256 `8c99c0a921fff7890032432097c13c07a4296c2b0c2f38dc1403d6a779490c89`;
private audit SHA-256 `ca8f22359c50c1d99ff609b0807973037f4b7bf8601246c7ef949a47921aaa9d`)
opened only Gin gold after the rankings were sealed. All seven arms share
the same 56 cases, all-files candidate universe per case, and 68 gold file
entries:

| Source-only arm | MRR@8 | Top-3 hit | Recall@20 |
| --- | ---: | ---: | ---: |
| ARB BM25 replica, full query JSON | 0.1525 | 12/56 | 0.5089 |
| ARB BM25 replica, tail failure excerpt | 0.1609 | 13/56 | 0.6250 |
| ARE candidate BM25, tail failure excerpt | 0.3549 | 27/56 | 0.8423 |
| ARE candidate trace-text, tail failure excerpt | 0.4002 | 28/56 | 0.9048 |
| ARB BM25 replica, edge failure excerpt | 0.1851 | 15/56 | 0.6012 |
| ARE candidate BM25, edge failure excerpt | 0.4349 | 30/56 | 0.8423 |
| ARE candidate trace-text, edge failure excerpt | 0.4771 | 31/56 | 0.8869 |

The input-matched edge trace-text minus ARB BM25 replica MRR@8 difference
is +0.2920 (32 improved, five regressed, 19 tied cases). This is a useful
development diagnostic **only**. The official full-query row is a different
input contract and must not be portrayed as a matched comparison. The ARB
ranker here is a source-level replica with pinned-function parity, not execution
of the official package evaluator;
the ARE rankings are source-only projections, not live ARE episodes. All
56 cases are exposed, all from Gin, and adaptive work selected the candidate.
No independent or broad superiority claim follows. The next claim-bearing
step is to freeze matched inputs and run both implementations through a
verified official comparator/ARE adapter on repository-grouped confirmation,
with native metrics, receipts, and cost.

Private WSL receipts are under
`/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004/` in
`gin-official-bm25-replica-source-r1/` and
`gin-official-bm25-replica-eval-r1/`, with the later parity receipt in
`gin-official-bm25-parity-r1/`; nothing was sent to the VPS.

The separately [frozen non-Gin source-only transfer](G01-ARB-NONGIN-SOURCE-TRANSFER-FREEZE-2026-10-04.md)
has now [finished](G01-ARB-NONGIN-SOURCE-TRANSFER-RESULT-2026-10-04.md):
45/45 complete rankings across six repositories, with ARE edge trace-text
MRR@8 **0.18003** versus matched ARB BM25 **0.18000**. The paired mean
delta is +0.0000265, the exact repository-cluster sign-flip `p` is 1.0, and
the cluster-bootstrap interval spans −0.0731 to +0.1388. The predeclared
superiority gate failed. Those 45 cases are now exposed; the Gin development
gain did not independently transfer and must not be advertised as superiority.
The [post-confirmation retrieval diagnosis](G01-ARB-POSTCONFIRMATION-RETRIEVAL-DIAGNOSIS-2026-10-04.md)
then rejected a fixed chunk/file RRF replacement for early ranking: it raised
non-Gin Recall@20 to 0.6704 but lowered MRR@8 to 0.1725. These are exposed
development observations only. The next candidate should use chunk/file
coverage as input to a separate query-conditioned reranker, then seek a new
independent population; the 101 trace2code cases cannot be re-labeled fresh.

## Admission before any new campaign

1. Pin an exact ARB release and hashes; inspect download sizes **before**
   selecting VPS storage. Prefer a bounded subset on WSL for source-only
   feasibility, keeping evaluator labels out of ARE's selector.
2. Audit overlap by repository, base commit, workflow signal, and instance ID
   against G01/G02 exposed inputs; publish a separate exclusion ledger.
3. Freeze a distinct objective and metric (file-level retrieval plus cost and
   no-gold behavior where applicable), comparator, development/confirmation
   split, and claim wording. Do not call it ContextBench Span-F1.
4. Qualify the adapter and source-only selection on development cases; then
   run independent matched confirmation with sealed inputs, native evaluator,
   usage, uncertainty, and full denominator. Require a separate route/effect
   assessment for any VPS download, provider spend, or campaign launch.

## Open Questions

- Can the versioned `rank_sources` candidate be qualified against exact
  pinned Git checkouts, wired into a frozen ARE runner, and measured through
  actual `read_file` delivery and cost without losing its retrieval gain?
- Are any ARB task signals or pinned commits already exposed in our G01/G02
  development work, beyond repository-name overlap?
- Can the current ARE episode produce the official ranked-file output without
  changing the benchmark's `all_files` candidate-set contract?
- What independent claim would this external file-level study support, and
  which original G01 ContextBench claim remains separately unproven?
