# Ready-gated live corrective evaluation

Both new corrective proposals passed the separate oracle **8/8 checks each**. The fixed run nevertheless missed its full target: only the empty-history correction completed both public validation and oracle assessment. Archive post-repair public validation timed out, and the final unchanged proposal blocked during initial validation.

| Proposal | Feedback outcome | Separate oracle |
| --- | --- | --- |
| Long recent 1 | REPAIRED; public checks passed | 8/8 |
| Archive recent 1 | UNCHANGED | 8/8 |
| Scoring clear 1 | UNCHANGED | 8/8 |
| Scoring clear 2 | UNCHANGED | 8/8 |
| Archive recent 2 | BLOCK; post-repair public children timed out | 8/8 on returned replacement |
| Long recent 2 | BLOCK during initial public validation | Not assessed; no candidate returned by stage |

The run completed all six scheduled stage invocations. Two corrective model attempts and two tokenizer attempts were recorded; both model requests dispatched and returned HTTP 200. Immediate readiness passed before each corrective call. There were no retries, second corrections, failure replacements or applied patches. The separate oracle ran only after all feedback calls and did not feed model prompts.

The archive replacement includes the required interior-start rejection and passed all independent oracle checks, but its three public validation children timed out. This remains a blocked stage result; the later oracle does not erase the earlier failure. The final retained proposal also encountered child timeouts. Thus readiness at dispatch is insufficient to guarantee stable execution throughout the task. We have evidence that the corrective prompts repaired both selected defects, but not a clean full evaluation.

No source or threshold changed in this request. All enumerated source entries matched after completion. Existing 21-test validation belongs to the unchanged implementation; no new unit-test run is claimed. Earlier v20 scores and failed feedback runs remain separate. This selected, retrospective corrective-stage sample does not establish fresh end-to-end repair reliability, unseen-task performance or long-context continuity.

Evidence: [plan](PLAN.md), [frozen manifest](run/manifest.json), [aggregate and per-check oracle results](run/result.json), and individual readiness, transport and proposal records in `run/`. Private admission ledgers remain under `/tmp/are-ready-feedback-32`. No provider reasoning was exported. CAV2-D65 bounded validation, authority effect none.

## Open Questions

Can a genuinely isolated worker complete the same fixed pipeline without mid-run execution stalls? A readiness probe cannot reserve host capacity. Is the one-turn improvement reproducible on fresh task runs? Default integration and activation remain separate decisions. The next useful execution experiment should address worker stability rather than retuning these now oracle-correct proposals.
