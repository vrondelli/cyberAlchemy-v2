---
artifact: task-session-context-pack
status: block
task: SWU-GCP-001
mode: standard-strict
created: 2026-07-20
authority: session-evidence
---

# Context Pack: SWU-GCP-001

## Task And Expected Output

Execute one `Rule --enforces--> Operation` path for the key-and-door fixture,
producing source graph, normalized graph, obligation, test case, binding,
evaluator, positive receipt, typed-negative mutation receipt, and replay notes.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | use the authored key-and-door graph | minted node source and expected `graph.json` | covered |
| O2 | admit only `Rule --enforces--> Operation` | current relationship registry | covered |
| O3 | preserve source and graph digests | minted graph/build evidence plus DEFINE/DESIGN contracts | covered |
| O4 | derive a deterministic obligation key | `rules/index.ts` and `keys/index.ts` contract | covered |
| O5 | bind without storing expected output | `bindings/index.ts` | covered |
| O6 | generate a real assertion from an authored predicate | emitter requires a formal expression; key-and-door Rule supplies only `formal_return_type: boolean` | **block** |
| O7 | keep evaluator and receipt claims scoped | DESIGN and `residue/receipt.ts` | covered |
| O8 | reject a typed relationship mutation | registry signature and task acceptance boundary | covered |
| O9 | stay inside the declared evidence write scope and validate | work-pack/task contract | covered |

## Controlling Context

| Source | Selector | Obligation fit |
| --- | --- | --- |
| `WORK-PACK.md` | Gate And Scope; SWU Execution Handoff; Blockers | O1-O9 |
| `work-pack/tasks/TASK-GCP-ENFORCES.md` | Selected SWU; Done Criteria; Validation Surface | O1-O9 |
| `DEFINE.md` | Candidate Contract Set; Invariants | O3-O7 |
| `DESIGN.md` | Low-Level Contracts; Workflow; Decision Flow | O3-O7 |
| `IMPLEMENTATION-LAYERING.md` | L0 row | O1-O9 |
| `V1-ASPECT-ADOPTION.md` | operations/interface mapping | O5-O7 |
| `definitions/relationships/relationships.md` | backend signature table, `enforces` | O2/O8 |
| key-and-door `nodes/has-key-rule.json` | Rule body and `enforces` connection | O1/O2/O6 |
| key-and-door `expected/graph.json` | normalized nodes, edges, source digest | O1-O3 |
| `src/ir/types.ts` | graph, edge, obligation types | O3/O4 |
| `src/rules/index.ts` | classifier-driven Rule derivation | O4/O6 |
| `src/bindings/index.ts` | binding is target/fixture data, not oracle | O5/O6 |
| `src/emit/tests.ts` | real assertion requires resolvable Formal; otherwise skip | O6 |
| `src/residue/receipt.ts` | structural receipt boundary | O7 |

## Authority Precedence And Contradictions

1. Current v2 relationship authority controls edge direction:
   `Rule --enforces--> Operation`.
2. The legacy engine IR comment says `Operation --enforces--> Invariant`; it is
   an implementation-era dialect and cannot override the v2 registry.
3. The Rule formation schema proves only boolean return type. Neither it nor the
   key-and-door node authors the predicate needed for a generated expected value.

## Hard Constraints

- Do not infer `has_key == true` at generation time from prose intent.
- Do not count `needs_formal`, `it.skip`, or `it.todo` as a passing test.
- Do not alter canonical relationship authority or release state.
- No implementation mutation until the formal-source decision is resolved.

## Context Builder Summary

- Mode: standard, strict
- Files selected: 14
- Obligations covered: 8 of 9
- Strict coverage: block
- Handoff pack: none
- Fallback search: named gap only
- Blocker: authored predicate and fixture-input source is missing
