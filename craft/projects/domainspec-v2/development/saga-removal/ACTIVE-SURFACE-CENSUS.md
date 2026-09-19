---
module: saga-removal
status: planning-baseline
updatedAt: 2026-07-11
docType: active-surface-census
---

# Active Surface Census: Saga Removal

This census distinguishes active removal targets from evidence that must remain.

## Canonical Authority Targets

| Surface | Current Saga role | Planned treatment |
| --- | --- | --- |
| definitions/meta-types/meta-types.yml | Active DS-D1.10 registry row | Remove row; do not renumber later IDs. |
| definitions/meta-types/meta-types.md | Human registry projection/card | Remove active Saga card/row. |
| definitions/DEFINITIONS.md | Current D6/DS-D1 examples and counts | Reconcile active counts and examples. |
| definitions/DEFINITIONS-INDEX.md | Definition navigation | Remove active Saga navigation claims. |
| definitions/relationships/relationships.yml | Active Saga orchestrates signature | Remove Saga row; widen Workflow row. |
| definitions/relationships/relationships.md | Human relationship projection | Regenerate or reconcile from root YAML. |

## Implementation Targets

| Surface family | Planned treatment |
| --- | --- |
| impl/spec/meta-types/behavioral/saga.md and saga.schema.yml | Delete after Workflow migration is validated. |
| impl/spec/meta-types/behavioral/workflow.md and workflow.schema.yml | Absorb intra/cross scope via attribute-one-of. |
| impl/spec/__fixtures__/mt/saga-ok.md and saga-bad.md | Delete; retain coverage as Workflow cross-feature fixtures. |
| impl/spec/__fixtures__/mt/workflow-bad.md | Replace obsolete cross-feature rejection with missing/unknown scope rejection. |
| impl/spec/__fixtures__/relationships/valid/SPEC.md | Rewrite active Saga edge as cross-feature Workflow. |
| impl/tools/validate-content.ts | Implement attribute-one-of. |
| impl/tools/instances.ts | Generate and validate attribute-one-of deterministically. |
| impl/tools/lib/meta-type-noncollapse.ts | Classify attribute-one-of as attestation. |
| impl/tools/validate-meta-types-noncollapse.ts | Remove hard-coded Saga acceptance lock. |
| impl/tools/tests/validate-content.test.ts | Add both allowed scopes and unknown-scope rejection. |
| impl/tools/tests/validate-meta-types-noncollapse.test.ts | Remove Saga fixtures/expectations; retain generic anti-attestation tests. |
| impl/tools/tests/validate-relationships.test.ts | Accept cross-feature Workflow and reject Saga source. |
| impl/spec/TAXONOMY.md and meta-types/LEARNING-ORDER.md | Remove active Saga type; explain Workflow scope. |
| README.md and discovery/domainspec-v2-discovery.md | Reconcile current product/taxonomy claims. |
| impl governance tag guidance containing current Saga examples | Replace active examples without weakening the guidance. |

## Current Plan Targets

| Plan | Conflict | Planned treatment |
| --- | --- | --- |
| development/ds-d1-improvement-plan | Still presents harden/collapse branch and Saga task status | Mark decision selected, SWU-008 cancelled, SWU-009 expanded/satisfied by this package receipts. |
| development/r3-l2-relationship-hardening | Schedules Saga obligation hardening | Cancel/supersede Saga-law task and remove it from active waves; preserve history. |
| development/meta-type-formalization | May describe Saga as current schema-backed type | Reconcile active status/projection claims only. |

## Historical Preservation Classes

Remaining Saga text is permitted only when classified under an explicit
historical/evidence boundary:

- projects/domainspec-v2/research/**
- projects/domainspec-v2/development/**/research/**
- projects/domainspec-v2/development/**/reviews/**
- projects/domainspec-v2/development/**/task-sessions/**
- projects/domainspec-v2/development/reformulate-batch1/refreshes/**
- superseded decision and governance records
- telemetry, Inventory, observability, and execution receipts
- projects/domainspec-v2/development/saga-removal/**

The execution-time census must refresh this list from the live tree. A path is
not historical merely because it sits under development; active work-packs and
current design contracts remain removal/supersession targets.

## Baseline Counts

The planning scan found Saga references in 25 current authority/implementation
files plus multiple active planning files. It also found a much larger research
and historical corpus. Counts are evidence snapshots, not acceptance criteria;
the final validator classifies live matches by path and status.
