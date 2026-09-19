# Prepared repository runner for independent investigations

Status: implemented with four passing offline integration tests; independent review pending. No live provider calls or benchmark score is reported.

## Contract

[The runner](discovery-v1/orchestrate-independent-v1.mjs) verifies the public task digest, closed task fields, repository origin and exact base commit before preparing source. It creates one isolated base/work pair for the entire arm, not one pair per investigation. Source admission is checked before preparation and each clone. Source and evidence paths must be disjoint, fresh and free of symlink aliases.

One client and arm ledger serve the planner, three fresh-context investigations and final join. Native phase admission preserves the shared 96,000-token/96-call ceiling and measured 8K request limit. Only search, read_file and list_files are exposed. Snapshots, captures and results use guarded persistence. Before each model dispatch, the runner checks the shared callback, abort signal and all available model/tokenizer/index-tokenizer receipts for provider health.

On successful completion it reconstructs native export from branch receipt assignments, saved request/response captures, the delivered terminal packet and source snapshots. The reconstructed export must equal the episode export before prediction files are written. The base checkout must remain clean. No retry or existing-directory resume is supported.

## Verification

Run from the repository root:

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/independent-prepared-runner.test.mjs
```

Four tests passed on 2026-09-18:

- Full scripted episode uses one client, eight model calls, three source snapshots and one base/work pair; persisted result and reconstructed export match.
- Invalid task digest or denied source preparation stops before client creation.
- A forced failure on model call three stops with 240 known synthetic tokens and one unknown-cost attempt retained; no later branch dispatch occurs.
- Shared dispatch denial stops before any model attempt and persists the failed episode.

Fixtures use actual temporary Git repositories, repository tools, native recycler, evidence bindings and guarded persistence. Model replies and token measurements are synthetic. The fixture client stubs ledger binding; actual GLM ledger behavior is covered separately by [native episode verification](INDEPENDENT-NATIVE-EPISODE-RESULTS.md). These tests do not measure benchmark quality, provider reliability or token savings.

## Product frontier and operations

The coordinator owns runner integration and common comparison interfaces. Next runnable work is independent review of this runner, then three-arm campaign/scorer integration and common baseline implementation. Live execution requires reviewed exact sources, protocol-valid bounded history, shared cancellation verification, real tokenizer qualification and D:/WSL capacity admission. C: is excluded. Release, publication and deployment remain deferred and are not granted by this construction result.

## Open questions

Does shared cancellation stop an in-flight native request and drain its durable ledger? How should bounded history preserve complete tool exchanges consistently across the three arms? Can the twelve-outcome campaign reconstruct and score all arm variants under one frozen comparison contract? Perfect quality, at least 15% cumulative-token savings against both comparators and untouched confirmation remain unproved.
