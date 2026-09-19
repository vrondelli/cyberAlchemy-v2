---
task_id: TASK-SGRM-CONTRACT
feature_code: SGRM
layer: L0
status: completed
---

# TASK-SGRM-CONTRACT: Freeze Removal And Migration Contract

## Objective

Produce the non-mutating packet that makes all later removal work bounded,
reviewable, and reversible at each receipt boundary.

## Inputs

- ../../IMPLEMENTATION-PLAN.md
- ../../ACTIVE-SURFACE-CENSUS.md
- ../../../ds-d1-improvement-plan/decisions/DEC-DSD1-SAGA-FORK.md
- ../../../ds-d1-improvement-plan/research/2026-07-11-saga-existing-evidence-adjudication/findings.md

## Outputs

- ../../runs/SWU-SGRM-001/MIGRATION-PACKET.md
- ../../runs/SWU-SGRM-001/ACTIVE-REFERENCE-MANIFEST.json
- ../../runs/SWU-SGRM-001/TASK-SESSION-RESULT.md

## Implementation Detail

1. Enumerate every case-insensitive whole-word Saga match under
   projects/domainspec-v2, excluding node_modules only.
2. Classify each match as:
   - active-authority;
   - active-implementation;
   - current-plan-or-projection;
   - historical-research;
   - superseded-decision;
   - telemetry-or-receipt.
3. Require a concrete file path and reason for every historical allowance.
4. Confirm the target DS-D8 transformation is one widened Workflow row.
5. Confirm stable DS-D1 IDs are not renumbered after retired DS-D1.10.
6. Search for deployed/external consumer contracts, persisted instance formats,
   or release notes that promise Saga compatibility.
7. Freeze deletion, rewrite, validation, owner, rollback, and stop-condition
   tables in MIGRATION-PACKET.md.
8. Record that this packet satisfies the planning obligation of SWU-DSD1-009,
   but does not authorize mutation by itself.

## Failure Modes

- Unclassified match: block.
- External consumer evidence: block and route decision-gate.
- Historical evidence listed for deletion: block.
- Migration proposes deleting orchestrates: block.
- Packet omits an owner or rollback point: block.

## Smallest Working Unit

### SWU-SGRM-001

- Goal: freeze the live migration packet and classified manifest.
- Dependencies: accepted DEC-DSD1-SAGA-FORK.
- Write scope: development/saga-removal/runs/SWU-SGRM-001 only.
- Done criteria: all matches classified; target mapping, compatibility policy,
  owners, stop conditions, and rollback points approved.
- Acceptance evidence: packet, parseable JSON manifest, Task Session receipt.
- Validation: jq empty manifest; source-path existence script; git diff check.
- Owner: local-fallback, with DS-D1/DS-D8 owner review.
- Handoff: Context Builder selects the decision, accepted findings, active
  census, implementation plan, and this task; expected result uses the standard
  SWU receipt shape.
