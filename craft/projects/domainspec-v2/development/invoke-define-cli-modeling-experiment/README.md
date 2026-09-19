# Invoke Define CLI Modeling Experiment

Status: private, local, non-authoritative experiment.

This package tests how much of the deterministic Invoke Define CLI can be
represented by the currently selected DomainSpec-v2 JSON source profile.
It reuses Whole Invoke Repair Work Pack WIR-WP-001 and especially
SWU-WIR-006 as its behavioral source; it does not create another Work Pack.
It treats the live command catalog as current evidence and models only the
selected profile kinds that honestly fit the artifact-producing path: Rule,
Operation, and Event.

The first run asks two separate questions:

1. Can DomainSpec-v2 structurally represent the five artifact-producing Define
   stages named by the current CLI and SWU-WIR-006?
2. Can the selected profile prevent source authoring from bypassing its exact
   semantic-closure prerequisite?

The expected result is useful but incomplete: the graph can represent
eligibility rules, artifact-producing operations, and their outputs, while
read-only status, checks, CLI Interface shape, Workflow ordering, and exact
receipt dependencies remain outside the selected profile's structural
guarantees.

## Boundaries

- All model sources and run evidence stay inside this package.
- Canonical DomainSpec registries, the Craft ledger, Arcanum, generated skill
  packages, and the Invoke CLI are read-only inputs.
- A generated graph or passing build receipt proves structural conformance
  only. It grants no authority, admission, release, execution, publication, or
  deployment status.
- This run is not the blocked Invoke Define tournament and does not satisfy or
  replace its aggregate acceptance.
- This run does not execute SWU-WIR-006. WIR-WP-001 remains
  blocked-before-execution-candidate at its recorded authority ceiling.

## Reused Work Pack

- Whole Invoke Work Pack:
  ../../../../arcanum/spells/invoke/development/whole-invoke-repair-plan/WORK-PACK.md
- Define slice:
  ../../../../arcanum/spells/invoke/development/whole-invoke-repair-plan/tasks/TASK-WIR-MODES.md#swu-wir-006
- Prototype blocker evidence:
  ../../../../arcanum/spells/invoke/development/whole-invoke-repair-plan/collaboration/evidence/PROTOTYPE-VALIDATION-REPORT.md

## Run

From the repository root:

    projects/domainspec-v2/impl/node_modules/.bin/tsx \
      projects/domainspec-v2/development/invoke-define-cli-modeling-experiment/development/scripts/run-experiment.ts

The command emits one JSON result to standard output and writes no canonical
or generated repository state.
