# Measurement loader v2 — native integration verified

Root cause: installed @wdio/mocha-framework calls Mocha loadFilesAsync with an
esmDecorator that adds `?invalidateCache=<random>`. The v1 loader compared the full
URL against the undecorated spec URL and therefore skipped transformation. WDIO
does propagate NODE_OPTIONS; the failure was spec matching, not missing propagation.

V2 ignores query/fragment only when matching the exact spec URL. It reuses v1's
pinned SHA-256 source check and bounded measurement transform. Unrelated modules,
source drift, functional assertions, missing-sample checks, budgets and ordinary
smoke behavior are unchanged. The separate WDIO config explicitly selects the v2
register module in runnerEnv. No installed dependency or frozen candidate changed.

Validation: five v2 regression tests pass, including reproduction of the v1 miss
and v2 success through the installed Mocha file loader. The existing 32 campaign
tests and six CC004 candidate tests also pass (43 total).

Native integration on 2026-09-05: one actual Tauri/WDIO session exited 0 and emitted
the measurement-only/v1 marker. All 13 metric arrays were retained, including slow
observations. Host CPU pressure avg10 reached 31.24 against limit 5, so this run
is REJECTED for campaign statistics. Local regression tests also ran during probe
startup; this was an integration check, not an uncontended performance campaign.
No population p95, product performance PASS or approval is claimed.

RESULT.json retains exact apparatus/candidate/executable/log digests, host
observations, process result and raw arrays. Output is retained at
`/tmp/cav2-measurement-v2.S4uTRY/`. CC004 source and executable digests were checked
before launch and after exit. This is a new harness repair epoch over the retained
CC004 executable, not a replacement for CC004's failed native evidence. The mock
provider and preview-only protocol tolerance do not prove live conformance.

Run the regression tests from repository root:

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/native-test/measurement-v2/loader.test.mjs
```

The native check selected this directory's wdio.conf.mjs with CC004_TEST_BINARY
and fresh database/data/config/receipt/artifact paths. It did not rebuild binaries
or replace production assets. The test process group exited; no app is left open.

Next construction: bind v2 to a successor candidate and make campaign selection
candidate-aware (the existing collector still explicitly selects CC003/v1).
Then run the predeclared population on a qualified host, retain all attempts, and
produce the previous-candidate differential. Do not change host thresholds to
discard slow samples. Full build/process provenance and ordinary unified smoke
remain required product-test work; approval and publication stay separate.
