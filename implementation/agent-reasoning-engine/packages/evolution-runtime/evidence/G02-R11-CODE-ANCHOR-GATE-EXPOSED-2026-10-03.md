# G02 r11 exposed C++ code-anchor abstention gate

Status, 2026-10-03: **exposed development only; a later full ARE task-4
episode was scored and failed the frozen improvement condition; no independent
claim**. See the [full-episode result](G02-R11-CODE-ANCHOR-R3-FULL-EPISODE-TASK4-RESULT-2026-10-03.md).

The [r5 relation-aware GLM chooser](G02-R11-RELATIONAL-CHOOSER-EXPOSED-2026-10-03.md)
sealed nine proposed reads on three already-exposed C++ tasks before native
evaluation. It recovered two missing gold files, added seven false positives,
and counterfactually moved three-task mean ARE File-F1 from 0.21667 to 0.26010.
Task 12 regressed because its remaining native-gold files were outside the
direct-include candidate pool. Its macro header was **already delivered**;
the missing files were documentation and the generated single-header mirror.
The issue text itself named no concrete macro identifier. This is evaluator
diagnosis, not an input to the source-only gate.

A source-only [r1 gate](../research/g02-product-r4/seal-g02-r11-code-anchor-gate-exposed-r1.py)
admitted the sealed chooser paths only when a backticked issue token contained
`::`, an uppercase macro-like identifier, or `#define`. Its seal SHA-256 is
`96acb32c993894f20d08394f1dede3fe223152e719976857b927c8e92c1e05e9`.
It admitted tasks 4 and 8, abstained on task 12, and an evaluator-only replay
found two gold hits in six added slots, four false positives, and mean
File-F1 0.31010 versus DSH 0.24046 (receipt SHA-256
`b4f72fdc85d88458dece304462160c7447272df796ea3381574a56aa16c403fe`).
However, a source-column-only probe of all six selected r11 C++ issues found
that r1 admitted only **2/6**; three other issues carried concrete unquoted
function names or file paths. R1 is too restrictive as a general rule.

The separately sealed [r2 gate](../research/g02-product-r4/seal-g02-r11-code-anchor-gate-exposed-r2.py)
recognizes namespace-qualified symbols, uppercase macro-like identifiers,
underscored identifiers, explicit source filenames, angle-bracket include
forms, and `#define` syntax regardless of backticks. Its source-only seal is
SHA-256 `d89ede44360af4b120b96592a34efbf6078f49926b399e71777cee940d502cd9`.
The source-column-only six-task probe admitted **5/6** selected C++ issues,
abstaining only on task 12; receipt SHA-256
`333f3984ca7c5c95deab8beb75ca0c40b2cfe99cb4f938d855328507e10bda6c`.
That probe read only `instance_id`, `base_commit`, and `problem_statement` from
the pinned private parquet; it loaded no gold, patch, or score fields.

The r2 evaluator-only replay was sealed after the source decision. On the
three scored exposed tasks it added **six** proposed reads, with **two** new
gold hits and **four** false positives; two tasks improve, none regress.
Mean File-F1 would be **0.21667 → 0.31010**, versus the archived DSH mean
**0.24046**. Its receipt SHA-256 is
`bcdd7e5125283619fc6b574d85c4a16a2f3414d43de6c816819fbd49ccb0cbfd`.
This is a set-based counterfactual over a **post-hoc, label-exposed three-task
slice**, not native rescoring, actual read delivery, Span-F1, full episode
cost, or independent superiority evidence. The r2 syntax rule may also be
triggered by pull-request checklist boilerplate; that risk needs a source-only
robustness test before integration.

An r3 source-only robustness variant strips the generic pull-request checklist
before anchor detection. It reduced incidental anchor counts on tasks 4 and
16 while preserving the exact r2 admit/abstain decisions on **6/6** selected
C++ issues and the exact proposed path sets on the three scored tasks. Its
source seal SHA-256 is
`f04876f86f5951cda29c4c04f4c3c895d26eb0092f5ee57bd8febad29533e6f1`;
the six-issue source-column probe SHA-256 is
`2b8b49ac0e4436472e3c356dbf612831f08ec6f7d70f292d57d54dfe7e7c3bbb`.
No second evaluator replay was needed because the r3 decision projection is
byte-for-byte identical to r2 after selecting `ordinal`, `admitted`, and
`selected_paths`. This checks one boilerplate artifact, not generalization.

Private receipts are under
`/home/vlad_/are-benchmark-archive/g02-r11-code-anchor-gate-exposed-r1-20261003/`
and
`/home/vlad_/are-benchmark-archive/g02-r11-code-anchor-gate-exposed-r2-20261003/`,
with r3 under the corresponding `...-r3-20261003/` root.

A separately versioned [read-tool probe](../research/g02-product-r4/probe-g02-r11-code-anchor-read-tool-exposed-r1.mjs)
used the r3 seal and pinned r11 base checkouts with the actual ARE `read_file`
tool. All six admitted paths produced valid base-revision observations and
stable read IDs: task 4 used 3,005 source bytes, task 8 used 5,168, and the
task-12 abstention used zero. The original initial packets used 6,156 and
7,595 bytes respectively, so these additional observations would remain
below the 49,152-byte packet cap if integrated without other changes. Private
receipt SHA-256:
`91f56656b1306fdf38960a107447a2c92511bfb0f250aa9717b18f9406af6a15`.
This proves tool feasibility only. No model request included these extra
observations, and neither final selection nor native scoring was rerun.

A subsequent sealed [one-shot exposed model-delivery diagnostic](../research/g02-product-r4/run-g02-r11-code-anchor-model-delivery-exposed-r1.mjs)
sent the original initial read excerpts plus those exact six extra tool
observations to GLM on the VPS. The two HTTP-200 responses were valid and used
**8,800 known model tokens** beyond the archived episodes. After sealing the
responses (private SHA-256
`dcd531ac0404f6208b37feb893350a3201e46cbdf68fdbcbdb135592f43f65b0`),
an evaluator-only additive file-set audit found that the model retained just
**one** extra path: one gold hit and zero false positives across tasks 4 and 8.
Their mean exposed File-F1 would move **0.125 → 0.222**, still below the
archived DSH mean **0.261**; evaluator receipt SHA-256 is
`5c5382ca2ecea7c45436ae81f973fa82cdb304ef09c2a1f8ed8fefa3ff9fb187`.
This is not a full ARE episode, actual final-context projection, native
rescoring, or all-in cost result. It rejects direct promotion of the r3 gate
plus this one-shot selector as superiority evidence. The private requests,
responses, freeze, seal, and audit are under
`/home/vlad_/are-benchmark-archive/g02-r11-code-anchor-model-delivery-exposed-r1-20261003/`.

Task 8's issue specifically concerns replacing `#define private public` with
an access macro. The first extra read windows showed file-top material, while
their first literal `private:` sections were at lines 166, 322, and 279. A
separately sealed [source-only r2 rewindow](../research/g02-product-r4/build-g02-r11-task8-access-window-exposed-r2.mjs)
kept the exact three candidate paths but moved each 50-line read to that first
access section. The rewindow stayed under the packet cap at 11,963 source
bytes (source packet SHA-256
`cfe3e7f13830f0694dd48825c511166c5185a348fed2ece43edae1bb54d43fc3`).
One further HTTP-200 GLM call used 4,584 tokens and selected **exactly the
same three prior test paths, zero extra headers**. Its sealed response SHA-256
is `eb0e423eb5175137f2c575aaed9f4dc9ee7f318b632c1980c23be7d18b8c0ba3`.
Because selected paths are identical to r1 task 8, no new evaluator lookup is
needed to conclude that this rewindow does not improve the additive file set.
This does not prove the candidate paths are irrelevant; it shows that merely
moving windows to generic access sections is insufficient for this selector.
An exact-base, source-only Git search found the old `#define private public`
syntax in **14 tracked files** (13 test source files plus `Makefile`), while
`JSON_TESTS_PRIVATE` and `JSON_PRIVATE_UNLESS_TESTED` were absent at the pinned
base because the issue proposes introducing them. The primary
`include/nlohmann/json.hpp` has four existing `private:` sections. This gives
a concrete alternative acquisition route to screen—old-hack callsites plus
access declarations—without treating the post-hoc reference label as a query.
The [sealed source census](../research/g02-product-r4/census-g02-r11-task8-old-hack-source-r1.py)
confirmed **13/14** old-hack files already in the delivered-read set, zero in
the 23-path direct-include candidate pool, and neither proposed macro present
at base (private SHA-256
`43616198bac41b110d7934b6f891243aee40db9cda62e66ba3c2c8e41a8c2e95`).
However, its separate evaluator-only [coverage audit](../research/g02-product-r4/audit-g02-r11-task8-coverage-ceiling-r1.py)
**rejected the initial retention hypothesis**: task 8 has two native-gold
files, zero already delivered, one in the direct-include pool, and one outside
both; none of the old-hack callsites was gold. The evaluator receipt SHA-256
is `b9d137aeb12c2a2d092147585aa77c5737fe89708d8fcfa8450a6666d3637a0a`.
The next source-only expansion must therefore address candidate coverage, not
merely reselect already-read test files.

Two separately sealed source-only expansions failed that coverage test before
any further GLM request. Adding the tracked primary
`include/nlohmann/json.hpp` and generated `single_include/nlohmann/json.hpp`
to the 23-path pool recovered **zero** missing gold files: coverage stayed at
**1/2** (source seal SHA-256
`24449b2706688b9fbf02f92e51ce5f734f9262e0ce4273c6b4273ce269c020bd`,
evaluator receipt SHA-256
`fbac205ea2dd5da7e6665379457b266121cca80a96acd0feab32eb30b2a6cb28`).
Following the already-read `macro_scope.hpp` header to its explicit
`macro_unscope.hpp` counterpart likewise added **zero** gold files and left
coverage at **1/2** (source seal SHA-256
`01f905d78f9075db2e584ca77eb4d2f6ee3a30a7dfcc14762ea4bef6f950145e`,
evaluator receipt SHA-256
`f0f5f2408d41868d9e6ccc7848932bcb338f6f3833115ebc1a263bd9ed98bde1`).
These are exposed path-coverage diagnostics only. Neither expansion was sent
to the model, and further guesses against this task's gold would overfit the
label rather than qualify an acquisition rule.

A separate [source-only union ceiling](../research/g02-product-r4/seal-g02-r11-cpp-union-ceiling-r1.py)
combined the previously sealed direct-include, code raw/structured BM25
top-30, and bounded-text top-30 pools for exposed C++ tasks 4, 8, and 12.
It sealed **72/60/72** unique undelivered candidates before evaluator access
(private SHA-256
`86b8a3ed5790313bbee666e6c85f928c035565fe3199696734b0ead676ac3fde`).
The [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-cpp-union-ceiling-r1.py)
found **5/8** missing gold files in that **204-candidate** union, with three
still outside. Direct includes contributed four hits, bounded text one, and
the two code-BM25 top-30 lists zero on this slice; the private audit SHA-256
is `82ea2917e3ec41d2e2784f7de64e986b90e22ed9c726b90f13704c32bd9392b8`.
The union is an oracle coverage ceiling, not a three-read selection or
quality improvement. Enlarging this same pool does not solve task 8's
missing file or task 12's second missing file; no model call was made.

For completeness, a separate evaluator-only direct file-set score of the
previously sealed r1 one-shot selections found task 4 at File-F1 **0.5714**
and task 8 at **0.0000**; their two-task mean was **0.2857** versus archived
DSH **0.2607** (private receipt SHA-256
`13976b48f46c8f2cfd5fa41d163c4a9fc6fb835055ddd3b95f12e23ac3dfddb8`).
That narrow mean is dominated by task 4, costs an extra 8,800 model tokens,
and is not a native full-episode or independent superiority result.

The separately frozen r3 [full task-4 episode](G02-R11-CODE-ANCHOR-R3-FULL-EPISODE-TASK4-RESULT-2026-10-03.md)
delivered all three added code-anchor reads but scored Span-F1 **0.1302** and
File-F1 **0.2222**, below archived task-4 ARE **0.4050** and **0.25**. It used
**136,835** known tokens versus archived **85,443**. This rejects direct
promotion of the r3 packet; the earlier additive set replay did not predict
full-agent behavior. The result remains a single exposed, non-matched task.

## Open Questions

- Does the boilerplate-stripped r3 gate keep this balance across a genuinely
  independent, source- and score-blind task cohort?
- Can a revised rule retain useful added reads through full-agent selection
  without lowering native quality or raising cost? The task-4 r3 episode
  confirmed delivery and cost but failed quality.
- Why did the one-shot selector omit the useful extra path on task 8, and can
  a source-only change recover it without spending 8,800 more tokens for two
  tasks or adding false positives?
- Can a new, general source-only relation cover files outside all four sealed
  retrieval channels without label-guided path guessing? Old-hack callsites,
  primary headers, and the macro-scope counterpart failed task 8, and the
  existing-channel union still misses three of eight exposed C++ gold files.
- Can a separately predeclared fresh cohort validate positive File-F1 and
  Span-F1 effects under the full G02 validity and cost gates?
