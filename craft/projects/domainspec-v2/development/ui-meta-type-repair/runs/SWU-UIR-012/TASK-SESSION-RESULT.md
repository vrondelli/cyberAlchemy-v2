---
task: SWU-UIR-012
status: complete
result: PASS
run_id: task-session-20260712T152932Z-swu-uir-012-corpus-generation-002
completed: 2026-07-12T15:29:32Z
---

# SWU-UIR-012 Task Session Result

Published immutable corpus generation 002 as a verified successor to generation
001. It contains five v2 facts: four `observed`, one bounded
`observed-absent`, and zero `not-observed`. The absence fact carries the
complete bounded-search record handle and aligns to the exact pinned source,
revision, digest, and literal selector.

Missing, stale, mismatched, tampered, partial, and positive-match proofs cannot
construct absence. Identical generation replay is a no-op, non-identical
overwrite and generation-001 writes are refused, and generation 001 remains
byte-identical at
`sha256:72f49516b741cf31b3f7fb930a67ca9144b43d04a27f0b2031cd231c51bff03f`.

Focused tests pass 6/6 and the full UI-repair suite passes 57/57. This closes
the implementation route for bounded absence, but does not establish
portability, replication, or candidate identity.
