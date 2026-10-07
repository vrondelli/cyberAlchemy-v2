# G01 Defects4J 32-case prospective file-localization protocol

Status: frozen before GLM generation and gold access, 2026-10-06.
Source cohort and dependencies: [supply record](G01-EXTERNAL-TRACE-SUPPLY-DEFECTS4J-2026-10-06.md).

Use all 32 selected cases across 16 projects. The query is the sealed first
failure header, exception line, and first eight non-harness Java frames.
Candidates are tracked Java files at the exact buggy commit, including tests.
RepoMap and the Java adaptation of ARE rank_sources use the same candidate
universe and first 20,000 Unicode characters of each source file. Verify
candidate counts and source projection digests before generation.

Comparators are pinned official RepoMap, the Java ARE ranker, the sealed
production stack-frame locator, and reciprocal rank fusion (constant 60)
of the top-20 RepoMap and ARE lists plus the stack list. Fusion uses the same
candidate union as GLM. The GLM candidate union is top ten of RepoMap, top ten
of ARE, and up to eight stack paths, de-duplicated and ordered lexically.
Each candidate receives at most 600 characters from its first 20,000 source
characters, choosing a 20-line window at 10-line strides with
maximum distinct query-token overlap, ties resolved by earliest line. All
paths and excerpts are data. Return up to eight unique candidate IDs.

Run GLM-5.3-flash on the VPS, one request per case, 512 maximum output tokens,
low reasoning effort. Same-account tokenizer admission requires prompt plus
512 reserve at most 8,192 tokens. No generation retries. Invalid output is
scored as an empty ranking. Persist each response and cost before advancing.
Transport failures terminate the batch; preserved completed requests are
never regenerated. Gold stays closed until final predictions are sealed.

The gold proxy is Defects4J's recorded modified production classes, mapped
to tracked Java paths at the buggy revision. Report unmatched labels against
the fixed denominator; do not replace cases. This measures localization of
files modified by the human fix, rather than proving semantic root cause.

Primary quality metric: MRR@8 of the first gold file. Secondary: Hit@3 and
gold-file Recall@8. Give each project equal weight (two cases each), report
all project effects, and exact two-sided sign-flip tests over the 16 project
mean paired deltas. The prospective substantial-gain gate requires GLM mean
MRR@8 at least 0.10 higher than **every** comparator, project sign-flip p<=0.05
against both RepoMap and fusion, at least 24/32 Hit@3, and at least six more
Hit@3 than the strongest comparator. A failed criterion leaves the gate failed.

Report provider calls, prompt/completion tokens, elapsed time, tokenizer
calls, candidate generation and source acquisition separately. A quality win
does not establish a cost win over model-free retrieval. This public Java
dataset carries possible pretraining exposure and trace-path cues; any passed
claim is restricted to this cohort and adapted task. Product integration and
the other G01/G02/G03 campaigns still require their own evidence.

## Open Questions

- Does the prospective candidate clear the frozen quality gate?
- Are all recorded modified classes representable at the buggy revision?
- Does the gain survive a live ARE episode and another independent population?
