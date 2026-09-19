---
task: SWU-UIR-004
status: complete
result: PASS
run_id: task-session-20260711T220458Z-swu-uir-004-mutation-ledger
completed: 2026-07-11T22:04:58Z
---

# SWU-UIR-004 Task Session Result

Published immutable mutation generation 001 with exactly 165 cases: 52
deletions, 52 empty values, 52 whitespace values, and 9 wrong fixed values.

All cases reject in both validator paths with the expected stable code and full
parity. A second run is a byte-preserving no-op; tampered output or changed
predecessor fails closed. Candidate schemas and prior UIF evidence were not
modified. Full evidence is in `receipt.json` and
`../../mutation/results/generation-001/ledger.json`.
