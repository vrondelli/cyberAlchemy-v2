# G01 r17 explicit-file cue — exposed chooser qualification

Status: **passed a narrow exposed-development selection gate**, received a
**post-hoc synthetic native-score diagnostic**, and completed a **live GLM
window-selection microepisode**. This is not a full live ARE episode,
independent result, or superiority claim. The fixed r17 campaign remains terminal failed at four scored pairs;
tasks 19–22 here were part of its frozen but unattempted set and are now
exposed for development.

The [gold-blind source sealer](../research/g01-fast-live-v1/seal-g01-r17-explicit-file-exposed-r1.py)
(SHA-256 `cfa3219131c2f1d186feb9c685c821586050b0d2d32140fe15eb1a447172b701`)
resolved source-like filenames mentioned in each of the 24 pinned r17 issues
against its exact Git tree: exact tracked path first, otherwise only a unique
basename, maximum eight candidates. It exported **six candidates across four
tasks** (19–22) before opening labels. Its private `SOURCE-SEAL.json` SHA-256
is `2a3ccd5b7546b4f7d0f6f878a3f66e3dc2aaef0a98ecd4701f0d81191f2ea18e`.
The separate [evaluator-only source audit](../research/g01-fast-live-v1/audit-g01-r17-explicit-file-exposed-r1.py)
(script SHA-256 `468be5403f0df0f43c16c21a3af4430aaa4270df79110954b0cf216b8da2d694`;
private receipt SHA-256 `4659a3ee1246ec1df8113197524d8c6c8dd51828b0424ffdf5611b4bb4ac6c5b`)
found **four gold / six candidates**, two false positives, across Django and
Transformers. This passed the predeclared candidate gate: at least four hits,
precision at least 0.5, and at least two repositories with a hit.

The [source-only packet builder](../research/g01-fast-live-v1/build-g01-r17-explicit-file-packets-r1.py)
(SHA-256 `d632b33b4691112629167547e61896414599793a36db0e12f24ac51d9a00f66e`)
bound those four exact issues and six tracked source files to compact code
windows, with no gold, DSH output, score or model response. `PACKETS.json`
SHA-256 is `1ac6069a4125c315e956c2f1abff9ba0ebd4b281d7e37132c52f321cb9d58148`.
The [VPS chooser](../research/g01-fast-live-v1/run-g01-r17-explicit-file-chooser-exposed-r1.mjs)
(SHA-256 `0aa57324a7a69f8c1b071e44f19deae40af1e17db16d76d49982f4e266416896`)
was frozen before dispatch at SHA-256
`b75947b8bf53f8c15209ffd85086dcace3029ecffb63373acf9f6c599791d644`.
It fixed GLM-5.3-flash, four ordered zero-retry calls, at most two new files
per task, 8,192 prompt-plus-reserve tokens per call, abstention, and an
advancement gate of four valid responses, at least three new gold hits,
precision at least 0.5, and hits across two repositories.

All **4/4** tokenizer admissions and generation calls passed. Each response
selected one file. All 16 VPS run files were cold-copied to private WSL
`/home/vlad_/are-benchmark-archive/g01-r17-explicit-file-chooser-exposed-r1-20261004/`;
a complete filename/SHA-256 comparison found **16/16 identical** copies.
The separate [response sealer](../research/g01-fast-live-v1/seal-g01-r17-explicit-file-responses-r1.py)
(SHA-256 `04518806f2a4f429a7841b47d4c5e415ee176a1eee1c9d53213bfd426f3cf1a7`)
fixed the four choices before evaluator access at private SHA-256
`66bd577b61a5be337a7306a568b5b60dbee1651aca888ce2a5792b2204dd8da8`.
Known chooser usage was **3,667 tokens** across four calls, excluding the
tokenizer-only admissions.

The [evaluator-only choice audit](../research/g01-fast-live-v1/audit-g01-r17-explicit-file-chooser-r1.py)
(script SHA-256 `d81256d17a82382c44e6009b22c3e6452524ebd371223c2a2f2bc55bf59aa7ae`;
private receipt SHA-256 `b351d02c2e0a4fa1dbec199264f0988d533c5def7de1c93357a2efa01a0847e2`)
found **4/4 selected files were gold, zero false positives**, across the two
repositories. The frozen chooser gate **passes**. This shows the model can
filter the two false candidates in this tiny, already-exposed packet. It does
not show that ARE would request, deliver or select these files during a live
episode, that Span-F1 or all-in cost would improve, or that the rule transfers
to a fresh cohort. The 24-task G01 r17 campaign remains terminal failed and
must not be retroactively repaired or scored as 24/24.

## Native read and span-localization boundary

A separate [source-only native-read probe](../research/g01-fast-live-v1/probe-g01-r17-explicit-native-reads-r1.mjs)
(script SHA-256 `31153708a1438746ae8923b7003de9446c1afebe1471e4d7646c6dc8f8d307af`)
replayed the four sealed selections against the exact archived r17 checkout
with ContextBench's real `createRepositoryTools` and `read_file` at revision
`base`. All **4/4** calls succeeded; returned full-file hashes matched pinned
Git blobs, line/byte receipts matched returned content, and one native
source snapshot was recorded for each call. The private `READ-PROBE.json`
SHA-256 is `43b6f55896d11f77f602727abf334b589289e16478c56f5ba4c449f0e41c3f01`.
This proves those paths are natively readable, not that a live model would
choose, retain or submit them.

The separate [evaluator-only line audit](../research/g01-fast-live-v1/audit-g01-r17-explicit-native-span-r1.py)
(script SHA-256 `dffa3d9da577419e4d3e881faad23ad281baf57f7819a43c8a4d0c9652e92daf`;
private receipt SHA-256 `02f50f5b0f8a4e0e8f82b8abfa391d224265b4b469f167cef2dc2d46037f6248`)
found that only **2/4** first 12-line reads overlapped any gold line.
Across all four reads, **23/48** read lines overlapped gold, but the two
zero-overlap tasks show that file identification alone does not solve span
localization. This is a line-overlap diagnostic, **not** native Span-F1.
The next exposed development test should select bounded ranges within the
chosen files before any fresh campaign.

### Issue-cited dual-view development and native projection

The separate issue-line [native read probe](../research/g01-fast-live-v1/probe-g01-r17-issue-line-native-reads-r1.mjs)
sealed eight real `read_file` views across the same four exposed tasks
(`READ-PROBE.json` SHA-256
`d69b90931df6fa429b4ea037c22289d0b5bd33cb1dc4d6b62205cfdcb9d329c9`).
Its first issue-cited view overlapped a gold line on **3/4** tasks; that
missed its predeclared 4/4 gate. A post-hoc source-only dual-view rule then
retained the first code window plus the last matching issue-cited window,
at most two reads and 24 unique lines per task. Its
[source seal](../research/g01-fast-live-v1/seal-g01-r17-explicit-dual-view-r2.py)
has SHA-256 `67ca94bc226e424aa50d57adbf8f91727e490f1538c7f9c0e189285a057ad892`;
the separate evaluator audit has SHA-256
`a68114c376804c6fdd8cf716a1f2309842855184facca62cf5a3f1445cd52657`.
All **4/4** selected files then had gold-line overlap; 48 of 91 unique
read lines overlapped gold. This passes the stated exposed line gate, but
was devised after inspecting the failed single-view result.

Two further gold-blind synthetic prediction sets were sealed from those
already verified native reads before their respective native scoring:
[first-view comparator](../research/g01-fast-live-v1/seal-g01-r17-first-view-native-comparator-r1.py)
at private seal SHA-256
`179e97afdaad9710a4f88820c89b0548f99c63e26dd7c32efdd9d3957bd46c15`,
and [dual-view projection](../research/g01-fast-live-v1/seal-g01-r17-dual-view-native-projection-r1.py)
at private seal SHA-256
`5b93f32c85b57d577dbee70fadcc6c77d08870bb9024d5089d4cad12e1aa0f86`.
The unchanged pinned `score_native.py` wrapper (SHA-256
`2bddabec8393585faa93df47bc0c2444c094852232bb228c406c4c5dc5325f6f`)
ran against the matching upstream revision and parquet in the VPS frozen
scorer image. All eight results succeeded and were checksum-copied to the
private WSL archive directories named by those two projection sets.

| Exposed task | First-view native Span-F1 | Dual-view native Span-F1 |
| --- | ---: | ---: |
| 19, Transformers | 45.85% | 38.86% |
| 20, Django | 12.64% | 13.94% |
| 21, Transformers | 0% | 11.78% |
| 22, Django | 0% | 27.11% |
| **Macro, four tasks** | **14.62%** | **22.92%** |

The exposed paired difference is **+8.30 percentage points**, with three
improvements and one regression. Dual-view macro File-F1 is **85%**; task 22
selects one of four gold files. This is a synthetic post-hoc projection of
read spans, **not** a model-generated terminal selection, live ARE result,
independent confirmation, or a repair of terminal r17. There were no new GLM
calls. The natural next test is a versioned live exposed episode that actually
delivers both reads and binds the model's final selection; a distinct fresh
cohort remains required for a superiority claim.

### Live GLM selection over the eight delivered reads

That next *bounded microepisode* ran on the same four exposed tasks. The
[source-only packet builder](../research/g01-fast-live-v1/build-g01-r17-dual-read-live-packets-r1.mjs)
replayed the exact two `read_file` ranges per task against pinned WSL cold
checkouts, checked all eight native-output hashes against the earlier source
seal, and produced gold-free `PACKETS.json` SHA-256
`30be79bff7eb212ae1635b81c32dedbd27ea9418c3db7d8d5bbcd36eebce8053`.
The [VPS runner](../research/g01-fast-live-v1/run-g01-r17-dual-read-selector-exposed-r1.mjs)
was frozen before dispatch at `FREEZE.json` SHA-256
`e0e1abc3a3be414ab30be699f5807a7f496936803d2538ba76de34b82cda257b`:
GLM-5.3-flash, four ordered calls, zero retries, 8,192 input-plus-output
reserve tokens, at most 512 output tokens, and selection of zero, one, or
both delivered window IDs. All **4/4** tokenizer admissions and provider
generations passed with valid selections: tasks **19–20 kept both views**,
while **21–22 kept only view 2**. Known selector model usage was **4,402
tokens**. The complete VPS run was checksum-copied to private WSL storage at
`/home/vlad_/are-benchmark-archive/g01-r17-dual-read-selector-exposed-r1-20261004/`.

The [gold-blind response-to-prediction sealer](../research/g01-fast-live-v1/seal-g01-r17-dual-read-live-predictions-r1.py)
fixed all four final contexts *before* native scoring at private
`PREDICTION-SEAL.json` SHA-256
`23055c942cb8ae8125ecbef20203cc7b93ca8a4df663171d116e41dccedaa997`.
The same pinned VPS native wrapper scored all four predictions successfully;
its output was checksum-copied to WSL. A separate
[receipt and numeric audit](../research/g01-fast-live-v1/audit-g01-r17-dual-read-live-r1.py)
is sealed at private SHA-256
`e8ba76a342854c6f108f7f928c67c292739cea456de5eb74153dbf72a6021fc9`.

| Exposed task | First view | Always both | GLM-selected final Span-F1 |
| --- | ---: | ---: | ---: |
| 19 | 45.85% | 38.86% | 38.86% |
| 20 | 12.64% | 13.94% | 13.94% |
| 21 | 0% | 11.78% | 12.65% |
| 22 | 0% | 27.11% | 32.50% |
| **Macro, four tasks** | **14.62%** | **22.92%** | **24.49%** |

The live selector's exposed gain over first-view-only is **+9.86 percentage
points**; over always-both it is **+1.57 points**. Macro File-F1 remains
**85%**. This proves GLM can choose among the two actually delivered native
read windows in this tiny exposed packet. It does **not** prove that the
ordinary ARE loop would discover or deliver those windows, retain the
selection under its full context policy, or improve all-in cost. The earlier
file chooser used another 3,667 known model tokens, but summing the two
stages still omits live source indexing, tool scheduling, replay, and other
episode costs. This is **not** a full live ARE episode, independent campaign,
fresh confirmation, or superiority claim; terminal r17 remains failed.

## Open Questions

- Can this opt-in cue be wired to native `rank_sources`/`read_file` delivery
  without shortcutting provenance or adding too much token and latency cost?
- Can a source-only, issue-conditioned range selector cover the two
  zero-overlap cases while preserving line precision and bounded read cost?
- Does the dual-view rule improve *live* native Span-F1 and all-in cost, rather
  than only this post-hoc synthetic projection? Can its task-19 precision
  regression be prevented without gold-dependent tuning?
- Can one versioned ARE episode connect issue-cited reads, GLM selection and
  final-context export under actual 8K admission and all-in receipts? Does it
  transfer beyond these four source-filename-cued exposed tasks?
- Can the memory-safe r8 source index pass an actual-layout VPS rehearsal
  under a safe host-memory plan before any live exposed development episode?
- Does the mechanism retain useful precision across a distinct, clean
  24-task cohort, including tasks without explicit source filenames?
