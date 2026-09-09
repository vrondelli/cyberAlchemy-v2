# TASK-OEW-ADAPTER-001 — Deterministic Loss-Aware Projection

Layer/wave: L0 / W0
Dependencies: SWU-OEW-001

## Implementation Detail

Read only through `VerifiedRunHandle`. Build two distinct records:

1. UA-compatible `KnowledgeGraph` presentation data;
2. OEW sidecar retaining source kind, exact relation, disposition, diagnostics,
   authority effect, source path, and digest.

Use stable source-ID-based presentation IDs, closed mapping tables from
`define/mappings.md`, canonical key/list ordering, and fail-closed handling for
unknown kinds/relations. Write only a new adapter run. Receipt is last.

## Smallest Working Units

### SWU-OEW-002 — Project Candidate Nodes

- Primary behavior: map every supported source node to one UA-compatible
  presentation node plus exact sidecar node row.
- Dependencies: 001.
- Target inventory:
  - `.../contracts/evidence-sidecar.schema.json`
  - `.../src/presentation-nodes.mjs`
  - `.../test/presentation-nodes.test.mjs`
  - `.../fixtures/poker-source-subset.json`
- Done: Finding/Research/Definition/Observation node mapping is total,
  deterministic, and duplicate/unknown IDs fail.
- Validation: `node --test test/presentation-nodes.test.mjs`.
- Expected handle: `oew-node-projection/v1`.
- Execution owner: Task Session local fallback.
- Split analysis: node mapping has its own totality and duplicate-ID falsifiers;
  relation policy/mapping can pass independently and is SWU-003.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-002/receipt.json`.
- Handoff: node projection handle and exact counts.

### SWU-OEW-003 — Project Exact Relations and Policy State

- Primary behavior: map each source/candidate relation to a presentation edge
  while preserving exact verb, loss class, disposition, diagnostics, and
  grounding inclusion in sidecar.
- Dependencies: 002.
- Target inventory:
  - `.../src/presentation-edges.mjs`
  - `.../test/presentation-edges.test.mjs`
  - `.../fixtures/unknown-relation.json`
- Algorithm:
  1. lookup exact relation in closed table;
  2. create stable edge ID from source/verb/target;
  3. emit generalized presentation type;
  4. emit exact sidecar row and mapping-loss field;
  5. reject unknown, missing endpoint, duplicate, or authority-effecting state.
- Done: Poker lineage/conflict/indeterminate specializes oracle passes.
- Validation: `node --test test/presentation-edges.test.mjs`.
- Expected handle: `oew-relation-projection/v1`.
- Execution owner: Task Session local fallback.
- Split analysis: exact edge mapping is one decision; output persistence and
  receipt atomicity have independent overwrite/determinism falsifiers in 004.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-003/receipt.json`.
- Handoff: relation projection handle and mapping-loss counts.

### SWU-OEW-004 — Write and Independently Verify an Adapter Run

- Primary behavior: create one immutable three-file adapter run with a terminal
  independently verifiable receipt.
- Dependencies: 003.
- Target inventory:
  - `.../contracts/adapter-receipt.schema.json`
  - `.../src/canonical-json.mjs`
  - `.../src/adapter-run-writer.mjs`
  - `.../scripts/verify-adapter-receipt.mjs`
  - `.../src/cli.mjs`
  - `.../test/adapter-run.test.mjs`
  - `.../generated/runs/SWU-OEW-004/presentation-graph.json`
  - `.../generated/runs/SWU-OEW-004/evidence-sidecar.json`
  - `.../generated/runs/SWU-OEW-004/adapter-receipt.json`
- Algorithm: canonicalize → compare two in-memory builds → create new run dir →
  write graph/sidecar → hash → write receipt last → verify independently.
- Done: two clean builds are byte-identical; overwrite/partial/tamper negatives
  fail; receipt binds source and authority ceiling.
- Validation: `npm test && npm run verify:adapter`.
- Expected handle: `oew-adapter-run/v1`.
- Execution owner: Task Session local fallback.
- Split analysis: writer, canonicalization, and receipt-last verification are
  one terminal adapter-run behavior. Native viewer build/use can pass
  independently and is 005/006.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-004/receipt.json`.
- Handoff: adapter-run handle/digests; report 005 eligible.

`.../` above expands only to
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/`; the machine
manifest carries normalized full paths.

## Execution State

| SWU | State | Evidence / successor |
| --- | --- | --- |
| SWU-OEW-002 | completed | `../session-evidence/SWU-OEW-002/receipt.json`; 6 tests pass |
| SWU-OEW-003 | completed | `../session-evidence/SWU-OEW-003/receipt.json`; 7 tests pass |
| SWU-OEW-004 | dependency-ready candidate | fresh Task Session admission required |

The completed node and relation projections prove total deterministic
presentation objects plus lossless exact-source sidecar rows for the bounded
Poker subset. Output persistence, upstream compatibility, and UI claims remain
outside these receipts.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
