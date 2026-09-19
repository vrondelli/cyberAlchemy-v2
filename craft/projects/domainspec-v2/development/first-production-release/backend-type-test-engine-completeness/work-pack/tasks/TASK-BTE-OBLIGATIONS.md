> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md` for the six-catalogue L4 replacement.

# TASK-BTE-OBLIGATIONS — Independent backend obligation catalogue

## Objective

Freeze the expected backend criterion obligations independently from the engine that will derive and execute them. This prevents a generator defect from shrinking both the implementation and its denominator.

## Dependencies and blockers

- Depends on SWU-BTE-002 and SWU-BTE-004.
- Requires a validation owner distinct from the derivation implementation owner.
- The catalogue is formation evidence only; it does not claim semantic, relationship, cross-feature, or code-conformance completeness.

## SWU-BTE-005 — Author and freeze `O_spec`

### Goal

Create a digest-bound, reviewable catalogue containing the exact 16 criterion obligations expected from the approved 13-kind witness.

### Algorithm

1. Read the approved profile, canonical YAML schema digests, and the positive corpus inventory.
2. Emit one stable obligation record per profile-kind/criterion pair with: obligation ID, profile ID/version/digest, meta-type ID, kind, schema path/digest, criterion ID/rule, adapter version, positive fixture, targeted mutant, and execution requirement.
3. Derive IDs from canonical contract identity, never from enumeration order alone.
4. Sort records deterministically and reject duplicates, missing kinds, missing criteria, unbound fixtures, and digest drift.
5. Have the independent validation owner review and freeze the catalogue receipt.
6. Make the engine consume the frozen catalogue read-only for comparison; it must not regenerate and overwrite `O_spec` during validation.

### Edge cases

- Two criteria with the same human label but distinct IDs.
- A schema changes without a profile or catalogue digest refresh.
- A mutant points to the wrong criterion or fails at node-envelope validation.
- A kind has zero criteria or an obligation has no runnable witness.
- The catalogue is empty, duplicated, or generated solely by the engine under test.

### Write scope

- `contracts/backend-obligation-profile.yml` (new contract promoted from this planning package)
- An independent catalogue validator under `impl/tools/minted-project/`
- Direct catalogue tests
- A run-scoped freeze receipt under the existing evidence convention

### Done criteria

- `O_spec` contains the exact 16 expected obligation IDs across the exact 13 kinds.
- Every record binds to an existing positive fixture and targeted mutant.
- Contract, schema, profile, and adapter digests are recorded and verified.
- Independent owner identity and approval time are present in the receipt.
- Empty, stale, duplicate, orphaned, and engine-self-authored catalogues fail closed.

### Validation

```bash
npm --prefix projects/domainspec-v2/impl run tools:test
npm --prefix projects/domainspec-v2/impl run engine:test
npm --prefix projects/domainspec-v2/impl run typecheck
```

### Owner and handoff

- Catalogue owner: backend formation contract owner.
- Independent validation owner: release evidence owner, not the derivation implementer.
- Handoff: provide the immutable catalogue path, digest, and receipt to TASK-BTE-DERIVATION.
