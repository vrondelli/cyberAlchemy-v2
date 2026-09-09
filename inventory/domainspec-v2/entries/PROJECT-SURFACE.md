---
document_id: domainspec-v2-project-surface/v1
status: current
authority_effect: none
visibility: private
updated_at: 2026-08-30
---

# Project Surface

The source tree is a complete private DomainSpec product workspace, not merely an early research folder. It
contains product thesis and guides, authority and definitions, architecture, ontology, research, formalization,
implementation packages, generated profiles, validation, and a large development evidence history.

The exact counts, byte totals, Git state, hashes, and target-layer classifications live in
[`../source-manifest.json`](../source-manifest.json). That machine ledger is the authoritative source for
inventory facts; prose here explains its interpretation.

## Active product spine

- `PRODUCT-THESIS.md` explains the product promise and claim ceiling.
- `ARCHITECTURE.md` defines the language-to-evidence system structure.
- `definitions/` owns DomainSpec-local semantics.
- `ontology/` projects product, system, and implementation knowledge without replacing definitions.
- `architecture/` owns portable profiles and conformance properties.
- `impl/` contains the Node 26 runtime, CLI, generators, profile contracts, and validators.
- `RUNTIME.json` binds the active implementation baseline and exact historical evidence set.

## Historical and working evidence

`development/`, `.craft/`, `research/`, and parts of `formalization/` contain provenance and lifecycle evidence.
Many records bind exact repository paths and digests. They cannot be treated as ordinary files in a bulk move.

## Completeness boundary

“Complete” means every Git-tracked path and every non-ignored untracked path at the captured snapshot. Ignored
dependency caches and generated environment material are intentionally excluded. The ledger also represents
tracked files that are currently deleted, so working-tree omissions cannot disappear from the inventory.

## Open Questions

The selected migration mode must decide which active product surfaces receive successor locations and which
historical evidence remains permanently addressable in place.
