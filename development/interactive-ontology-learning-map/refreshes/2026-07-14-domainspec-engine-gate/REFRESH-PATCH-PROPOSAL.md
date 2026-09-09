---
artifact: invoke-refresh-patch-proposal
mutationMode: apply-approved
status: applied
date: 2026-07-14
---

# Refresh Patch Proposal — DomainSpec `Sg` Consumer Boundary

The user approved this patch and its planning changes are applied. The original
proposal is retained below as decision evidence; application did not change
DomainSpec FPR state or grant the learning map graph authority.

## Proposed Invariant

> For DomainSpec material, semantic nodes and admitted semantic relations enter
> the learning map only through an exact owner-produced `FPR-04` `Sg` handle.
> The learning map may create separately typed learning, navigation, layout,
> search, and presentation projections. It may retain rejected or incompatible
> mappings as residue. It may not create a replacement DomainSpec relation,
> lifecycle ID, evidence authority, or gap owner.

## Proposed Gate Model

```text
external DomainSpec owner route
  guard restored
    -> FPR-01 authority baseline receipt
      -> FPR-02 supported profile receipt
        -> FPR-03 precedence/direction receipt
          -> FPR-04 two-node/one-edge Sg + quotient/retraction receipt
                                                       \
G-OWNER projection contract receipt ------------------ AND
                                                         -> IOLM contract/witness mutation
```

G-OWNER and the FPR chain are independent authorities. Neither substitutes for
the other. The plan may verify their receipts but cannot set their statuses.

## File-Level Proposal

### `CONTEXT.md`

- Add the engine findings and Inventory entry as new selected evidence.
- Add `O-11`: DomainSpec semantic records/relations are imported from the exact
  owner-produced `Sg`; local reconstruction is forbidden.
- Add the upstream FPR receipts to preserved unknowns/blockers.

### `SPEC.md`

- Add `G-DSV2-SG` with status `BLOCKED`.
- Add acceptance criteria that bind the exact input graph identity, profile,
  source manifest, quotient receipt, and retraction receipt.
- Amend W-01: the AEO scenario traverses the bounded `Sg` and retains invalid
  mappings as attempted-relation residue.
- State that projection schemas may type view records, but may not redefine the
  DomainSpec node/relationship authority carried by `Sg`.

### `ARCHITECTURE-BUNDLE.md`

- Add a `DomainSpec Sg adapter` component that verifies and imports an immutable
  FPR-04 graph handle.
- Keep source adapters for Arcanum, Craft, and CAV2 documentary material, but do
  not use feature SPEC parsing to reconstruct DomainSpec semantic relations.
- Rename “canonical semantic build” to “source-preserving projection build.”
  `canonical` is local byte determinism, never DomainSpec canonical authority.
- Separate imported semantic edges from learning/navigation/layout edges in
  storage, APIs, hashes, validators, and UI legends.

### `INVOKE-PLAN.md`

- Replace “blocked solely because no projection owner” with “blocked by
  G-OWNER and the external guard/FPR receipt chain.”
- Preserve `decision-gate` as a permissible non-mutating G-OWNER preparation,
  but make the mutation handoff `deferred` until `G-DSV2-SG` also passes.

### `IMPLEMENTATION-LAYERING.md`

- Insert an external readiness boundary before L0 mutation.
- Define the first L0 working unit as import-contract validation over the exact
  `Sg` skeleton plus discriminating failure fixtures.
- Forbid schema freeze or local DomainSpec relation fixtures before FPR-01..04
  owner receipts exist.

### `WORK-PACK.md` And `EXECUTION-PACK.md`

- Add a non-mutating upstream-readiness slice and SWU whose output is a receipt
  bundle/handle, not an FPR status change.
- Add blockers projected from the existing owners:
  - live retired-reference guard;
  - `FPR-01` authority baseline;
  - `FPR-02` supported profile;
  - `FPR-03` precedence/direction;
  - `FPR-04` bounded graph, quotient, and retraction.
- Make contract, compiler, and witness SWUs depend on both G-OWNER and the
  upstream readiness handle.
- Add stop conditions for empty-success input, unapproved edge mapping, failed
  retraction, missing graph identity, and attempts to promote projection data.

### `TASK-IOLM-000-OWNER.md`

- Add an explicit decision clause: the projection owner cannot approve
  DomainSpec meanings, relations, profile admission, precedence, FPR closure,
  or graph conformance.

### Proposed `TASK-IOLM-000B-DOMAINSPEC-SG-READINESS.md`

- Purpose: verify external owner receipts and return the exact bounded `Sg`
  handle.
- Write scope: IOLM run/session evidence only.
- Must not edit DomainSpec FPR artifacts or close any FPR node.
- Acceptance: exact FPR-01/02/03 receipts, restored guard evidence, schema-valid
  two-node/one-edge `Sg`, explicit `Sg -> G`, independent retraction result, and
  source/profile identifiers.
- Handoff: block on any missing/failed receipt; otherwise enable the IOLM import
  contract task.

### `TASK-IOLM-001-CONTRACT.md`

- Require G-OWNER plus the upstream readiness handle.
- Specify imported-graph and derived-view schemas. Do not create an alternative
  DomainSpec node/relationship registry.
- Add negative fixtures for missing/empty input and graph/profile mismatch.

### `TASK-IOLM-002-COMPILER.md`

- Change the DomainSpec path from source parsing to exact `Sg` import and
  validation.
- Allow derived view edges only in separately typed namespaces.
- Preserve imported semantic bytes/identity and make learning/navigation/layout
  changes unable to alter them.
- Route incompatible local labels/mappings to residue, never to semantic export.

### `TASK-IOLM-003-WITNESSES.md`

- Replace direct AEO table reconstruction with traversal of the FPR-04 walking
  skeleton.
- Exercise:
  - `EGI-008`: missing/empty required input cannot return success;
  - `EGI-010`: unapproved local edge mapping remains residue;
  - `EGI-011`: mutated node, field, direction, edge, or quotient fails
    `Sg -> G -> Sg_canonical` comparison.
- Route all residue to existing `FPR-04`, `FPR-05`, or `FPR-07` owners.

### `cross-task-gaps.md`, `DISPATCH.json`, And `DISTILL-VALIDATION.md`

- Project upstream blockers with their existing owner IDs; do not prefix or
  replace them with local lifecycle identities.
- Add an upstream receipt handoff and authority boundary to the dispatch.
- Re-run Dispatch Spec validation after patching.
- Re-run Distill because the first coherent unit changes from local schema
  authoring to imported-graph contract validation.

## Proposed Acceptance Checks For Apply-Approved Refresh

1. Every applied line maps to `RFS-001..007`.
2. No source under `projects/domainspec-v2/`, `arcanum/`, or CAV2 authority is
   changed by the refresh.
3. Target links and JSON parse.
4. Full `DISPATCH.json` passes the repository validator.
5. Distill returns pass, or flag with named owner/repair paths.
6. Search finds no remaining “solely G-OWNER” mutation claim.
7. Search finds no DomainSpec path that reconstructs admitted semantic
   relations from feature SPEC tables.
8. Work-pack remains blocked and all task statuses remain not-started.

## Apply Receipt

- Approval: explicit user instruction, `apply approved`.
- Applied scope: 22 private learning-map planning, task, shared, wave, dispatch, and validation artifacts listed in `REFRESH-REPORT.md` and `refresh-report.json`.
- Main Dispatch Spec: pass, zero blocks and zero flags.
- Distill validate: pass for structural coherence only.
- Preserved boundaries: no DomainSpec/CAV2 authority, public Arcanum, Craft source, or prototype implementation mutation.
- Remaining gates: G-OWNER and G-DSV2-SG are open; the next mutation route remains deferred.
