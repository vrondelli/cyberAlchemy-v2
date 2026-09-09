# Encrypted Durable Devnet Co-Ownership Business Ontology

Status: authored candidate; not admitted

Ontology ID: `CA2-ONTOLOGY-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET`

This private `business-domain` ontology composes the admitted no-price Solana
co-ownership and SQL-portable Durable Storage meanings for the adopted
encrypted Devnet protocol outcome. It specializes those predecessors with one
test-only cryptographic profile, one three-layer storage instantiation, a
finalized activation boundary, recipient decryption, and policy-scoped key
reissue.

## Core Grant Path

```text
exact artifact version with owners {A}
  -> encrypt artifact and B envelope under exact profile
  -> write and verify both objects across required storage layers
  -> storage-ready
  -> A-authorized Solana grant
  -> finalized state and stored-byte commitments match
  -> owners {A, B}; A preserved; replay consumed
  -> B retrieves and decrypts the exact artifact
```

## Reissue Path

```text
B remains a co-owner
  -> B authorizes a request for a new encryption-key binding
  -> replacement envelope is written and verified first
  -> exact Propagation Policy authorizes A to fulfill
  -> finalized commitment activates the replacement
  -> owner set, artifact version, epoch, policy, and economic state stay fixed
```

Prepared storage bytes and a submitted transaction are not active delivery.
Activation requires `finalized` Solana state plus independent retrieval and
commitment reconciliation. Storage and network costs remain infrastructure
costs; knowledge price remains absent.

The profile is test-only. Devnet is non-production. This package does not prove
cryptographic security, independent infrastructure failure domains, runtime
behavior, transaction success, deployment, or Mainnet suitability.

## Validate

```bash
python3 cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/ontology/validate.py
python3 -m unittest cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/ontology/tests/test_validate.py
```

## Claim Ceiling

The adopted Product Capability is an exact predecessor and this ontology is an
authored candidate. Validation cannot admit it. DomainSpec v2, compiled graph,
system ontology, implementation binding, conformance, wallet use, Devnet
transaction, publication, release, deployment, and external effects remain
`not_evaluable` or unauthorized.
