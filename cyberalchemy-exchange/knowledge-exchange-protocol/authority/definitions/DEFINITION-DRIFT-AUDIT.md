# Knowledge Exchange Protocol Definition Drift Audit

Status: active
Owner: Knowledge Exchange Protocol product owner
Last updated: 2026-08-31

## Scope

This audit covers the product-local definition authority and its current
candidate consumers:

- [DEFINITIONS.md](DEFINITIONS.md)
- [DEFINITIONS-INDEX.md](DEFINITIONS-INDEX.md)
- [../../README.md](../../README.md)
- [../../business-ontology.json](../../business-ontology.json)
- [../../grant-encrypted-knowledge-coownership.product-capability.json](../../grant-encrypted-knowledge-coownership.product-capability.json)
- [../../domainspec/](../../domainspec/)
- [../../runtime/](../../runtime/)

## Migration

| Withdrawn parent ID | Product-local ID | Status |
| --- | --- | --- |
| CAV2-D70 | KEP-D1 | relocated before ontology admission |
| CAV2-D71 | KEP-D2 | relocated before ontology admission |
| CAV2-D72 | KEP-D3 | relocated before ontology admission |
| CAV2-D73 | KEP-D4 | relocated before ontology admission |
| CAV2-D74 | KEP-D5 | relocated before ontology admission |
| CAV2-D75 | KEP-D6 | relocated before ontology admission |
| CAV2-D76 | KEP-D7 | relocated before ontology admission |
| CAV2-D77 | KEP-D8 | relocated before ontology admission |
| CAV2-D78 | KEP-D9 | relocated before ontology admission |
| CAV2-D79 | KEP-D10 | relocated before ontology admission |
| CAV2-D80 | KEP-D11 | relocated before ontology admission |
| CAV2-D81 | KEP-D12 | relocated before ontology admission |

## Findings

| Finding | Status | Remediation |
| --- | --- | --- |
| Product vocabulary was initially placed in CyberAlchemy-v2 shared definition authority. | fixed | Relocated the twelve terms into this product-local authority and reserved the former parent IDs as withdrawn. |
| The Product Capability and business ontology did not bind the exact product-local definition IDs and digest. | fixed | The adopted capability and admitted business ontology now bind `KEP-D1` through `KEP-D12` and the exact canonical definition digest through [the ontology admission decision](../../decisions/ontology-admission.json). |
| Existing DomainSpec-generated and Rust artifacts descend from the earlier unbound vocabulary and ontology. | blocked successor claim | Rebuild or prove exact successor binding only after ontology admission; do not infer conformance from existing tests. |
| Solana realization, payment, licensing, royalties, rights, and reputation are outside the admitted state. | not_evaluable | Define and admit each successor capability before implementation. |
