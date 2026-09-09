# Lean Ontology Evidence Compiler

This private package carries one bounded CyberAlchemy-v2 D65 construction
vertical: validate whether one candidate ontology edge is supported by exact,
frozen Lean declaration bindings and the selected direction rule.

The first operation is `ValidateTypedOntologyEdge`. It returns either
`reviewable-candidate-evidence` or `rejected`. Both outcomes have
`authority_effect: none`; neither outcome selects meaning, admits an ontology,
or approves implementation.

## D65 posture

| Stage | Local artifact | Posture |
| --- | --- | --- |
| Definitions | `definitions/DEFINITION-PACK.v1-candidate.json` | candidate, not canonical |
| Product Capability | `product-capability.json` | candidate, not adopted |
| Business ontology | `business-ontology/` | candidate, not admitted |
| DomainSpec source | `domainspec-project/` | authored under a development-only profile |
| Compiled graph/system ontology | generated files plus `system-ontology/` | deterministic candidate projection |
| Exact implementation binding | `implementation/` | delegated candidate, owner acceptance required |
| Conformance | `conformance/assessment.json` | independent local assessment only |

## Validation

From the repository root:

```bash
python3 cyberAlchemy-v2/product/lean-ontology-evidence-compiler/scripts/validate.py
```

Recheck deterministic generated outputs with:

```bash
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- \
  node --import tsx ../../../cyberAlchemy-v2/product/lean-ontology-evidence-compiler/scripts/compile-domainspec.ts --check
```

## Claim ceiling

This package is a local candidate. Passing checks establish source closure,
deterministic projection, and bounded fixture behavior only. They do not make
the proposed definitions canonical, adopt the Product Capability, admit either
ontology, accept the implementation binding, prove independent conformance,
or authorize publication, release, deployment, or external effects.

## Open questions

- Will definitions-governance promote, revise, or reject the six proposed terms?
- Which semantic owner may review a passing edge candidate for admission?
- Which independent conformance owner may evaluate the delegated implementation binding?
