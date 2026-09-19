---
task: SWU-CDSC3-009
audit_result: PASS
generation_id: generation:sha256:a96be3dcc50a196f4d044971ecf94141de34583784050581cda913ba1cf5e4bc
---

# Generation 3 Independent Replay

Two fresh processes reproduced the complete generation-3 chain. A final replay
after Inventory synchronization also passed.

## Exact Replay

- Protected imports: 14/14.
- Protected generation-1/2 prefix: 2/2.
- Generation chain: 3/3 with one generation-3 successor.
- Atomic targets: 6/6, derived from parent substitution text only.
- Browser baseline, permitted mutation, and breaking mutation: replay-identical.
- Usefulness differential: replay-identical and empty.
- Atomic adjudication: 36/36 coordinates, two resolved observation gaps, five
  carried uncertainty rows.
- Overlay, projection, F3, suite, provenance, and index: exact deterministic
  rebuild equality.
- Duplicate, wrong-tail, and rerun append rejection: 3/3.
- Prior Task Session receipts: 8/8 pass.
- `DEC-CDSC3-011` remains visible as the resolved runtime decision.
- Inventory machine/human indexes: pass and idempotent.

## Outcome

The unchanged evaluator returns F1/F2 `EXPLAINED`, F3
`INSUFFICIENT-EVIDENCE`, and suite `CALIBRATION-DEFER`. The suite's
`evidence-repair` route is a bounded machine recommendation only.

## Residue

Six atomic coordinates remain indeterminate. Independent route/content
attestation remains missing; the finite catalog has an untested outer boundary;
and browser/source evidence remains specimen-bounded and non-portable. These
are accepted result states, not replay failures.
