# CyberAlchemy Review Capabilities

Status: candidate D65 construction
Authority effect: none

This owner-local module defines two CyberAlchemy Product Capability candidates:

- `CA2-CAP-RESOLVE-CONSEQUENTIAL-DECISIONS` gives a work owner a checked,
  durable decision boundary before consequential work continues.
- `CA2-CAP-EXPLAIN-COMPLEXITY-WITHOUT-MEANING-DRIFT` gives a participant
  aligned low, medium, and complex explanations without changing the concept,
  evidence, options, recommendation, or authority state.

The product outcomes are private CyberAlchemy meaning. Their current candidate
realizations remain public, source-owned Agent Capabilities:

- `arcanum/arcana/decision-gate/SKILL.md`
- `arcanum/transmutations/complexity-example-ladder/SKILL.md`

An exact binding does not copy either skill, transfer its ownership, adopt the
Product Capability, or establish behavioral conformance.

## D65 chain

```text
CAV2-D65, CAV2-D67, and DEF-ARC-CAPABILITY references
  -> two Product Capability candidates
  -> capability-local review business ontology
  -> DomainSpec v2 authored source
  -> deterministic graph and candidate system ontology
  -> exact public Agent Capability bindings
  -> fail-closed conformance assessment
```

## Validate

```bash
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- \
  node --import tsx ../../../cyberAlchemy-v2/review/scripts/build.ts
python3 cyberAlchemy-v2/review/scripts/validate.py
python3 cyberAlchemy-v2/review/tests/test_negative_mutations.py
```

Passing these checks proves exact candidate structure and deterministic local
materialization only. It does not grant adoption, acceptance, publication,
deployment, external effects, or authority to choose for a human owner.
