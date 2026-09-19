# B04 — Recovery adapter and test observer

B04 connects recovery test evidence to ORODI's B03 evaluator. The TypeScript adapter accepts explicit, caller-pinned JSON bytes; it performs no file discovery, process execution, database access or recovery action. The Python observer reads only explicitly named local fixture stores. The separate case driver runs one selected frozen test scenario against its own temporary fixtures.

## What is implemented

`recovery-evidence-adapter.ts` checks exact manifest/source/map/result relationships, all 30 scenario identities, required test names and results, formation-probe boundaries, duplicate runs and source selectors. Historical normalization preserves raw references, original labels, unknown runtime outcomes and missing slots. `historical-import.json` contains a real import of the 60 R07 records with their original selectors. It is a historical-integrity artifact, not a new runtime observation or approval.

Fresh normalization also checks driver, Python executable and observer artifact pins; separately bound producer/observer descriptors; parent and observer identities; test/barrier correspondence; ordered capture intervals; closed store/table shapes; and closed connections. Unavailable snapshots remain unsupported. The adapter does not invent telemetry counters or change historical records into fresh observations.

`recovery_test_observer.py` uses mode=ro, query_only, an SQL authorizer, bounded reads and a separate transaction per store. It rejects escaped paths, unsupported WAL fixtures and malformed requests. It never acquires recovery authority or invokes an Operation. Reads close before the driver continues. The tests verify database bytes remain unchanged and that a writer can acquire an exclusive lock after the observer returns. Missing files are not created. No cross-store atomic snapshot is claimed.

`recovery_observed_case.py` checks the pinned product manifest and frozen source closure, invokes original tests without changing them, and runs a separate observer child before and after each test. Formation probes get their own observer intervals and retain their formation-only meaning. The driver, unlike the observer and adapter, performs bounded fault-test effects inside temporary fixtures.

## Evidence limits

The observer captures before/after test boundaries. Authored tests still own the semantic assertions and intra-test process fault checks. These snapshots are not an independent re-proof of every recovery invariant, every SIGKILL boundary, or all concurrency schedules. Exact hashes identify selected artifacts and records; they are not cryptographic attestations of an untrusted producer's honesty.

Source-backed test-to-constraint correspondence for all 30 obligations is recorded in `scenario-mapping.json`. Fresh captures and actual source predicates for the complete composite will be exercised in B05. An unavailable snapshot may require explicit diagnosis during that campaign; it is not silently treated as a passing observation.

## Checks and frontier

Type-check PASS. TypeScript: 34/34 tests PASS (11 adapter tests and 23 preserved B03 evaluator tests). Python: 11/11 tests PASS, including real R01-F01 runtime and R01-F26 formation smoke cases. Adapter tests exercise the complete historical 60-record import through B03 and all 30 missing-repetition variations. Fresh negative probes reject spoofed observer identity, wrong barriers, invalid dates, undeclared telemetry and malformed tables.

B05 is ready: bind and freeze the composite and run the fresh 30 x 2 campaign. B06 review and B07 product decision remain pending. The two legacy hostile-directory fixture collisions recorded in B03 remain separate operational-support residue; the legacy suite was not rerun or declared fixed here.

From the repository root:

```sh
python3 -B -m unittest discover -s projects/domainspec-v2/impl/operational-resilience/test -p test_recovery_test_observer.py -v
```

From `projects/domainspec-v2/impl`:

```sh
node node_modules/typescript/bin/tsc --project operational-resilience/tsconfig.json --noEmit
node --import tsx --test operational-resilience/test/recovery-evidence-adapter.test.ts operational-resilience/test/recovery-product-test.test.ts
```

The original runtime, R07/R08 packets, and B03 source bindings were preserved. No product approval, profile admission, publication or deployment occurred.
