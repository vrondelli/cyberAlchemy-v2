# N39 — emits closure-envelope placement

Status: selected — A, dedicated consumer-authored closure sidecar.

Question: should the approved consumer completeness claim be materialized as a dedicated consumer-authored project sidecar outside generated output?

- A — dedicated sidecar. Recommended. One immutable envelope per exact snapshot; evaluator receives contained path and digest.
- B — defer. Keep evaluation at `not-evaluated-incomplete-closure` when no separately admitted envelope exists.
- C — stop. End this closure-evidence route without representation change.
- Explain — revisit the aligned low/medium/complex examples; explanation has no decision effect.

Rejected constructions: embedding snapshot evidence in `project.json`, ephemeral copied request attestations, or compiler-authored completeness.

Owner source: exact `A` response in the active conversation. Recording time: `2026-08-26T11:12:21+01:00`; the exact response timestamp was not exposed. N38-A and the recommendation did not supply this consent.
