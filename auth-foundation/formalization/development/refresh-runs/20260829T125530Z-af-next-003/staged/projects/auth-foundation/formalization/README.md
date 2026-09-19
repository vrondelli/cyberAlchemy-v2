# Auth Foundation Formalization Package

This directory is the human index for a JSON-first candidate package.

Canonical artifacts:

- [`formalization-package.json`](formalization-package.json) — package identity,
  source bindings, artifact inventory, boundary, and next step.
- [`ontology/authorization.ontology.json`](ontology/authorization.ontology.json)
  — business-domain ontology.
- [`schemas/formalization-package.schema.json`](schemas/formalization-package.schema.json)
  — stable package-manifest contract.
- [`schemas/formalization-ontology.schema.json`](schemas/formalization-ontology.schema.json)
  — stable ontology contract.
- [`cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/`](cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/)
  — Auth-owned L0 BusinessMeaning, InterpretationModel, FormalClaim identity,
  v3 claim candidate, and case package.

`validate.mjs` checks source currency, record closure, stable-ID uniqueness,
relation endpoint closure, source bindings, authority ceilings, package
inventory, case JSON Schema conformance, exact-reference currency, proposition
digests, and the honest v2 adapter boundary. Validation receipts are append-only under
`receipts/`.

The package starts from the CyberAlchemy-v2 node, relation, and package model.
Its explicit DomainSpec/Auth delta is recorded in the ontology. The source
model remains provenance; this candidate does not mutate or promote it.

The L0 case uses `fol-core` only as a canonical proposition language. It has no
provider route and makes no obligation, proof, implementation, or EVF claim.
The exact BusinessMeaning and InterpretationModel are owner-accepted. Their
acceptance does not admit the rebound FormalClaim candidate; that is the next
separate decision.
