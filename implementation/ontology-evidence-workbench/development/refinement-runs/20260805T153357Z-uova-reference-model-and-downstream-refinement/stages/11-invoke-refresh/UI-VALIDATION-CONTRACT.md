# UI Validation Contract

## Structural witnesses

- `UI-API-INVENTORY.json` parses as JSON.
- Contract groups contain 19 + 36 + 1 + 2 = 58 unique IDs.
- Declared counts equal 52 UI instances plus six Mapping specializations.
- `canonically_active` is false and `authority_effect` is `none`.
- Adapter and general State Indicator counts are zero.
- Every contract has exactly one `realization_swu` and one conformance
  disposition; allowed SWUs are UOVARR-005, 006, 007, and 009.
- No runtime owner, import, or snapshot path begins with
  `projects/domainspec-v2/`.

## Semantic witnesses

- Relation, Portal, Path, Inspector, and relation-bearing Index View Models carry
  `RelationRef` and `relation_digest`.
- Altering predicate, evidence, cue, endpoint, direction, or authority display data
  without changing the digest is rejected.
- Stale scene and missing relation references fail closed without tuple fallback.
- Geometry contains no predicate, evidence, mapping-loss, or authority fields.
- Static output remains meaningful with null color and pattern cues.
- A Component cannot acquire domain, validation, access, or ontology authority.
- A Guard mirrors an admitted Rule and cannot become decision authority.

## Profile witnesses

The current DomainSpec development profile must pass its owner validator:

```bash
cd projects/domainspec-v2/impl
./node_modules/.bin/tsx tools/validate-ui-profile.ts \
  --profile spec/ui-profile/profile.yml \
  --fixtures spec/ui-profile/fixtures/create-player
```

The minted profile, registry, and profile source digests must remain equal to the
bindings in `UI-API-INVENTORY.json`. Drift blocks conformance until this refresh is
reissued.

## Package witnesses

```bash
jq empty stages/11-invoke-refresh/*.json
node stages/11-invoke-refresh/validate-ui-inventory.mjs
git diff --check -- stages/11-invoke-refresh
```

The inventory validator is a UOVARR-005 implementation output, not an artifact
authored by this refresh. Until it exists and passes, the 58-contract denominator
is planned rather than proven.
