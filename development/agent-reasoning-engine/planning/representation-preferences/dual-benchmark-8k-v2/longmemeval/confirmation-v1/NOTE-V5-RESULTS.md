# LongMemEval note-v5 development result

The fixed four-task development comparison passed every declared gate. The ARE deterministic source-retrieval treatment answered all four tasks correctly; sequential compact-note control answered two correctly. All eight assigned answers and judgments completed. This is a successful development result, not untouched confirmation or full-benchmark perfection.

| Metric | Control | ARE treatment |
| --- | ---: | ---: |
| Correct / assigned | 2 / 4 | 4 / 4 |
| Completed answers | 4 / 4 | 4 / 4 |
| Generation tokens | 563,167 | 11,550 |
| Native judge tokens | 1,057 | 1,112 |
| Total model tokens | 564,224 | 12,662 |

The treatment used **97.76% fewer total model tokens**, exceeding the 15% target on this comparison without lower quality. The denominator includes each arm's ingestion, note carry, final answers and native judging. Provider parent totals include reasoning and cached input; neither is subtracted. There were 154 generation calls and eight judge calls, consuming **576,886 tokens** in total, with no unknown expenditure or held reservations.

## What changed and what the evidence supports

The predecessor's two control notes truncated at a384-token output allowance, leaving only two control answers complete. This successor allows768tokens per note while keeping the120-word note instruction and treatment algorithm unchanged. One note used418completion tokens and completed; the other145note calls stayed at or below384. All146notes and eight answers completed without retries.

A tokenizer-only intermediate attempt caught an unnecessarily fixed6,976-input ceiling. The successor admits exactly8,000minusoutputreserve input tokens:7,232for768-output ingestion,6,976for1,024-output answers. Fresh qualification used159actual tokenizer measurements. One source-order chunk split changed36,37,36,36chunks to36,37,36,37; all source turns were preserved. Every actual generation/judge request fit8K. The largest generation input-plus-reserved-output was7,265tokens, so this result does not claim every request filled the window.

The treatment selects source-only evidence deterministically before answering. The control repeatedly summarizes the complete112K-plus histories. The result supports this memory-handling comparison on these tasks; it does not establish that every ARE feature, another model, or every task benefits equally. The same tasks were exposed in predecessor development. Native judging remains model-dependent evidence.

## Evidence and research decision

- [Immutable97-binding freeze](live-note-v5-freeze.json), [execution protocol](NOTE-V5-PROTOCOL.md) and [research plan](NOTE-V5-RESEARCH-PLAN.md).
- [Terminal generation seal](live-note-v5-r1/GENERATION-SEAL.json) and [isolated native scoring](evaluator/score-note-v5-r1/RESULTS.json).
- [Independent receipt reconciliation](postrun-note-v5-r1/RECONCILIATION.json), [evidence hashes](postrun-note-v5-r1/EVIDENCE.json), [native supporting observation](postrun-note-v5-r1/OBSERVATION.json) and [learning decision](postrun-note-v5-r1/LEARNING-DECISION.json).

[Independent result review](RESULT-NOTE-V5-REVIEW.md) verified all1,145evidence hashes and reproduced the reconciliation without reference-answer access. All thirteen reconciliation gates pass: exact receipt/plan evidence, source integrity, settled transports, complete planned generation, clean execution, known accounting, all eight answers/judgments,8K admission, token ceilings,4/4treatment quality, nonregression and15%savings. Classification is supporting; authority_effect remains none and campaign_goal_achieved remains false.

The previous bounded-v3 trial's370,852tokens remain charged to that failed comparison. Together these two generation-and-judging trials consumed947,738known tokens; this is not the entire research campaign's expenditure. The failed note-v4 tokenizer qualification and first native-registration attempt also remain preserved. No predecessor is reclassified as successful.

## Next order

1. Review this development result and preserve its exact treatment/counterpart definitions.
2. Predeclare a broader, untouched LongMemEval cohort and acceptance criteria before seeing answers or outcomes. Reuse the stable architecture, include every assigned task and all model costs, and retain the perfect-treatment/15%savings conjunction.
3. Finish ContextBench bounded-write integration, fresh source-complete preparation and exact review, then run its sixteen-slot component diagnostic. Component success still requires a separate full-trajectory quality/efficiency comparison.
4. Complete shared supervision and measured two-plus-two capacity before any four-worker scaling. Worker count changes throughput, not token efficiency.
5. Keep the original reusable-retention objective, GLM8K milestone and research ontology/DAG in every successor. Do not mark the campaign complete from this four-task result.

## Open questions

Will perfect treatment quality and savings replicate on untouched histories? Which failure modes appear outside this selected cohort? Can ContextBench reach perfect native quality and at least15% savings on complete trajectories? Does the mechanism transfer to other models and non-code contexts? Those requirements remain open.
