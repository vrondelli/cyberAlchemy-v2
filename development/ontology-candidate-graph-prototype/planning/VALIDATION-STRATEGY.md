# Prototype Validation Strategy

Status: planned

## Test Layers

| Layer | Contract | Evidence |
| --- | --- | --- |
| unit | one exported behavior per SWU | `node --test` result |
| fixture | one-condition positive, negative, or indeterminate vectors | expected vs actual canonical JSON |
| contract | versions, digests, endpoints, dispositions, receipt schema | fail-closed vectors |
| deterministic | same inputs in two fresh roots | byte equality of canonical bodies |
| isolation | governed selector digest set and denied-write probe | before/after attestation |
| recomposition | O13 case through carrier→verifier | closure task report |

## Fixture Matrix

The Design fixture IDs remain authoritative for expected behavior:

- `FX-VALID-LINEAGE-001`
- `FX-WRONG-DIRECTION-001`
- `FX-GROUNDING-CYCLE-001`
- `FX-SESSION-CLAIM-001`
- `FX-SESSION-EVIDENCE-001`
- `FX-INVERSE-STORED-001`
- `FX-SPECIALIZES-001`
- `FX-UNKNOWN-KIND-001`
- `FX-AUTHORITY-EFFECT-001`

Each negative fixture varies exactly one condition from a valid carrier.

## Canonical Byte Contract

- UTF-8, no BOM;
- recursively sorted object keys;
- arrays retain contract-defined order;
- no insignificant whitespace;
- final newline excluded from hashed canonical bodies;
- SHA-256 over exact bytes;
- run ID and wall clock are outside bodies compared for determinism;
- terminal receipt binds every input, evaluator module, output, and attestation
  digest.

## Independent Verification

The verifier must not call the producer’s receipt-creation or run-writer
functions. It may share only the closed schema constants and canonical-byte
specification. Tests must demonstrate rejection of:

- missing artifact;
- stale or wrong digest;
- unknown major version;
- unexpected extra file;
- overwritten output;
- self-issued acceptance claim;
- protected selector drift.

## Planned Commands

Each task file owns its exact future command. Full closure eventually runs:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/*.test.mjs
node cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/scripts/verify-terminal-receipt.mjs \
  cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/SWU-OCGP-008/terminal-receipt.json
```

These commands do not exist yet and are not evidence until a selected Task
Session implements and executes them.

## Claim Rules

Green tests can establish the finite contract only. They cannot establish
ontology completeness, semantic correctness outside the policy, Poker Team
acceptance, authority, promotion, publication, security, or production
readiness.
