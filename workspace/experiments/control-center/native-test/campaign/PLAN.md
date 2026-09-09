# Cold desktop timing campaign — analysis prototype

Construction frontier: measurement-only adapter and raw-evidence comparison,
runnable with synthetic drivers while the native candidate is stale. Extend
collect.mjs; add measurement-loader.mjs, measurement-register.mjs, evidence.mjs,
bundle.mjs and measurement.test.mjs; update this plan and README.md. No changes to
frozen candidate, unified smoke source, protocol or budget bytes.

Definitions: a session is a fresh desktop process with fresh app data and database;
an attempt is recorded even if failed or rejected. Qualified does not mean fast:
host checks cannot consume application timings. A candidate population is the
first 40 qualified attempts in a predeclared sequence of at most 60 attempts.
Per metric use each session's maximum, then nearest-rank p95 across sessions;
retain all raw measurements. This is session-worst-case p95, not pooled event p95.
Existing per-session sample requirements remain enforced. No one-sample p95.

Protocol v1 uses conservative host thresholds for normalized 1-minute load,
available-memory fraction and CPU/memory pressure. At least five prelaunch
observations and continuous during-run coverage are required. Thresholds are
prototype qualification criteria, not a causal proof of contamination. They
must be fixed before a campaign; never tune them to discard slow observations.

Identity: candidate, executable, budget, protocol and host digests. Each attempt
must match declared identities and record fresh-process posture. The collector
checks selected sources, binary, protocol, budgets and host before observations,
immediately before launch, and after process exit. Bind selected harness source
hashes at collector startup and retain checks. Missing observations fail closed.
Differential comparisons require same
protocol/host/budgets, distinct candidates and complete eligible populations.
Passing against one candidate does not approve either candidate.

Collector construction: retain append-only attempt directories, raw stdout/stderr,
performance arrays, host telemetry, checks and fresh data/config/database paths.
Use a fresh WDIO runner per attempt and fixed mock provider; record its PID. This
is not desktop PID/executable mapping attestation. Poll host metrics at one second
using a monotonic clock. Timeout/interrupt cleanup targets only the spawned process
group. Never overwrite evidence or auto-resume partial campaigns. Done criteria:
boundary tests, real child exit/timeout tests, continuous-observer test, and native
read-only preflight. A live campaign PASS is not required to finish this independent
collector prototype slice.

Sequence: (1) pin the existing smoke source and implement a separate in-memory
measurement loader; (2) wire explicit --measure mode and require its output marker;
(3) index retained evidence with SHA-256; (4) recompute differential reports from
raw attempts/logs with caller-pinned index digests; (5) test slow populations,
functional failures, source drift and tampering; (6) run read-only native preflight.
Ordinary --collect still stops on every smoke failure. Measurement mode moves only
latency adjudication to the fixed-population analyzer; functional assertions and
insufficient-sample failures remain. A measurement completion is not smoke PASS.
Tests establish adapter/evidence consistency, not desktop campaign completion.

Operational support: current agent owns read-only native preflight, affecting the
product-test stage only; no desktop starts or build/environment modification.
Live collection is blocked by CC-003 selected registry/profile drift. The missing
CA2-ROUTE-RECENT policy is repaired and verified; frozen CC-003 remains unchanged. Independent
collector construction continues. Deferred construction: full native WDIO loader
exercise, complete executable/source closure and process attestation, repeated
campaign and real previous-candidate differential evidence. Shared routing
owner completed the bounded registry/profile reconciliation; product owner owns candidate selection
and later product approval. Publication/merge preparation is operational residue
with no current construction-stage effect and requires separate user direction.

Routing prerequisite repair (2026-09-05): add RECENT's local-read-only policy to
request-decision-router/profiles/cyberalchemy-v1.json, bind the current registry
hash and recompute only the profile's deterministic digest. No other provenance,
consequence classification, route registry or frozen candidate is changed. Add
test/recent.test.mjs for query phrases, explicit intent, effect conflicts,
cache/hook exclusions, negation and digest tampering. The existing committed/commit
lexical ambiguity stays gated; no global matcher change. Results: router 34/34,
campaign harness 32/32; CC003 nested_runtime_profile PASS, missing policies empty,
selected_binding FAIL on exact changed sources. This completes one dependency
repair, not a new product candidate or desktop campaign.

Next construction sequence: define CC004 with CC003 lineage and an explicit
changed-source ledger including this regression test; bind the measurement
apparatus and fresh executable; make candidate selection explicit in native test
configuration; rerun candidate tests and native loader proof, then the qualified
campaign. Do not infer previous-candidate evidence or approval. Operational
support for that stage: current agent owns isolated builds/storage and ordinary
build restoration; no effect on current repair validation. Commit, publication,
merge, approval and live-provider execution remain deferred separate decisions.
