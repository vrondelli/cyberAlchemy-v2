# Task Session Result — SWU-OEW-003

Result: **pass**

The relation adapter now maps the Poker grounding lineage to `builds_on`, the
runtime/spec conflict to `contradicts`, and the unowned `specializes` candidate
to `related`, while exact sidecar rows preserve each original relation,
mapping-loss class, policy disposition, diagnostics, evidence refs, grounding
inclusion, and `authority_effect:none`.

## Evidence

- material receipt: `material-receipt.json` — pass/ready;
- mutation admission: `mutation-admission-receipt.json` — admit/ready;
- terminal Task Session receipt: `receipt.json`;
- specialized output: `relation-projection-handle.json`;
- validation:
  `node --test cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/presentation-edges.test.mjs`
  — 7 passed, 0 failed;
- staged/live parity: three of three exact target hashes match;
- projection regeneration: exact handle bytes match;
- protected equality: eight of eight protected scopes match the preflight
  content-digest baseline.

The initial staged run exposed one backwards canonical-order expectation in
the test oracle. It was corrected and rerun before material validation,
mutation admission, or any live target write.

## Evidence Ceiling

This result proves deterministic relation projection and exact state recovery
for the bounded Poker oracle. It does not prove adapter-run persistence,
upstream build/viewer compatibility, ontology admission, promotion,
publication, or production readiness.

## Next Route

`SWU-OEW-004` is the unique dependency-ready successor in the captured
Task-Session-Until-Blocker frontier. This inner Task Session does not execute
it.

## Open Questions

See [../../../../define/SPEC.md](../../../../define/SPEC.md#open-questions).
