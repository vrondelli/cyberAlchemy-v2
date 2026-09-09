# TASK-OCGP-CARRIER-001 — Closed Candidate Carrier

Layer: L0A  
Status: completed; owner closeout pass  
Parent work pack: `WP-OCGP-001`

## SWU-OCGP-001

Primary behavior: parse one JSON candidate document and deterministically
accept or reject it against the closed candidate-v1 carrier.

Execution owner recommendation: Task Session in the current private checkout.
No subagent or external runtime is needed.

### Inputs

- `../../../PLANNING-CONTEXT.md`
- `../../../../define/domain.md`
- `../../../../define/interfaces.md`
- fixtures `FX-VALID-LINEAGE-001`, `FX-UNKNOWN-KIND-001`, and
  `FX-AUTHORITY-EFFECT-001`

### Exact Future Write Scope

- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/package.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/src/contracts/candidate-v1.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/candidate-v1.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/carrier-minimal.v1.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/unknown-kind.v1.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/authority-effect-forbidden.v1.json`
- exact terminal/session/owner receipt paths from the SWU manifest

Everything else is read-only.

### Algorithm and Result

Validate the document version, finite top-level fields, unique IDs, four closed
node kinds, closed candidate record fields, and `authority_effect: none`.
Collect issues in stable `(path, code)` order.

Expected result shape:

```json
{
  "contract_version": "candidate-v1",
  "accepted": true,
  "node_count": 5,
  "edge_count": 4,
  "issues": []
}
```

Unknown major versions, fields, kinds, duplicate IDs, missing references, or
non-`none` authority effects reject. This unit must not interpret relation
direction, closure, policy, or lineage.

### Independent Acceptance

Done when:

- the minimal carrier accepts;
- each negative fixture rejects with one stable code;
- repeated evaluation returns byte-identical canonical result bodies;
- the module exports no writer and performs no filesystem mutation.

Validation:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/candidate-v1.test.mjs
```

Expected evidence: passing test summary, exact negative codes, source digest
map, and terminal receipt at the manifest path.

### Completion Evidence

- terminal receipt:
  `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/SWU-OCGP-001/terminal-receipt.json`
  (`sha256:9f7a687d09e7bfbbfdb772478a456488619d2e260f769d42324a2e82f623f99f`)
- Task Session result:
  `planning/work-pack/session-evidence/SWU-OCGP-001/TASK-SESSION-RESULT.md`
  (`sha256:62d4130a1cc6db0d843a79ffc6a17856ff770a87ae6ac8c3efd53aa55947ed3d`)
- validation: 8 tests passed, 0 failed
- closeout route: `invoke:refresh:apply-approved`
- successor candidate: `SWU-OCGP-002` (not selected by this closeout)

### Split Analysis

Split analysis: carrier acceptance is independently useful and testable. Edge grammar,
grounding, policy, projection, and persistence consume its accepted structure
but are separate behaviors and are excluded.

### Handoff

Handoff: Task Session receives only this task, shared context, W0, the Design schema
anchors, and `SWU-OCGP-001`. Return the Execution Pack result shape and stop.
On passing closeout, `SWU-OCGP-002` becomes the sole successor candidate but is
not selected.
