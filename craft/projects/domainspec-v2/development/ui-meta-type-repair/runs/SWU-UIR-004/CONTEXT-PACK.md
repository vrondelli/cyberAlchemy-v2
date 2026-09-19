---
artifact_id: CONTEXT-UIR-004-v1
task: SWU-UIR-004
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-004 Context Pack

## Summary

- Files selected: 10.
- Selector groups: 16.
- Obligation coverage: 100 percent.
- Runtime: local; no handoff pack.
- Blockers: none.

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Freeze exactly 52 criterion selectors and 9 fixed-value selectors. | `candidates.json`; reproduced census | covered |
| O2 | Emit 52 deletion, 52 empty, 52 whitespace, and 9 wrong-fixed cases. | `TASK-UIR-MECHANICAL.md` | covered |
| O3 | Execute both validators and record stable outcome/code. | SWU-002/003 receipts | covered |
| O4 | Derive stable case, fixture, record, and generation identities. | SWU-001 kernel | covered |
| O5 | Reject incomplete, duplicate, overwritten, or predecessor-conflicting ledgers. | task failure contract | covered |
| O6 | Prove deterministic rerun/no-op. | `EVIDENCE-CONTRACTS.md#Kernel` | covered |
| O7 | Keep extensions separate from the mandatory base. | DEC-UIR-003; duplicate/conflict manifest | covered |
| O8 | Leave candidate schemas and prior results immutable. | `SPEC.md#Scope` | covered |

## Evidence Projection

The source has 52 criteria: 43 `attribute-present` and 9
`attribute-equals`. The runner creates temporary evidence schemas where the 43
presence rules select `attribute-nonempty/v1`; fixed-value rules remain
unchanged. No candidate source or schema is edited.

Expected base codes:

- deletion: `ATTRIBUTE-MISSING`;
- empty: `ATTRIBUTE-EMPTY`;
- whitespace: `ATTRIBUTE-WHITESPACE`;
- wrong fixed value: `FIXED-VALUE-MISMATCH`.

## Selected Sources

- `TASK-UIR-MECHANICAL.md` - algorithm, scope, and done criteria.
- `candidate-meta-types/ui/candidates.json` - 9 candidates, 52 criteria, 9 fixed.
- `round-trip-candidates.ts` and stored results - prior 9-case limitation.
- `replication/findings.md#CR-02` - complete mutation obligation.
- SWU-001 receipt and canonical reference - IDs/digests/lineage.
- SWU-002 receipt and nonempty vectors - rule parity.
- SWU-003 receipt and registry - codes/preflight.
- `validate-content.ts` and `instances.ts` - execution paths.
- `duplicate-conflict-manifest.json` - extension boundary.

## Write Scope

- `ui-meta-type-repair/mutation/`, its result schema, focused tests, and this run.
- Minimal code-prefix retrofit for existing `attribute-equals` in both validators
  so all mandatory mutations have normative codes.
- No candidate, DS-D1, DS-D8, or prior evidence changes.

## Validation

1. Runner in a temporary output produces exactly 165 unique records.
2. Both paths reject each record with the expected code and parity.
3. Second identical run is a no-op.
4. Tampered existing output and predecessor mismatch fail closed.
5. Published generation validates against Draft 2020-12 schema.
6. Full tool tests, typecheck, aggregate validation, and diff checks pass.
