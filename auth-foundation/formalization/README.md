# Auth Foundation Formalization Package

This directory is the human index for a JSON-first candidate package.

Canonical artifacts:

- [`formalization-package.json`](formalization-package.json) — package identity,
  source bindings, artifact inventory, boundary, and next step.
- [`ontology/authorization.ontology.json`](ontology/authorization.ontology.json)
  — preserved business-domain ontology source.
- [`ontology/authorization-semantic-alignment.v1-candidate.json`](ontology/authorization-semantic-alignment.v1-candidate.json)
  — exact-reference compatibility overlay that makes current consumers use the
  owner-accepted v2 authorization definitions without rewriting the preserved
  ontology bytes.
- [`schemas/formalization-package.schema.json`](schemas/formalization-package.schema.json)
  — stable package-manifest contract.
- [`schemas/formalization-ontology.schema.json`](schemas/formalization-ontology.schema.json)
  — stable ontology contract.
- [`cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/`](cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/)
  — Auth-owned accepted definitions-bearing v2 meaning, candidate external
  InterpretationModel lifecycle correction, explicit definition graph, v4 FormalClaim draft,
  derived consumer envelope, predecessor evidence, and case package.

`validate.mjs` checks source currency, record closure, stable-ID uniqueness,
relation endpoint closure, source bindings, authority ceilings, package
inventory, case JSON Schema conformance, exact-reference currency, proposition
digests, explicit definition dependency closure, formal-signature closure,
deterministic envelope materialization, definition-to-fact pointers, and the
honest v2 adapter boundary. Validation receipts are append-only under
`receipts/`.

The package starts from the CyberAlchemy-v2 node, relation, and package model.
Its explicit DomainSpec/Auth delta is recorded in the ontology. The source
model remains provenance; this candidate does not mutate or promote it.

The L0 case uses `fol-core` only as a canonical proposition language. It has no
provider route and makes no obligation, proof, implementation, or EVF claim.
The definitions-bearing v2 BusinessMeaning is owner-accepted and supersedes
v1 meaning. The accepted v3 InterpretationModel remains historical semantic
acceptance. Its v4 successor corrects the lifecycle rule so interpretation
changes create EvaluationContext identity, not FormalClaim identity; that
successor still needs owner acceptance. The current v4 FormalClaim draft exact-binds 20
accepted definitions through explicit graph edges and declares its own formal
signature. Its envelope copies those definitions only as a deterministic,
definition-complete, non-authoritative consumer view; external interpretation
references remain opaque traceability metadata. FormalClaim v3 remains
predecessor evidence; v4 still requires independent review and separate admission.
