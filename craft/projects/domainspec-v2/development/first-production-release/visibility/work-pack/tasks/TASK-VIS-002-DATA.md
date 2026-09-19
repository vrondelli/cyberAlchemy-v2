# SWU-VIS-002 — deterministic data projection

Owner: task-session

## Outcome

Implement a read-only source join, normalized `roadmap-data.json`, deterministic
generation/check mode, and unit tests.

## Write surface

`tools/build-roadmap.py`, `tests/`, `roadmap-data.json`, and the SWU receipt.

## Required invariants

- Exact manifest counts: 16 nodes, 38 edges, 5 frontiers, 14 critical steps.
- All graph references resolve.
- Each manifest frontier joins one Craft gap by id.
- FPR Craft context exists and retains `stage: plan`, `gate: block`.
- Production authorization is exactly false.
- Output contains source fingerprint but no wall-clock time or absolute path.
- `--check` is byte-deterministic and non-mutating.

## Negative controls

Unknown endpoint, missing Craft gap, true production authorization, and stale output must
all fail closed.

## Handoff

Produce `runs/SWU-VIS-002/RESULT.md` for SWU-VIS-003.
