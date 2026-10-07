# G01 external failure-trace supply and prospective Defects4J cohort

Status: supply qualified; this records preparation and source seals. The
subsequent [r1 scored result](G01-DEFECTS4J-32-R1-RESULT.md) supersedes its
unrun frontier: strict gate failed, format-corrected diagnostic improved,
fresh confirmation required. This follows the exposed [ARB/RepoMap matched
comparison](G01-ARB-OFFICIAL-REPOMAP-MATCHED-EXPOSED-2026-10-06.md) and
[exact-Git read preflight](G01-ARB-EXACT-GIT-READ-DELIVERY-PREFLIGHT-2026-10-06.md).

The official [BugsJS dataset](https://github.com/BugsJS/bug-dataset) was
checked at commit `7abbad3e4df12cd5294110bb5db11b7d5bc758a6` with the
[gold-blind census](../research/arb-trace2code-r1/census-bugsjs-trace-supply-r1.py)
(SHA-256 `6b6c9f6f1fd1deecba130088eee794927c17dfd46bdf50156f24c661c5f92b98`).
Only 19/453 cases had a parseable stack trace, across three of ten projects;
only six had a source frame under the current parser. The private census at
`/home/vlad_/are-benchmark-archive/bugsjs-trace-supply-r1/CENSUS.json` is
SHA-256 `bdbebe87e740bd60b8006a7bc68a0adabba16fe272fa3244a5261b2443bc3c5d`.
This release does **not** supply an independent, repository-diverse trace
cohort. No provider calls or gold access were made.

The official [Defects4J v3.0.1](https://defects4j.org/) source was pinned at
`6d54320e0db5a357f9ab38a8e4d2e5aead7e1c09`. Its active-bug metadata
and recorded `trigger_tests` were checked with the [gold-blind census](../research/arb-trace2code-r1/census-defects4j-trigger-supply-r1.py)
(SHA-256 `d4eb9fc58961d2ab063014a6373fd1de72674b30ecf62cdc6e84a29bc8183cf8`).
All 854 active bugs across 17 projects have a parseable recorded Java trace.
The private census at
`/home/vlad_/are-benchmark-archive/defects4j-trigger-supply-r1/CENSUS.json`
is SHA-256 `e77a02ad4e1ef8cc2be950c0e7d560dc7a0bb53283c7ddcd3e1e7ee6be43d076`.
The 16 Git-revision projects permit exact buggy-source archives; Chart uses
SVN and is excluded from this cohort. A `HEAD` request to the exact public
buggy-revision codeload archive returned HTTP 200 for both lowest active bug
IDs in each of the 16 Git projects (32/32). This verifies URL availability,
not archive contents or runnable tests.

The [freeze script](../research/arb-trace2code-r1/freeze-defects4j-source-order-cohort-r1.py)
(SHA-256 `e8c5b576e312a52153e9abf1f7045ccaaf3526daa154047759d64680838f90e6`)
selected the two lowest active numeric IDs with a usable trigger trace in
each Git project, without looking at gold, scores, source contents, fixed
revisions, or provider responses. The resulting private
`/home/vlad_/are-benchmark-archive/defects4j-trigger-supply-r1/SOURCE-ORDER-32.json`
is SHA-256 `457ecd8e44ee0dab1773b0e5fbad63d8e371c1f6993dccdd2fb1461814b73e33`.
All 32 selected traces contain non-harness frames; their full frame counts
range from 35 to 1,240, so an 8K experiment must prespecify a bounded trace
view. The selected cases span 16 repositories, two each. This is an external
**candidate confirmation population**, not yet an admitted scored campaign.

Next, freeze a trace-view and task/metric contract before reading labels:
an exact buggy checkout per case, the same trace and source-access budget for
ARE, official RepoMap, and GLM, an explicit-path/leakage stratum, and a
paired cost/quality analysis. Build and dry-run the Java packet on exposed
development cases, then run the sealed 32 only once. A source-availability
failure must be reported against the frozen denominator, not silently
replaced. Keep the complete source archive in private WSL storage; send only
bounded, integrity-checked case packets to the VPS GLM runner.

The benchmark is old and public. Possible model pretraining exposure,
trace-revealed class paths, small per-repository denominators, and Java-only
coverage limit any eventual claim. It cannot establish broad ARE product
superiority by itself. The prior ARB exposed result likewise cannot be
presented as independent confirmation.

## Exact-source and trace-view preflight

The [gold-blind trace-view preflight](../research/arb-trace2code-r1/preflight-defects4j-trace-view-r1.py)
(SHA-256 `3f8082f07d61e792ca0172421ec3504e752423ffc22b04c13ad29ec0dc399420`)
retained only the first failure's test header, exception line, and first eight
non-harness stack frames. The private `TRACE-VIEW-PREFLIGHT.json` beside the
manifest is SHA-256 `5ce31ad82fd8f73b89ed7358cf3f3f26f5a060544b826be8ccf33d3eb9bfec66`.
Across the frozen 32, view size has median **344 bytes** and maximum **761
bytes**. In 16/32, the first retained frame names a non-test-looking Java
class; in the other 16 it is test-looking. This suffix check is a cue audit,
not a defect-localization score. It makes a deterministic zero-model
stack-frame locator an essential comparator, alongside official RepoMap and
ARE. The view is frozen for this cohort; any later change requires a new
cohort or an explicitly developmental status.

For `Defects4J-Compress-1`, the public archive at the exact buggy Git SHA was
downloaded and hashed (`1722facc2ea24414fdbdc7a1d23228f7e2902fd164489f37a58772b44e3fcda3`),
and a separate clean, shallow exact-commit checkout was verified. The
[actual-tool pilot](../research/arb-trace2code-r1/preflight-defects4j-exact-read-r1.mjs)
(SHA-256 `c842d021e3b0f26c972162ecd696ae1c7efdf46cb70346d538024f6531c91bc2`)
resolved the first trace frame to
`src/main/java/org/apache/commons/compress/archivers/cpio/CpioArchiveInputStream.java`
and invoked `read_file` at the pinned base revision for 50 lines around line
293. It delivered 1,568 source bytes in one valid read. The private
`/home/vlad_/are-benchmark-archive/defects4j-source-pilot-r1/EXACT-READ.json`
is SHA-256 `d45737eee9d17124eac1534529d05130369da2b98f8ea9d10a3055d732b5391e`.
There were **zero model calls and zero gold accesses**. This is source/tool
feasibility for one case only; it does not establish 32-case coverage, 8K
token admission, quality, or superiority.

Before any confirmation scoring, freeze the stack baseline as: rank distinct
tracked production Java files whose package/class suffix exactly matches a
retained stack frame, in frame order; exclude test files, and report a miss
when no tracked production match exists. No source-body or gold inspection is
needed to define it. Match every arm on the same 32-case denominator and
8K source-access budget. Report both quality and all-in calls/tokens/latency.

## Full buggy-source acquisition and gold-blind arm seals

The [tree acquisition](../research/arb-trace2code-r1/acquire-defects4j-buggy-trees-r1.py)
(SHA-256 `285396781825c431295e78a8d5fc04332b4cd4a44616daea03dfc1e4a4fc038e`)
fetched the 32 exact buggy commits and their tracked-path trees without blobs.
Its private `TREE-RECEIPT.json` is SHA-256
`1db6166a7c96b0dbd80876e6fc16b99ccff974760cea70b6935e46b32afa3dae`.
The [worktree materializer](../research/arb-trace2code-r1/materialize-defects4j-buggy-worktrees-r1.py)
(SHA-256 `d30e691799b7c4dfb42ac24803070cd78abed641dc95bd703ad1610f286d4e56`)
then verified 32 clean exact-commit checkouts, with `WORKTREE-RECEIPT.json`
SHA-256 `4b77bf03a0b004831b2416ead495772a08b3cbc3222d84234a1114d03efa45ab`.
They reside only under the private WSL
`/home/vlad_/are-benchmark-archive/defects4j-buggy-source-32-r1/` and
currently occupy about 344 MB. No fixed revisions, patches, or gold files
were opened and no tests or GLM calls were run.

Three source-only ranking arms are now sealed under that private directory:

| Arm | Seal SHA-256 | Source policy and limitation |
| --- | --- | --- |
| Deterministic stack-frame locator | `1b40d1e6fb5764697816816e7817241583a861b551eec001c98582de4097c3fd` | [Script](../research/arb-trace2code-r1/seal-defects4j-stack-baseline-r1.py) SHA-256 `25c08562cc3571681651b5549125f22a9566328504ce1c2063ff198b0c013952`; exact tracked production Java suffix match in frame order. It emits at least one path for 10/32 cases; this is **coverage, not accuracy**. |
| Official RepoMap code adapted to these Java snapshots | `1c7fbd4dda6e2112bf77dd1102e615ab5935f7d111151fa0b15526c7fba3ae3d` | [Adapter](../research/arb-trace2code-r1/seal-defects4j-official-repomap-r1.py) SHA-256 `6a7e3e47968dcafc9b0adfae5aabcd2957dccde42ebd6151d8832a001048c3a2`, pinned ARB code commit `07014c986f3deadb1548c62b32c0ffbe6a81465d`; all tracked Java files, 20,000-character content cap per file, default 0.65/0.25/0.10 weights. Candidate sets range from 15 to 1,310 Java files; six projected files had lossy UTF-8 decoding. This is an adapted comparison, **not official ARB evaluation**. |
| Existing ARE `rank_sources` trace-text candidate | `a17a8f232117b003fe3bf377b92a8e56edcbf7c718b486cb27c2fb7e2045f959` | [Adapter](../research/arb-trace2code-r1/seal-defects4j-are-trace-text-r1.mjs) SHA-256 `ad587fc76a29831ece4c5b8d3204c870ca7549af19d2409e403e6fcf857827cf`; indexes tracked text under its 1 MB/file and 256 MB total limits. It reports partial indexes on 27/32 cases (513 omitted tracked files across snapshots), and therefore **does not share RepoMap's exact Java-only candidate universe**. |

Ten of the ten stack-ranked cases also passed one actual `read_file` call on
their clean exact-buggy worktrees, with private per-case `EXACT-READ.json`
receipts beside them. This is deterministic trace-line read delivery, not a
model-driven episode. At this sealing boundary, no label had been scored.
The [later r1 run](G01-DEFECTS4J-32-R1-RESULT.md) resolved Java candidate parity
and scored after prediction sealing. The preparation frontier was: freeze a
common Java candidate universe or explicitly report the differing universe,
and preflight the full treatment packet in the same-account 8K tokenizer.
The zero-model and RepoMap arms remain essential even if GLM is stronger on
an exposed development population.

## Open Questions

- Does the frozen trace view fit the actual same-account 8K tokenizer after
  source-read and instruction framing, not merely by raw byte count?
- How many of the 32 cases can a model-driven policy read through the real
  exact-revision tool path, including those without a direct production
  stack-frame path? Ten direct-frame cases passed deterministic read delivery.
- Do the ARE omitted tracked files include relevant Java source, and should a
  Java-only adapter be frozen for a genuinely matched candidate universe?
- What is the prospectively frozen primary metric and non-inferiority guard
  for tool calls, token use, and latency against official RepoMap and ARE?
- How will potentially memorized public bugs and traces with explicit source
  paths be reported in the claim scope?
