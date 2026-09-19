# Invoke Design Result

## Outcome Brief

The design candidate connects specification and ontology without merging their owners. In plain terms, the ontology is the shared map, while specification is one governed branch on that map. A formal claim can say which business meaning it formalizes; a proof obligation can say which formal claim it was derived from; system evidence can point at the exact subject it evaluates. None of those links silently proves, discharges, promotes, or transfers authority.

Result: `design-validator-pass` with protected continuation blocked.

The smallest coherent candidate contains four owner-local branches:

- business meaning;
- formal claims and specification;
- proof bridge;
- system evidence.

It selects only two candidate semantic relations:

- `FormalClaim --formalizes--> BusinessMeaning`;
- `ProofObligation --derived_from--> FormalClaim`.

The `formalizes` edge becomes eligible only when the formal-claims owner accepts the exact assertion and the business owner accepts fidelity to the exact business meaning. These are two different keys over the same bytes, not shared ownership. `formal-claims-owner` is an explicit per-claim role under the existing primary-source authority route, not a new authority kind.

## Boundary and Next Decision

This run produced a validated architecture contract and an exact owner-sliced acceptance package. It did not materialize executable schemas, implement or run validators, send owner requests, receive owner acceptance, modify canonical catalogs, migrate records, promote, publish, stage, commit, or push.

The next route is not Invoke Plan yet. The recommended protected continuation is a fresh `invoke:design-hardening-and-owner-admission` authorization that:

1. materializes exact role, node, relation, receipt, manifest, catalog, projection, validator, and lifecycle schemas;
2. creates and executes the fixed positive and twelve-class negative validation corpus;
3. regenerates the acceptance-bound inventory and digests over those exact bytes;
4. routes owner-specific requests and records current exact receipts;
5. admits or rejects the candidate before deciding whether planning is allowed.

## Technical Details / Invoke Result

The architecture is recorded in `design/ARCHITECTURE.md`; machine-readable contracts are in `design/CANDIDATE-CONTRACTS.json`. The acceptance package manifest digest is `05eb47c790f764795825fd6cf951521bb3a4f73ed75a799c334d662703dbba6a`, binding package content digest `58c3c2274ce02bcb8b903e416c7bb84740d40f9e8735e84808e6ad39bb97d7ef`.

The validation order is owner-local and fail-closed: eleven ordered stages preserve `pass`, `fail`, `block`, and `indeterminate-error`, and a later success cannot mask an earlier failure. The fixed negative corpus covers twelve distinct failure classes. Integrated machine and human projections are derived views with `authority_effect: none`; canonical records remain in owner-local catalogs.

Run status: completed. Consequential continuation status: blocked pending fresh authorization, exact schema/validator evidence, and protected owner admission.
