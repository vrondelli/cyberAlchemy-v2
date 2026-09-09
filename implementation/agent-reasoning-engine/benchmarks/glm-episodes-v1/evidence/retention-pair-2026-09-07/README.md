# Retention task trial — 2026-09-07

The second controlled repair task completed under the unchanged corrected runtime.
V2 repaired the mutant (8/8 independent oracle checks), but failed archive
continuity. Clearing passed continuity but exhausted its model-call budget without
producing a patch. No policy passed both outcomes on this task.

| Policy (execution order) | Model calls | Tokenizer calls | Repair | Continuity |
| --- | ---: | ---: | --- | --- |
| recent-observations-v2 | 9 | 15 | 8/8 checks | Missing archive recovery |
| clear-v1 | 12 | 15 | No candidate; model-request-limit | Pass |

See [checked report](checked-report.json), [analysis](analysis.json),
[manifest](manifest.json), [result](result.json), and the arm directories for
visible traces and the V2 candidate. The [plan](../RETENTION-PAIR-PLAN.md)
uses the existing CAV2-D65 construction boundary. Candidate verification used
isolated benchmark copies; original fixtures remained unchanged.

Both arms delivered all four required files. V2 reread contract and cases three
times each, performed no archive recovery and still repaired the task. Clearing
read seven consecutive archive pages, exhausted its 12 model calls, and left its
last read undelivered. Continuity alone does not prove efficient completion.

The same source, delivery and completion policies as the
[corrected scorer trial](../source-corrected-2026-09-07/README.md) were used.
Across these two exploratory tasks, V2 repaired 2/2 with continuity 0/2; clearing
repaired 1/2 with continuity 2/2. This small sample does not establish a reliable
winner or isolate the causal effect of any prompt change.

## Validation

The checked report passed recorded integrity, policy, usage and oracle-receipt
consistency checks. All source hashes in the prior 316-test receipt matched before
and after this run; those tests were not rerun. The runner separately froze its
full runtime and fixture source manifest. Total usage: 21 model calls, 30 tokenizer
calls, 89,114 input and 1,733 output tokens. No retries or endpoint failures were
recorded. All dispatched requests stayed within the unchanged 8,000 soft limit,
including output reservation and safety margin; see analysis.json for headroom.
The hard limit remains 16,384. Provider internal compaction remains unobservable.

The exported evidence excludes raw message history and provider reasoning.
Complete private report inputs remain at /tmp/are-glm-retention-pair-2026-09-07;
the export is not a complete reportRun input. Hashes are not authentication and
the report does not rerun the oracle. Authority effect: none. Defaults unchanged.

## Open Questions and next implementation

- Can an explicit, typed outstanding archive-recovery requirement prevent V2's omission?
- Can budget-aware page selection stop clearing from reading through its final synthesis opportunity?
- Do those changes preserve independent repair success across both tasks?

Next candidate: expose the exact remaining inspection obligations alongside
remaining model calls, with a bounded recovery target and explicit final synthesis
step. Test that guidance against exhausted budgets, already-complete reads and
rejected dispatches before another matched trial. Do not increase caps or weaken
the oracle/continuity checks to turn these failures into passes.
