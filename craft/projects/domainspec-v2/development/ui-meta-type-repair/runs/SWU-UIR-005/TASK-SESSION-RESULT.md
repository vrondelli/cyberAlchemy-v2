---
task: SWU-UIR-005
status: complete
result: PASS
run_id: task-session-20260711T220939Z-swu-uir-005-reroute-receipt
completed: 2026-07-11T22:09:39Z
---

# SWU-UIR-005 Task Session Result

Published immutable reroute generation 001 with six independently evaluated
source and destination outcomes. The focused suite covers local acceptance,
destination rejection, source acceptance, an external pending owner, an invalid
specimen, and a destination that cannot be tested.

The receipt contract rejects destination-identity claims, requires the relevant
destination or owner handle, validates all semantic receipts under Draft
2020-12, and replays as a byte-preserving no-op. The external case remains
`pending-owner`; it is not presented as destination acceptance. Full evidence is
in `receipt.json` and
`../../evidence/results/reroute/generation-001/receipts.json`.
