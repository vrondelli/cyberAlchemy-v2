# Validation Contract

All witnesses below are planned design contracts, not executed evidence.

| ID | Positive witness | Negative witness |
| --- | --- | --- |
| RR-01 | canonical relation union builds one stable index | duplicate relation ID rejects compile |
| RR-02 | two same-tuple relations retain two refs/paths/index rows | tuple-based collapse rejects acceptance |
| RR-03 | portal and Path resolve exact predicate/direction | missing ID and stale scene fail before display |
| RR-04 | navigation restores exact selected ref | stale ref clears/falls back atomically |
| RR-05 | geometry joins every scene relation ID once | wrong scene digest or missing path rejects geometry |
| RR-06 | view-model display fields match relation digest | mutated predicate/cue/evidence copy rejects mapping |
| RR-07 | static snapshot has endpoint labels, source direction, optional traversal, and is byte-stable | altered snapshot or relation digest blocks output |
| RR-08 | exact predicate and direction text remain visible with nullable color/pattern cues | missing encoding never removes exact text or invalidates fallback |
| RR-09 | Body War exact denominator passes generic compiler | current/planned denominator mismatch blocks claim |
| RR-10 | second project uses same schema and resolver | any project-name branch fails reuse check |

Required validation layers:

1. JSON Schema positive/negative fixtures.
2. Typed unit tests for index construction and resolution.
3. Integration tests for Portal/Path/navigation/geometry/view models/static serialization.
4. Full affected OEW tests with the repository-owned TypeScript loader.
5. Body War generation and denominator assertions.
6. Browser acceptance only after implementation; no browser claim belongs to this Refine run.

Digest witnesses also prove canonical ordering, count equality, domain separation,
partition-order independence, and authoritative SourceGraph-bound legacy migration.
