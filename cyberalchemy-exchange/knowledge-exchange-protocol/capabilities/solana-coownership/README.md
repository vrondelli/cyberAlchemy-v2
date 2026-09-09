# No-Price Solana Co-Ownership Capability

Status: exact definitions accepted; Product Capability authored as a candidate

The Knowledge Exchange Protocol product owner accepted the frozen
`KEP-SOL-D1` through `KEP-SOL-D10` definition source at SHA-256
`4bd06cf89baf081cbd404c1bad55378c47a14cdeb2029b0cf41d4ad49e133365`.
The immutable decision is
[`decisions/definition-set-acceptance-001.json`](decisions/definition-set-acceptance-001.json).
The accepted bytes retain their candidate-era labels because acceptance binds
the exact reviewed artifact rather than rewriting it after the decision.

The newly authored Product Capability is
[`../../realize-no-price-solana-coownership.product-capability.json`](../../realize-no-price-solana-coownership.product-capability.json).
Its exact candidate and predecessor closure is
[`product-capability-candidate.json`](product-capability-candidate.json).

## Outcome

For one exact encrypted Knowledge Artifact Version, an A-authorized Solana
instruction should atomically expand `{A}` to `{A, B}`, record B's envelope
commitment, advance the exact state revision, and consume the replay identity.
A remains an owner. No knowledge price, seller payout, royalty, escrow,
treasury consideration, or token transfer is part of this capability.

Network fees, account rent, and refundable rent reserves are infrastructure
costs and must not be misrepresented as knowledge consideration.

## D65 State

```text
accepted KEP-SOL-D1..D10 definitions
  -> authored Product Capability candidate
  -> Product Capability adoption: not requested
  -> Solana business ontology: not evaluable
  -> DomainSpec v2 and system ontology: not evaluable
  -> Solana program and conformance: not evaluable
```

## Validate

From the repository root:

```bash
python3 cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/validate.py
python3 cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/tests/test_validate.py
```

## Claim Ceiling

The definition set is accepted and the Product Capability is authored. The
capability is not adopted. No ontology, DomainSpec source, Solana program,
transaction, payment, deployment, or other external effect is authorized.
