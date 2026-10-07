# AlchLang Governed Domain Modeling

Status: private Product Capability and business-ontology candidate with three
owner-accepted reference vertical candidates in its governed material set.

AlchLang is a CyberAlchemy product language for expressing the terms, edges,
rules, states, events, permissions, examples, and authority limits of one
bounded domain. Its stable product outcome is governed domain modeling. A CLI,
TypeScript generator, agent tool surface, or other compiler interface is a
replaceable realization rather than the Product Capability identity.

## Product boundary

- Product: `CA2-PRODUCT-CYBERALCHEMY`.
- Product Capability: `CA2-CAP-ALCHLANG-MODEL-GOVERNED-DOMAINS`.
- Capability-local business ontology: `cav2.alchlang.business`.
- DomainSpec v2: the future authored system-model substrate.
- Compiled graph and system ontology: future deterministic projections of the
  exact DomainSpec source.
- Runtime, CLI, and generators: future exact implementation bindings.

The human-facing domain description need not contain repository IDs, but it
must make its important terms and relationships explicit or visibly unresolved.
Define may propose dispositions and candidate edges; it cannot silently settle
ambiguity or grant authority.

## Current D65 position

```text
canonical definitions                         validated references
  -> Product Capability                       candidate
  -> capability-local business ontology       candidate
  -> canonical DomainSpec v2 source             absent
  -> canonical graph/system ontology            not_evaluable
  -> canonical implementation binding           not_evaluable
  -> canonical conformance                      not_evaluable

accepted reference lane (three times)
  definition pack -> reference Product Capability -> reference business ontology
  -> AlchLang source -> DomainSpec source -> graph/system ontology
  -> TypeScript implementation -> source-local conformance -> user acceptance
```

The reference lane covers customer credit release, inventory reservation, and
sandbox-only production rollback. [reference-examples.json](reference-examples.json)
indexes their exact terms, ontology edges, D65 artifacts, accepted bindings,
conformance snapshots, and owner decision. The validator fails closed on drift
at any selected stage.

These examples are governed evidence, not the canonical AlchLang compiler or
runtime. The package still grants no business-ontology admission, publication,
release, deployment, production status, product proof, or external-effect
authorization.

## Campaign currentness

The accepted campaign is an immutable historical predecessor set. This
integration intentionally supersedes its AlchLang `product-capability.json`, so
rerunning that original campaign must fail its predecessor-currentness gate.
The package validator requires this to be the only historical predecessor
drift. A new end-to-end campaign needs a new digest-bound authorization; the
old campaign is not silently refreshed.

## Validate

From the repository root:

```bash
python3 language/capabilities/alchlang/scripts/validate.py
python3 language/capabilities/alchlang/tests/test_negative_mutations.py
```

Validation is read-only. It proves the current candidate shape, exact
selected-source digests, reference closure, required ontology terms and edges,
the three accepted reference D65 chains, authority ceiling, and fail-closed
residue. It does not prove canonical admission or a general compiler/runtime.
