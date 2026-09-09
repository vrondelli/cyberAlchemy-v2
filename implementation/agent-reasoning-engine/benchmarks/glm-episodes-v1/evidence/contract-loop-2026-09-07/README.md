# Compact contract loop — 2026-09-07

Target reached: 3 consecutive paired repair-and-continuity passes at soft limit8000. Overall 7/8 repairs and 8/8 continuity passes. The failed first repair remains counted.

## Implementation

Opt-in compact-contract-v5 shortens v4 contract guidance and two repeated completion explanations. It preserves the exact patch schema, strict rejection diagnostics, required recovery, native delivery accounting, fixture/oracle, output reserve2048, token margin256, hard16384 and soft8000. Existing policies and defaults remain unchanged. The pre-freeze [362-test suite](tests.tap) passed without failures, including prompt-size reduction and malformed-candidate rejection without retries.

The previous v4 fresh request measured5754 input tokens: with reserve and margin it exceeded8000 by58. Every dispatch in this loop fit its limit. However, minimum measured headroom was only 29 tokens: this remains a narrow candidate budget, not broad robustness evidence.

## Every trial

| Pair | Policy | Repair | Continuity | Minimum soft headroom | Evidence |
| ---: | --- | --- | --- | ---: | --- |
| 1 | clear-v1 | False | True | 31 | [Report](iteration-01/trial-00/checked-report.json) |
| 1 | recent-observations-v2 | True | True | 31 | [Report](iteration-01/trial-01/checked-report.json) |
| 2 | recent-observations-v2 | True | True | 30 | [Report](iteration-01/trial-02/checked-report.json) |
| 2 | clear-v1 | True | True | 36 | [Report](iteration-01/trial-03/checked-report.json) |
| 3 | clear-v1 | True | True | 33 | [Report](iteration-01/trial-04/checked-report.json) |
| 3 | recent-observations-v2 | True | True | 32 | [Report](iteration-01/trial-05/checked-report.json) |
| 4 | recent-observations-v2 | True | True | 29 | [Report](confirmation-01/trial-00/checked-report.json) |
| 4 | clear-v1 | True | True | 39 | [Report](confirmation-01/trial-01/checked-report.json) |

The first clear-v1 patch passed7/8 oracle checks but missed positional ordering. All subsequent patches passed8/8. Continuity requires all prescribed reads/delivery, actual recycling and meaningful archive recovery.

## Experiment boundaries

Used 49 model and 61 tokenizer attempts; recorded input/output tokens 176737/6892. Median arm time 46.1s.

The [plan](PLAN.md) defined the target. [Iteration01](iteration-01/manifest.json) froze six trials. After pairs2/3 passed, a separately [predeclared confirmation pair](confirmation-01/PLAN.md) used identical frozen source hashes and task bytes. Pair4 passed, satisfying the consecutive-pair target. This is adaptive stopping on the same task; neither the streak nor7/8 is an unbiased reliability estimate. No failed trial was replaced or automatically retried.

Source hashes matched across both batches and at aggregation ([validation](validation.json)). Checked reports validate recorded integrity/accounting and oracle receipts; they are not fresh oracle replays or cryptographic authenticity proofs. Exact raw inputs remain under /tmp/are-glm-contract-loop-01 and /tmp/are-glm-contract-confirmation-01. Exported visible traces omit raw message history/provider reasoning. These subset exports are not standalone report inputs. Request admission and recycling measurements cannot prove absence of provider-internal compaction.

## Open Questions

- Can we increase the 29-token minimum headroom without removing useful evidence?
- Does the candidate generalize to held-out tasks and longer contexts?
- Will controlled, non-adaptive repetitions confirm the apparent improvement?
- Can a separately frozen longer fixture exercise continuity at12K?
