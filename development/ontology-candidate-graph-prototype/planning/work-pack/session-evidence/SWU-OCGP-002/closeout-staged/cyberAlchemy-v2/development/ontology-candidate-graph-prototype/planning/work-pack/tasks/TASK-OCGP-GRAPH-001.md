# TASK-OCGP-GRAPH-001 — Finite Edge and Grounding Laws

Layer: L0B  
Status: in progress; `SWU-OCGP-002` completed, `SWU-OCGP-003` next  
Parent work pack: `WP-OCGP-001`

## SWU-OCGP-002

Primary behavior: enforce the closed relation endpoint, direction,
cardinality, and declared-inverse rules for an accepted carrier.

Execution owner recommendation: Task Session.

### Dependencies and Inputs

- passing terminal and closeout receipts for `SWU-OCGP-001`;
- `../../../../define/operations.md`;
- Design fixtures `FX-WRONG-DIRECTION-001`,
  `FX-SESSION-CLAIM-001`, `FX-SESSION-EVIDENCE-001`, and
  `FX-INVERSE-STORED-001`;
- read-only canonical edge-law source digests pinned by Design.

### Exact Future Write Scope

- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/src/evaluator/edge-grammar.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/edge-grammar.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/wrong-direction.v1.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/session-claim-forbidden.v1.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/session-evidence-forbidden.v1.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/inverse-stored-forbidden.v1.json`
- exact terminal/session/owner receipt paths from the manifest

### Result and Acceptance

Return a stable list of allowed edge IDs or typed failures.

Expected result shape:

```json
{"accepted_edge_ids": ["E1"], "issues": []}
```

Unknown relations,
wrong endpoint pairs, stored read inverses, and cardinality violations fail
closed. There is no transitive reasoning.

Done when every one-condition fixture returns its Design code, the positive
edge set passes, and edge order does not affect the canonical result.

Completion evidence:

- terminal receipt:
  `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/SWU-OCGP-002/terminal-receipt.json`
  (`sha256:7e12bc73d49a25b1dbc39099fef64a40a1e11f23677f221166d9522d5959f7f2`)
- Task Session result:
  `planning/work-pack/session-evidence/SWU-OCGP-002/TASK-SESSION-RESULT.md`
  (`sha256:54c02e814a0efd5b66969930771bef7d57b8b0999a12271838969dd8424b4ec9`)
- validation: 10 passed, 0 failed
- successor candidate: `SWU-OCGP-003` (not selected by this closeout)

Validation:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/edge-grammar.test.mjs
```

Split analysis: endpoint-table enforcement needs no graph traversal and is
independently testable. Closure and cycle detection belong to `003`.

Handoff: return one result envelope and stop; on passing closeout, only `003`
may be offered for explicit selection.

## SWU-OCGP-003

Primary behavior: compute the grounded-evidence closure for an allowed graph
and reject a grounding cycle.

Execution owner recommendation: Task Session.

### Dependencies and Inputs

- passing terminal and closeout receipts for `001` and `002`;
- grounding semantics in `../../../../define/operations.md`;
- `FX-GROUNDING-CYCLE-001`;
- the accepted O13 edge set from Design.

### Exact Future Write Scope

- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/src/evaluator/grounding.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/grounding.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/grounding-cycle.v1.json`
- exact terminal/session/owner receipt paths from the manifest

### Result and Acceptance

For each valid root, return sorted reachable grounding IDs and paths.

Expected result shape:

```json
{
  "roots": {
    "F1": {
      "reachable_ids": ["D1", "R1"],
      "paths": [["F1", "R1", "D1"]]
    }
  },
  "issues": []
}
```

Reject a
cycle with `GROUNDING_CYCLE`. Contradiction and `specializes` edges never enter
the grounding traversal.

Done when the O13 closure is exactly `F1 → R1 → D1`, insertion order does not
change bytes, a cycle rejects, and `D2 contradicts D1` remains outside closure.

Validation:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/grounding.test.mjs
```

Split analysis: this unit owns traversal only. It does not choose a policy
disposition or produce a research view.

Handoff: return one result envelope and stop; on passing closeout, only `004`
becomes the successor candidate.
