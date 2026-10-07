# Historical poker-team corpus import candidate

## Purpose

Restore the TDE seven-feature parser/round-trip regression in this standalone
checkout without a runtime or validation dependency on `../domainspec-core`.
This is a historical test fixture, not an active application source or a new
DomainSpec authority.

## Exact source and scope

- Source: `https://github.com/vrondelli/poker-team.git` at Git commit
  `6c990537662dca7abe3f77f3aff35ae897db2bf6`, also the recorded
  `validation/poker-team` gitlink in the sibling checkout.
- Selected features: `financial-settlement`, `player-onboarding`,
  `auth-access-control`, `player-makeup`, `player-management`,
  `player-progression`, and `player-stats`.
- Selected files per feature: `states.md`, `operations.md`, `interfaces.md`,
  `events.md`, `workflows.md`, `queries.md`, `mappings.md`, `domain.md`, and
  `TEST-SPEC.md` (63 regular files total). The pinned source has no
  `rules.md`; the parser treats it as optional. `SPEC.md` is not selected
  because the parser uses it only when no aspect file exists.
- Destination:
  `craft/projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/poker-team-corpus/docs/features/`.
  No active `craft/validation/poker-team` tree is created.

## Gates and validation

1. Verify the fetched source's exact commit and all 63 source files before
   copying. Preserve their bytes. Generate a sorted manifest with path,
   SHA-256, size and Git blob ID for each source file.
2. Pin the manifest's SHA-256 independently in the verifier. Before any
   module-level corpus parse, reject a changed manifest, missing or changed
   file, symlink, extra file, or unexpected feature/file denominator.
3. Change only the historical corpus path in `src/index.test.ts`; keep its
   seven-feature semantic assertions and the separate financial-settlement
   development fixture unchanged.
4. Test byte edit, deletion, extra file and symlink rejection; run the full
   index suite, TDE typecheck, and broad TDE suite. A green imported corpus
   proves historical regression replay only, not current application behavior.

## Separate residue

The five P4/R4 suite-load failures need a distinct backend-source import and
dependency review. Do not point them silently at this documentation fixture
or the candidate-local standalone rule slices.

## Open Questions

- Which minimal historical backend closure and dependency lock will support
  a separate P4/R4 replay without making staged provenance current runtime?
