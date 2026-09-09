# Durable Storage DomainSpec v2

This source projects the admitted Durable Storage business ontology into a
provider-neutral system model:

```text
classified encrypted bytes
  -> persist under exact binding
  -> bounded write receipt
  -> retrieve candidate bytes
  -> verify qualified byte identity and context
  -> verified retrieval or typed failure
```

Envelope reissue is a separate ordered operation: write replacement, verify
replacement, commit it as active, then retire prior bytes under policy. A
locator is never object identity, a write receipt is never durability proof,
and local evidence cannot claim availability outside its observation interval.

`binding.json` maps every accepted definition and every admitted ontology node,
rule, and proof requirement onto the authored DomainSpec nodes. No storage
provider, deployment, network operation, secret, or external effect is selected.

