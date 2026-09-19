# ORODI WP7 candidate-local implementation report

## Outcome

`WP-ORODI-007` passed its exact W0 -> W1 -> W2 candidate-local frontier. The implementation composes two through seven independently replayed WP6 items into a deterministic audit campaign, preserves one derived-result partition per binding, rejects atomically, and cannot admit evidence or produce an aggregate derived control result.

This report is candidate-local execution evidence only. It does not update Craft, Invoke, ontology, lifecycle, runtime, infrastructure, deployment, publication, release, or production state.

## Accepted identity

- Work Pack SHA-256: `a94e681ba939ef234b801f76de0933d3d38316dee66fc42eaec54585c20ef914`
- Nine-path manifest SHA-256: `258a8578c79d7ba4f065eec7f5fe9927aa24c3ff153e2f9884b9f40b27aa359b`
- Planning-artifact manifest SHA-256: `c994d90c9e689a4919c9807bd1be8ce1e07b36fced2c14fe1cce7e6d8cbb89df`
- Final product-digest inventory SHA-256: `c19e1e4b476c1fed67d9936addbb4b69bc894c49271fc06dcff4bf4b0884d219`
- Owner admission: exact candidate accepted and implementation explicitly authorized in the current task.

All 18 planning-manifest entries and all 13 pinned source hashes revalidated before product mutation. The eight create targets were absent. The pre-existing operational-resilience baseline contains 123 non-README files.

## Handoff precondition

- Locator: `HN-F92D4A1A3838`
- Notice digest: `f92d4a1a38387e2cc844f19386b9c2cd70d3b5ad08143a1206f324c2174d1fc6`
- Publish: pass
- Exact resolve/join: pass
- Final inspect: pass
- Transport: local-only
- Remote availability: unverified
- Status: open for deferred lifecycle owner review
- Authority: communication evidence only; grants no permission

The notice was published and joined before the first product mutation.

## Product output

The exact nine-path final digest inventory is `FINAL-WP7-PRODUCT-DIGESTS.sha256`:

| Layer | Paths | Result |
| --- | ---: | --- |
| W0 contracts and schemas | 3 | pass |
| W1 pure composer | 1 | pass |
| W2 fixtures, test, README | 5 | pass |

Created/modified parity: eight declared create paths exist and the one declared README path contains exactly one additive `## Offline replay campaigns (candidate-local)` section. The README prefix before that section hashes to the accepted pre-edit digest `85098eee...034`.

## Behavior proven

- The API recomputes every structurally valid item through unchanged `replayToolEvidenceProfile`.
- Supplied result bytes require valid UTF-8 JSON, no duplicate keys, an exact caller digest, and semantic parity with recomputation.
- Campaign input order is non-semantic; original, reverse, fixed shuffle, and double run are byte-identical.
- Accepted outputs contain replay-only item receipts, simulation observations, eligibility receipts, and labeled per-binding derived partitions.
- Any finding returns `rejected` with all item, observation, eligibility, and derived projections empty.
- Output values are deeply immutable.
- No aggregate derived result exists.

## Final validation

| Check | Command or surface | Exit | Evidence |
| --- | --- | ---: | --- |
| TypeScript | `npm exec -- tsc --project operational-resilience/tsconfig.json --noEmit` | 0 | pass |
| Focused WP7 | `node --import tsx --test operational-resilience/test/tool-evidence-replay-campaign.test.ts` | 0 | 5/5 pass |
| Full regression | `node --import tsx --test operational-resilience/test/*.test.ts` | 0 | 161/161 pass |
| JSON parse | accepted `find ... | xargs jq empty` surface | 0 | pass |
| Fixture schema | Python `jsonschema` through focused test | 0 | 1 instance pass |
| Result schema | Python `jsonschema` through focused test | 0 | 28 emitted instances pass |
| Corpus parity | focused test and independent boundary check | 0 | 3 golden, 25 hostile, unique and one-to-one |
| Purity scan | accepted forbidden-surface `rg` expression | 0 | zero matches |
| Frozen baseline | `sha256sum -c PRE-IMPLEMENTATION-BASELINE.sha256` | 0 | 123/123 pass |
| Exact boundary | independent current-file/manifest/baseline comparison | 0 | 9 product paths, 132 total current files |
| Package boundary | explicit SHA-256 | 0 | package, lockfile, tsconfig unchanged |
| File hygiene | independent all-nine byte scan | 0 | regular, non-symlink, non-empty, newline, no conflict/trailing whitespace |
| Git diff check | accepted manifest-scoped command | 0 | pass; independent byte scan also covered untracked prototype files |
| Planning integrity | `sha256sum -c WP7-PLANNING-ARTIFACT-MANIFEST.sha256` | 0 | 18/18 pass |
| Handoff integrity | `handoff_notice.py inspect HN-F92D4A1A3838` | 0 | digest, index, Markdown parity, authority pass |

The package and configuration digests remain:

- `tsconfig.json`: `e9c97ceb1dd78bb317e82d20c717e24d0d011b66c0ca322fa674e7676b6c1190`
- `package.json`: `0cb21aa8116166073844207ad0cf8820ce6d9f4e4bba559f657567d446cb238f`
- `package-lock.json`: `12d5dc3b41e490983bd413f91184de88bf0aabd2a7a0de704ff93538889be298`

## Attempt history retained

Final success does not mask earlier failures:

1. The initial W2 compile failed on a test-only optional-field narrowing (`TS2345`); an explicit guard fixed it.
2. Focused proof attempt 1 passed 4/5 and exposed unfrozen finding objects in rejected output; SWU-002 was reopened for a bounded deep-freeze recovery.
3. Attempt 2 passed 4/5 and showed the duplicate-observation hostile builder had changed the replay identity; the test transformation was corrected.
4. Attempt 3 passed 4/5 and showed locale-sensitive test ordering differed from deterministic binary ordering; the comparator was aligned and absent-eligibility noise was removed.
5. The final focused proof passed 5/5, then the full regression passed 161/161.

Two earlier host-side script-encoding attempts failed before any W0 assertion ran because the orchestration isolate lacked browser-style encoding globals. The shell-neutral harness then ran the declared W0 checks successfully. These were harness invocation errors, not product test results.

## Claim ceiling

This candidate explicitly denies all of the following:

- live tool execution or source authenticity;
- monitoring coverage, load behavior, fault behavior, or live canary analysis;
- infrastructure validity or infrastructure mutation;
- deployment, rollback, or protected effects;
- runtime admission or eligible aggregate controls;
- merged cross-binding control derivation;
- ontology/profile promotion or lifecycle reconciliation;
- Git publication, external transport, release readiness, production readiness, or production truth.

`runtime_admission` remains `denied`, `referent_trust` remains `unverified`, `authority_effect` remains `none`, and lifecycle reconciliation remains deferred.

## Next route

The only successor is deferred owner review of the exact implementation bytes and this evidence. That route grants no lifecycle, runtime, infrastructure, deployment, release, or publication authority unless separately authorized.
