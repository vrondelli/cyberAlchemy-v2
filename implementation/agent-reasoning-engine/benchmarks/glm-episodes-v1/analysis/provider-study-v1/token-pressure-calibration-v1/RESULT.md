# H22 actual-token pressure calibration result

All three windows have an independently audited pressure interval. The full-history template contains both original fact bodies; the engine-rendered fallback contains neither. With the same neutral padding, all six preceding read templates remain admitted. Calibration used **54 actual provider tokenizer attempts, zero model calls, zero retries and zero failed receipts**. Session 93910 exited 0.

| Nominal window | Effective limit | Largest prefix including reserves | Full history including reserves | Fallback including reserves | Padding blocks |
| --- | --- | --- | --- | --- | --- |
| 8,000 | 7,744 | 7,389 | 7,765 | 6,637 | 64 |
| 10,000 | 9,744 | 9,400 | 9,780 | 8,638 | 109 |
| 12,000 | 11,744 | 11,384 | 11,761 | 10,625 | 154 |

Each projected count includes 2,048 reserved output tokens and the existing 512-token input margin. The effective limit also retains the existing 256-token soft headroom. The immediately smaller padding count is measured below the full-history threshold in every window. No limits were changed to obtain these intervals.

[Independent audit](audit.json) verifies normalized request bytes against the production transport serializer, request hashes, every reservation/dispatch/receipt, admission arithmetic and exact per-fact source bodies. [Raw result and receipts](live/result.json), [execution binding](execution-binding-80.json), and [three passing local tests](test-output.txt) are retained.

This establishes actual-token feasibility for controlled pressure testing. It does not establish a live model trajectory, a semantic failure under pressure, or a remedy. The prefix could be admitted; it was not dispatched to a live model. Full and fallback templates came from the unchanged engine under a synthetic trigger used only to capture renderings. Actual provider token measurements, not that trigger, establish the intervals above.

## Research decision and next step

[The canonical calibration observation](research.json) supports the feasibility experiment while keeping the full H22 semantic prediction untested. [The current DAG](../research/dag-token-pressure-80-final.json) contains 105 records and 173 edges.

Construct a controlled pressure episode with this exact neutral padding adapter, verify it locally, then separately freeze any live model study. Every real request must be measured again: different call identifiers or model output can move a narrow interval. Preserve early-pressure and unbracketed outcomes explicitly instead of reclassifying them as semantic failures. No model execution or serving activation is granted by this calibration result.

## Open Questions

Will actual GLM proposals preserve both facts after the measured fallback? Which bounded representation can retain working evidence without H20's recovery loops? How does pressure interact with natural repository documents rather than neutral padding? The broader [pressure plan](../research/pressure-frontier-v1/PLAN.md) and GLM qualification remain open.
