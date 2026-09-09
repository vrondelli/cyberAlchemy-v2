# TASK-OCGP-POLICY-001 — Named Finite Policy Disposition

Layer: L0C  
Status: completed; owner closeout pass  
Parent work pack: `WP-OCGP-001`

## SWU-OCGP-004

Primary behavior: evaluate one admitted graph against `candidate-policy-v1`
and return exactly one typed disposition.

Execution owner recommendation: Task Session.

### Dependencies and Inputs

- passing receipts for `001–003`;
- `../../../../design/VALIDATION-CONTRACTS.md`;
- the policy ID, owner, version, digest, schema digest, and edge-grammar digests;
- all positive, negative, and indeterminate Design fixture expectations.

### Exact Future Write Scope

- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/policy.v1.json`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/src/evaluator/policy-disposition.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/policy-disposition.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/fixtures/cases/specializes-owner-unbound.v1.json`
- exact terminal/session/owner receipt paths from the manifest

### Ordered Evaluation

1. verify policy/schema/edge-law versions and digests;
2. preserve structural or graph-law failures as `policy-fail`;
3. return `policy-indeterminate/POLICY_OWNER_UNBOUND` when a
   `specializes` claim lacks a named admitted owner;
4. otherwise return `policy-pass`;
5. always emit `authority_effect: none`.

Expected result shape:

```json
{
  "policy_id": "candidate-policy-v1",
  "disposition": "policy-pass|policy-fail|policy-indeterminate",
  "codes": [],
  "authority_effect": "none"
}
```

### Independent Acceptance

Done when every Design fixture yields its exact disposition/code, stale or
unknown policy material blocks, result ordering is stable, and no function can
admit meaning or write authority.

Validation:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/policy-disposition.test.mjs
```

Expected evidence: complete finite fixture table with no missing disposition,
policy and source digests, test result, and terminal receipt.

Completion evidence:

- terminal receipt: `generated/runs/SWU-OCGP-004/terminal-receipt.json`
  (`sha256:24494f9050decedcc87a52267677c5bd89f902e741688fa2ee0d0870c44f4c5a`)
- Task Session result (`sha256:e30a6fdc31ad635101dbe9f298ebef5970a2decbd6f8be884fdd11af42dc38a8`)
- validation: 12 passed, 0 failed
- successor candidate: `SWU-OCGP-005`

### Split Analysis

Split analysis: disposition is one normative behavior. Projection is deliberately separate:
the same disposition may support multiple read views, none of which owns the
policy result.

### Handoff

Handoff: use only this SWU. Return the Execution Pack result and stop. Passing closeout
makes `SWU-OCGP-005` the only successor candidate; it remains unselected.
