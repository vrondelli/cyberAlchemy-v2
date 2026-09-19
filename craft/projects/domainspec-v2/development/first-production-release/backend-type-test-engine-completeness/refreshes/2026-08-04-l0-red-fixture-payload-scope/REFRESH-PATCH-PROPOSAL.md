---
artifact: bte-l0-red-fixture-payload-scope-proposal
status: approved
updatedAt: 2026-08-04
semanticAuthority: none
---

# Refresh Patch Proposal — L0 RED Fixture Payload Scope

## Approval

The user approved the recommended package-local scope after the independent
validation owner proved that a manifest and freeze receipt alone cannot contain
or truthfully reference executable RED bytes.

## Exact delta

1. Preserve all current L0A contract and receipt bytes.
2. Authorize the independent validation owner to create
   `validation-inputs/l0/fixtures/*.json` and
   `validation-inputs/l0/topology/*` before the manifest and freeze.
3. Bind regular files by exact bytes and symbolic links by no-follow `readlink`
   bytes; never traverse an escaping link.
4. Define one stable validation-owner identity, canonical digest rule, and
   `domainspec-v2-bte` package-root mapping.
5. Require at least one causally isolated RED case for each of the 25 closed
   diagnostics, explicitly adding `BTE_SCHEMA_INVALID`.
6. Correct the stale transport report so it exposes no L0A candidate and routes
   the independent owner.
7. Keep `candidateSWU=none`, `selectedSWU=none`, and L0B owner-gated.

## Target inventory

- `WORK-PACK.md`
- `EXECUTION-PACK.md`
- `IMPLEMENTATION-LAYERING.md`
- `transport-report.json`
- `work-pack/shared/DECISIONS.md`
- `work-pack/shared/GAPS.md`
- `work-pack/shared/TRACEABILITY.md`
- `work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md`
- `work-pack/waves/W1B-L0-VALIDATION-EXECUTION.md`

## Boundary

No validation input, implementation, historical receipt, Craft, Inventory,
roadmap, UI, admission, release, production, Git, or public Arcanum mutation is
part of this apply.
