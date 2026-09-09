# TASK-OCGP-PROJECTION-001 — Research-Lineage Projection

Layer: L0C  
Status: completed; owner closeout pass  
Parent work pack: `WP-OCGP-001`

## SWU-OCGP-005

Primary behavior: project the admitted grounding lineage and visible conflict
from one `policy-pass` result without composing the conflict into lineage.

Execution owner recommendation: Task Session.

### Dependencies and Inputs

- passing receipts for `001–004`;
- `../../../../design/EXAMPLE.md`;
- `../../../../define/queries.md`;
- synthetic O13 identifiers already captured by Design.

### Exact Future Write Scope

- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/src/projection/research-lineage.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/research-lineage.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/poker-team-o13.v1.json`
- exact terminal/session/owner receipt paths from the manifest

The runtime must not read `validation/poker-team/`; the fixture is a synthetic,
versioned copy of the Design witness.

### Result and Acceptance

Expected result shape for O13:

```json
{
  "session_id": "S1",
  "lineage_ids": ["D1", "F1", "R1"],
  "grounding_path": ["F1", "R1", "D1"],
  "visible_conflicts": [{"from": "D2", "relation": "contradicts", "to": "D1"}],
  "excluded_from_lineage": ["D2"],
  "authority_effect": "none"
}
```

Projection is allowed only for `policy-pass`; fail or indeterminate returns no
lineage. Reordering input records must not change output bytes.

Done when O13 matches exactly, `D2` is visible but excluded, non-pass results
produce no view, and there is no promotion or canonical-ontology field.

Completion evidence:

- terminal receipt (`sha256:2f465d19c218e88193a57d03bf5c1e89576f22bd167ad1bbf50b93ea8cf9cb69`)
- Task Session result (`sha256:34f340dfecdab68031ba48d6dca5700c3cbe20f4c72f5ce3e38b28e03d15c4a1`)
- validation: 5 passed, 0 failed
- successor candidate: `SWU-OCGP-006`

Validation:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/research-lineage.test.mjs
```

### Split Analysis

Split analysis: this unit is a pure read projection. It does not evaluate policy, serialize a
receipt, render HTML, or decide whether Gauge or Histogram is the product
answer.

### Handoff

Handoff: return one result envelope and stop. Passing closeout makes `006` the only
successor candidate.
