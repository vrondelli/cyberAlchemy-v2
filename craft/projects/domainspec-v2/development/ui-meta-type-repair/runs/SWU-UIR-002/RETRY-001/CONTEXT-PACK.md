---
artifact_id: CONTEXT-UIR-002-RETRY-001-v1
task: SWU-UIR-002
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-002 Retry 001 Context Pack

## Summary

- Files selected: 11.
- Selector groups: 17.
- Obligation coverage: 100 percent.
- Blocking dependency: resolved by SWU-UIR-003 receipt.
- Runtime: local; no handoff pack.
- Blockers: none.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Preserve `attribute-present`. | `EVIDENCE-CONTRACTS.md#S1-Rule-Adapter` | covered |
| O2 | Register `attribute-nonempty/v1` in schema preflight. | SWU-003 shared registry module | covered |
| O3 | Generate deterministic nonempty example values. | `instances.ts#buildInstance` | covered |
| O4 | Validate Markdown values with stable missing/empty/whitespace codes. | `validate-content.ts#applyCriterion`; parser adaptation | covered |
| O5 | Validate instance values with missing/empty/whitespace/non-string codes. | `instances.ts#applyInstanceCriterion` | covered |
| O6 | Prove normalized outcome/code parity across representable cases. | `ui-repair-violations/v1`; focused parity test | covered |
| O7 | Classify the rule totally as attestation-only. | `meta-type-noncollapse.ts#ATTESTATION` | covered |
| O8 | Reject unknown rule versions. | SWU-003 preflight | covered |
| O9 | Keep all candidates unmodified and unselected. | `SPEC.md#Scope` | covered |

## Parser Adaptation

The current Markdown parser trims every cell. To distinguish authored empty
from whitespace without changing existing consumers, each data row gains an
`authoredCells` view. It removes at most one conventional delimiter-padding
space from each edge, while `cells` remains the existing fully trimmed view.

- `| label | |` becomes authored empty.
- `| label |   |` becomes authored one-space whitespace.
- Existing header, key, and value-normalization behavior is unchanged.

Markdown cells are textual, so `NONSTRING-VALUE` is exercised only by the
structured instance path and is recorded as not representable in Markdown.

## Selected Sources

- `runs/SWU-UIR-003/receipt.json` - normative registry/preflight dependency.
- `EVIDENCE-CONTRACTS.md` and DEC-UIR-004 - rule/code contract.
- `WORK-PACK.md` and `TASK-UIR-CONTRACTS.md` - scope and done criteria.
- `impl/tools/lib/ui-repair-rule-contract.ts` - shared classification/code owner.
- `impl/tools/validate-content.ts` - Markdown dispatch and table parser.
- `impl/tools/instances.ts` - generation and structured validation.
- Both focused validator test files - black-box precedent.
- `meta-type-noncollapse.ts` and its tests - total classifier.
- `contracts/ui-repair-violations-v1.yml` - machine code registry.

## Write Scope

- Shared registry module, the two validator tools, noncollapse classifier, and
  their focused tests.
- UI repair contracts/fixtures/tests and this retry folder.
- No candidate schema, canonical definition, DS-D8, or prior evidence mutation.

## Validation

1. New cross-path parity test for accepted, missing, empty, and whitespace.
2. Instance-only non-string and unknown-version negatives.
3. Generation round trip.
4. Total noncollapse classifier test.
5. Full tool suite, typecheck, aggregate validation, and diff checks.
