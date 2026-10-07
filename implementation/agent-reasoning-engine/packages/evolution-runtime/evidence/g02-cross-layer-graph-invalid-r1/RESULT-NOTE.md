# G02 graph task: source-unbound, unscored pair

The one-command G02 driver ran both arms on NodeBB task `ac8400d9` (requesting a new `DirectedGraph` class refactor of `LinkProvider`) at the pinned base commit. ARE completed in 85.06 seconds and 15,247 known model tokens but returned `no_context_selected`; DSH completed in 108.85 seconds and 74,494 known tokens with a selection. **No matched native quality score or four-gate decision exists** because ARE had no final context selection. The driver stopped before opening gold. The VPS receipt root is `/opt/are-benchmark-runs/g02-cross-layer-graph-r1`; `FREEZE.json` SHA-256 is `75a33176273a7bf2d2a9d7dcd9c6311aefb8119e761be4fdac0cc0b68ec285de`.

The ARE initial packet followed the word “graph” into dashboard chart code and a user schema. Its terminal summary explicitly found no relevant base evidence. A read-only search of the pinned source found neither `LinkProvider` nor `DirectedGraph`; the task's named existing component appears unbound to this repository revision. This is a **source-only task-eligibility warning**, not proof that the candidate loses accuracy. The DSH output is preserved but intentionally unscored for a pair claim. ARE `RESULTS.json` SHA-256 is `ab9b0d2a19bdd49c93f52e7df020e780b391dd97c8c67614096005cd39dde40a`; the DSH export receipt is `3bcbbbb10bfe572e5bf1c1da78698477af148b42c3000e25b0d6a5aeb1795e42`.

The driver has been changed for future tasks to record a pre-dispatch source-binding check for two or more task-named types and to emit an explicit unscored decision for any non-final arm, instead of failing with a stack trace after export. The old run is not silently reclassified or rerun.

The revised preflight was exercised separately at `/opt/are-benchmark-runs/g02-cross-layer-graph-preflight-r1`: it marked both named types unbound and emitted `not-run` **before any model or gold call**. This verifies that the same wasted generation would now be avoided; the original run and its cost remain intact.

## Open Questions

- Is the source-unbound issue a dataset identity error or an intentional task with no selectable base evidence? Inspecting benchmark gold would be diagnosis only, not a valid retroactive quality claim.
- Which independent task source can replace the round-30-exposed ContextBench identities for a stronger G02 generalization test?
