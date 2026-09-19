---
module: language-type-enforcement-parser-experiment
status: planned
updatedAt: 2026-07-17
docType: execution-receipt-schema
---

# Shared SWU Execution Receipt Schema

Every SWU-LTE-001/002/003 worker returns this complete shape. The owning Task
Session chooses and records the concrete receipt path before mutation.

```yaml
swu_id: SWU-LTE-001 | SWU-LTE-002 | SWU-LTE-003
capability_ref: <actual runtime capability or worker handle>
receipt_kind: native-stage | subagent | local-fallback | blocked
receipt_artifact: <repository-relative Task Session result path>
result: pass | flag | block | interrupted
files_touched:
  - <path or none>
validation:
  - command: <exact command or review check>
    result: pass | fail | not-run
    evidence: <concise output/count/code evidence>
blockers:
  - <blocker or none>
residue:
  - <remaining gap, pre-existing failure, or none>
reroute: <next SWU, owning task, decision gate, or none>
handoff_note: <what the coordinator and next SWU may rely on>
```

`pass` is invalid when a declared command failed, a write-scope file is omitted,
or acceptance-critical residue is hidden. Pre-existing failures are recorded
separately and still receive an owner/reroute; they are not silently waived.
