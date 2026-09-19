---
task: SWU-R3C-004
mode: lean
strict_coverage: pass
created: 2026-07-12
artifact_role: task-session-evidence
---

# Context Pack: SWU-R3C-004

## Objective

Materialize the dispatch-selected Agent Execution Orchestrator source as a
current v2 feature pack, preserving only its nine source-backed DS-D8-admissible
rows, and prove a seeded one-axis endpoint violation is rejected.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O-001 | Use an owned corpus distinct from financial-settlement. | accepted dispatch findings; AEO source SPEC/aspects | covered |
| O-002 | Do not invent replacement semantics for invalid legacy rows. | findings 9/3 adjudication | covered |
| O-003 | Preserve current v2 node-shape criteria. | seven selected meta-type schemas | covered |
| O-004 | Exercise additional DS-D8 signatures. | orchestrates, contains, applies, exposes, produces | covered |
| O-005 | Prove a focused invalid edge fails. | State Machine `enforces` Operation non-example | covered |
| O-006 | Keep code-tag checking conditional. | no code-tag extraction input in selected pack | covered |
| O-007 | Synchronize work-pack and gap state only after green/red evidence. | TASK-R3C-CORPUS | covered |

## Selected Sources

1. `work-pack/tasks/TASK-R3C-CORPUS.md`.
2. Accepted `research/2026-07-12-second-corpus-selection/findings.md`.
3. AEO `SPEC.md`, `domain.md`, `operations.md`, `workflows.md`, `rules.md`,
   `interfaces.md`, and `observability.md`.
4. Root `definitions/relationships/relationships.yml`.
5. Current selected meta-type `.schema.yml` files.
6. `impl/spec/features/financial-settlement/SPEC.md` as v2 pack-shape precedent.
7. `validate-content.ts` and `validate-relationships.ts` entry contracts.

## Decisions

- Re-emit only the nine adjudicated valid rows, without semantic relabeling.
- Materialize the minimum concepts required by those rows; do not copy absent
  cross-feature siblings or unrelated draft concepts.
- Preserve each row's source aspect anchor in a provenance column.
- Keep the red fixture outside a `SPEC.md` filename so aggregate feature
  validation remains green; validate it explicitly with `--file`.
- Do not run `tags:composability`: the pack contains no code tags, so the task's
  conditional gate is not applicable.

## Write Scope

- `impl/spec/features/agent-execution-orchestrator/`
- this task-session evidence directory
- R3/APE work-pack and gap synchronization after validation

## Validation

- `validate:content`
- `validate:rels`
- focused `validate-content --file` red fixture, expected exit 1
- aggregate `validate`
- `engine:test`, `typecheck`, `tags:test`
- docs links and scoped diff check

## Gate Verdict

PASS. The accepted dispatch supplies a bounded source choice, the current
schemas make the pack shape decidable, and the negative case isolates one
authority endpoint violation.
