---
task_id: TASK-OCON-002
status: completed
layer: L1
wave: W1
owner: task-session
---

# TASK-OCON-002: CAV2 Harvest Crosswalk

## Objective

Preserve useful `projects/ontology` materialization patterns by linking them
into the CAV2 ontology package as source-context/witness evidence, not as a
competing ontology authority.

## Source Contracts

- `projects/ontology/ARCHITECTURE.md`
- `projects/ontology/GLOSSARY-CONSISTENCY.md`
- `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`
- `cyberAlchemy-v2/ontology/README.md`

## Dependencies

- SWU-OCON-001.

## Implementation Detail

Create a source-surface crosswalk that records:

- source path;
- source role;
- allowed reading;
- forbidden reading;
- owner route;
- harvest action;
- validation evidence.

Then add a compact source-contract row or note to `PACKAGE-MODEL.md` pointing at
the crosswalk.

## Smallest Working Units

### SWU-OCON-002

- Goal: create the harvest crosswalk and package model pointer.
- Dependencies: SWU-OCON-001.
- Source anchors: `projects/ontology/ARCHITECTURE.md#artifact-classes`,
  `projects/ontology/ARCHITECTURE.md#node-eligibility`,
  `projects/ontology/GLOSSARY-CONSISTENCY.md#checked-terms`.
- Related context: `IMPLEMENTATION-LAYERING.md#layer-definitions`.
- Write scope:
  - `cyberAlchemy-v2/ontology/SOURCE-SURFACE-CROSSWALK.md`
  - `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`
- Done criteria:
  - Crosswalk rows distinguish source/evidence/candidate/projection roles.
  - Package model cites the crosswalk as witness/source context only.
  - `projects/ontology` remains non-authority.
- Acceptance evidence:
  - Reviewable crosswalk with concrete source paths.
  - Diff does not copy old project architecture as current CAV2 authority.
- Validation:
  - `git diff --check -- cyberAlchemy-v2/ontology/SOURCE-SURFACE-CROSSWALK.md cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`
- Execution owner: local-fallback.
- Handoff note: the crosswalk is a bridge and map, not a migration script.

## Synchronization Rules

After completion, update `WORK-PACK.md`, `EXECUTION-PACK.md` receipt notes, and
inventory only if a new inventory evidence entry is intentionally created.

## Completion Evidence

- Context pack: `../../CONTEXT-PACK-SWU-OCON-002.md`
- Receipt: `../../TASK-SESSION-SWU-OCON-002.md`
- Files updated:
  - `cyberAlchemy-v2/ontology/SOURCE-SURFACE-CROSSWALK.md`
  - `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`
- Validation:
  - `git diff --check -- cyberAlchemy-v2/ontology/SOURCE-SURFACE-CROSSWALK.md cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`
  - ASCII scan
  - whitespace check for new crosswalk/context files
- Inventory refresh: not run; this SWU created package-local orientation, not a
  new reusable inventory evidence synthesis.
