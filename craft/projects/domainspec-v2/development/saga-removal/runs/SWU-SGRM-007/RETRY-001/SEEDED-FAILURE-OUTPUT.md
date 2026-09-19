---
task_reference: SWU-SGRM-007-R1
evidence_kind: seeded-failure-output
recorded_at: 2026-07-14T19:01:05Z
result: pass
---

# Seeded Active-Reference Failure Output

## Seed

A temporary `SPEC.md` was added under the active implementation fixture root with one whole-word active-type reference.

## Expected red result

Command:

```text
npm --prefix projects/domainspec-v2/impl run audit:retired-orchestration
```

Observed:

```text
Result: FAIL
Matching files: 214
Whole-word matches: 1805
Allowed files: 213
Violations: 1
Violation code: unclassified
Exit code: 1
```

The only violation was the temporary active fixture. This proves the new historical exceptions do not create a broad bypass for active implementation content.

## Cleanup and recovery

The temporary fixture and directory were removed. The immediate rerun returned:

```text
Result: PASS
Matching files: 213
Whole-word matches: 1804
Allowed files: 213
Violations: 0
Exit code: 0
```

Fixture cleanup: **PASS**.
