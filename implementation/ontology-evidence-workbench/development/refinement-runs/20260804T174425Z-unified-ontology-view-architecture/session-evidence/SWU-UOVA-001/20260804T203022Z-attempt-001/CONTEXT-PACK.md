# Task Session Context Pack — SWU-UOVA-001

Status: strict coverage passes; mutation remains gated by the current admission receipt.  
Attempt: `20260804T203022Z-attempt-001`.

## Selected behavior

Compile one versioned, digest-bound source graph into renderer-independent exact-ID indexes and ID-sorted records. Preserve graph-level and row-level source digests, source/evidence references, authority, ordered endpoints, exact predicates, direction, mapping status, and distinct parallel relation IDs. Reject unsupported envelopes, stale digests, duplicate IDs, invalid authority, and dangling endpoints.

## Exact mutation partition

- Material writes: `src/oew/scene/sourceGraph.ts` and `test/source-graph-normalization.test.mjs`.
- Execution output: this attempt's terminal `receipt.json` only.
- Both product baselines are absent.
- No dependency, renderer, visual component, ontology, Body War output, public Arcanum, network, deployment, promotion, release, or Git publication effect is admitted.

## Validation

The admitted validation surface is the focused Node test, the complete OEW root `npm test` regression, and scoped `git diff --check`. All are acceptance-critical. The focused test uses a data-URL bridge because pinned Node 22.12 cannot directly import `.ts`; the source remains JavaScript-compatible TypeScript with no runtime dependency.

## Closeout

A passing terminal receipt may synchronize only the declared SWU manifest, task, W1 wave, and Work Pack status targets, then select `SWU-UOVA-002`. A failed validation retains `SWU-UOVA-001`. Full-bundle parallel-edge compatibility in the older `validateOewBundle()` path is recorded as later integration residue and is not silently absorbed into this unit.
