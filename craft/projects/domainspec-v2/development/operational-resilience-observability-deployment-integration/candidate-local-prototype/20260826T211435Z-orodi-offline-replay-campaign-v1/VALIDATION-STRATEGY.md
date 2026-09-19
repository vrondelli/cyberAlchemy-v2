# Validation Strategy: ORODI WP7 Offline Replay Campaign

## Acceptance-critical surfaces

1. Contract closure: strict TypeScript plus closed Draft 2020-12 fixture/result schemas.
2. Source parity: all pinned WP6 sources rehash exactly before mutation.
3. Golden composition: exactly three campaigns cover two-through-seven items and all seven families.
4. Permutation invariance: original, reversed, and fixed-shuffled full campaigns emit byte-identical canonical results.
5. Hostile closure: exactly 25 unique hostile IDs map one-to-one to required discriminator codes.
6. Atomic rejection: every rejected campaign has empty item, observation, eligibility-receipt, and per-binding-derived projections.
7. Eligibility ceiling: every accepted item remains replay-only; aggregate admitted observations and eligible controls remain empty.
8. Binding isolation: every derived result remains attached to one exact binding/replay pair; no aggregate derived result exists.
9. Purity: inputs remain byte/object identical and repeated calls emit byte-identical JSON.
10. Static safety: no filesystem, process, network, dynamic code, discovery, ambient clock, or external handle surface.
11. Regression: complete WP1-WP6 operational-resilience suite remains green.
12. Manifest hygiene: exact nine-path parity, baseline freeze, package/lockfile parity, JSON parse, schema replay, whitespace, regular-file, symlink, newline, conflict-marker, and digest checks.

## Commands

Run from `projects/domainspec-v2/impl`:

```bash
PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH npm exec -- tsc --project operational-resilience/tsconfig.json --noEmit
PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH node --import tsx --test operational-resilience/test/*.test.ts
PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH node --import tsx --test operational-resilience/test/tool-evidence-replay-campaign.test.ts
find operational-resilience/contracts operational-resilience/fixtures/tool-evidence-replay-campaign -type f -name '*.json' -print0 | xargs -0 -n1 jq empty
```

Validate each emitted campaign result with:

```bash
python3 -m jsonschema -i <result.json> operational-resilience/contracts/tool-evidence-replay-campaign-result.schema.json
```

Run the exact forbidden-surface and manifest commands from `WORK-PACK.md` without weakening their patterns.

## Failure policy

Any failed acceptance-critical check blocks closeout. A later passing retry must be recorded as a new attempt and cannot erase the first failure. No test outcome authorizes live tools, infrastructure, deployment, runtime admission, lifecycle reconciliation, publication, release, or production claims.
