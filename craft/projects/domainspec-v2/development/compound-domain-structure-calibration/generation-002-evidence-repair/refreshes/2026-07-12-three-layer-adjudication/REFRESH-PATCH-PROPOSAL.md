---
mode: refresh
mutation_mode: proposal-only
status: apply-ready-proposal
---

# Refresh Patch Proposal

## Proposal Boundary

Apply only after a Task Session explicitly selects the refreshed work-pack. The
proposal supersedes the current generation-2 L2/L3 continuation; it does not
rewrite completed SWU001-SWU004 artifacts or execute adjudication/evaluation.

## Planning Artifact Deltas

| Target | Proposed delta | Signal |
| --- | --- | --- |
| `SPEC.md` | Add immutable three-layer input model, deterministic compatibility projection, separate permitted/breaking adjudication, and target-provenance invariants. | RFS-01, RFS-04, RFS-05 |
| `GLOSSARY.md` | Add Pre-Observation Baseline, Observation Layer, Adjudication Overlay, Compatibility Projection, and Target Provenance. | RFS-01 |
| `GLOSSARY-CONSISTENCY.md` | Prove the five terms have one meaning across spec, architecture, contracts, tasks, and audit. | RFS-01 |
| `ARCHITECTURE.md` | Replace direct `M1/M2 -> repaired F3` flow with parent + M1/M2 -> overlay -> deterministic v1 projection -> frozen evaluator. Update all six views. | RFS-04, RFS-05 |
| `IMPLEMENTATION-LAYERING.md` | Preserve completed L0/L1; split L2 into contract/materializer, overlay/projection, and evaluation/append; retain L3 audit. | RFS-06, RFS-07 |
| `IMPLEMENTATION-PLAN.md` | Replace old F3-builder/evaluate tasks with the four refreshed SWUs and exact algorithms in `REFRESHED-WORK-PACK.md`. | RFS-04, RFS-05, RFS-06 |
| `WORK-PACK.md` | Mark old SWU005/006/007 superseded by WP-CDSC2-R1, set exact next SWU 005A, and preserve SWU001-SWU004 complete. | RFS-06, RFS-07 |
| `EXECUTION-PACK.md` | Bind new artifacts, write scopes, failure policy, and receipt handoffs. | RFS-06 |
| `INVOKE-TRANSPORT.md` | Record refresh provenance, selected decision, new work-pack handle, validation, and exact next route. | RFS-01, RFS-06 |
| L2/L3 task and wave files | Supersede old direct F3 mutation with 005A, 005B, 006R, and 007R contracts. | RFS-04, RFS-05 |
| generation-2 dispatch | Replace direct F3 step with contract/materializer and adjudication/projection steps; preserve append and audit boundaries. | RFS-06 |

## Execution Artifact Deltas

These are owned by the refreshed Task Sessions, not by Invoke refresh:

| SWU | Proposed files | Acceptance |
| --- | --- | --- |
| 005A | `contracts/adjudication-overlay.schema.yml`, validator, materializer, negative fixtures, contract test | direct/schema parity, total separate matrix, deterministic parent-valid projection |
| 005B | overlay, compatibility receipt, review/provenance report, focused test | twelve cells, exact handles, uncertainty retained, no evaluation |
| 006R | generation-2 results, provenance manifest, append-only index update, integration test | total outcome, exact predecessor, identical replay |
| 007R | independent replay/audit/closeout and read-model synchronization | fresh-process equality, protected bytes, target provenance, bounded route |

## Compatibility Projection Rules

The plan and implementation must encode these rules verbatim:

1. Parent receipt, M1, and M2 are referenced, never rewritten.
2. Parent `G`, `A`, `Q01-Q05`, and corresponding cells are copied exactly into
   the derived evaluation projection.
3. Evaluation `Q06` and `Q07` derive only from parent permitted/breaking `S`
   descriptions and predictions.
4. The overlay supplies six cells per substitution; combined coordinates are
   invalid.
5. M1/M2 outcomes set observation state but cannot define target statements.
6. Partial or disputed explanatory coverage is `indeterminate`.
7. The parent v1 evaluator remains unchanged.
8. The generated v1 receipt is explicitly a compatibility projection, not a
   promoted interpretation.

## Status Transition On Approval

- Current root work-pack: `refresh-required` -> `superseded-l2-l3` with completed
  SWU001-SWU004 retained.
- Refreshed work-pack: `proposed-ready` -> `ready`.
- Exact first SWU: `SWU-CDSC2-005A`.
- GAP-CDSC2-008: `acceptance-critical/open` -> owned by 005A, then resolved only
  when contract negative vectors pass.

## Not Proposed

- Rerun M1/M2 or edit their predictions/outcomes.
- Modify parent receipt schema, validator, evaluator, or generation-1 bytes.
- Preselect any overlay cell or fixture/suite verdict.
- Add explanations, type identities, relationships, patterns, candidates, or
  promotion routes.
- Append generation 2 before 005A and 005B pass.
