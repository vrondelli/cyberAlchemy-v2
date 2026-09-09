# Task Session Result — SWU-OEW-002

Result: **pass**

The node adapter now projects the four supported evidence kinds through a
closed table into pinned Understand-Anything `GraphNode` values. The Poker O13
subset yields three `claim` nodes and one `source` node, while one exact
sidecar row per node preserves its source ID, normalized and original kind,
path, digest, mapping loss, and `authority_effect:none`.

## Evidence

- material receipt: `material-receipt.json` — pass/ready;
- mutation admission: `mutation-admission-receipt.json` — admit/ready;
- terminal Task Session receipt: `receipt.json`;
- specialized output: `node-projection-handle.json`;
- validation:
  `node --test cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/presentation-nodes.test.mjs`
  — 6 passed, 0 failed;
- staged/live parity: four of four exact target hashes match;
- projection regeneration: exact handle bytes match;
- protected equality: eight of eight protected scopes match the preflight
  content-digest baseline.

## Evidence Ceiling

This result proves deterministic node projection and exact source recovery for
the bounded Poker subset. It does not prove relation projection, adapter-run
persistence, upstream build/viewer compatibility, ontology admission,
promotion, publication, or production readiness.

## Next Route

`SWU-OEW-003` is the unique dependency-ready successor in the captured
Task-Session-Until-Blocker frontier. This inner Task Session does not execute
it.

## Open Questions

See [../../../../define/SPEC.md](../../../../define/SPEC.md#open-questions).
