---
task_session: SWU-CDSC2-006R
result: PASS
completed: 2026-07-12
runtime: local
adapter: none
next_swu: SWU-CDSC2-007R
---

# Task Session Result: SWU-CDSC2-006R

Rebuilt the accepted compatibility projection and required exact equality,
then evaluated it twice with unchanged `cdsc-evaluator-v1`. F3 remains
`INSUFFICIENT-EVIDENCE` because approved indeterminate cells make evidence
incomplete. Joining frozen F1/F2 results preserves `CALIBRATION-DEFER` and the
machine route `evidence-repair`; neither outcome was normalized or upgraded.

Wrote the deterministic F3 result, suite result, provenance manifest, and run
receipt. The successor generation
`generation:sha256:24c4e0292197d0d8895bd5a668813437ba6d5c6f02cf6b549d85b2ae350ce683`
has exact predecessor
`generation:sha256:2ff6a0109e08f188388d580125ab6b185b4ff5f198300cb6bd5db0d9fe31349f`.
The existing atomic API appended it once; a second CLI invocation rejected and
left index bytes unchanged.

Validation: focused 6/6 pass; combined parent and generation-2 suites 84/84
pass; projection, F3, suite, provenance, and index replay identical; protected
generation-1 bytes pass; duplicate and wrong-tail writes reject; JSON and
scoped hygiene pass. Two stale generation-1-only tests were narrowed to assert
the immutable first-entry prefix after the authorized successor append.

Gate: PASS. Decisions: none. Runtime: local. Adapter: none. Handoff pack: none.
Fallback search: none. Subagents: not used. Experiment harness: not applicable.
Next route: independent audit SWU-CDSC2-007R.
