# Canonical Semantic Bytes and Projection Decision

Status: canonical input/projection boundary selected; exact contracts pending
Authority effect: none
Implementation effect: none
Promotion effect: none
Parent architecture: `A-one-semantic-graph-owned-branches`
Provenance binding: `A-hybrid-exact-edge-and-context-manifest`
Decision ID: `DEC-DSV2-CANONICAL-BYTES-PROJECTIONS-001`

## Recorded selection

- Selected option: `A-branch-canonical-catalogs-generated-integrated-graph`
- Selected by: direct user selection (`A`)
- Selected at: `2026-08-23T19:05:04+01:00`
- Canonical inputs: owner-local business, formal-claims/specification,
  proof-bridge, and system-evidence catalogs plus their owner-adopted schemas
  and relation records.
- Cross-branch assertions: each relation remains canonical in the catalog of
  the narrowest owner making the assertion; shared storage does not transfer
  semantic authority.
- Generated outputs: integrated graph, indexes, crosswalks, query views, and
  human pages are deterministic projections over exact admitted inputs.
- Projection boundary: every output binds generator identity/version/digest,
  exact input catalog and policy digests, output digest, freshness, and a visible
  `authority_effect: none` claim ceiling. A projection cannot become semantic
  input, owner acceptance, discharge, or promotion by being fresh or useful.
- Decision effect: canonicality and generation design selected only. No catalog,
  compiler, projection, adoption, migration, or promotion is created here.

## Decision question

Which bytes are canonical semantic inputs, and which bytes are generated views
of the connected specification ontology?

## Clarification

“One semantic graph” describes one connected logical model with stable typed
identities and relations. It does not require one file or one authority owner.
Cross-branch relation records remain canonical under their narrowest legitimate
owner: for example, the formal-claims branch owns the formalization assertion,
while validation-governance owns the obligation derivation assertion.

## Options

### A — Branch-owned canonical catalogs; generated integrated graph (recommended)

Keep business meanings, formal claims/specification composition, proof-bridge
records, and system evidence in owner-local canonical catalogs governed by a
shared shape-only ontology contract. Store each cross-branch relation in its
assertion owner's catalog. Deterministically compile their exact admitted
versions into an integrated machine graph, indexes, crosswalks, query views,
and human documentation. All compiled outputs carry generator identity/version/
digest, exact input catalog digests, policy bindings, output digest, freshness,
and a visible `authority_effect: none` claim ceiling.

Benefit: one navigable graph without collapsing branch ownership or creating a
second semantic authority. Cost/risk: every consumer needing the integrated
view depends on reproducible compilation and freshness validation. Choose it
when semantic ownership must remain local but graph traversal must be unified.

### B — One canonical integrated graph with branch ownership fields

Store every node and edge in one canonical graph artifact. Preserve branch and
owner fields on each record, and generate owner-specific and human views from
that file.

Benefit: one direct source for queries and no compilation seam. Cost/risk: the
graph file becomes a shared promotion and mutation surface; owner fields alone
do not prevent one writer or release gate from becoming de facto authority over
other branches. Choose it only if all branch owners accept a single atomic
authority and change-control protocol.

### C — Both branch catalogs and integrated graph are canonical

Treat branch-owned catalogs and the integrated graph snapshot as two canonical
layers, requiring digest-locked two-phase updates and conflict resolution.

Benefit: branch autonomy plus a canonical query snapshot. Cost/risk: creates
split-brain potential, dual promotion acts, and recovery complexity whenever
one side advances without the other. Choose it only when a canonical snapshot
is an external system requirement and atomic multi-owner updates are feasible.

### D — Defer

Keep the eight prior selections recorded and do not choose canonical storage or
projection behavior.

### E — Stop

Preserve the selected architecture and provenance contract as non-executed
decisions and stop this design route.

## Standing context option

`Explain / more context` does not select an option. It requests aligned low-,
medium-, and complex-example comparisons, after which this same decision will
be presented again.

## Current gate state

- Result: `PASS` for canonical-boundary selection; parent route remains `BLOCK`
- Selected option: `A-branch-canonical-catalogs-generated-integrated-graph`
- Remaining local blocker: exact catalog/projection contracts and owner admission
- Next parent blocker: validator ownership, aggregation, and negative controls
- Protected owner admission: every branch semantic owner, ontology-protocol and
  relationship owners, and the projection owner must accept the exact contract
- Consequential product bytes changed: 0
- Override: not requested
