---
artifact_id: CONTEXT-UIR-003-v1
task: SWU-UIR-003
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-003 Context Pack

## Summary

- Files selected: 10.
- Selector groups: 15.
- Obligation coverage: 100 percent.
- Handoff pack: none; local execution.
- Blockers: none.
- Concurrent edits: existing `attribute-one-of` changes in both validators and
  tests are user-owned inputs and must be preserved.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Implement registry `ui-repair-violations/v1`. | DEC-UIR-004; `normalized-result.schema.yml` | covered |
| O2 | Reject unknown rules in both schema paths. | DEC-UIR-004; both rule dispatches | covered |
| O3 | Detect duplicate keys before parser overwrite. | DEC-UIR-003; both inlined YAML readers | covered |
| O4 | Reject finite contradictory criterion forms. | DEC-UIR-003; task contract | covered |
| O5 | Use identical codes/messages in both paths. | `WORK-PACK.md#Global-Done-Contract` | covered |
| O6 | Preserve current supported rules and concurrent changes. | live git diff; rule census | covered |
| O7 | Produce finite duplicate/conflict manifest and counterexamples. | task output contract | covered |
| O8 | Keep candidates, DS-D1, DS-D8, and prior evidence unchanged. | `SPEC.md#Scope` | covered |

## Selected Sources

- `DECISION-LEDGER.md` - O1-O4 - resolved policy and dependency order.
- `EVIDENCE-CONTRACTS.md` - O1-O5 - registry and no-precedence contract.
- `contracts/normalized-result.schema.yml` - O1 - machine registry reference.
- `work-pack/tasks/TASK-UIR-CONTRACTS.md#SWU-UIR-003` - O1-O7.
- `impl/tools/validate-content.ts#loadSchemas,#parseSchemaYml,#applyCriterion` - O2-O6.
- `impl/tools/instances.ts#loadSchemas,#parseYamlSubset,#buildInstance,#applyInstanceCriterion` - O2-O6.
- `impl/tools/tests/validate-content.test.ts` - O5-O6 - black-box CLI checks.
- `impl/tools/tests/instances.test.ts` - O5-O6 - generate/validate checks.
- `impl/spec/meta-types/**/*.schema.yml` rule census - O6 - supported-rule baseline.
- `runs/SWU-UIR-002/DECISION-DEPENDENCY-ORDER.md` - order authority.

## Execution Contract

- Add one shared rule-contract module under `impl/tools/lib/`.
- Call it from both schema loaders before any criterion executes.
- Detect duplicate keys before assignment in each raw YAML-subset parser.
- Detect only finite contradictions: unequal `attribute-equals`; equals outside
  `attribute-one-of`; disjoint `attribute-one-of` sets for the same key.
- `attribute-present` composes without conflict.
- Emit stable `[ui-repair-violations/v1:CODE]` prefixes; messages remain
  non-normative.
- Do not add `attribute-nonempty/v1` to supported rules until SWU-UIR-002 lands
  generation and both validators atomically.

## Write Scope

- `projects/domainspec-v2/impl/tools/lib/ui-repair-rule-contract.ts`.
- Targeted imports/calls in `validate-content.ts` and `instances.ts`.
- Focused additions to their two existing test files.
- `ui-meta-type-repair/contracts/`, `fixtures/contracts/`, `tests/`, and this run folder.

## Validation

1. Focused shared-module tests.
2. Focused validator tests for unknown, duplicate, conflict, and non-conflict.
3. `npm --prefix projects/domainspec-v2/impl run tools:test`.
4. `npm --prefix projects/domainspec-v2/impl run typecheck`.
5. `npm --prefix projects/domainspec-v2/impl run validate`.
6. Scoped diff review and `git diff --check`.
