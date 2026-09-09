# TASK-VERIFY

## Objective

Verify the full local-fixture evidence set against
[`DESIGN-PLANNED-WITNESSES.json`](../../DESIGN-PLANNED-WITNESSES.json) and
[WORK-PACK.md](../../WORK-PACK.md) without repairing implementation.

## Smallest Working Unit Exemption

Allowed because this is a `VERIFY` closure-only task.

## Checks

JSON/schema parse; unit/adapter/replay/race/native/capability/security/resource
suites; curl/API; optional browser with exact claim ceiling; source
preservation; zero outbound/residue; receipt digest completeness; no unplanned
files; all SWU closeout receipts.

Verdict is pass/block with exact failed evidence. A pass is local-fixture
evidence only.

