# G01 cap-12 zstd pair — unscored, inconclusive

The second task in the [predeclared cohort](../COHORT-FREEZE.json),
`Multi-SWE-Bench__c__maintenance__bugfix__40aed09e`, ran at pinned zstd
commit `be3bd70c57a23383401f8a883cdecaca1d10a4d7`. Both
[control](CONTROL-FREEZE.json) and [candidate](CANDIDATE-FREEZE.json) froze
before dispatch and used the same source-only task. Neither produced a
terminal prediction, so neither was native-scored.

| Observation | Control | Cap-12 shortlist |
| --- | ---: | ---: |
| Final status | `run_error` | `run_error` |
| Error | `bounded-view-not-admitted` | `unbound-retained-reasoning` |
| Model calls before error | 10 | 8 |
| Known model tokens before error | 29,772 | 23,408 |
| Elapsed time before error | 151.777 s | 137.284 s |

Those partial token and time numbers are **not** a benchmark comparison:
both arms stopped early for different reasons. The control exhausted the
bounded-view admission path after repeated projection attempts. The candidate
failed at retained-reasoning binding after a tool-argument correction. Full
receipts remain under `/opt/are/evolution-runtime/g01-shortlist-cap12-zstd-r1/`.
The task is now exposed and is diagnostic-only. The cohort cannot establish
two-task replication, even though its first GitHub CLI pair passed all gates.

## Open Questions

- Which bounded-view admission condition rejected the control projection?
- Was the retained-reasoning binding failure caused by the model response,
  transport capture, or a runtime edge case? A new scoreable task, not a
  tuned replay of this task, is needed for prospective quality evidence.
