# Essays Agent Runtime Business Ontology

Private durable candidate package for the business meaning of the Essays
multi-client agent runtime.

- Ontology: `cav2.essays.agent-runtime.business-domain.v1`
- Type: `business-domain`
- Branch: `business`
- Root: `B-ESSAYS-AGENT-RUNTIME-CAPABILITY`
- Product Capability: `CA2-CAP-ESSAYS-AGENT-RUNTIME`
- Owner: Essays Project owner plus CyberAlchemy v2 product owner
- Authority effect: none

The ontology models three desired outcomes, four product outputs, and nine
business rules. Its central rule is that desktop, CLI, remote clients, agents,
browsers, transports, storage, and extensions may participate without becoming
the semantic owner of accepted Essays state.

This package deliberately does not model runtime components or assert
realization. Its eight named capability dependencies close against the adopted
bundle at digest `65c57262318437ac8e22be79a44f4675c65f7e3aa81227bb43d7defe2d5028e5`;
the realization precondition remains intentionally unselected. System ontology,
DomainSpec source, implementation binding, conformance, product evidence, and
effect authority remain in `RESIDUE.jsonl`.

Run `python3 scripts/validate.py` from this directory. `FLAG` remains expected
only because later D65 successors do not yet exist. Owner approval is required
for the exact pre-merge candidate, not for candidate authoring or diagnostic
compilation.
