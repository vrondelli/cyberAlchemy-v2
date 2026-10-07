# G01 ARB post-confirmation retrieval diagnosis

The [non-Gin confirmation](G01-ARB-NONGIN-SOURCE-TRANSFER-RESULT-2026-10-04.md)
failed its superiority gate and exposed all 45 non-Gin cases. Everything in
this note is **post-confirmation development**, not a new independent result.
No GLM call, VPS transfer, or live ARE episode was made.

**Correction:** The r1 source-neighbor and r1 BCY results below used the full
failure excerpt for the new arm, while both comparator rankings used only the
1,024-byte edge window. They are retained as provenance but are **not fair
matched-input comparisons**. The matched-edge r2 results later in this note
supersede them for development decisions.

## File-level versus chunk-level gap

An evaluator-only [numeric file/chunk audit](../research/arb-trace2code-r1/diagnose-nongin-file-chunk-gap-r1.py)
(script SHA-256 `2e6d47981ca669db2690b648a9f8c05094af4183d1347f88473c35fc52d03fb1`;
private audit SHA-256 `df07e9e5e456dcb7538af16d1f999547a310b72f498b178931e3294a790cd005`)
found 59 gold-file entries: ARB BM25 ranked 28 better, ARE ranked 29 better,
and two tied. Many source-corpus file rows cluster at about 8 KB; **44/59**
gold file rows are at least 8,000 UTF-8 bytes. ARB separately indexes symbol
chunks; ARE's current candidate indexes only the capped file-level rows.

A second [symbol-only token audit](../research/arb-trace2code-r1/diagnose-nongin-symbol-only-evidence-r1.py)
(script SHA-256 `4a63dcda82e921b90af0cba680ca744ff54ace9539dc53319dae64c81c6aa0f9`;
private audit SHA-256 `8fbde9ab6aad3c242934091ef76aad29f86b7745bfea0094a4b8365697e6b032`)
found at least one query token present in the gold file's symbol chunks but
absent from its file row in **22/28** ARB-better files and **24/29** ARE-better
files. In Click this was **17/19** versus **11/11**. Thus capped file rows
and omitted symbol evidence are real, but this binary feature does **not**
explain which ranker wins. The ARB-better group had fewer query-token types in
its file rows on average (21.0 versus 25.6), an exploratory association only.
Neither audit proves a causal fix; no gold paths were exported in the reports.

## Fixed chunk/file fusion ablation

A separate [source-only predictor](../research/arb-trace2code-r1/probe-arb-fixed-rrf-r1.py)
(script SHA-256 `7987b0f2f5e7918a8fc5037be910afbd6c072a869f7af851968dc4215c92e4ab`)
combined the already sealed matched edge-input ARB chunk BM25 and ARE
trace-text file rankings with equal-weight reciprocal-rank fusion, fixed
`k=60`, on all 101 now-exposed cases. The source seal SHA-256 is
`9b03ffa889ae0e45e81fb8c1828ad38f0d20d874d3939b38a5ac4542d0cafbde`.
Its separate [evaluator](../research/arb-trace2code-r1/audit-arb-fixed-rrf-r1.py)
(script SHA-256 `55339135035b8f62b7abbfa57ed60def7c3253c95632c635328957ae0185ec7b`;
private audit SHA-256 `dc510a99aa7016241de4f4dba7bbfe134f4adf839e9cb9b220bf6bb7f29f2cf9`)
found:

| Exposed population / arm | MRR@8 | Recall@20 |
| --- | ---: | ---: |
| Non-Gin 45, ARB chunk BM25 | 0.1800 | 0.5370 |
| Non-Gin 45, ARE file trace-text | 0.1800 | 0.5148 |
| Non-Gin 45, fixed RRF | 0.1725 | 0.6704 |
| All 101, ARB chunk BM25 | 0.1828 | 0.5726 |
| All 101, ARE file trace-text | 0.3448 | 0.7211 |
| All 101, fixed RRF | 0.2531 | 0.7591 |

The fusion improves top-20 candidate coverage but worsens MRR@8 relative to
the better standalone arm. Click and the single pytest case remain weak at
early ranks. It is **rejected as a first-stage ranker replacement**. The gain
at Recall@20 supports testing a distinct two-stage candidate: a union of
chunk and file evidence followed by a query-conditioned reranker, with a
fixed cost budget and no access to evaluator labels. This is a mechanism
hypothesis, not a demonstrated improvement. Any tuning on these 101 cases
turns them into development data; an independent population is required
before a superiority claim.

A second fixed [gold-blind minimum-rank ordering](../research/arb-trace2code-r1/probe-arb-minrank-r1.py)
(script SHA-256 `82ebaabc8edafeee847520b68a761f092a365b503cbcd2b5191aa9b139d48bde`;
source seal SHA-256 `c759650060d9b927136eb5d2bf532506fcca47a270c5f38ea4a6a00ccac0fe1a`)
sorted by the better of the two input ranks, then their rank sum and path.
Its separate [exposed-data evaluator](../research/arb-trace2code-r1/audit-arb-minrank-r1.py)
(script SHA-256 `057733840d8130bd75748d81b899e5fd1f1f5129f4eeceb4138cc604cab29535`;
private audit SHA-256 `bdc40c28cbf77ea490662005a460692993708c1bc1b8859f1184deff8555762e`)
raised non-Gin MRR@8 to **0.2032** and Recall@20 to **0.6370**, versus
roughly 0.1800 MRR@8 for either standalone arm. But Gin MRR@8 fell to
**0.3438** from ARE's **0.4771**, and overall 101-case MRR@8 fell to
**0.2811** from ARE's **0.3448**. This variant is also **rejected as a
general ranker replacement**. It demonstrates complementary non-Gin hits,
not transferable superiority; neither fixed rank-combination rule resolves
the early-rank tradeoff. No additional independent cases were consumed.

The [ARB authors' release inventory](https://github.com/eyuansu62/agent-retrieval-bench)
lists other positive workflow subsets—`code2test` (106),
`comment2context` (80), and `edit2ripple` (58)—distributed as separate
self-contained releases. These are possible *cross-workflow* populations,
not fresh `trace2code` replicas; query contracts, gold meaning, source overlap,
official comparator, and release size must be audited before selecting one.
The same source reports that no retrieval family leads every workflow and
that RepoMap, not BM25, leads published `trace2code` MRR/Recall@20. A future
claim therefore needs a stronger comparator than BM25 alone.

## Trace-mentioned test → source-neighbor probe

A first [source-only exposed-data probe](../research/arb-trace2code-r1/probe-trace-source-neighbor-r1.py)
(script SHA-256 `dd2fc32df6621afd054d5ede52a9894a08f7bf3b0ecbd09a60d95f27c58a6db5`)
used the same 101 already-exposed rankings, but incorrectly consumed the
**full** allowlisted failure excerpt when the comparator rankings consumed
only its 1,024-byte edge window. It finds test files named in an excerpt,
maps language-conventional test basenames to the nearest matching source
basename, and promotes at most three matches while preserving the original
ARE order for every other file. The prediction script does not open the
archive, labels, or evaluator. It changed 52/101 full-file rankings and sealed
its output at SHA-256
`43715becfba62f33ccab93e405cae07c7af2ac8bed8fe33622621303703dbe1c`
(source receipt SHA-256
`bea47e533a7c899b2d94e981a0371ad0a29d8b5045151fe4a2f5710052e09b06`).

Only after that seal, a separate
[evaluator](../research/arb-trace2code-r1/audit-trace-source-neighbor-r1.py)
(script SHA-256 `0111a6a8087294b391351dfad9baeb516249293994f283adbf48c5b45658c14`;
private audit SHA-256
`6663c02f826abb2f8c6e154249870eb4019f46584c75f2eb3e8e945326647043`)
scored all 101 exact candidate universes against the now-exposed labels.

| Exposed population / arm | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| All 101, ARE trace-text | 0.34475 | 0.42574 | 0.72112 |
| All 101, source-neighbor probe | 0.57806 | 0.61386 | 0.72112 |
| Non-Gin 45, ARE trace-text | 0.18003 | 0.26667 | 0.51481 |
| Non-Gin 45, source-neighbor probe | 0.23743 | 0.31111 | 0.53704 |

Against the ARE ordering, 33 cases gained MRR@8, five lost, and 63 tied.
The unmatched-input response is heterogeneous: Gin 0.47713→0.85179, Caddy
0.45238→0.69048, etcd 0.25000→0.62500, but Click
**0.11058→0.08814**. This is an **unmatched-input exploratory** mechanism signal,
not a transferable gain or a candidate for direct promotion. The post-hoc
non-Gin paired MRR@8 delta is +0.05741, but an exact
six-repository sign-flip diagnostic gives two-sided `p=0.5`; this is
exploratory uncertainty, not an independent inference gate. It is not a live
ARE/GLM episode, exact-Git source index, ContextBench Span-F1 result, or
independent comparison. Reusing these 101 labels to revise this heuristic
would remain post-confirmation development. The test/source linkage may
overlap the published RepoMap method, which leads the author's trace2code
leaderboard; the release archive contains no stored RepoMap ranking for the
exact matched edge query. A fair stronger-comparator run and a new
repository-separated confirmation population remain required before any
superiority claim. No provider call or VPS transfer was made.

## Stronger comparator preparation

A read-only check of the author's GitHub tree and the verified `v2_trace2code`
archive found no published per-case RepoMap predictions for this release.
The [official ARB source](https://github.com/eyuansu62/agent-retrieval-bench)
defines RepoMap over file nodes, import/symbol/test-source graph edges, a
query score, personalized PageRank, and task affinity. In particular its
test/source edge overlaps the mechanism above; BM25 alone is therefore a
weak comparison. The author's pinned source commit is
`07014c986f3deadb1548c62b32c0ffbe6a81465d` (the same commit used for
the earlier BM25-function parity check). The public repository declares no
required Python runtime dependencies.

A [source-only official-RepoMap adapter](../research/arb-trace2code-r1/rank-exposed-official-repomap-r1.py)
is prepared but **not run**. It requires an exact clean checkout at that
commit, the sealed source-only corpus, the 101 exposed query projections, and
the already sealed matched edge-query hashes. It would emit all-file RepoMap
rankings before an evaluator sees gold. The official-code WSL acquisition
was submitted as an exact owner gate; no checkout, RepoMap prediction, score,
or new superiority evidence has been produced at this point.

A [separate source-only adapter preflight](../research/arb-trace2code-r1/preflight-exposed-official-repomap-r1.py)
(script SHA-256 `a07dfe67ca8d17af2e68af71fe11d6da51f3e33fe7e2d88479ffbecf7fe29be7`;
private receipt SHA-256
`403e9d37cffb349bfd75a30ef61672fc5fad3b216b2702da73feb2c3d4b8fb93`)
has now passed without acquiring the official checkout or opening gold. All
98 snapshot files matched their declared counts (356,074 chunks and 24,883
file entries), with zero candidate-universe mismatches against both sealed
ranking arms. All 101 query identities and reconstructed 1,024-byte
edge-query hashes matched. The largest snapshot has 1,431 files. A read-only
inspection of the [pinned official RepoMap module](https://github.com/eyuansu62/agent-retrieval-bench/blob/07014c986f3deadb1548c62b32c0ffbe6a81465d/src/agent_retrieval_bench/repomap_eval.py)
confirmed the adapter's imported function names and ranking call signature.
An additional source review confirmed that the prepared adapter supplies the
same 1,024-byte edge query to both RepoMap's lexical query score and its
task-affinity/path-mention calculation; the `trace2code` sample fields do not
introduce the omitted tail of the original failure excerpt through an
alternate affinity input. The adapter also fixes the official evaluator's
default query/PageRank/affinity weights at 0.65/0.25/0.10. This resolves an
input-parity concern before dispatch, but does not validate numerical parity
with the official evaluator or produce a ranking.
This establishes input readiness only; it is not a RepoMap run, performance
comparison, live ARE result, or independent superiority evidence.

### Published RepoMap reference is not a matched comparator

The author's [paper, Table 20](https://arxiv.org/pdf/2607.24882) reports
`trace2code` aider-style RepoMap MRR **0.2742** and Recall@20 **0.8366** on
101 cases. The pinned [V1.1 completion audit](https://github.com/eyuansu62/agent-retrieval-bench/blob/07014c986f3deadb1548c62b32c0ffbe6a81465d/docs/v1_1_completion_audit.md)
instead reports MRR **0.2745** and Recall@20 **0.8465** on 101 cases. These
are distinct published aggregates, not interchangeable exact-run receipts.
The verified local `v2_trace2code` release archive (SHA-256
`19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4`)
contains no per-case RepoMap rankings or aggregate evaluation report, so it
cannot reconcile the difference or supply a paired comparison. The paper's
RepoMap BCY@8K **0.3828** is pooled over three core task families, not a
`trace2code`-specific figure.

The exposed Go-only r3 arm below uses a reconstructed 1,024-byte edge query
and reports truncated MRR@8 **0.55885**. The published RepoMap MRR uses the
author's evaluation input and metric, and its exact query/label/run binding
to this local arm is not established. A numerical cross-row comparison would
therefore be misleading. The next valid development comparison is the
prepared official RepoMap adapter on the same sealed query and candidate
universe, followed by a separately sourced confirmation population for any
superiority claim.

## Budgeted-context check on the sealed exposed rankings

A separate [evaluator-only BCY audit](../research/arb-trace2code-r1/audit-trace-source-neighbor-bcy-r1.py)
(script SHA-256 `92abcce5bf831b6884bb104fdd6ea7c66abd3134101d12bc12ef83cfd`;
private numeric audit SHA-256
`da01a679af0cc2bb73c66db8c32651c3b0ae807790bec5899e13b45bcb555bee`)
used the unchanged sealed predictions, isolated canonical file texts, and
now-exposed gold. It reproduced the author's published BCY tokenizer and
greedy top-20 file-packing rule, including path headers, prefix truncation,
and the requirement for at least one non-header gold-content token. The
author's toy tokenizer and partial-gold fixtures passed against this audit
implementation. This is a method-faithful local audit, not execution of the
official package evaluator.

| Exposed population / arm | BCY@4K | BCY@8K | BCY@16K | BCY@32K |
| --- | ---: | ---: | ---: | ---: |
| All 101, ARB chunk BM25, matched edge query | 0.1881 | 0.3234 | 0.4340 | 0.5528 |
| All 101, ARE trace-text | 0.3201 | 0.4719 | 0.5957 | 0.7063 |
| All 101, source-neighbor probe | 0.5660 | 0.6056 | 0.6502 | 0.7112 |
| Non-Gin 45, ARB chunk BM25 | 0.1852 | 0.2926 | 0.4148 | 0.5370 |
| Non-Gin 45, ARE trace-text | 0.1556 | 0.2667 | 0.3556 | 0.4815 |
| Non-Gin 45, source-neighbor probe | 0.2333 | 0.3222 | 0.4111 | 0.5148 |

At 8K, the neighbor rule improved 17 cases, worsened zero, and tied 84
against ARE trace-text; Click's mean BCY@8K tied despite its MRR regression.
The non-Gin paired BCY@8K delta is +0.05556, but an exploratory exact
six-repository sign-flip gives `p=0.5`. At 16K and 32K the non-Gin neighbor
arm remains below matched ARB BM25. Thus this unmatched-input 8K development improvement
survives canonical budget packing, but it neither establishes cross-repo
superiority nor substitutes for the pending RepoMap and independent/live
checks. No new cohort, provider call, or VPS transfer was used.

## Matched-edge r2 correction

The [r2 source-only predictor](../research/arb-trace2code-r1/probe-trace-source-neighbor-r2.py)
(script SHA-256 `ab8ee3958f924f67606999cec5ae672f419284002a7a79987ded95c69f3e59db`)
reconstructed the **exact same 1,024-byte edge window** used by both frozen
rankings and checked each reconstructed query SHA-256 against its sealed base
row. It preserved the r1 promotion mechanism, changed 49/101 rankings, and
sealed all-file predictions at SHA-256
`60c8bfc9cbca8c71f52b93b4b114f488c3306e244a917d4d9360ee8e6d5fa4a0`
(source seal SHA-256
`3ade08e2a1fc90dc5db08f11bfb360d5c870fcc651562ad48e08e190084a93ae`).
Gold remained isolated until the seal was written. The already-downloaded
public 39.3 MB ARB release in private WSL storage was reverified at published
SHA-256 `19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4`;
the isolated source-only corpus audit remained pinned at
`1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f`.
No duplicate download or VPS transfer was needed.

Separate [r2 rank](../research/arb-trace2code-r1/audit-trace-source-neighbor-r2.py)
and [r2 BCY](../research/arb-trace2code-r1/audit-trace-source-neighbor-bcy-r2.py)
evaluator wrappers used the frozen r1 scoring logic only after sealing.
Their private numeric audit SHA-256 values are respectively
`f9efff41392700755b93dd5a786467d60f73037024d6c6a9de9f3ff84eccd5ea`
and `358bfc078aa10fa20674fecaaa7dc896d3f2fd09c6a71c356c2e0c278aa56f60`.

| Exposed population / matched-query arm | MRR@8 | BCY@8K |
| --- | ---: | ---: |
| All 101, ARB chunk BM25 | 0.18284 | 0.32343 |
| All 101, ARE file trace-text | 0.34475 | 0.47195 |
| All 101, matched-edge source-neighbor r2 | 0.55308 | 0.59571 |
| Non-Gin 45, ARB chunk BM25 | 0.18000 | 0.29259 |
| Non-Gin 45, ARE file trace-text | 0.18003 | 0.26667 |
| Non-Gin 45, matched-edge source-neighbor r2 | 0.23743 | 0.32222 |

The matched-input improvement remains a development signal, especially on
Gin; it does **not** establish superiority. All 101 labels are exposed,
RepoMap remains unrun, and no exact-Git/live ARE/GLM or fresh confirmation
was performed. At 16K and 32K the non-Gin r2 arm remains below matched ARB
BM25. Future comparisons must use r2, not r1, as the source-neighbor arm.

The matched r2 arm gains MRR@8 on 30 cases, loses on five, and ties on 66;
its BCY@8K gains on 16, loses on none, and ties on 85. The result is
repository-heterogeneous: MRR@8 improves on Gin, Caddy, and etcd, declines
on Click (0.11058→0.08814), and ties on three other repositories. A
post-hoc, equal-repository exact sign-flip diagnostic over the four nonzero
MRR deltas gives two-sided `p=0.25`; the same calculation for BCY@8K over
three nonzero repositories gives `p=0.25`. This is exploratory uncertainty,
not a preregistered or independent inference test. Click has only six changed
rankings among 26 cases, and its BCY@8K stays 0.21154; the mechanism neither
solves its low baseline nor shows broad transfer. No Click-specific exception
should be promoted from these exposed labels.

## Exposed promotion-confidence diagnosis

A [counts-only join](../research/arb-trace2code-r1/diagnose-matched-neighbor-confidence-r1.py)
(script SHA-256 `c07608b4b3fb5f799bef77d3c39ae2e2d33d6757ec289f4de7b9c22aa14ba575`)
rechecked all 101 sealed r2 predictions against the existing per-case numeric
MRR audit. It did not reopen gold paths or make model calls. Among the 33 Gin
cases with a **cross-directory** test/source promotion, 18 gained MRR@8 and
one lost. The corresponding six Click cases had zero gains and two losses;
all six Click traces mentioned the full test path, not just a basename.
Consequently, requiring a same-directory counterpart would discard many Gin
gains, while requiring an explicit full-path mention would not remove the
Click regressions. These are post-hoc feature diagnostics on exposed cases,
not a validated confidence gate. The next meaningful test remains the
matched-query official RepoMap comparator followed by independent transfer,
not a label-tuned Click exception.

## Go-only source-neighbor r3 — exposed development result

The [r3 source-only sealer](../research/arb-trace2code-r1/seal-exposed-go-neighbor-r3.py)
(script SHA-256 `a333b59a92db63754695a90030801daedcd38f2d1fa340f3c456134e8e8e8ab1`)
filtered the already sealed r2 promotions to `.go` counterparts and otherwise
kept the original ARE file order. This is a language-convention hypothesis:
Go's `_test.go` → `.go` mapping is more direct than Python's `test_*.py` →
`*.py` mapping. The predictor used r2 predictions and no labels, scores,
model output, VPS, or GLM. It changed 43/101 rankings and sealed the r3
predictions at SHA-256
`7020c28e12180a5d9f137bd33062c962852f3f8a816511f1e8c0f9fcc02ae0d2`
before evaluation (`SOURCE-SEAL.json` SHA-256
`d5c80c1a6f288a5ada6896099ede9b4e498b42e37cb979e13829b8ecfabec6d0`).
The seal fixed a development gate: 101/101 valid; MRR@8 no lower than r2
overall and non-Gin; no Click MRR regression; report BCY@8K.

The [separate evaluator wrapper](../research/arb-trace2code-r1/audit-exposed-go-neighbor-r3.py)
(script SHA-256 `c8f1ade99e4d322a5efd6379c552e8bdfce4d2a9648a6c7c4e3e095d6942aa38`)
reused the pinned rank and budget-packing evaluators after the source seal.
Private rank and BCY audit SHA-256 values are respectively
`4c41213be879167363ac7974a4c124c0c461e72a1ecd591a67baa3d350ed60ae`
and `3f9a0d8866cb778acc54b8fe4337032cf5ac131f76efafbebcb9d4ac3c1a9593`.

| Exposed matched-edge arm | All 101 MRR@8 | Non-Gin 45 MRR@8 | Click 26 MRR@8 | All 101 BCY@8K |
| --- | ---: | ---: | ---: | ---: |
| ARE trace-text | 0.34475 | 0.18003 | 0.11058 | 0.47195 |
| Source-neighbor r2 | 0.55308 | 0.23743 | 0.08814 | 0.59571 |
| Go-only r3 | **0.55885** | **0.25040** | 0.11058 | 0.59571 |

The fixed **exposed-development** gate passed. Filtering Python promotions
removed the Click MRR regression without losing the 8K BCY gain, and the
non-Gin mean MRR rose. This policy choice was made after the 101 labels had
been exposed and the prior r2 heterogeneity inspected, so the r3 improvement
is not independent confirmation. Non-Gin BCY@8K is unchanged at 0.32222;
at larger budgets it remains below matched ARB BM25. The author's stronger
RepoMap comparator, exact-Git/live ARE and GLM, costs, and a fresh
repository-separated population are still required before a G01 superiority
claim. R3 neither repairs the failed ContextBench campaign nor becomes the
default ARE policy from this result alone.

### Matched BM25 comparison is repository-heterogeneous

The same sealed exposed rank audit (SHA-256
`4c41213be879167363ac7974a4c124c0c461e72a1ecd591a67baa3d350ed60ae`)
also includes the matched-edge-query ARB BM25 arm. Across all 101 cases,
BM25 MRR@8 is **0.18284** versus r3 **0.55885**, a sample-weighted delta
of **+0.37601**. But Gin contributes 56 cases and its within-repository
delta is **+0.62160**; without Gin, the 45-case delta is only **+0.07040**.
Click's 26-case delta is **−0.07147**. Of seven repository-level deltas,
four are positive, two negative, and one tied. The unweighted mean of the
seven deltas is **+0.15761**; an exact two-sided sign flip over repository
deltas gives **p=0.3125**. These calculations use numeric aggregates already
in the exposed audit; no new labels, rankings, provider calls, or VPS files
were opened. They are descriptive and exploratory, not a valid independent
significance test after post-hoc r3 design. The large sample-level gain does
not establish broad repository transfer or superiority over the author's
stronger RepoMap method. Independent Go repositories and the matched official
RepoMap run remain the decisive next comparisons.

## Independent-population feasibility check

The existing eight-task G01 development-transfer candidate contains five
Django and three Transformers tasks, all Python. It therefore cannot test
the r3 **Go-only** hypothesis; opening its native references for this purpose
would spend a scarce clean set without testing the mechanism. The [ARB release
inventory](https://github.com/eyuansu62/agent-retrieval-bench) contains 101
`trace2code` cases in total, all of which are already exposed here; its other
releases use different query and gold contracts. The [Go SWE-bench v0
card](https://huggingface.co/datasets/guildlm/go-swe-bench-v0) reports 51
registered Go repair tasks from distinct repositories: 40 `test_fail` and 11
`compile_error`. These are **not 51 ready trace-retrieval cases**. Its
registered task supplies the changed source-file paths and their before
content to a file-level repair model, while hiding test files. The public
record contains `src_files`, `before`, `after`, `tests`, `fail_to_pass`, and
`gold_patch`, but no frozen failure-output query or ARB root-cause label.
Published repair pass@1 scores therefore cannot be a comparator for ARE file
retrieval.

A new, explicitly named trace-reproduction study could use the 40 runtime
`test_fail` cases only as an **upper bound** before eligibility. It would need
to check repository overlap with exposed ARB Go repositories (the card's
visible Caddy task already overlaps), reconstruct each exact parent worktree,
copy the commit's test files, reproduce and freeze the failing `go test`
output, and keep `src_files`, `before` as a changed-file list, `after`,
`gold_patch`, and any derived labels evaluator-only. The 11 `compile_error`
cases require a separately defined query stratum or exclusion because their
failure may directly name a newly introduced symbol. These are protocol
requirements inferred from the published schema, **not** completed checks.
The dataset's 51-task split, its published repair results, and any eventual
ARE retrieval study must remain separately named. No new dataset was
downloaded, label opened, or candidate dispatched in this check.

## Open Questions

- Does the test/source-neighbor mechanism survive a fresh repository-separated
  trace population without the Click regression, and how does it compare to
  the author's RepoMap on exactly matched queries?
- What new, repository-separated population can serve as independent
  confirmation after development on all 101 ARB trace2code cases?
- Does any source-only gain survive exact-Git, live ARE/GLM tool delivery,
  cost, and the original G01 ContextBench scoring contract?
