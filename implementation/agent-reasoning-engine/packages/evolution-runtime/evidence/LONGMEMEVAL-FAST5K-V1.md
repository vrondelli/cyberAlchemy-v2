# LongMemEval G03 fast development screen — 2026-09-26

Status: completed development screen, not an untouched confirmation or full-benchmark claim.

## Hypothesis and result

Halving the ranked whole-turn projection from about 10,000 to 5,000 serialized
characters would retain answer accuracy while reducing token cost and response
time. The four fixed source-only G03 questions were answered with GLM-5.3-Flash
on the VPS. The native LongMemEval rubric then judged the completed answers in
a separate reference-access process. All four judgments were valid and correct.

| Arm on these four questions | Correct | Generation tokens | Judge tokens | All-in tokens |
| --- | ---: | ---: | ---: | ---: |
| Historical matched control | 2/4 | 556,385 | 758 | 557,143 |
| Prior 10K treatment | 4/4 | 11,489 | 861 | 12,350 |
| New 5K treatment | 4/4 | 6,304 | 833 | 7,137 |

The 5K treatment used 42.21% fewer all-in tokens than the prior treatment and
98.72% fewer than the historical control. These are exact known-token sums for
this fixed cohort, not estimates. Generation alone used 45.13% fewer tokens
than the prior treatment. Four generation and four judge calls completed, with
four successful tokenizer measurements in each phase, zero retries, no failed
calls and no unknown usage.

Summed generation-model service time was 12,356 ms for 5K, 13,738 ms for the
prior treatment and 972,951 ms for the historical control. This is a sum of
provider-call durations, **not campaign wall time**. The new generation tasks
including tokenizer measurement took 15,046 ms summed; the prior run does not
have the same end-to-end per-arm measurement. The 10.06% model-service-time
improvement over prior treatment is too small and noisy to claim a confirmed
latency gain. The large control gap mainly reflects its 148 ingestion/answer
calls versus four treatment answer calls.

## Evidence and boundaries

- [Generation run and receipts](longmemeval-fast5k-v1-generation/RESULT.json):
  four sealed task results and 24 gateway events.
- [Reference-bound native score and receipts](longmemeval-fast5k-v1-score/RESULT.json):
  four valid judgments and 24 gateway events. Reference values are not in these
  receipts.
- Source-only G03 package on VPS:
  `/opt/are-benchmark-data/longmemeval/98d7416c24c778c2fee6e6f3006e7a073259d48f/unexposed-live-v1/source-v1`.
- Historical matched generation/evaluation seals on VPS:
  `/opt/are/evolution-runtime/evidence/longmemeval-unexposed-generation-v1/longmemeval-unexposed-recovery-r1/GENERATION-SEAL.json` and
  `/opt/are/evolution-runtime/evidence/longmemeval-unexposed-evaluation-v1/longmemeval-unexposed-evaluation-r1/EVALUATION-SEAL.json`.
- Local copies of the new generation and score result files have the same SHA-256
  as the VPS originals: `c339004a0ea0b85dbdfaa0e7b741e8d5734d66fe9a8104b7b23d3955c8c7baaf`
  and `c6918f332fb0c13cf7391b812f7263d058134df5fcb5c0734070039ecf19e49f`.

The control and prior treatment are historical, not freshly interleaved with
this screen. The cohort is four already exposed questions, and answer accuracy
was at ceiling before this hypothesis. Thus this result promotes 5K for a
larger prospective matched test; it does not prove general accuracy, cost or
latency improvements by itself.

## Next experiment

Select a larger untouched LongMemEval full-S cohort using source-only input.
Run the 5K treatment and a fresh counterbalanced 8K control with a common
native rubric and explicit wall, provider-service and all-in token accounting.
Keep the 4-question development cohort out of that confirmation. The runner's
current four-ID source adapter must be generalized before dispatch; that is the
next engineering seam, not a reason to rerun the existing cohort.

## Open Questions

What cohort size gives a useful accuracy interval within the available GLM
budget? Does 5K retain accuracy across question types and long histories?
How much of the provider-service-time gap survives a fresh interleaved run?
