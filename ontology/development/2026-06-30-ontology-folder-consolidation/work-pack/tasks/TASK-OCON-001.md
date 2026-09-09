---
task_id: TASK-OCON-001
status: completed
layer: L0
wave: W0
owner: task-session
---

# TASK-OCON-001: Folder-Role Bridge

## Objective

Make the non-collapse recommendation visible at the folder boundary without
deleting, moving, or promoting `projects/ontology`.

## Source Contracts

- `projects/ontology/ARCHITECTURE.md`
- `projects/ontology/GLOSSARY-CONSISTENCY.md`
- `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md`
- `CONTEXT-PACK.md`

## Dependencies

None.

## Smallest Working Units

### SWU-OCON-001

- Goal: add a visible status bridge for `projects/ontology` and link it from
  the CAV2 ontology artifact tree as witness/incubator material.
- Dependencies: none.
- Source anchors: `projects/ontology/ARCHITECTURE.md#context-view`,
  `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md#orientation-map`.
- Related context: `CONTEXT-PACK.md#settled-planning-frame`.
- Write scope:
  - `projects/ontology/README.md`
  - `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md`
- Done criteria:
  - `projects/ontology/README.md` says the folder is private witness/incubator
    evidence, not current CAV2 ontology authority.
  - CAV2 artifact tree references `projects/ontology` only as witness evidence.
  - No files are deleted or moved.
- Acceptance evidence:
  - Reviewable diff.
  - The forbidden readings are explicit.
- Validation:
  - `git diff --check -- projects/ontology/README.md cyberAlchemy-v2/ontology/ARTIFACT-TREE.md`
- Execution owner: local-fallback.
- Handoff note: keep wording short and role-based. Do not restate the full
  project history.

## Synchronization Rules

After completion, update `WORK-PACK.md` task status and add the task-session
receipt path if one exists.

## Completion Evidence

- Context pack: `../../CONTEXT-PACK-SWU-OCON-001.md`
- Receipt: `../../TASK-SESSION-SWU-OCON-001.md`
- Files updated:
  - `projects/ontology/README.md`
  - `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md`
- Validation:
  - `git diff --check -- projects/ontology/README.md cyberAlchemy-v2/ontology/ARTIFACT-TREE.md`
  - path existence review
  - ASCII scan
  - whitespace check for new context/README files
