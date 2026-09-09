# Task Session Context — SWU-OCGP-001

Status: strict coverage pass  
Mode: Context Builder standard  
Evidence type: session-local execution context

## Objective

Implement only the closed `candidate-v1` carrier validator and its three
planned fixtures. Do not interpret relation direction, closure, policy,
projection, persistence, or authority.

## Obligation Matrix

| ID | Obligation | Controlling selector | Status |
| --- | --- | --- | --- |
| O1 | exact SWU identity and one behavior | `TASK-OCGP-CARRIER-001.md#swu-ocgp-001` | covered |
| O2 | exact private write scope | task `#exact-future-write-scope` | covered |
| O3 | four closed node kinds and complete governance fields | `define/domain.md#candidatenode` | covered |
| O4 | closed edge and relation-candidate carrier fields | `define/domain.md#candidateedge` and `#relationcandidate` | covered |
| O5 | stable reject diagnostics | task `#algorithm-and-result` | covered |
| O6 | no writer or relation semantics | task exclusions and `define/operations.md` stage order | covered |
| O7 | deterministic validation | task `#independent-acceptance` | covered |
| O8 | candidate-only authority | Architecture authority model | covered |
| O9 | closeout targets and successor | manifest row `SWU-OCGP-001` | covered |
| O10 | Poker Team remains read-only | shared constraints and series authorization | covered |

## Selected Sources

1. `planning/WORK-PACK.md` — control fields, gates, and prohibited scopes.
2. `planning/work-pack/swu-manifest.json` — exact receipt/closeout paths.
3. `planning/work-pack/tasks/TASK-OCGP-CARRIER-001.md` — behavior and writes.
4. `planning/work-pack/waves/W0-L0A.md` — entry/exit gate.
5. `planning/work-pack/shared/context.md` — fixed cross-SWU constraints.
6. `planning/work-pack/shared/traceability.md` — `VC-SCHEMA-001` binding.
7. `define/domain.md` — candidate carrier fields and invariants.
8. `define/interfaces.md` — input/output and exit boundaries.
9. `design/VALIDATION-CONTRACTS.md` — fixture expectations.
10. `design/ARCHITECTURE.md` — authority and component separation.
11. `design/EXAMPLE.md` — current Poker Team evidence identifiers.
12. `planning/OWNER-APPROVAL.md` — Plan approval ceiling.
13. `design/DESIGN-SELECTION-RESULT.json` — fixed-point Design evidence.

## Decisions

- Node 22 ESM and built-in `node:test`: already fixed by Plan; reversible.
- Negative fixture representation: a mutation descriptor applied to the valid
  carrier, so each negative changes exactly one condition.
- Closed top-level record:
  `schema_version`, `fixture_id`, `authority_effect`, `nodes`, `edges`, and
  `relation_candidates`.

No unresolved blocker-level choice remains.

## Write Scope

Exactly the six implementation paths and three receipt paths declared by the
task and manifest. Everything else is read-only.

## Acceptance-Critical Validation

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/candidate-v1.test.mjs
```

All done criteria and this command are acceptance-critical.
