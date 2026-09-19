# DomainSpec integration ontology scaffold

This R1 package projects the 36 integration definitions into an agent-facing business/system bridge. It exists for navigation, traceability, drift detection, and construction planning.

It does not modify the canonical DomainSpec ontology, admit the candidate definitions, select providers, or claim implementation conformance. The suspended ontology runtime is neither invoked nor required.

## Contents

- `concepts.json` projects all 36 stable definition identities with separate evidence and commitment confidence.
- `relations.json` contains every specialization edge plus the declared binding, mapping, channel, observation, and layout relations.
- `invariants.json` materializes all 15 non-collapse laws.
- `sources.json` binds the scaffold to the exact Definition Pack, reconciliation matrix, and construction plan bytes.
- `schema/integration-ontology-scaffold.schema.json` documents the closed record shapes.
- `validate.mjs` checks source currency and complete projection closure.

## Branch model

- `business` is reserved for domain meaning. No integration definition currently claims ownership of a business concept.
- `system` contains provider-facing profiles, realizations, channels, policies, evidence, observations, and layout.
- `bridge` contains contracts, mappings, and bindings that connect domain/application meaning to system mechanics.

This prevents system artifacts from silently redefining Entity, Event, Operation, Query, Mapping, Workflow, or other domain meta-types.

## Validate

From the `domainspec-core` repository root:

```bash
node projects/domainspec-v2/development/integration-reconciliation/v1/ontology/validate.mjs
```

Expected result: 36 concepts, 24 relations, 15 invariants, no ontology runtime use, and `authority_effect: none`.

## Next construction boundary

R2 may now define the shared integration contract kernel. It must consume the exact scaffold/Definition Pack identities and preserve the five recorded conflict repairs before specialized persistence, messaging, and API contracts are added.
