---
task_reference: SWU-SGRM-007-R1
evidence_kind: focused-test-output
recorded_at: 2026-07-14T19:01:05Z
result: pass
---

# Focused Guard Test Output

Command:

```text
node --import tsx --test tools/tests/audit-retired-orchestration-references.test.ts
```

Result: **PASS — 6/6 tests, 0 failures.**

| Test | Result |
|---|---|
| clean repository passes the classified reference guard | pass |
| temporary active reference fails and is removed by the harness | pass |
| changed reviewed reference fails its content digest | pass |
| missing exception paths fail closed | pass |
| unused exceptions fail closed | pass |
| machine report is valid JSON | pass |

The two missing contract cases were added in this retry. The existing positive, active-fixture, same-count digest-drift, and machine-report tests remain green.
