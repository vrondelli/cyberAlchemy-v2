# Execution-control live trial — 2026-09-07

Clearing produced a repair passing all eight independent oracle checks, but skipped
archive recovery. V2 passed continuity but returned a progress message instead of
a patch on its final response. Neither passed both outcomes; the conditional
scorer regression was not started.

| Policy | Model calls | Tokenizer calls | Repair | Continuity |
| --- | ---: | ---: | --- | --- |
| recent-observations-v2 | 12 | 14 | Invalid final response | Pass |
| clear-v1 | 6 | 8 | 8/8 oracle checks | Missing archive recovery |

Both used bounded-execution-v2, bounded-reads-v1 and inspected-mutation-v1 on the
same frozen runtime/task. In each arm, one repeated whole-file read was deferred
without filesystem execution. Neither had a successful repeated whole-file read.
V2 followed the hint and read six consecutive archive pages, then returned:
“Good progress — the contract text confirms the pairing requirement. Continuing.”
Candidate validation correctly rejected this text. Clearing produced its valid
candidate immediately after the deferred read, without archive recovery.

See [checked report](checked-report.json), [analysis](analysis.json),
[manifest](manifest.json), [result](result.json), arm traces and clearing's
[candidate](arm-1/candidate.json). Verification used an isolated benchmark copy;
the original fixtures remained unchanged. No repository repair was applied.

Usage: 18 model calls, 22 tokenizer calls, 72,420 input and 1,366 output tokens.
No endpoint failures, automatic retries or context-admission blocks occurred.
All dispatched requests fit the 8,000 soft limit including the unchanged 2,048
output reserve and 256 margin; hard limit remained 16,384. The pair stayed within
24/48 calls and 1,200 seconds, with 12/24 calls and 580 seconds per arm. Observed
admission does not establish the absence of provider-internal compaction.

## Validation and interpretation

The [construction](../../../../packages/coding-agent-runtime/glm-flash-v1/evidence/EXECUTION-CONTROL-PLAN.md)
passed 328 local tests. Its source hashes matched before and after live execution;
tests were not rerun. The copied source receipt's live_validated:false describes
the earlier checkpoint; this directory owns subsequent live evidence. The checked
report passed recorded integrity, policy, accounting and oracle-receipt checks.
It does not rerun the oracle or authenticate records cryptographically.

Repeat-read suppression worked at the execution boundary, but the two exploratory
arms do not establish a reliable repair improvement. Removing tools on the final
response cannot force the model to produce valid patch JSON. Archive continuity
and repair remain independent outcomes. Defaults remain unchanged.

Exports omit raw message history and provider reasoning. Complete private report
inputs remain at /tmp/are-glm-execution-live-2026-09-07; this export is not a
complete reportRun input. Authority effect none. Publication, deployment and
default activation remain deferred.

## Open Questions and next construction

- Can an earlier synthesis transition avoid consuming the run on archive pages?
- How can required archive recovery be represented explicitly before accepting a final candidate?
- Will a dedicated final patch request improve format compliance without inventing evidence?

Next bounded candidate: separate inspection and finalization explicitly, retain
exact source and task contract in the final request, and test malformed/insufficient
final outputs. Preserve strict budgets, oracle and delivery accounting.
