# CyberAlchemy Ontology Product Ontology

Status: candidate private product ontology

Ontology ID: `cav2.ontology-product`

Ontology type: `business-domain`

Owner: CyberAlchemy v2 ontology route

Authority effect: none

## Responsibility

This package projects the draft CyberAlchemy Ontology Product thesis into a
stable machine-readable business-domain model. It owns candidate nodes,
relations, source bindings, residue, schema, validation, and validation history
for this package only.

Product meaning remains owned by
[`../../product/ontology-product/PRODUCT-THESIS.md`](../../product/ontology-product/PRODUCT-THESIS.md).
Canonical definitions remain owned by
[`../../authority/definitions/DEFINITIONS.md`](../../authority/definitions/DEFINITIONS.md).
This ontology cannot redefine either source.

## Core Identity

```text
CyberAlchemy Ontology Product --subproduct_of--> CyberAlchemy
CyberAlchemy Ontology Product --claims_value_through--> Ontology Product Thesis

Ontology Product Project --develops--> CyberAlchemy Ontology Product
Ontology Product Project --tests_realization_of--> Ontology Product Thesis
Ontology Product Foundation Goal --belongs_to--> Ontology Product Project
Ontology Product Foundation Goal --advances--> Ontology Product Thesis
```

The Project and Goal are candidate product-ontology identities. Their canonical
Goal-package carriers are deliberately not materialized here because
`cyberAlchemy-v2/goals/` is an active owner surface whose current validator is
not yet multi-project. This package reports that external validation as
`not_evaluated`; it does not claim Goal-package closure or Goal achievement.

## Package Files

| File | Responsibility |
| --- | --- |
| `profile.json` | Package identity, ownership, visibility, roots, and claim ceiling. |
| `sources.json` | Exact source identities and digests. |
| `nodes.json` | Product, thesis, actors, problem, capabilities, outcomes, rules, Project, and Goal. |
| `relations.json` | Closed relation vocabulary and package-local edges. |
| `residue.json` | Unresolved runtime, Goal-package, consumer, dependency, and product-proof work. |
| `schema.json` | Closed record-shape contract. |
| `validate.py` | Check-only validation by default; receipt writing requires an explicit flag. |
| `receipts/` | Append-only validation history created after PASS. |

## Validate

Check without writing:

```text
python3 cyberAlchemy-v2/ontology/ontology-product/validate.py
```

Write one append-only receipt for the exact passing material digest:

```text
python3 cyberAlchemy-v2/ontology/ontology-product/validate.py --write-receipt
```

## Claim Ceiling

A passing package proves only closed shapes, exact source currency, stable-ID
and endpoint closure, required Product/Thesis/Project/Goal relationships, visible
residue, and `authority_effect: none` for these exact bytes. It does not prove
product value, Goal achievement, runtime implementation, Arcanum replacement,
publication, release, deployment, or production readiness.
