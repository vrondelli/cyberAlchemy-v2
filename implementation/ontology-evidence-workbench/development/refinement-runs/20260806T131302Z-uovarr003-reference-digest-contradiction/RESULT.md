# Refine Result — UOVARR-003 Digest/Reference Repair

Status: `complete` as candidate design and non-executed work-pack evidence
Run: `20260806T131302Z-uovarr003-reference-digest-contradiction`
Authority effect: none

## Outcome

The current v1.2 scene/reference contract is definitively inconsistent for non-empty reference-bearing structures. It can finalize and admit a scene whose portal, Path, and navigation references all immediately resolve as `stale-scene`.

The selected repair is a versioned v1.3 validated embedded back-reference model:

```text
draft fields + relation locators
  -> semantic basis
  -> scene revision R
  -> construct final immutable scene with R-bound references
  -> admission recomputes R, validates every copy, and resolves every ID
```

This removes the fixed point without dropping semantic integrity. Only exact schema-declared revision-copy values are excluded; relation IDs, traversal/local fields, and unknown extension fields remain hashed.

## Evidence

- Two independent read-only analyses joined: content-addressing and downstream compatibility.
- The design includes a dependency DAG, field/hash ownership matrix, six architecture views, v1.3 draft/final repair schema, migration/downstream map, and validation contract.
- The executable toy game passes 11/11 fixtures and reproduces the rejected v1.2 failure.
- External research was unnecessary; current local sources directly decide the contract.

## Work pack

`stages/09-invoke-plan/WORK-PACK.md` replaces the unsafe portal-first route with:

1. `UOVARRD-001` — v1.3 relation-reference core and full schemas;
2. `UOVARRD-002` — non-empty legacy reference migration/rejection;
3. `UOVARRD-003` — grouped portals compiled as locators before one finalization.

After those close, the original Path/navigation/static/Body War/acceptance units must be rebased through Invoke Refresh.

## Current blocker boundary

Do not resume the old UOVARR-003 material package. Its target inventory cannot modify the digest owner (`relationReference.ts` and schemas). The new work pack is not mutation-ready until Invoke Refresh emits fresh live baselines, semantic/material packages, validation, and closeout for UOVARRD-001.

## Next route

`$invoke refresh apply-approved` selecting `UOVARRD-001` from `stages/09-invoke-plan/WORK-PACK.md`.

## Claim ceiling

This result proves candidate architecture coherence and planning completeness only. It does not prove product implementation, schema promotion, migration, full regression, Body War behavior, browser acceptance, deployment, release, or production readiness.
