# ORODI Ontology Candidate

Status: candidate, non-admitted, non-effectful

Ontology ID: `domainspec.orodi.ontology@1`

Ontology type: `business-system-bridge`

Owning Product and Project: `CA2-PRODUCT-CRAFT` / `CA2-PROJECT-CRAFT`

Business-ontology admission owner: `CA2-OWNER-CRAFT-ORODI-BUSINESS-ONTOLOGY`

DomainSpec-profile admission owner: `CA2-OWNER-DOMAINSPEC-LANGUAGE-PROFILE`

Visibility: private

## Purpose

This package connects Operational Resilience, Observability, and Deployment
Integration meaning to DomainSpec v2 authored source, a deterministic compiled
graph and system-ontology projection, exact implementation candidates, tests,
planned infrastructure, and explicit residue.

It separates four surfaces that must not collapse:

1. ORODI product and business meaning;
2. DomainSpec-authored system intent;
3. generated system-ontology state;
4. implementation, conformance, and runtime evidence.

The package is deliberately isolated from the canonical DomainSpec product
ontology. `product-ontology-projection.json` is a candidate projection for a
later owner decision; it does not mutate or outrank
`projects/domainspec-v2/ontology/`.

## Construction shape

```text
exact source evidence
  -> candidate Product Capabilities
  -> candidate ORODI business ontology
  -> DomainSpec project/feature/node source
  -> deterministic graph
  -> deterministic ORODI system ontology
  -> exact implementation bindings
  -> static conformance evidence
  -> candidate DomainSpec product-ontology projection
  -> separately authorized runtime evidence
```

## Package files

| Surface | File |
| --- | --- |
| Identity and authority ceiling | `profile.json` |
| Source identities | `sources.json` |
| Capability decomposition | `capabilities.json` |
| Business and system concepts | `nodes.json` |
| Business/system/bridge relations | `relations.json` |
| Implementation binding candidates | `implementation-bindings.json` |
| D65 construction-stage candidates | `construction-bindings.json` |
| Business-ontology admission candidate | `admission/business-ontology-candidate.json` |
| DomainSpec-profile admission candidate | `admission/domainspec-profile-candidate.json` |
| Canonical-ontology projection candidate | `product-ontology-projection.json` |
| Unresolved obligations | `residue.json` |
| Closed package contract | `schemas/orodi-ontology.schema.json` |
| Deterministic validator | `scripts/validate.py` |
| DomainSpec source, capability trace, and generated views | `domainspec/` |
| Negative and focused test evidence | `evidence/` |
| Architecture and adversarial review | `ARCHITECTURE.md`, `ARCHITECTURE-REVIEW.md` |
| Human views | `views/` |
| Append-only evidence | `validation-receipts/` |

## Verify

From the repository root:

```bash
python3 projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/ontology/scripts/validate.py --write-receipt
```

Rebuild the DomainSpec graph and system projection with the repository-pinned
Node environment:

```bash
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- node --import tsx ../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/ontology/domainspec/scripts/build.ts
```

## Claim ceiling

This package is candidate architecture and traceability evidence. The existing
Craft Project coordinates it and the six immutable Product Capability records
are materialized as candidates. It does not adopt those capabilities, admit a
business ontology, admit a DomainSpec profile or system ontology, accept
implementation, prove conformance or runtime behavior, authorize commissioning,
mutate infrastructure, publish, release, or deploy.
