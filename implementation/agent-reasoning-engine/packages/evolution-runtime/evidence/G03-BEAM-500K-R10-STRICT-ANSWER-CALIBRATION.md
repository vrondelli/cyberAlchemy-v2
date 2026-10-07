# G03 BEAM 500K IE r10 — direct-answer scorer calibration

Status: **private exposed-development protocol fixed before r10 judge calls**,
2026-10-03 UTC. R9's source selections, GLM answers, rubric scores, and
19-pair source review remain immutable. R10 changes only the *evaluation
method* on those sealed answers; it is not a new retrieval or answer run.

## Objective and population

Test whether a question-aware GLM judge rejects incidental mention,
off-target answers, unsupported “not stated” answers, and contradictory
qualifications that inflated r9's criterion-only rubric. The population is
**all 19 non-tied r9 question pairs**, 38 already sealed final answers.
Their questions and native evaluator reference answers come from pinned
**BEAM 500K development** evidence. The reserved 100K evaluator values,
conversation turns, and labels must not be read by this calibration.

## Fixed assessor

Each blinded wire contains only the question, native reference answer, and
one final response. No arm label, source projection, prior score, reasoning
record, or source citation is emitted. The evaluator asks whether the
response *directly and unambiguously answers the asked question*. The full
material reference must be asserted for a positive binary score. A fact
present only in a list of alternatives, explicitly disclaimed, contradicted,
or surrounded by a “not stated/cannot confirm” answer is negative. Incidental
word overlap is insufficient. Additional correct context does not invalidate
an otherwise clear direct answer. Source/reference integrity is a separate
pre-answer review; the judge cannot adjudicate an outdated or false label
from the reference alone.

The exact prompt is embedded in the versioned runner. Output is strict JSON
`{"correct": boolean, "reason_code": enum}`; a missing/invalid field or
provider failure stops the run. Use `glm-5.3-flash`, 8,192-token request
window, `max_tokens: 256`, low reasoning effort, thinking enabled,
nonstreaming, on the same private VPS/credential helper. Preflight all 38
prompts with the same-account tokenizer and a 256-token reserve before any
generation. Run two zero-retry passes in opposite blind-ID order, at most
**76 judgment calls**, stopping on the first invalid output. Preserve raw
attempts, freeze, preflight, result, hashes, tokens, and summed per-call time
privately; repository receipts contain no unrestricted raw response.

## Prospective calibration gate

This gate tests scorer behavior, **not** model or retrieval superiority.
The [prior source/answer review](G03-BEAM-500K-R9-DISCORDANT-REVIEW.md)
established five treatment false-credit sentinels (`2fd0d301`, `3d7e1537`,
`8548b293`, `9700f2da`, `b070f906`), nine direct supported treatment-answer
sentinels (`2c413d7a`, `3f98850e`, `45a30701`, `4af4a8c9`, `51b33f57`,
`79548ee8`, `a30c6b37`, `bfed0d1b`, `d1fba1d9`), and one clear control
answer (`6439bc12`). The five false-credit sentinels must score false in
**both** passes. At least eight of nine direct supported treatment answers
must score true in **both** passes. The clear control answer must score true
in both passes. At most two of 38 blind answer wires may disagree across
passes. All 76 calls and parser outputs must be valid. A failure rejects this
assessor version for the held-out protocol; no retry or post-hoc prompt
repair is credited to r10.

Any aggregate accuracy comparison on the 19 pairs is descriptive only:
these cases were selected because r9's criterion-only scores differed. The
strict judge remains a **GLM-adapted**, not official BEAM, evaluator. Even a
passed sentinel gate does not license opening 100K labels without a separately
fixed source-label policy and a matched 32-question confirmation protocol.

## Open Questions

- Will the strict judge pass its fixed false-credit and true-answer sentinels
  without adding instability or invalid outputs?
- How should independently reviewed source/reference conflicts be handled
  prospectively for the untouched confirmation population?
- Can the full 32-question 100K source-only population use the same frozen
  5K dual-view mechanism and 8K wire bounds?

## Terminal calibration result — 2026-10-03 UTC

The [wire builder](../research/g03-beam-r1/build-beam-500k-r10-strict-answer-wires.py)
sealed 38 blind requests at private SHA-256
`6065d02a532a87accd82b5eaf4ae026c28880d2457a1f2747171e3838bafa28f`;
the separate private arm map is
`c27b7c43cad511f9fa5924b0848f06115823cc50e63e32d755e2b7021223067d`.
VPS tokenizer admission passed **38/38** requests. The two-pass zero-retry
run completed **76/76 valid** judgments, terminal result SHA-256
`bc49c17d89507169547db9f10af90bd078829ed3c687ebcaa8520a443894edef`.
All raw attempts were copied to private WSL storage and hash/identity-checked
by the [auditor](../research/g03-beam-r1/audit-beam-500k-r10-strict-answer-judge.py),
private audit SHA-256
`b72f06c966e28960d59ad03c0cd35198b5b78c23bb5fc08aba3050abd6c8d496`.
Known judge usage was **29,498 prompt + 2,006 completion tokens** and
**152.890 seconds** summed per-call time.

The fixed calibration gate **failed**. All nine directly supported treatment
sentinels and the clear control sentinel scored true in both passes. Four of
five false-credit treatment sentinels scored false in both passes, and there
were zero repeat disagreements. The exception was `9700f2da`: the scorer
twice accepted a generic product-rule explanation about *other functions*
as a direct answer to the cited user's specific two-factor function. This
is the exact target-binding defect the gate was designed to catch. The
judge received the question and native reference but **not the cited source
turn**; the native reference summarizes the procedure without naming that
function. This is a plausible explanation for the miss, not a proven causal
attribution. A successor should test full cited-source grounding under the
same 8K admission and fixed sentinel gate rather than rewording r10 in place.
The 19-pair descriptive strict counts (12 treatment true, four control true)
are selected-case calibration observations, **not** population estimates.
R10 is rejected for held-out scoring; its failed sentinel must not be
waived, retried in place, or retrospectively recoded. A separately named
assessor may test a general target-binding rule on exposed data, but any
further tuning remains development-only.
