# Validation Contracts

Status: planned Design witnesses

## Fixture Contracts

| Fixture ID | Polarity | Claim | Expected result |
| --- | --- | --- | --- |
| `FX-VALID-LINEAGE-001` | positive | Five-node graph satisfies the pinned grammar | `policy-pass`; closure `D1,R1,F1`; conflict excluded |
| `FX-WRONG-DIRECTION-001` | negative | Endpoint direction fails closed | `policy-fail/EDGE_ENDPOINT_PAIR_FORBIDDEN` |
| `FX-GROUNDING-CYCLE-001` | negative | Instance grounding cycle fails closed | `policy-fail/GROUNDING_CYCLE` |
| `FX-SESSION-CLAIM-001` | negative | A session cannot assert contradiction | `policy-fail/SESSION_CLAIM_FORBIDDEN` |
| `FX-SESSION-EVIDENCE-001` | negative | An artifact cannot ground itself in a session | `policy-fail/SESSION_EVIDENCE_FORBIDDEN` |
| `FX-INVERSE-STORED-001` | negative | Read inverse cannot be declared | `policy-fail/INVERSE_EDGE_DECLARATION` |
| `FX-SPECIALIZES-001` | indeterminate | No admitted `specializes` owner/policy exists | `policy-indeterminate/POLICY_OWNER_UNBOUND` |
| `FX-UNKNOWN-KIND-001` | negative | Closed-world node kind enforcement | `policy-fail/UNKNOWN_NODE_KIND` |
| `FX-AUTHORITY-EFFECT-001` | negative | Candidate records cannot claim authority effect | `policy-fail/AUTHORITY_EFFECT_FORBIDDEN` |

## Validator Contracts

| Contract ID | Target | Binding | Pass/fail rule |
| --- | --- | --- | --- |
| `VC-SCHEMA-001` | node/edge/candidate records | schema ID/version/digest | reject missing, unknown, or invalid enum fields |
| `VC-POLICY-001` | policy and edge grammar | policy plus both YAML digests | reject stale or mismatched grammar |
| `VC-DETERMINISM-001` | result/projection/comparison bodies | two fresh run roots, same canonical inputs | byte-identical |
| `VC-ISOLATION-001` | governed inputs | protected selector digest set plus denied-write probe | every digest unchanged and write denied |
| `VC-RECEIPT-001` | completed run | all input/output/evaluator bindings | reject missing, stale, self-issued, or overwritten artifact |
| `VC-REPORT-001` | static human view | completed receipt digest | report data equals canonical JSON |

## Planned Acceptance Commands

These command shapes are future contracts, not present runtime commands:

```bash
ontology-prototype validate --case fixtures/cases/valid-lineage.v1.json \
  --policy fixtures/policy.v1.json --out generated/runs/run-1
ontology-prototype validate --case fixtures/cases/valid-lineage.v1.json \
  --policy fixtures/policy.v1.json --out generated/runs/run-2
ontology-prototype inspect --receipt generated/runs/run-1/receipt.v1.json \
  --format html
```

## Evidence Ceiling

Passing these future contracts would prove only the finite prototype behavior.
It would not prove ontology completeness, semantic correctness outside the
pinned policy, promotion, publication, production readiness, or IOLM parity.
