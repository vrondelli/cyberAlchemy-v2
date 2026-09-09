# Essays Agent Runtime Capability

Private candidate meaning package for one durable Essays runtime that may be
used through desktop, CLI, and explicitly authorized remote clients.

The Product Capability source is
[`../essays-agent-runtime.product-capability.json`](../essays-agent-runtime.product-capability.json).
The capability-local business ontology is under [`ontology/`](ontology/).

The runtime is defined by continuity and authority boundaries, not by a chosen
framework. Clients send commands and queries; agents produce proposals;
supervised browsers execute separately authorized actions and return evidence.
Only the Essays semantic owner may commit accepted state.

The capability remains incomplete by construction. Its five input/output
contracts, context policy, obligation registry, and explicit unselected
realization-precondition record now exist as a structurally validated bundle
adopted by the Essays agent-runtime owner and CyberAlchemy v2 Capability owner
at exact material digest
`65c57262318437ac8e22be79a44f4675c65f7e3aa81227bb43d7defe2d5028e5`.
DomainSpec source, generated system ontology, implementation binding, and
conformance evidence do not yet exist.

Validate the current candidate with:

```bash
python3 cyberAlchemy-v2/essays/capabilities/agent-runtime/ontology/scripts/validate.py
python3 cyberAlchemy-v2/essays/capabilities/agent-runtime/scripts/validate-capability-records.py
```

Both validators are check-only. The record validator can return structural
`PASS` while the ontology validator remains `FLAG` until owner decisions and
D65 successors close. Neither result authorizes construction.
