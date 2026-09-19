# Lean Context Pack — SWU-MNP-003

Session evidence, not canonical authority.

- Task: `SWU-MNP-003` formation, edge, and graph compiler.
- Coverage: `8/9`; strict coverage: `BLOCK`.
- Runtime: local; adapter and subagents: none.
- Blocker: no canonical mapping exists from meta-type criterion schemas to the
  minted JSON node `body`.

## Covered Obligations

1. Safe ordered source discovery — SWU-MNP-002 receipt/resolver.
2. Supported profile and registry digest binding — `supported-profiles.yml`.
3. Unique node and edge indexing — task algorithm and graph schema.
4. Source-owned connection lifting — node/connection schemas.
5. Active exact relationship signatures — profile plus relationship authority.
6. Deterministic graph/source-manifest form — expected Key/Door projections.
7. Total graph-ID provenance — source-manifest contract.
8. Write scope and validation surface — task/work-pack.

## Uncovered Obligation

9. Formation validation over JSON node bodies. The canonical schemas define
   table-oriented criteria. Operation, Rule, and Event have apparent flat-key
   correspondences, but Entity requires both typedness and identity while the
   approved fixture provides only `identity_fields`. No machine mapping or
   per-kind body schema exists in `impl/` or `definitions/`.

## Gate

Decision artifact:
`projects/domainspec-v2/authority/decisions/2026-07-14-minted-node-body-formation-contract.md`.
No compiler mutation is authorized until one real option is selected.
