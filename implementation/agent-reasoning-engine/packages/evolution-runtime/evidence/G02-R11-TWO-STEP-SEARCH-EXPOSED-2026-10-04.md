# G02 r11 two-step repository search — exposed development stop

The first 12 already exposed G02 r11 tasks were used for a bounded query →
exact-Git-grep → choose/abstain probe. This is **development**, not a new
independent benchmark, actual ARE read, native Span-F1 result, or superiority
claim. No G01/G03 campaign state was changed.

The [source-only packet builder](../research/g02-product-r4/build-g02-r11-search-packets-exposed-r1.py)
(SHA-256 `00a5950b8d77761a5b21f19f721c1a7d4daaa5a19c2f6d30f8f9a05d616ad920`)
verified each issue, task identity, base commit, selected path and delivered
path against the archived r11 task and sealed relation union. It exported no
gold, DSH output, score or model response. The private `PACKETS.json` has 12
rows and SHA-256 `2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b`.

The [VPS runner](../research/g02-product-r4/run-g02-r11-two-step-search-exposed-r1.mjs)
(SHA-256 `fa2cf29439d3c86c93a2ced43130d22ba4db189ce04fab50252a204be5546216`)
passed read-only preflight against all 12 exact bare Git caches. Before the
first GLM call it sealed `FREEZE.json` at SHA-256
`1124a36bf3f12838231d3f787b478be76fd72e7a6656fc092f37154eb1d3f923`.
It fixed GLM-5.3-flash, at most 24 generation calls, no retries, up to three
literal search queries, at most 24 search-result paths and three new reads,
8,192 prompt-plus-reserve tokens per call, and a development advancement gate:
12/12 valid planner/chooser pairs, at least four new gold hits across at least
two repositories, proposal precision at least 0.25, and counterfactual mean
File-F1 above archived DSH. A frozen invalid response stopped the run.

The run completed **2/12** planner/chooser pairs and used five GLM generation
calls (the fifth was task 3's invalid planner). Task 1's chooser abstained.
Task 2 proposed one file, which was not gold; its evaluator-only set-based
File-F1 would decrease from **0.80 to 0.6667**. Task 3's HTTP-200 planner
response was a Markdown-fenced JSON object with four queries, violating the
fixed JSON-only and maximum-three-query validator. It was counted invalid;
there was **no retry, correction, continuation, or gate revision**. The
`RUN-RESULT.json` SHA-256 is
`2326150002538d7b755d852790b8b39c7d31e717b38380f4041e8dbac921318e`.

All 23 VPS files were cold-copied to private WSL
`/home/vlad_/are-benchmark-archive/g02-r11-two-step-search-exposed-r1-20261004/`
with mode-700 directory and mode-600 response files. A complete filename and
SHA-256 comparison found **23/23 identical** copies. The run cannot satisfy
its 12-task gate and must not be described as an improvement. The two scored
tasks are too few to diagnose search quality generally; the only observed
selection was a false positive.

## Separately frozen r2 full exposed-cohort probe

The [r2 VPS runner](../research/g02-product-r4/run-g02-r11-two-step-search-exposed-r2.mjs)
(source SHA-256 `4fdaf263782a66814ee6eab8172bb05c1ddd7940699ffa0961e4ae13963565b5`)
reused the exact r1 `PACKETS.json` hash and pinned base caches, while accepting
an optional whole-response Markdown JSON fence and counting invalid tasks
without aborting the remaining exposed cohort. It kept the same at-most-three
literal queries, 24 search-result paths, three new-file proposals, 8,192-token
prompt-plus-reserve admission, 24-call ceiling, and zero retries. Its freeze
preceded all r2 calls at SHA-256
`885f61301cff67557794390a1510d7311101055fce25c0c3fbefb99f9a84ce46`.
This is a new diagnostic, not a continuation or repair of r1.

The VPS attempted all 12 exposed tasks with **23 generation calls**, all
HTTP 200: 30,319 known prompt tokens and 593 known completion tokens (269
reported reasoning tokens). Eleven planner/chooser pairs were valid. Task 5's
planner returned an invalid query set; it was counted invalid, with no chooser
or retry. The 93 pre-evaluator raw files were checksum-matched into private
mode-700 WSL storage under
`/home/vlad_/are-benchmark-archive/g02-r11-two-step-search-exposed-r2-20261004/`.
`RUN-RESULT.json` SHA-256 is
`b268059bf5bfff87ff09b71e5869cca6f6a98bc931d775941d8dc28a74c0b67a`.

The independent [evaluator-only replay](../research/g02-product-r4/audit-g02-r11-two-step-search-exposed-r2.py)
(source SHA-256 `406a78c3e14d2b08e850aae6a1cb19e0364eee93e8b9cd21693b398831e0a604`)
verified exact task/base identities, archived ARE prediction hashes, frozen
search/choice bindings, and the unchanged native-reference source. The seven
new-file proposals had **0/7 new gold hits** in **0/4 repositories**. The
set-based counterfactual mean File-F1 fell **0.535975 → 0.485644**, versus
archived DSH's **0.563586**. The predeclared advancement gate failed on
validity, hit count, precision, repository spread, and File-F1. Evaluator
receipt SHA-256:
`82f41aa0a37877f4ade5b1db6b20bed4c8df6c9c48cdbdf1b172b74f317e098c`.

R2 is rejected for fresh dispatch. This is an exposed, evaluator-only
additive-file replay: none of the proposed files was actually read by ARE,
there is no new native Span-F1 or independent ARE-versus-DSH result, and no
superiority claim follows. The next G02 acquisition mechanism must change
how source candidates are generated or grounded, not merely relax the
two-step response parser or retune its unchanged search-result pool.

## Independent-population research lead

The public [Vulnerability Localization Benchmark dataset card](https://github.com/cisco-foundation-ai/vulnerability-localization-benchmark/blob/main/DATASET_CARD.md)
describes 500 repository-scale cases across six ecosystems, including Go,
Python, and Rust. Its Phase A supplies a vulnerability description and
read-only repository access, then measures file-level F1 against patch-derived
vulnerable-file labels; the [author's runner](https://github.com/cisco-foundation-ai/vulnerability-localization-benchmark)
allows 15 terminal calls. This is a potentially useful **separate**
repository-localization transfer population for ARE, with a published task
and scorer closer to G02's file selection than Go SWE-bench's file-given
repair task.

It is **not** a G02 r11 successor or a DSH-matched comparison: the query is
a security advisory rather than the G02 issue packet, the tool budget and
corpus differ, and no DSH or ARE arm has run on it. Its manifest contains
`ground_truth_files`, so any future source-only selector must isolate those
fields before candidate construction and audit repository/commit overlap.
The card's labels are files changed by security patches, not independently
adjudicated vulnerable spans. No dataset, repository snapshot, label, or
benchmark runner was downloaded or executed in this research check.

## Open Questions

- Can a deterministic source-only query and evidence screen raise candidate
  precision before another GLM selection test, rather than spending calls on
  a merely more permissive response parser?
- Which new acquisition mechanism can bring missing gold into a small packet
  without repeating the top-24 chooser's low-precision behavior?
- A revised protocol would need a **new freeze**, separate cost ceiling and
  full exposed-cohort qualification before any independent G02 test.
