---
task_reference: SWU-UIF-001
parent_task: TASK-UIF-BASELINE
mode: standard
status: pass
created: 2026-07-11
artifact_kind: task-session-evidence
runtime_handoff: false
---

# Context Pack: SWU-UIF-001

## Task And Output

- Task: freeze the UI candidate hypothesis matrix.
- Output: one 11-label matrix plus a decision ledger under the UIF development
  package.
- Runtime: local; no adapter, delegation, or subagent.
- Authority: development evidence only. Canonical DS-D1 and DS-D8 are read-only.

## Obligation Matrix

| ID | Obligation | Required evidence | Status |
| --- | --- | --- | --- |
| O1 | Cover exactly all 11 UI labels. | SPEC candidate set, CANDIDATES UI rows, work-pack done criterion. | covered |
| O2 | Record hypothesis, neighbors, allowed witnesses, forbidden shortcuts, possible outcomes, and correction route for every label. | Baseline task contract, experiment tensions, UI11 attack tables. | covered |
| O3 | Keep every row formation-deferred and non-promoting. | UI11 accepted findings, shared authority precedence. | covered |
| O4 | Separate source evidence from package inference. | UI11 attacks, formalism and non-collapse findings, DS-D8 signatures. | covered |
| O5 | Stay inside the development matrix/ledger write scope. | SWU manifest and task-local contract. | covered |
| O6 | Validate count, required columns, authority language, links, and diff integrity. | SWU validation surface and repository docs validator. | covered |
| O7 | Synchronize SWU, parent task, W0, and next-ready state only after evidence passes. | Task Session synchronization rule and work-pack status board. | covered |

## Controlling Constraints

1. All 11 UI labels remain formation-deferred.
2. Candidate criteria are structural hypotheses, not definitions.
3. A self-declared type/tag, naming convention, framework API, or raw
   edge-participation difference cannot serve as a separating witness.
4. DS-D8 evidence counts only when an instance exercises an active signature;
   endpoint use is never formation authority.
5. A candidate may honestly resolve to merge, relation-not-node, framework
   vocabulary, split, or deferred evidence rather than schema-ready.
6. This SWU does not create experiment manifests, fixtures, schemas, validators,
   or promotion packets.

## Included Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `WORK-PACK.md` | SWU-UIF-001 manifest row; gates; blockers | O1, O2, O5, O6, O7 |
| `work-pack/tasks/TASK-UIF-BASELINE.md` | UIF-001 contract and synchronization | O1, O2, O5, O6, O7 |
| `work-pack/shared/context.md` | authority precedence and stable constraints | O3, O4, O5 |
| `SPEC.md` | Candidate Set, Experiment Outcomes, Formation Rules | O1, O2, O3 |
| `ARCHITECTURE.md` | Decision Flow, UIF-AD1..AD6, Risks | O2, O3, O4 |
| `EXPERIMENTS.md` | UIF-H1..H6, E0, Per-Type Tension Matrix, thresholds | O2, O4, O6 |
| UI11 `findings.md` | review verdict, F1..F4, per-type coverage | O1, O3, O4 |
| UI11 `attacks.md` | schema-construction, collapse, and relation-pressure tables | O2, O4 |
| `CANDIDATES.md` | UI rows 15..25 | O1, O3 |
| formalism `findings.md` | structural table-walk and moat boundary | O2, O3, O4 |
| non-collapse `findings.md` | a1/a2 separating witness requirements | O2, O3, O4 |
| `relationships.yml` | active UI signatures `renders` through `mirrors` | O2, O3, O4 |

## Evidence Versus Inference

- Evidence: candidate names/statuses, active DS-D8 signatures, accepted defer
  verdict, structural formalism, and non-collapse constraints.
- Inference: the exact hypothesis wording, neighbor sets, and correction routes
  drafted by this SWU. These remain frozen experimental inputs, not accepted
  formation laws.

## Decisions And Assumptions

- No blocker decisions.
- Assumption: matrix and decision-ledger outputs live under `baseline/`.
- Assumption: use the six provisional outcomes already approved by the package
  design; tailor possible outcomes per row without choosing one.
- Assumption: cite source families in compact form rather than copying full
  excerpts into the matrix.

## Validation Surface

- Scripted matrix count and required-column check.
- Scan for prohibited `active`/`promoted` status claims.
- Local Markdown link validation.
- `npm --prefix projects/domainspec-v2/impl run validate:docs`.
- trailing-whitespace and scoped diff checks.

## Context Builder Summary

- Files selected: 12.
- Snippet groups: 16.
- Obligation coverage: 100 percent.
- Noise ratio: low; every source closes at least one obligation.
- Handoff pack: none.
- Strict runtime coverage: n/a.
- Blockers: 0.
- Fallback search: named gaps only; none required during context building.
