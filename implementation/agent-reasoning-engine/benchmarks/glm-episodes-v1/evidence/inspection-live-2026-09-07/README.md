# Inspection-guidance live trial — 2026-09-07

The implemented guidance was run on retention-tool-pairs. Neither policy produced
a patch: both hit strict fresh-context admission. V2 passed archive continuity;
clearing did not. The conditional scorer regression was not started because the
retention success condition was unmet. No automatic retries occurred.

| Policy | Model calls | Tokenizer calls | Repair | Continuity | Rejected reserved request |
| --- | ---: | ---: | --- | --- | ---: |
| recent-observations-v2 | 7 | 12 | No candidate | Pass | 8,017 tokens |
| clear-v1 | 7 | 11 | No candidate | Fail | 8,044 tokens |

Both failed with recycling.fresh-context-too-large. Last measured inputs were
5,713 and 5,740 tokens; adding the unchanged 2,048 output reservation and 256
margin exceeded the 8,000 soft limit by 17 and 44 tokens. The guard blocked the
next model dispatch. All actual dispatches remained within the strict limit.
Provider-internal compaction remains unobservable.

See [checked report](checked-report.json), [analysis](analysis.json),
[manifest](manifest.json), [result](result.json), and arm visible traces.
Total usage: 14 model calls, 23 tokenizer calls, 59,111 input and 613 output tokens.
No endpoint failures were recorded. Caps remained 24 model/48 tokenizer calls and
1,200 seconds for the pair, with 12/24 calls and 580 seconds per arm. Runtime,
fixture, delivery and source policies were frozen across both arms.

V2 recovered one meaningful archive page and repeated two whole-file reads.
Clearing performed no archive recovery and repeated three whole-file reads.
Both delivered all four required files, but each left a later repeated read
undelivered. Neither reached the final three-response synthesis reserve before
context admission blocked further progress. This trial cannot establish that
the reserve improves finalization. One exploratory pair also cannot attribute
behavior changes solely to the guidance.

## Validation and construction

This executes the [existing D65 construction plan](../../../../packages/coding-agent-runtime/glm-flash-v1/evidence/INSPECTION-GUIDANCE-PLAN.md).
The prior 319-test source hashes matched before and after live execution. Tests
were not rerun; the log and historical source receipt are included. Its earlier
live_validated:false flag describes the pretrial checkpoint; this directory owns
the later failed live result. The checked report passed recorded integrity,
policy and accounting checks against the complete private run. It does not
rerun an oracle or authenticate records cryptographically.

Exports omit raw message history and provider reasoning. Complete local report
inputs remain at /tmp/are-glm-inspection-live-2026-09-07; the export is not a
complete reportRun input. No candidate existed to apply. Defaults unchanged;
authority effect none. Existing operator credentials and endpoint worked.
Publication, deployment and default activation remain deferred.

## Open Questions and next step

- Can redundant prompt metadata be reduced enough to preserve strict admission?
- Should repeated full-file reads be redirected through bounded recovery, while preserving exact delivery semantics?
- Will synthesis guidance help once the run reaches its reserved responses?

Next bounded construction target: reduce measured request overhead and add a
regression fixture for these rejected requests before another paid trial. Keep
the token limits, output reserve, delivery accounting and repair oracle intact.
