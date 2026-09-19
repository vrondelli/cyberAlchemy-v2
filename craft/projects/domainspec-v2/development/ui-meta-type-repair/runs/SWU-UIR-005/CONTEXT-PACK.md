---
artifact_id: CONTEXT-UIR-005-v1
task: SWU-UIR-005
mode: lean
strict_coverage: pass
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-005 Context Pack

## Summary

- Files selected: 6.
- Selector groups: 9.
- Obligation coverage: 100 percent.
- Runtime: local; blockers: none.

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Record independently evaluated source and destination outcomes. | `EVIDENCE-CONTRACTS.md#S3-Reroute-Receipt` | covered |
| O2 | Keep source rejection distinct from destination acceptance. | `SPEC.md#Invariants` | covered |
| O3 | Represent external destinations as `pending-owner`. | task contract; accepted findings S3 | covered |
| O4 | Require owner handle for pending external evaluation. | architecture boundary view | covered |
| O5 | Derive immutable receipt identities and replay them. | SWU-001 kernel receipt | covered |
| O6 | Make prohibited identity inference machine-visible. | spec prohibited inferences | covered |

## Selected Sources

- `TASK-UIR-EVIDENCE.md#SWU-UIR-005` - required vectors and write scope.
- `EVIDENCE-CONTRACTS.md#S3-Reroute-Receipt` - outcome vocabulary.
- `SPEC.md#Invariants` and `#Prohibited-Inferences` - strict boundary.
- `ARCHITECTURE.md#6-Dependency-Interface-View` - external owner route.
- `contracts/record-envelope.schema.yml` and reference implementation - identity.
- Accepted research finding S3 - two-sided, not inverse/bidirectional identity.

## Write Scope And Validation

- Add reroute schema, evaluator, fixtures, generated receipt set, and focused tests
  under this repair package only.
- Test local shape acceptance, destination rejection, source acceptance,
  pending owner, invalid specimen, and not-testable destination.
- Reject pending-owner without owner handle and any claimed destination identity.
- No DS-D1, DS-D8, candidate, or external destination mutation.
