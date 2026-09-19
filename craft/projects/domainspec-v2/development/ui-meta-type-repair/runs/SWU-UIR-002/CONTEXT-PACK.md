---
artifact_id: CONTEXT-UIR-002-v1
task: SWU-UIR-002
mode: standard
strict_coverage: block
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-002 Context Pack

## Summary

- Files selected: 9.
- Selector groups: 13.
- Obligation coverage: 92 percent.
- Handoff pack: none; local execution proposed.
- Blockers: 1 dependency contradiction.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Preserve `attribute-present`. | `EVIDENCE-CONTRACTS.md#S1-Rule-Adapter` | covered |
| O2 | Implement `attribute-nonempty/v1` in generation. | `instances.ts#generate` | covered |
| O3 | Implement it in Markdown validation. | `validate-content.ts#applyCriterion` | covered |
| O4 | Implement it in generated-instance validation. | `instances.ts#validateCriterion` | covered |
| O5 | Classify missing, empty, whitespace, non-string, and nonempty. | `DECISION-LEDGER.md#DEC-UIR-004`; task edge cases | covered |
| O6 | Compare stable outcomes and violation codes across both paths. | `WORK-PACK.md#Global-Done-Contract`; `normalized-result.schema.yml` | blocked |
| O7 | Reject unknown rules through one normative registry. | DEC-UIR-004 | blocked dependency |
| O8 | Keep candidates and authority unchanged. | `SPEC.md#Scope` | covered |

## Blocking Contradiction

- SWU-UIR-002 is next and depends only on SWU-UIR-001 in `WORK-PACK.md`.
- SWU-UIR-002 cannot claim parity-ready until stable codes and strict unknown
  rule handling exist.
- `TASK-UIR-CONTRACTS.md#SWU-UIR-003` assigns implementation of the normative
  code registry and strict unknown-rule handling to SWU-UIR-003.
- Therefore SWU-UIR-002 cannot satisfy O6/O7 without either crossing SWU-003's
  ownership or changing the task order/scope.

Strict coverage is `block`. No shared validator, test, candidate, or authority
file was changed for SWU-UIR-002.

## Included Context

- `WORK-PACK.md` - dependency row and global parity done contract.
- `work-pack/tasks/TASK-UIR-CONTRACTS.md` - SWU-002 and SWU-003 ownership.
- `EVIDENCE-CONTRACTS.md` - selected rule and code behavior.
- `DECISION-LEDGER.md` - DEC-UIR-004 strict registry decision.
- `contracts/normalized-result.schema.yml` - code registry reference.
- `impl/tools/validate-content.ts` - Markdown rule dispatch.
- `impl/tools/instances.ts` - generation and instance rule dispatch.
- `impl/tools/tests/validate-content.test.ts` - black-box Markdown precedent.
- `impl/tools/tests/instances.test.ts` - generation/instance precedent.

## Next Action

Resolve `DEC-UIR-002-ORDER` before mutation.
