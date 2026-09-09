# Essays

Status: candidate semantic package
Visibility: private
Project: `CA2-PROJECT-ESSAYS`
Goal: `CA2-GOAL-ESSAYS-FIRST-RUNTIME`
Authority effect: none

Essays is a proposed CyberAlchemy v2 subproduct for developing long-form writing
through a focused interface while keeping author intent, composition state,
review, revision, evidence, and unresolved editorial residue explicit.

The package begins with meaning rather than implementation:

```text
selector-bound definitions
  -> Essays product ontology
  -> Essays capability ontology
  -> DomainSpec v2 authored source
  -> deterministic compiled graph and generated system ontology
  -> exact realization baseline and owner acceptance
  -> runtime and frontend candidate
```

Whisper is the starting composition capability. It remains a source-owned
Arcanum spell and a candidate realization of part of the Essays Product
Capability; it is not renamed into the Essays Product, Project, or runtime.

The first local writing runtime now exists as a bounded candidate. A second
candidate capability, `Inspect Essays Product Model`, defines a read-only view
of the definitions, products, projects, and ontologies bound to that runtime.
Its generated system projection does not authorize frontend implementation;
that work requires acceptance of its own exact realization-baseline digest.

## Package map

- `PRODUCT-THESIS.md` — candidate Essays product proposition.
- `sources.json` — selector-bound source identities.
- `definitions.json` — canonical bindings and Essays-local definition candidates.
- `nodes.json` and `relations.json` — shared graph records.
- `product-ontology.json` — why Essays should exist and what outcome it claims.
- `capability-ontology.json` — what Essays must enable and how Whisper may contribute.
- `domainspec-project/` — consumer-owned DomainSpec v2 source and deterministic generated views.
- `system-ontology/` — graph projection and the semantic-to-system bridge.
- `research/open-source-writing-substrate/` — source-backed substrate comparison and bounded selection candidate.
- `residue.json` — open substrate-adoption, shared-capability, implementation, and runtime gaps.
- `schemas/essays.schema.json` — closed semantic-package shapes.
- `scripts/validate.py` — deterministic check-only validator.

## Validate

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/essays/scripts/validate.py
```

## Claim ceiling

A semantic PASS proves current selector bindings, closed candidate definitions,
node/relation/view closure, required Product-Capability-Whisper distinctions,
visible residue, and `authority_effect: none`. A compiler PASS additionally proves
that the Essays-owned DomainSpec v2 source deterministically produces its current
development-profile graph, system ontology, and referentially closed bridge. Neither
PASS imports the editor candidate, grants DomainSpec release admission, registers a
complete CAV2-D65 ConstructionBinding, implements or adopts a runtime/frontend,
proves product value, publishes, releases, or deploys.
