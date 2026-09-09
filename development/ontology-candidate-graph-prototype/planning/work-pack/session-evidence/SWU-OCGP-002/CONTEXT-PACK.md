# Task Session Context — SWU-OCGP-002

Status: strict coverage pass  
Mode: Context Builder standard  
Evidence type: session-local execution context

## Objective

Implement only the closed endpoint, direction, inverse, and per-source
cardinality rules for edges in an already accepted `candidate-v1` carrier.
Do not traverse grounding paths, evaluate policy, or project a read model.

## Obligation Matrix

| ID | Obligation | Controlling selector | Status |
| --- | --- | --- | --- |
| O1 | exact SWU identity and one behavior | `TASK-OCGP-GRAPH-001.md#swu-ocgp-002` | covered |
| O2 | `SWU-OCGP-001` terminal and owner closeout pass | exact dependency receipts | covered |
| O3 | forward verbs and allowed kind triples | pinned `EDGES.yaml` and `ALLOWED-EDGES.yaml` | covered |
| O4 | inverse verbs reject as declarations | `EDGES.yaml#inverses` | covered |
| O5 | session claim and session-evidence negatives | Design fixtures | covered |
| O6 | per-source cardinality | `ALLOWED-EDGES.yaml` | covered |
| O7 | stable order-independent result | task acceptance | covered |
| O8 | exact private write scope | task exact future write scope | covered |
| O9 | no traversal, policy, projection, or mutation authority | task split analysis | covered |
| O10 | exact closeout targets and successor | manifest row `SWU-OCGP-002` | covered |

## Decisions

- The runtime embeds a finite table bound to the two pinned grammar digests;
  it does not parse or mutate the governed YAML at evaluation time.
- Diagnostics use stable edge-ID selectors so input edge order cannot alter
  canonical results.
- `contradicts` is admitted and visible but is not treated as composable.

No blocker-level choice remains.

## Write Scope

Exactly the six implementation paths and three receipt paths declared by the
task and manifest. Everything else, including both canonical grammar files
and Poker Team, is read-only.

## Acceptance-Critical Validation

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/edge-grammar.test.mjs
```
