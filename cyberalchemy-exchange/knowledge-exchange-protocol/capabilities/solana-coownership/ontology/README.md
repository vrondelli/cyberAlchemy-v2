# No-Price Solana Co-Ownership Business Ontology

Status: authored candidate; not admitted

Ontology ID: `CA2-ONTOLOGY-KEP-SOLANA-COOWNERSHIP`

This private, durable `business-domain` package maps the adopted no-price
Solana Product Capability to the exact meanings accepted as `KEP-SOL-D1`
through `KEP-SOL-D10`. It deliberately stops before DomainSpec, account-layout
selection, instruction implementation, program build, transaction evidence,
or deployment.

## Core Outcome

```text
A-authorized exact pre-state {A}
  + B identity and encryption-key binding
  + B envelope commitment
  + unique replay-domain identity
  -> atomic post-state {A, B}
     + B envelope commitment
     + revision + 1
     + replay consumed
     + no knowledge consideration
```

The ontology keeps Knowledge Identities separate from Solana public keys,
artifact versions separate from account aggregates, membership separate from
legal title, envelope commitments separate from secrets, network fees separate
from knowledge price, and local evidence separate from deployment evidence.

## Package Surfaces

- `profile.json`: identity, ownership, lifecycle, and D65 state
- `sources.json`: exact source identities, digests, and definition selections
- `definition-bindings.json`: closed `KEP-SOL-D1` through `D10` bindings
- `nodes.json`: business concepts and confidence posture
- `relations.json`: typed business relationships with closed endpoints
- `rules.json`: fail-closed business invariants
- `premises.json`: falsifiable technical premises with separate evidence and commitment confidence
- `proof-requirements.json`: future evidence obligations
- `residue.json`: admission, DomainSpec, storage, security, and economics gaps
- `receipts/index.json`: append-only receipt registry; currently empty
- `schema.json`: closed package schemas
- `validate.py`: deterministic check-only validator

## Validate

```bash
python3 cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/ontology/validate.py
python3 cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/ontology/tests/test_validate.py
```

## Claim Ceiling

The exact Product Capability is adopted and this ontology is authored as a
candidate. Validation cannot admit it. No DomainSpec source, system ontology,
Solana implementation, runtime behavior, payment, publication, release,
deployment, or external effect is authorized.
