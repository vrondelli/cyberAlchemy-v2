# Invoke Refresh — SWU-APE-ONT-004

Status: `materialized / ready for Task Session admission`

## Selection and scope

- Selected unit: `SWU-APE-ONT-004` (`Provenance and conflict carriers`).
- Dependency: immutable passing `SWU-APE-ONT-003` receipt.
- Exact mutation scope: one observation-projection schema, three provenance fixture files, and the existing ontology validator.
- Authority/publication: private, internal, `authority_effect: none`.

## Staged delta

- JSON Schema 2020-12 defines four closed provenance carriers: `observed`,
  `derived`, `owner-resolved`, and `unsupported`.
- Every carrier requires an owner route and at least one raw-evidence reference.
  Derived and owner-resolved carriers additionally require derivation and owner
  decision references; unsupported facts require a typed diagnostic reference
  and a null value.
- Projection-level raw-evidence records make fact references resolvable without
  embedding source or diagnostic content.
- Facts distinguish `observation` from `effective-constraint`. Conflicts use the
  canonical tuple `[fact_scope, subject_ref, predicate_ref, scope_ref]` and
  block independently of input order.
- The dependency-free Node fixture checker mirrors the closed schema contract,
  rejects mixed/missing/unresolved carriers, and performs cross-fact checks that
  JSON Schema cannot express.
- The main ontology validator invokes the focused checker as a regression gate.

## Validation

- Pinned runtime: Node `22.13.0`; built-ins only; no network or package change.
- Four positive carriers pass.
- Seven negative cases fail as expected: missing carrier, mixed carrier,
  missing raw reference, missing owner route, unresolved raw reference, and the
  same two-fact conflict in forward and reverse order.
- Repeated focused output is byte-identical with SHA-256
  `f254945f40f0d1d24098c893983f6bd681c2d53b737506f996fd8e6aa782ddfd`.
- Material package, dependency, owner boundary, publication boundary, and
  handoff checks pass.

## Residue and claim boundary

This proves the local schema/fixture contract and deterministic rejection
behavior only. It does not retrofit the older flat TypeScript facts, prove raw
evidence authenticity, validate real adapters, establish an owner decision's
currency, prove language parity, or change canonical authority. Duplicate JSON
object keys remain outside this parsed-object prototype boundary because
`JSON.parse` applies last-key-wins before contract validation.

