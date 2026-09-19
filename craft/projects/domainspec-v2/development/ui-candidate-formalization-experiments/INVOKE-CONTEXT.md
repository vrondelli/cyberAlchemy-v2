---
artifact_id: UCFE-INVOKE-CONTEXT-v1
invoke_modes: [define, design, plan]
strict_coverage: pass
created: 2026-07-12
---

# Invoke Context

## Intent

Define, design, and plan a reusable evidence process for formalizing each UI
candidate. Use Form as the first pilot. Before seeking new-type evidence, test
whether existing DomainSpec types, edges, roles, projections, or compound
structures already explain the candidate without loss.

## Controlling Evidence

- `ui-meta-type-repair/audit/integrated-001/result.json`: mechanical evidence
  machinery passes, but the bounded outcome is `DEFER`.
- `ui-meta-type-repair/GAP-LEDGER.md`: GAP-UIR-005 and GAP-UIR-006 require
  per-candidate portability and separating witnesses.
- `ui-meta-type-formalization/adjudication/VERDICT-MATRIX.md`: nine UI
  candidates remain candidate-only; Adapter and State Indicator already take
  merge/split routes.
- `ui-meta-type-formalization/replication/REPLICATION-MATRIX.md`: Form and Action
  have the strongest partial evidence, but no candidate is replicated.
- `ui-meta-type-repair/evidence/results/dossier-policy/generation-001/evaluation.json`:
  fixed per-candidate threshold is 2 real corpora, 2 implementation styles, and
  2 independent agreeing reviewers.

## Obligations

| ID | Obligation | Coverage |
| --- | --- | --- |
| C1 | Apply the full process to every candidate run | complete |
| C2 | Reuse existing types/edges when evidence supports coverage or collapse | complete |
| C3 | Require positive collapse evidence; do not infer collapse from missing evidence | complete |
| C4 | Preserve per-candidate evidence isolation and 2/2/2 threshold | complete |
| C5 | Require independent positive, contrast, label erasure, criterion erasure, and changed consequence | complete |
| C6 | Keep candidate, DS-D1, and DS-D8 mutation outside the experiment package | complete |
| C7 | Pilot the process on Form before packaging it for the remaining candidates | complete |

No blocker-level choice remains. The user's requirement to run the full process
for every new type selects the process boundary; the audit selects Form as the
first pilot because it has the strongest partial evidence.
