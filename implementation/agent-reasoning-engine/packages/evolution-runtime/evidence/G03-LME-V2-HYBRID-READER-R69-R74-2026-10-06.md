# G03 LongMemEval-V2 r69–r74: full exposed hybrid-reader readout

## Result and claim boundary

The r69 packet builder combined the pinned r61 whole-UI-group, r64
action→post-state, and r68 scoped closed-set source screens for all **26**
reserve-development questions. It used question text and image only; it did
not use question-type metadata, reference answers, evaluator fields, model
thoughts, or confirmation questions. The 26 requests were frozen before
provider calls. The VPS r70 GLM run completed **26/26 8K admissions and 26/26
valid zero-retry answers**. Its cold WSL archive is
`/home/vlad_/are-benchmark-archive/g03-lme-v2-hybrid-run-r70`; the pinned
reader result SHA-256 is
`71d6186093c0b0aeba922e4c2f101a472672f43e8eb5aa73c40a67b0aa11cdc5`.

The pinned deterministic rules scored **4/12**. The other 14 answers received
two arm-blind GLM-adapted votes each, all 28 valid and all pairs resolved. The
final exposed-development score is **6/26 (23.1%)**, with no unresolved
items. The score receipt is `FINAL-SCORE-R74.json` in that WSL archive,
SHA-256 `02813c0c9e0aec14002802d3050e6525c112c9ff42f4bb84a79092f565f01403`.
The earlier independently frozen r18 transfer treatment was **5–6/26**. On
the 25 r18 resolved questions, this newer, post-reference-tuned candidate
gains four and loses three relative to that treatment. It is not a
prospective improvement or a head-to-head superiority result. The original
≥14/26 advancement gate is not met. The 140-question confirmation partition
stays closed; no official LongMemEval-V2 or product superiority claim follows.

## Observed failure mechanisms

- The complete Incidents Filters menu was in the packet, yet the reader
  omitted “My Open Incidents” from the substring-`Incident` answer. This is
  an exact-set extraction failure after successful source retrieval.
- The Order View tablist was complete and the scoped r68 check showed no
  `Transactions` tab, yet the reader answered `Credit Memos` as if the false
  premise were true. This is a contradiction-to-final-answer failure.
- The Magento `Back` transition landed on All Reviews, yet the answer began
  “Yes” to a question about returning to Pending Reviews. This is a
  destination-to-decision failure.
- The biography-save answer did not establish the requested persisted state
  from the selected evidence, illustrating continued source-selection and
  answer-policy weakness beyond those three exact cases.

These are exposed development observations, not independent gains. A next
candidate should emit typed source facts (complete set, transition
destination, post-save persistence, and insufficiency) and apply an exact
predicate/answer formatter before the reader can finalize. It must be
screened over **all 26** exposed questions for source reach and answer
faithfulness, not only the three known examples. If that candidate has broad
source support, freeze it for a fresh independent reserve cohort before any
confirmation access. Do not repeatedly score variants on the same exposed
set as if they were independent trials.

## Reproducibility

Builder and runner sources:
[`build-lme-v2-hybrid-reader-r69.py`](../research/g03-beam-r1/build-lme-v2-hybrid-reader-r69.py),
[`run-lme-v2-hybrid-reader-r70.mjs`](../research/g03-beam-r1/run-lme-v2-hybrid-reader-r70.mjs),
[`score-lme-v2-hybrid-r71.py`](../research/g03-beam-r1/score-lme-v2-hybrid-r71.py),
[`build-lme-v2-hybrid-judges-r72.py`](../research/g03-beam-r1/build-lme-v2-hybrid-judges-r72.py),
[`run-lme-v2-hybrid-judges-r73.mjs`](../research/g03-beam-r1/run-lme-v2-hybrid-judges-r73.mjs),
and [`score-lme-v2-hybrid-final-r74.py`](../research/g03-beam-r1/score-lme-v2-hybrid-final-r74.py).
The WSL judge archive is
`/home/vlad_/are-benchmark-archive/g03-lme-v2-hybrid-judge-run-r73`, with
result SHA-256
`7ec1b888c2df24d48a1c84c092563652e8a9395fc2d8bec785ab86abcc1c58dc`.
All provider calls were private VPS-local GLM calls with no automatic retry.

## Open Questions

- Can a general source-fact compiler express enough exact predicates across
  all question types without coding to exposed answer keys?
- What source-reach and answer-faithfulness threshold justifies another
  independent 26-question transfer given the repeated exposed development?
- Is the available reserve partition large and balanced enough for a fresh
  prospective comparison without weakening the existing 140-question
  confirmation holdout?
