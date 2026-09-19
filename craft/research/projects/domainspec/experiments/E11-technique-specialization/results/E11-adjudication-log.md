# E11 Adjudication Log

- run_id: run-2026-04-22-bootstrap
- adjudication_mode: bootstrap-automated-dual-pass
- disclaimer: derived from E9 rows for pipeline execution rehearsal; not publication-grade adjudication evidence.

## Summary

- total_rows: 155
- adjudication_subset_rows: 33
- disagreements: 0
- third_rater_resolutions: 0

## Notes

- Dual-rater and third-rater processes were emulated for pipeline dry-run continuity.
- Final claim-upgrade hold from rehearsal phase is superseded by the 2026-04-25 closure packet.

## Manual Run Cycle - 2026-04-22

- run_id: run-2026-04-22-manual
- adjudication_mode: manual-provisional-ai-third-rater
- third_rater_id: rater-c
- note: provisional AI adjudication for workflow continuity; replace with human third-rater decisions for evidence-grade claim movement.

### Summary

- total_subset_rows: 35
- disagreements: 19
- third_rater_resolutions: 19
- remaining_disagreement_count: 0
- agreement_ratio_pre_third_rater: 0.457

### Third-Rater Resolution Table

| row_id | analysis_unit | technique_family | rater_a_label | rater_b_label | final_label | rationale_code | rationale_text | third_rater_id | adjudicated_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| manual-0001 | edge | Saga orchestration vs choreography | not-needed | needed | likely-needed | TR-TIE-SCORE | Wide disagreement resolved to likely-needed by composite score. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0002 | edge | Queueing and backpressure | not-needed | not-needed | not-needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0003 | edge | Batching and chunking | likely-needed | likely-needed | likely-needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0004 | edge | Optimistic vs pessimistic locking | likely-needed | needed | needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0005 | edge | Abstraction patterns | likely-needed | needed | needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0006 | edge | Retry, idempotency, circuit breaker | likely-needed | needed | needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0007 | edge | CQRS and related variants | needed | needed | needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0008 | edge | Saga orchestration vs choreography | needed | needed | needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0009 | edge | Queueing and backpressure | needed | not-needed | likely-needed | TR-TIE-SCORE | Wide disagreement resolved to likely-needed by composite score. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0010 | edge | Batching and chunking | likely-needed | needed | needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0011 | edge | Optimistic vs pessimistic locking | not-needed | likely-needed | likely-needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0012 | edge | Abstraction patterns | not-needed | likely-needed | likely-needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0013 | edge | Retry, idempotency, circuit breaker | likely-needed | needed | needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0014 | edge | CQRS and related variants | likely-needed | needed | needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0015 | edge | Saga orchestration vs choreography | likely-needed | needed | needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0016 | edge | Queueing and backpressure | likely-needed | needed | needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0017 | edge | Batching and chunking | needed | not-needed | likely-needed | TR-TIE-SCORE | Wide disagreement resolved to likely-needed by composite score. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0121 | scenario | Saga orchestration vs choreography | not-needed | not-needed | not-needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0122 | scenario | Queueing and backpressure | likely-needed | likely-needed | likely-needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0123 | scenario | Batching and chunking | likely-needed | likely-needed | likely-needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0124 | scenario | Optimistic vs pessimistic locking | likely-needed | likely-needed | likely-needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0125 | scenario | Abstraction patterns | needed | needed | needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0126 | scenario | Retry, idempotency, circuit breaker | needed | needed | needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0127 | scenario | CQRS and related variants | needed | needed | needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0128 | scenario | Saga orchestration vs choreography | needed | not-needed | likely-needed | TR-TIE-SCORE | Wide disagreement resolved to likely-needed by composite score. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0129 | scenario | Queueing and backpressure | not-needed | likely-needed | likely-needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0130 | scenario | Batching and chunking | likely-needed | likely-needed | likely-needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0131 | scenario | Optimistic vs pessimistic locking | likely-needed | likely-needed | likely-needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0132 | scenario | Abstraction patterns | likely-needed | needed | needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0133 | scenario | Retry, idempotency, circuit breaker | needed | needed | needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0134 | scenario | CQRS and related variants | needed | needed | needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0135 | scenario | Saga orchestration vs choreography | needed | not-needed | likely-needed | TR-TIE-SCORE | Wide disagreement resolved to likely-needed by composite score. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0136 | scenario | Queueing and backpressure | needed | likely-needed | needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0137 | scenario | Batching and chunking | not-needed | likely-needed | likely-needed | TR-TIE-HIGHER | Adjacent disagreement resolved by conservative higher-need policy. | rater-c | 2026-04-22T16:30:40.758075+00:00 |
| manual-0138 | scenario | Optimistic vs pessimistic locking | likely-needed | likely-needed | likely-needed | TR-AGREE | Raters agree on adjudicated need label. | rater-c | 2026-04-22T16:30:40.758075+00:00 |

## Human-Attested Closure Cycle - 2026-04-25

- generated_at_utc: 2026-04-26T08:05:03Z
- adjudication_mode: human-attested-single-review-override
- verifier: Vladimir Rondelli
- policy_override_reason: resource-constrained review capacity
- policy_override_revisit_trigger: new contributors to research
- source_artifacts:
	- results/E11-adjudication-rater-a-human-2026-04-25.csv
	- results/E11-adjudication-rater-b-human-2026-04-25.csv
	- results/E11-adjudication-disagreements-human-2026-04-25.csv
	- results/E11-adjudication-third-rater-human-2026-04-25.csv
	- results/E11-human-adjudication-round-lock-2026-04-25.md

### Closure Summary

- total_subset_rows: 35
- disagreements: 19
- third_rater_resolutions: 19
- remaining_disagreement_count: 0
- verifier_confirmation: frozen subset unchanged and final adjudication map approved

### Decision Artifacts

- D4 packet: `results/E11-D4-decision-packet-2026-04-25.md`
- claim delta: `results/E11-claim-delta.md`
- verification: `results/E11-human-adjudication-verification-2026-04-25.md`
