# SWU-VIS-002 result

Status: pass

## Inputs

SWU-VIS-001 receipt, FPR manifest, and scoped Craft ledger.

## Mutations

Implemented `tools/build-roadmap.py`, `tests/test_build_roadmap.py`, and generated
`roadmap-data.json`.

## Validation

- Live payload: 16 nodes, 38 typed edges, 5 Craft-joined frontiers, 14 ordered steps.
- Eight unit tests pass.
- Two consecutive generations are byte-identical.
- `--check` passes without writing.
- Payload contains a SHA-256 source fingerprint and no repository absolute path.

## Negative controls

Unknown edge endpoint, dependency cycle, missing Craft frontier join, missing declared
source, true production authorization, and stale/missing generated files all fail closed.

## Artifacts

`tools/build-roadmap.py`, `tests/test_build_roadmap.py`, `roadmap-data.json`.

## Residue

CI consumption of `--check` remains enabled but unscheduled.

## Handoff

SWU-VIS-003 may compose the HTML from the normalized payload and must not introduce a
second state source.
