---
feature_code: UIF
docType: traceability
status: draft
updatedAt: 2026-07-11
---

# Traceability: UI Meta-Type Formalization

## Requirement To SWU

| Requirement | Source | SWUs | Closure evidence |
| --- | --- | --- | --- |
| Cover all 11 labels | SPEC Candidate Set | UIF-001, UIF-004..007, UIF-011 | [11-row hypothesis matrix](../../baseline/CANDIDATE-HYPOTHESIS-MATRIX.md) and [provisional verdict matrix](../../adjudication/VERDICT-MATRIX.md) |
| Prove method can preserve and collapse | ARCHITECTURE UIF-AD2 | UIF-002..003 | [Frozen E0 protocol](../../experiments/protocol.yml), [comparison](../../experiments/results/e0/final/comparison.yml), and [summary](../../experiments/results/e0/final/SUMMARY.md) |
| Structural decidability | SPEC Formation Rules | UIF-001, UIF-004..009 | criterion and rule-kind records |
| Positive/malformed/neighbor fixtures | SPEC Artifact Contract | UIF-002..006, UIF-008 | fixture census and tests |
| Correction contract | SPEC Artifact Contract | UIF-001, UIF-004..008 | per-result repair/reroute field |
| DS-D8 pressure not authority | Architecture boundary | all | promotion guardrails and graph results |
| Framework portability | UIF-H4 | UIF-004..006, UIF-010 | [accepted bounded review](../../replication/findings.md) and [zero-survivor matrix](../../replication/REPLICATION-MATRIX.md); repair required |
| Generated-instance discrimination | UIF-H6 | UIF-009 | generated pass plus targeted mutation reject |
| Owner-safe promotion handoff | SPEC Success Condition | UIF-011 | blocked: zero replicated survivors; no authority mutation |

## Type Coverage

| Lane | Labels | SWU |
| --- | --- | --- |
| Composition | Page, Layout, Component | UIF-004 |
| Data/interaction | View Model, Form, Action, State Indicator | UIF-005 |
| Integration/control | Hook, Guard, Binding, Adapter | UIF-006 |

The lane partition is an experiment write-scope boundary, not an ontology
category decision.
