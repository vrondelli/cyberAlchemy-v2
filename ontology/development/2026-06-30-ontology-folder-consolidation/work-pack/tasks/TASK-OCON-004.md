---
task_id: TASK-OCON-004
status: completed
layer: L3
wave: W3
owner: task-session
---

# TASK-OCON-004: Domain-Local Instantiation Guidance

## Objective

Give DomainSpec v2 a candidate ontology-instantiation pattern without making it
a second base ontology package or promoting ontology entries prematurely.

## Source Contracts

- `projects/domainspec-v2/README.md`
- `projects/domainspec-v2/authority/AUTHORITY-MODEL.md`
- `projects/domainspec-v2/authority/source-spine.md`
- `projects/domainspec-v2/impl/spec/`
- `cyberAlchemy-v2/specs/README.md`
- `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`

## Dependencies

- SWU-OCON-002.
- SWU-OCON-004 for synced challenge-contract schema details.

## Implementation Detail

Write a small candidate guidance artifact that says:

- DomainSpec v2 can instantiate CAV2 ontology concepts locally.
- DomainSpec v2 source spine remains domain-local authority evidence.
- `specs/` are promoted contract targets after gates, not raw ontology sources.
- Example entries must stay `candidate` until promotion owner routes approve.

## Smallest Working Units

### SWU-OCON-005

- Goal: add DomainSpec v2 candidate ontology-instantiation guidance.
- Dependencies: SWU-OCON-002.
- Source anchors: `projects/domainspec-v2/README.md`,
  `projects/domainspec-v2/authority/source-spine.md`,
  `cyberAlchemy-v2/specs/README.md`.
- Related context: CAV2 ontology package and recent inventory synthesis.
- Write scope:
  - `projects/domainspec-v2/ontology/README.md`, or
  - `cyberAlchemy-v2/development/domainspec-v2/ontology-instantiation.md`
- Done criteria:
  - Guidance includes one candidate example shape or pointer.
  - The example is candidate/local, not promoted.
  - Specs are named as gated targets only.
- Acceptance evidence:
  - `TASK-SESSION-SWU-OCON-005.md`
  - Reviewable diff with clear owner boundaries.
- Validation:
  - `git diff --check -- projects/domainspec-v2 cyberAlchemy-v2/development/domainspec-v2`
- Execution owner: local-fallback.
- Status: completed.
- Handoff note: used `projects/domainspec-v2/ontology/README.md` as the
  project-local instantiation folder.

## Synchronization Rules

If this task creates a new ontology candidate example, consider refreshing
inventory only after the example is stable and non-promotional.
