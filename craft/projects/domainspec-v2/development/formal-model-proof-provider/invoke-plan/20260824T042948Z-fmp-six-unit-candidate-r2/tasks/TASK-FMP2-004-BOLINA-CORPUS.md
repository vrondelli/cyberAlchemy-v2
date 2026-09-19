# TASK-FMP2-004 — Exact Bolina Corpus

## Smallest Working Unit

- SWU: `SWU-FMP2-004`
- Layer: L2
- Dependency: accepted `SWU-FMP2-003`
- Successor: `SWU-FMP2-005`
- Expected execution owner: Bolina corpus evidence owner through one Task Session
- Primary behavior: one complete attributed 17-case Bolina bundle is decoder-valid, denominator-complete, drift-sensitive, and preserves M10 isolation

## Inputs and outputs

Inputs are only the 21 exact Bolina files and provenance identities in `SOURCE-LOCKS.json`. Outputs are one virtual model bundle, case manifest, independently owned proof denominator, provenance record, byte-identical LICENSE/NOTICE, and focused fixture test.

## Exact write scope

Create the seven absent Bolina fixture/test targets in `SWU-CONTRACTS.json`. Do not run or copy `run-evaluation.py`, mutate `projects/bolina`, or read unlisted upstream bytes.

## Algorithm and exact inventory

1. Revalidate upstream HEAD, clean worktree, each selected digest/size, license, and notice.
2. Embed exact `Bolina.tla`, `BolinaEvaluation.tla`, base config, W01-W06 configs, and M01-M10 configs as canonical virtual files.
3. Declare one base obligation, six exact reachability obligations, and ten mutants in the accepted order, with one worker, coverage 1, cleanup, 120,000 ms per case, and bounded output.
4. Bind exact invariant/finding names and trace markers from the validated Design.
5. Require M10 only when the corrected base is clean and `LEGACY_TRUNCATE_MUTANT` is the exact mutant evidence.
6. Record source URL, commit, path/digest/size, copied/authored status, license/notice, and claim ceiling.

## Edge cases and hostile evidence

Own `HC-FMP-023..025`: commit/source/license/notice drift, missing/extra/swapped case, wrong marker/property/finding, base failure, mutant survival, or fixture path escaping to the upstream checkout.

## Done and validation

All five commands for 004 pass; every JSON parses; tests rehash all embedded and attribution bytes; no TLC process starts; no upstream byte changes. Receipt and owner closeout bind successor 005.

## Split analysis

Candidate children are provenance copying, bundle, manifest, and denominator. None is runnable or independently meaningful without the complete attributed corpus and cross-identity checks. Order Saga is separately acceptable and remains 005.

## Runtime context anchors and result shape

Use `SOURCE-LOCKS.json`, exact source files it binds, accepted decoder contracts, validated Design corpus table, hostile catalogue, and this task. Return standard SWU result with exact seven-file inventory. This proves an exact fixture, not a new model result or implementation conformance.

Rollback removes only the seven created targets before acceptance.
