---
task: SWU-UIR-013
status: complete
result: PASS
run_id: task-session-20260712T153659Z-swu-uir-013-dossier-policy
completed: 2026-07-12T15:36:59Z
---

# SWU-UIR-013 Task Session Result

Published an immutable per-candidate policy evaluation for the nine current UI
formation candidates. Every candidate is below the fixed 2-corpus, 2-style,
2-independent-reviewer threshold; evidence is never pooled across candidates.
Form and Action independent-positive states are recorded as `missing`, with
their partial correspondence handles preserved.

Duplicate aliases, repeated authors, repeated reviewers in multiple roles,
reviewer disagreement, missing independence attestations, threshold tailoring,
and kill-like classifications all fail closed or cannot inflate counts. The
canonical generation replays as a no-op. Focused tests pass 5/5 and the full
UI-repair suite passes 62/62.

This unit records the current evidence gap; it does not resolve it by claim or
change candidate, DS-D1, or promotion state.
