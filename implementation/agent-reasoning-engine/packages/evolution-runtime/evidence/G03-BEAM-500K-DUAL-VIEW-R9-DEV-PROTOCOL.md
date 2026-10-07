# G03 BEAM 500K IE r9 — dual-view answer-quality development test

Status: **private exposed-development protocol fixed before r9 selection or
generation**. R7's shorter windows and r8's three-turn lexical reserve
failed their own citation-based answer-spend gates and sent zero answer calls.
R9 is a different evidence representation and a separately budgeted,
quality-first experiment. It does not retroactively qualify or repair r7/r8.

## Objective and fixed treatment

Determine whether separately organized semantic and lexical source evidence
improves *answer correctness* over the unchanged BM25 control on the full
**60-question / 30-conversation BEAM 500K information-extraction development
population**. Citation reach is a secondary diagnostic, not an answer-spend
gate: earlier matched development answers showed that cited-turn identity is
neither necessary nor sufficient for a correct answer.

The treatment uses the pinned r7 600-UTF-16-character source fragments and
MiniLM cross-encoder. Re-score only r7's already sealed treatment fragments
for each question. Place the highest-scoring fragments into a
`semantic_evidence` view with a **2,500-UTF-16-character JSON ceiling**.
Separately use the source-only 600-character BM25 ranking to place the
highest-ranked fragments from *source turns absent from the semantic view*
into `lexical_evidence`. The **combined JSON projection ceiling is 5,000
UTF-16 characters**, inclusive of keys and metadata. In each view, serialize
selected fragments in original source order. Every fragment is verbatim
source content with its original turn/part identity; no evaluator answer,
rubric, citation ID or reserved 100K data enters selection. There is no
adaptive choice based on development labels. The unchanged comparator uses
**2,500-character source fragments packed into a 5,000-character BM25
projection**, recomputed and hash-matched for all 60 questions. Both arms
therefore have the same 5,000-character evidence ceiling, although their
fragmenting and ranking mechanisms differ.

Before any evaluator or provider access, seal all 60 r9 treatment and
control projections, source/code/model hashes, source-only work and elapsed
time. A separate evaluator-only citation audit may diagnose reach but may
not change the quality-first spend rule or selected projections. Build 120
matched answer requests with the same system prompt, question, model and
generation settings in both arms; only the source-evidence JSON differs.
The model is `glm-5.3-flash`, thinking enabled, low reasoning effort,
`max_tokens: 512`, nonstreaming, with an exact 8,192-token request window.
Run an exact same-account tokenizer preflight on all 120 wires with 512
output-token reserve. If any wire fails, stop without generation. After a
fresh same-gateway tiny-generation readiness check, make at most 120 serial
VPS generation requests with zero automatic retries. Preserve every attempt
and stop on the first invalid answer; no top-up, substitution, or hidden
retry. All GLM requests run on the private VPS with its local secret helper;
no credential or unrestricted raw answer goes into this repository.

## Fixed answer-quality assessment and advancement gate

For each of the 60 questions, score treatment and control answers against
all BEAM IE rubric criteria with the already calibrated GLM-adapted BEAM
judge prompt. Blind judge wires to arm and source evidence. Run two
reversed-order zero-retry passes; an invalid judgment is reported and stops
the primary score, not silently repaired. The primary development measure
is the unweighted mean across questions of each question's mean criterion
score difference (treatment minus control, each criterion 0, 0.5 or 1).
Report per-question wins/losses/ties, criterion disagreements across passes,
paired 95% bootstrap interval, validity denominator, known model tokens,
local selector CPU time and summed arm time. This is **GLM-adapted** rubric
scoring, not official native BEAM scoring. Inspect source/answer ambiguity
before interpreting any favorable result.

Advancement to a separately frozen independent population requires **60/60
valid paired answers**, all prescribed judge wires valid in both passes, a
development mean paired score gain of at least **+0.10** on the 0–1 scale,
and a paired bootstrap 95% lower bound **above zero**. This is a
development-screen gate, not a superiority claim. Any claim additionally
needs untouched population confirmation, exact scorer compatibility,
all-in cost parity/tradeoff disclosure, independent receipt review, and
Vlad/Dave review of the exact wording. The 16 reserved BEAM 100K
conversations remain unopened by this experiment.

## Open Questions

- Does the dual-view treatment preserve answer-bearing content while adding
  complementary source coverage under the same 5K evidence budget?
- Is the GLM-adapted judge stable on the full IE development rubric, and do
  independent source reviews agree on any observed answer gain?
- Can the mechanism and scoring protocol transfer to a genuinely untouched
  population, and is its all-in cost competitive enough for a product claim?

## Sealed source and provider preflight — 2026-10-03 UTC

The r9 selector sealed **60/60** source-only dual-view projections at
private SHA-256
`5d9107da49b1fa90016f1e84d9a99a36f839af9cae7aeb053b9348e7363a8e6a`.
It rescored 655 local cross-encoder pairs in **74.818 seconds** and selected
327 semantic and 339 lexical fragments, across 645 distinct source turns.
The unchanged BM25 control was recomputed and hash-checked for every
question. The selector read no evaluator field and made zero GLM calls.

The 120 matched source-only answer wires were rebuilt from those exact
selected fragment identities and sealed at private SHA-256
`c2f524089e546e21079b73c21186dd6de598756d2eb1d8a465ac600a550d8336`.
WSL and VPS packet hashes match. Exact same-account VPS tokenizer admission
passed **120/120** requests with a 512-token reserve; the maximum prompt was
**1,939** tokens. Its private receipt SHA-256 is
`8e0069368c713676e9eb9d5277036513784b45a816f507a863218408055606a2`.
A separate one-tokenizer/one-tiny-generation readiness check returned HTTP
200/200 and sealed private receipt SHA-256
`2a17d2ed363ada513905318ca8c26b4bdf06672b9de40efdfc31486a71c368f9`.
Neither preflight nor readiness proves answer validity or campaign
reliability. No r9 campaign answer was sent at this checkpoint.

## Completed paired answer generation — 2026-10-03 UTC

The separately frozen zero-retry VPS run completed **120/120 valid matched
answers**. The private `FREEZE.json` SHA-256 is
`924c8efff6099bd2d52b4cac59ee13254a3afce2b3766d24fb99ea840a4b5c5a`;
the terminal `RUN-RESULT.json` SHA-256 is
`064701e645446af5f4d03315017d4b59c099a3c6fb4732a83dde76a5cec6d205`.
All 120 raw attempt files were copied privately to WSL; their exact hashes
were checked against the terminal receipt while constructing the blinded
judge packet. The response payload and credential were not put in this
repository. Known answer-generation tokens were **78,165 prompt + 4,780
completion** for the control and **79,294 prompt + 4,780 completion** for
the treatment. Summed generation-arm times were **165.933 seconds** control
and **156.291 seconds** treatment; r9 additionally incurred **74.818
seconds** of local source-only selector CPU time. These are incomplete
all-in costs until judge usage and archival overhead are accounted for, and
they are not a quality or efficiency superiority result.

The private blinded rubric packet is SHA-256
`fad197b4c2eab80e6de3d2f4086b5c70fa7b411d005b61d7dd7a3b19b5a87ac8`;
its separate arm map is SHA-256
`915835c97235f81432b1d1a22d0b149a539c4d22c561e89fd667d405c443e775`.
It contains **106 rubric criteria**, **212 blind answer–criterion wires**,
and **424 prescribed two-pass judgments**. Exact VPS tokenizer admission
passed **212/212** at private receipt SHA-256
`05e279b1bdc0748320c0a6701e653b495bbbdfc16d33074f300069adfa47622f`.
The judge result was sealed only after all prescribed calls completed.

## Terminal development score — 2026-10-03 UTC

The judge completed **424/424 valid** zero-retry attempts. Its private terminal
`RUN-RESULT.json` SHA-256 is
`4bb0d6afc28faed4ac95dee2160f5f3e1f557f7a1d01abc377ed12411db3d04d`.
The full VPS run was copied to the WSL private archive; the local auditor
verified every raw attempt hash, blind identity, both passes, and all 106
rubric items. The private score audit SHA-256 is
`ccb1434e29275c49dd135a725777605bbbc334c2d9507651c12983cf111ae6b8`.

Mean question-level GLM-adapted rubric score was **0.78575 treatment** versus
**0.63056 BM25 control**. The paired mean gain was **+0.15520** on the 0–1
scale, with a 20,000-resample paired-bootstrap 95% interval of **+0.05575 to
+0.26089**. There were 14 treatment wins, five control wins, and 41 ties;
six of 212 blind answer–criterion pairs disagreed across judge passes. The
predeclared **development advancement gate passed**. This is a fully exposed
development population, not independent confirmation or an official BEAM
score.

Known judge usage was **409,956 prompt + 23,465 completion tokens** and
**990.136 seconds** summed per-call time. Including answer generation, the
known model-token total is **600,440**; selector CPU was an additional
**74.818 seconds**. These totals are not a cost-adjusted arm comparison:
judge work, archive transfer, and campaign overhead need explicit attribution
before any efficiency claim.

Initial ambiguity inspection found a material scoring caution. For one
two-criterion distance question, the treatment answer led with a different
point pair but mentioned both reference coordinates as one of several other
instances. The criterion-only judge awarded full treatment credit. This
does not alter the sealed primary score, but answer-level correctness may
be lower than rubric mention-credit on ambiguous questions. Independent
source-and-answer review of all discordant pairs is required before
interpreting the gain or freezing a held-out protocol. The separate
source-only citation audit found treatment hit-all 43/60 versus r7 42/60
and BM25 31/60; this is secondary and does not validate answer quality.

The subsequent [19-pair source-and-answer review](G03-BEAM-500K-R9-DISCORDANT-REVIEW.md)
found nine directly source-supported treatment wins, five favorable pairs
with mention-credit or target ambiguity, two meaningful control-favoring
cases, and three control-favoring cases whose rubric score does not cleanly
represent answer quality. One of the latter has an older native salary
reference than a later user-stated raise. This preliminary review reinforces
the need for a prospective direct-answer and label-integrity policy before
any reserved-population confirmation; it does not change the sealed r9 score.

A separate [equal-budget BM25 reconstruction](G03-BEAM-500K-R9-DISCORDANT-REVIEW.md#equal-budget-control-verification)
confirmed this ceiling directly: recomputed 5K BM25 projection hashes matched
r9's control hashes on **60/60** questions. The earlier “2,500-character
BM25 projection” phrase confused the per-fragment cap with the assembled
projection cap; it did **not** describe the actual run.
