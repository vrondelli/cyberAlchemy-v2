# G03 BEAM 500K IE matched-answer pilot r1

Status: **private exposed-development protocol and completed pilot**. The
population, wires, and assessment rule below were frozen before answer
generation; the completed result is recorded separately below.
This pilot tests whether the r4 cross-encoder's improved cited-turn reach
improves answer quality against the unchanged BM25 evidence projection. It is
not an independent benchmark or a product superiority test.

## Frozen population and wires

The source-only sample is 12 information-extraction questions from 12 distinct
BEAM 500K development conversations, one question per conversation. Its
deterministic selection rule and exact private receipt are bound by SHA-256
`cfd359ed56f54bc0ad6fb7945637db9b82ac6b6b06128d358c996ac717a7a4e8`.
The matched 24-wire source-only packet is SHA-256
`a39f3b21ef88373344cb13ae3721e9f61593e573f2abfdd0d5c3936ae594a272`.
Each question has the same system prompt and question in both arms; only the
archived evidence projection differs. The r4 treatment and BM25 control each
use at most 5,000 UTF-16 characters of JSON evidence. The 60-question r4
selection was already exposed to a cited-turn audit, but neither the sample
selector nor these generation wires read evaluator answers, rubrics, or
source-chat IDs. The sample is not a fresh holdout.

Model: `glm-5.3-flash`, thinking enabled, low reasoning effort, 512 maximum
completion tokens, nonstreaming, 8,192-token request window. The same-account
VPS tokenizer preflight admitted all 24 exact wires, prompt tokens 1,093–1,633
plus the 512-token reserve; its result SHA-256 is
`5922fc6f4834055c7c822806400599bbcb3a842b52d6f6d39fa9eb8b92bcdbdc`.
The generation runner must verify both input hashes, every probe/arm tokenizer
binding, and the pinned VPS-local gateway helper before writing a freeze or
making requests. It will make at most 24 serial requests with zero automatic
retries, preserve every attempted response, and stop on the first invalid
answer without replacement or top-up. It must record usage and elapsed time,
but no speed or cost superiority will be inferred from this pilot.

## Answer assessment fixed before generation

The primary pilot readout is the *paired mean per-question rubric score*
(treatment minus control) over the 12 questions. Each rubric criterion receives
0, 0.5, or 1 under the BEAM rubric prompt adapted to GLM; a question score is
the mean of its criteria. The 12 evaluator rows contain 22 total criteria.
Answer text, criterion, and blind ID—not arm, question ID, source evidence, or
reference answer—are sent to the judge. The 44 answer–criterion wires are
evaluated twice in reversed order (at most 88 calls, zero retries). Judge
scores may be JSON numbers or canonical decimal strings `0`, `0.0`, `0.5`,
`1`, or `1.0`. Any other score, malformed response, missing item, or failed
wire is invalid and stops scoring; no silent imputation. Report both repeated
scores, per-question means, disagreement, and paired direction. This is
**GLM-adapted rubric judging**, not official BEAM scoring; inspect ambiguous
rubric/source cases before interpreting a gain. A second reviewer may audit
blinded answer pairs, but does not change frozen automated scores.

No answer-quality claim will be made from citation reach alone. Promotion to an
independent campaign requires credible development answer gains, all-in
reranking resource accounting (the r4 WSL selector took 600.753 seconds for
60 questions), and a separately frozen, previously unexposed population. The
16 reserved BEAM 100K conversations are untouched by this pilot.

## Completed pilot result — 2026-10-03 UTC

The VPS generation run completed **24/24 valid matched answers**, with zero
automatic retries and 2,204 known completion tokens. The private answer-run
result SHA-256 is
`6f6bac5724fc66680a49a4e95593ccc53f7810921942b4ac4a6355dc5eaa7711`.
The blinded judge input has 44 wires for 22 rubric criteria; its SHA-256 is
`bd048820b1676d99c3f309f39b6a1811ead88889fc8e037e8f4c3bef8332aace`
and the separate private arm-map SHA-256 is
`8cd2f6e935c5b38cdba7c03399dadba9d716308f6da107e47ecca5e213e3a2e8`.
All **44/44** judge wires passed the VPS 8K tokenizer preflight. Both
reversed-order passes completed **88/88 valid GLM-adapted judgments**, with
zero retries and 5,572 known completion tokens. The judge result SHA-256 is
`ea7ef891f5d93940a93ddb077e6a9da9ab44bbc493ad6297a12b704dccb909b2`.
The private WSL cold copies of both runs matched their VPS source trees under
checksum dry-run comparison. The [answer runner](../research/g03-beam-r1/run-beam-500k-dev-ie-answer-pilot-r1.mjs),
[judge wire builder](../research/g03-beam-r1/build-beam-500k-dev-ie-pilot-judge-r1.py),
[judge runner](../research/g03-beam-r1/run-beam-500k-dev-ie-pilot-judge-r1.mjs),
and [independent receipt/score audit](../research/g03-beam-r1/audit-beam-500k-dev-ie-pilot-scores-r1.py)
pin the comparison mechanics. The score audit SHA-256 is
`2f79dd1e8cbcb65b6e4b88c2127252abcde811d271ff60c5727ea56cd22d2870`.

The prespecified per-question rubric mean was **0.5863 treatment versus
0.5833 BM25 control**, paired difference **+0.0030** on the 0–1 scale.
There was one treatment win, one control win, and ten ties. One of the 44
criterion wires changed score between judge passes; the treatment's sole
control loss includes that unstable criterion. A subsequent join to the sealed
citation audit found that **none of these 12 questions was among the eight
questions with differential cited-turn reach** (seven r4 gains, one BM25
gain). Thus this near-tie does not directly test whether the cited-turn gain
helps answers in the cases that produced it. It is still no evidence of a
meaningful general answer-quality improvement. The r4 cross-encoder is **not
promoted** to the reserved independent cohort on this evidence. The
36/60-versus-31/60 citation-reach result remains a retrieval diagnostic, not
answer-quality superiority. No native BEAM, full-population, speed, cost, or
product claim follows.

## Open Questions

- Does manual, blinded review of the one discordant rubric criterion reveal
  genuine partial credit or judge instability?
- Does r4's differential cited-turn reach improve answers on the eight
  exposed-development questions that actually produced the citation gain?
- Can a future selector deliver a credible paired answer-quality gain and
  acceptable all-in reranking cost on the VPS before using an independent
  cohort?
