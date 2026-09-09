# SWU-OEW-006 Attempt 003 Context Pack

Mode: standard runtime handoff  
Coverage: strict  
Authority effect: none

## Objective

Revalidate the already materialized native Poker viewer slice while proving
fresh source-only protected-set equality.

## Attempt Boundary

This is a proof-only resume. The five implementation targets are immutable.
The only admitted writes are attempt-003 session evidence. Tests may use
contained operating-system temporary roots, but must terminate both loopback
servers and remove that residue before closeout.

## Covered Obligations

- `V1`–`V8`: original native-viewer scope, dependencies, boundary, Poker,
  cleanup, validation entrypoint, and stop-at-L0 obligations.
- `V9`: exact source-only protected-set equality under the selected contract.
- `V10`: no implementation mutation and no L1 selection.

## Validation

- `npm run test:native-viewer`
- `npm test`
- exact five-target digest equality
- exact before/after protected snapshot comparison
