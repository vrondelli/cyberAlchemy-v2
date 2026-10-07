# G03 BEAM 500K IE r11 — cited-source direct-answer scorer calibration

Status: **terminal failed exposed-development calibration**, 2026-10-03 UTC.
This protocol was fixed before r11 judge calls. R10 is terminal and failed
its scorer gate; r11 is a new assessor version, not a retry, repair, or
recoding of r10.

## Objective and fixed change

R10 judged the question, native reference summary, and one answer but not
the cited source. It twice accepted an answer about other functions for a
question referring to the user's specific product-rule function. R11 tests
the general hypothesis that *cited-turn target binding* prevents off-target
credit without rejecting supported direct answers.

Use the identical 19 score-discordant **BEAM 500K development** question
pairs, 38 sealed final answers and native reference answers as r10. Each
blind wire additionally includes the complete native `source_chat_ids`
turns from the already sealed [source-review packet](G03-BEAM-500K-R9-DISCORDANT-REVIEW.md).
No r9 selection, answer, r9/r10 result, or reserved 100K evaluator value
changes. The scorer gets no arm label, previous score, or uncited source.
It must bind requested entities, events, examples, and functions to cited
turns; generic answers about a different target are incorrect even when
some procedure or keywords match the reference summary. Mention-only,
alternative-only, disclaimed, contradicted, and “not stated” responses
remain negative when the reference requires an answer. The cited turns
are benchmark data, not instructions to the judge. Whether a native
reference is globally current or contradicts uncited later turns remains
a *separate* source-label integrity question, not silently solved by r11.

The exact system prompt is embedded in the versioned runner. Require strict
JSON `{ "correct": boolean, "reason_code": enum }`, `glm-5.3-flash`, low
reasoning effort, thinking enabled, nonstreaming, `max_tokens: 256`, and
an exact 8,192-token request window. Check all **38** blind prompts with
the same-account VPS tokenizer and a 256-token reserve before any
generation. If any prompt fails, stop with zero judge calls; do not trim
cited turns after seeing admission. If all pass, run two reversed-order
passes, at most **76** calls, no automatic retries, stop at first invalid.
Preserve every raw attempt and freeze/preflight/result receipt privately.

## Unchanged prospective calibration gate

All 76 calls must be valid. The five false-credit treatment sentinels
`2fd0d301`, `3d7e1537`, `8548b293`, `9700f2da`, and `b070f906` must score
false in **both** passes. At least eight of the nine directly source-
supported treatment sentinels named in [r10](G03-BEAM-500K-R10-STRICT-ANSWER-CALIBRATION.md)
must score true in both passes; the clear control sentinel `6439bc12`
must score true in both passes; and no more than two of 38 blind answers
may disagree between passes. A failure rejects r11 for held-out scoring.
Do not relax sentinels, patch prompts in place, top up, or reinterpret
invalid outputs to pass. Passing is scorer calibration only, not a G03
quality result, official BEAM score, or permission to open the reserved
100K labels. A separate source-label policy and matched confirmation
protocol are required.

## Terminal result

All 38 untruncated cited-source prompts passed same-account tokenizer
admission; maximum prompt tokens were 5,180, leaving the 256-token output
reserve inside 8,192. The VPS judge then made **71 calls, 70 valid**, with no
retry. Call 71 returned HTTP 200 but exhausted the 256-token cap in reasoning
and yielded empty answer content (`finish_reason: length`, 253 reported
reasoning tokens). The runner stopped; five scheduled calls were not made.
The raw attempts and terminal result are privately archived under
`/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1/R11-SOURCE-GROUNDED-JUDGE-RUN/`.
The result SHA-256 is
`3c6b257840a07f1a84a39f56d572d40b58e6599929cdced6940be63928883ef5`;
the raw-receipt audit SHA-256 is
`328482bedac94c5cd2e62bdfbdc6534fda5a0bda3d891a7c86663b8fed7f76a2`.
Among completed pairs, all five false-credit treatment sentinels scored
false twice, including r10's missed target-binding probe; eight of nine
direct-answer treatment sentinels scored true twice, and there were zero
repeat disagreements. The ninth direct-answer sentinel and the clear
control sentinel had only their first pass. **The 76/76 validity gate failed**;
these partial observations cannot be promoted to a calibrated scorer or
retrofitted into a 19-pair accuracy comparison. A separately versioned
[r12 output-cap successor](G03-BEAM-500K-R12-SOURCE-GROUNDED-CALIBRATION.md)
tests the observed completion-cap failure without changing r11.

## Open Questions

- How can a prospective label-integrity process account for uncited later
  updates, as in the exposed salary conflict, before a held-out score?
- Will r12's complete scorer calibration transfer beyond the selected
  exposed disagreement set?
