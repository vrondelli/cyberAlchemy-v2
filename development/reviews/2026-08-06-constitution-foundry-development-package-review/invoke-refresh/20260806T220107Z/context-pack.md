# Context Pack: Constitution Foundry Invoke Refresh

- Mode: deep, strict, runtime handoff
- Activation: direct-user
- Mutation mode: apply-approved
- Approved target inventory: 27 existing private/internal workflow artifacts
- Obligation coverage: 12/12 findings, 100%
- Inventory lookup: ready, discovery-only, non-authoritative

The sole source of repair authority is the independently verified review in `findings.md`, bound by its SHA-256 in `source-evidence/direct-user-refresh.json`. Target selectors and obligation mappings are recorded in `context-pack.json`.

## Runtime constraints

1. Stage changes outside the target root first.
2. The normalized approved scope, material-package changes, and target inventory must be exactly equal.
3. Preserve all 36 KEEP artifacts byte-for-byte.
4. Apply only after material-package validation and Refresh handoff both pass.
5. Do not execute Task Session, Mint, solvers, owner decisions, authority changes, promotion, publication, release, or deployment.

## Covered obligations

`O-CF-REF-001`, `002`, `003`, `004`, `005`, `006`, `007`, `008`, `009`, `012`, `013`, and `014` map one-to-one to the twelve surviving review findings.

## Excluded evidence

Inventory matches are orientation leads only. Historical packages, implementation sources, authority records, Arcanum sources, and the two verifier-refuted task-splitting candidates are excluded from repair authority.

