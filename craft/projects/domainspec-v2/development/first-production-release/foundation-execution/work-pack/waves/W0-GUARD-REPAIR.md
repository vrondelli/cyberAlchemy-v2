---
wave: W0
layer: L0
status: completed-proof-refreshed
---

# W0: Guard Review and Repair

## Decision

After this wave, we know whether the current repository still satisfies the zero-active retired-orchestration invariant.

## Order

1. `SWU-SGRM-006-R1` — completed: every match in the four violating files has an accepted exact disposition.
2. `SWU-SGRM-007-R1` — completed: the accepted retry receipt records exact exceptions and passing positive and negative proof.

## Promotion Gate

- current audit has zero violations;
- temporary active reference fails;
- same-count changed-line fixture fails digest checking;
- frozen SGRM-001 manifest and historical receipts are unchanged;
- retry receipt is independently reviewable.

All five promotion conditions pass in the accepted `SWU-SGRM-007-R1` retry receipt (`sha256:1d842c5c87286c49ae0d8f3158bd3a629a9266c280732493454d0249c5e78a6b`). W0 is closed by the separately approved proof refresh; later drift reopens the same source-owner route.

## Handoff

`SWU-FPR01-001` is selected for a later Task Session. No FPR evidence was created by this wave refresh.
