# TASK-OEW-VERIFY — Terminal Audit and Manual-Evidence Ceiling

Layer/wave: L3 / W3
Dependencies: selected target layer's terminal receipts
Mutation: closure/session evidence only

## Smallest Working Unit Exemption

Allowed because this is a `VERIFY` closure task. It adds no product behavior,
owns no implementation source, and only aggregates independently produced
receipts.

## Audit

1. validate every required receipt/schema/digest/predecessor;
2. prove Design and Plan source refs remain current;
3. prove protected set equality;
4. replay the applicable clean-room Poker path;
5. verify no authority/promotion/IOLM/publication/production claim;
6. report automated accessibility separately from named manual results;
7. report manual state `NOT_RUN` unless runner/device/browser/assistive-tech,
   steps, raw observations, and verdict are present;
8. emit one bounded terminal audit and stop.

## Target Inventory

- `work-pack/session-evidence/TASK-OEW-VERIFY/terminal-audit.json`
- `work-pack/session-evidence/TASK-OEW-VERIFY/MANUAL-RESULTS.json` only when
  named humans execute the approved protocol

## Validation

Reviewable command contract: `npm run verify:terminal`.

## Evidence Ceiling

Terminal audit summarizes declared prototype evidence only. It cannot grant
authority, publication, release, or production readiness.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
