# No-Price Solana Co-Ownership DomainSpec v2 Source

This is the authored DomainSpec v2 source candidate for the first Knowledge
Exchange Protocol capability: current co-owner A grants B co-ownership of one
immutable knowledge-artifact version without replacing A and without knowledge
consideration.

The source follows the admitted business ontology rather than embedding Solana
implementation choices prematurely:

```text
Knowledge Identity A
  -> performs grant-no-price-coownership
  -> preserves A + adds B
  -> records B envelope commitment
  -> increments revision + consumes replay identity atomically
  -> emits completed or rejected
  -> changes or preserves coownership-state
```

`binding.json` closes every admitted ontology node, rule, definition, and proof
requirement onto one or more DomainSpec nodes. The source uses the current
`domainspec.project/v1`, `domainspec.feature/v1`, `domainspec.node/v1`, and
`domainspec.edge/v1` contracts and the canonical relationship authority.

Run the bounded validator from the repository root:

```text
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/domainspec/validate.py
```

The validator checks predecessor bytes, admitted ontology bytes, total mapping
closure, declared-source closure, and the native DomainSpec v2 source lint. It
does not compile a graph, admit a system ontology, instantiate Rust, contact a
Solana network, or create any external effect.

Lifecycle state: `authored-candidate`. Any admission must bind the immutable
candidate bytes produced after validation and remains a separate owner decision.
