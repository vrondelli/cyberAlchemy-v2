---
task: SWU-CDSC3-005
result: PASS
completed_at: 2026-07-12T18:56:48Z
next_swu: SWU-CDSC3-006
---

# SWU-CDSC3-005 Result

The breaking commit mutation passes.

- Only the cloned `setStep(result.step)` commit adapter changes to
  `setStep(requested)`.
- `T-B-01` and `T-B-02` are observed as `supported`.
- Guard result remains false and notice remains present.
- Guard-selected destinations `login` and `3` remain separate from mutant
  committed destination `9` in the target-comparison sidecar.
- Two blocked-vector browser runs and screenshot files replay identically.
- Focused tests pass 5/5; aggregate tests pass 130/130.
- No adjudication state or authority effect is present.

Observation handle:
`sha256:879c37a64cf02ab1e28ca819e6a3e6c0de8bc05e061e9b65807d58033e74fdc5`.
