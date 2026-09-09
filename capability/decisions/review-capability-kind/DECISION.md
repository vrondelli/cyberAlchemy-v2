# Decision: Decision Gate and Complexity Example Ladder capability kind

- Decision ID: `CA2-DG-REVIEW-CAPABILITY-KIND-001`
- Status: `PASS`
- Source of decision: CyberAlchemy-v2 product owner request on 2026-08-30
- Consequential work blocked: capability ontology and D65 mutation before the Define blocker review

## Question

Should Decision Gate and Complexity Example Ladder become two CyberAlchemy
Product Capability verticals, or remain source-owned public Agent Capabilities
that CyberAlchemy references and uses?

## Options

### CA2-DG-OPT-PRODUCT-VERTICALS — recommended

Create two private Product Capability candidates with business outcomes,
capability-local business ontologies, DomainSpec sources, deterministic system
ontologies, exact bindings to the public Agent Capabilities, and conformance
residue.

- Benefit: makes the CyberAlchemy product outcomes and responsibilities explicit.
- Cost: larger D65 construction and more evidence obligations.
- Reversibility: candidate records can be retired without changing public skills.

### CA2-DG-OPT-AGENT-REFERENCES

Add two reference-only Agent Capability records and private projection nodes.

- Benefit: smallest correct public/private bridge.
- Cost: does not say CyberAlchemy itself offers two new Product Capabilities.
- Reversibility: references can be removed without changing public skills.

### CA2-DG-OPT-DEFER

Record the unresolved choice and do not begin the requested review.

### CA2-DG-OPT-STOP

Stop this capability and review work.

## Rejected option

`CA2-DG-OPT-PRIVATE-FORKS` is structurally inadmissible. CyberAlchemy may bind
to the public Agent Capabilities but must not privately redefine or take
ownership of them.

## Current result

The CyberAlchemy-v2 product owner selected
`CA2-DG-OPT-PRODUCT-VERTICALS` by replying `A` on 2026-08-30 and separately
authorized registration of the canonical `cav2.capability` ontology. The gate
therefore resolves `PASS` for candidate construction of two Product Capability
verticals. Public Decision Gate and Complexity Example Ladder remain
source-owned Agent Capabilities and may be used only through exact realization
bindings. No adoption, conformance, publication, deployment, or external effect
is granted by this record.
