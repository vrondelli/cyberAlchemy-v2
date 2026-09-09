# Timing campaign collector prototype

Implemented protocol, host-observation checks, session-level aggregation,
differential comparison core and fail-closed native smoke collector. Budgets remain unchanged:
SHA-256 `e8f7ac530bb990402a04a85ea61e654f83787263c24e73ac26d279fdabd77baf`.

From repository root:

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/native-test/campaign/*.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/native-test/campaign/probe.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/native-test/campaign/analyze.mjs attempts.json cyberAlchemy-v2/workspace/runtime/performance-budgets.candidate.json
```

Input format examples are in analyze.test.mjs. Attempts JSON has identity and
attempts fields. Caller supplies explicit SHA-256 identities for candidate,
executable, budget bytes, protocol bytes and host. Sequence numbers and unique
run IDs prevent duplicate/reordered observations. Native collection verifies
selected source and binary hashes; full runtime/build closure and desktop-process
attestation remain open.

Forty qualified cold sessions are required. At most sixty attempts are allowed;
attempts after the fortieth qualified session invalidate the sequence. All attempts
must remain in the input evidence, including host-rejected and failed sessions.
Qualified failures invalidate the report rather than silently disappearing.
Each session must satisfy existing minimum_samples; its maximum becomes one
observation in the campaign p95. Raw arrays remain linked by attemptsSha256.

Host thresholds are conservative prototype criteria independent of measured
latencies. Rejection means unqualified, not proven external contamination.
The Linux probe recorded five prelaunch observations: normalized load 0.035,
available memory about 81%, CPU/memory pressure avg10 zero. These meet numerical
thresholds but do NOT qualify any desktop session without during-run coverage.
See HOST-PROBE.json. WSL host scheduling outside the guest remains unobserved.

## Evidence ceiling and next work

No repeated desktop campaign or real-candidate differential bundle was produced.
The low-level differential function does not authenticate report objects. Use
bundle.mjs to verify indexed raw inputs and recompute reports. Host identity here
is a preliminary machine descriptor, not complete display/power/runtime identity.

CC-003 live validation fails on selected routes.json and routing-profile drift.
The missing RECENT policy has now been repaired: nested profile validation passes
and no route policies are missing. CC003's candidate bytes are unchanged and its
earlier results remain historical. A new exact candidate is required for native
collection; the repair does not revive CC003's old evidence.

## Collector use and retained evidence

Read-only preflight (the retained CC003 binary is not rebuilt or launched):

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/native-test/campaign/collect.mjs --preflight /tmp/cav2-cc003-native.JHGox9/essays-desktop 9de53e4a5875251626c2a0f42ddd2bdbb015fb95ee456233c4c2aef40a182921
```

Use `--collect` in place of `--preflight` only when the candidate is current and
a local desktop campaign is intended. It creates a unique `/tmp/cav2-cc-campaign.*`
directory, prints its location, and writes exclusively new files. CC003 identity
and budgets are pinned, not inferred or refreshed. Invalid source preflight stops
before app launch. Each attempt also checks immediately before launch (after host
observations) and after exit. The native adapter uses the existing unified WDIO
suite with an explicitly fixed mock provider and preview-only protocol tolerance;
this is not live-provider/protocol conformance.

Each fresh runner receives separate SQLite, data, config, receipt and screenshot
paths. Evidence contains manifest, exact budget/protocol bytes, preflight records,
launch/postflight records with selected apparatus hashes, raw stdout/stderr,
attempt records, attempts.json, and result.json. The host clock is monotonic with
one-second polling and start/end samples. PID refers to the WDIO runner, not an
attested desktop PID. Timeout and interruption cleanup target its process group.
This prototype is fail-closed on process errors, malformed/missing metrics,
sampling failures and identity drift. It stops on failure even on an unqualified
host, preserves the attempt, and never resumes or overwrites old evidence.

The smoke source and ordinary --collect behavior are unchanged: any failure stops.
Use **--measure** for the separate measurement adapter. A Node loader checks the
exact source SHA-256, then changes only latency adjudication and adds an explicit
measurement marker in memory. Functional assertions and insufficient-sample
failures remain. Slow sessions are retained for fixed-population analysis; a
single session's emitted p95 field is not used as campaign p95. The analyzer still
uses the original limits. No PASS from measurement replaces unified smoke PASS.

Both modes produce evidence-index.json and print its SHA-256. Retain that digest
outside the output directory. To compare complete measurement campaigns:

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/native-test/campaign/bundle.mjs BEFORE_DIRECTORY BEFORE_INDEX_SHA256 AFTER_DIRECTORY AFTER_INDEX_SHA256
```

The verifier checks indexed bytes and exact attempt coverage, reconstructs metric
arrays from stdout, checks process outcomes and identity-check receipts, and
recomputes population reports. It requires matching selected apparatus across
attempts and candidates, plus matching host/protocol/budgets and distinct candidate
identities. It rejects incomplete, edited or inconsistent evidence with
not_evaluable. Evidence indexes cover analysis inputs, not screenshot/database
artifacts. A hash proves consistency against the caller's retained digest, not
independent truth of telemetry, source-check receipts or desktop execution.

Construction remaining: exercise the loader in real WDIO after a current candidate
exists, complete process/build identity, and collect the two real populations.
The source-routing dependency is repaired. Next prepare a new exact candidate and
explicit native-test selection; CC003 cannot simply be rehashed.
Previous-candidate executable evidence, complete apparatus/build closure and
host display/power identity remain required for the final comparison campaign.

Validation on 2026-09-05: 32 tests passed, including a separate Node loader process,
slow 40-session synthetic populations, functional-failure stopping, tamper checks,
child exit/timeout and asynchronous telemetry. Native read-only preflight
initially failed on routes.json drift and missing CA2-ROUTE-RECENT policy; candidate, binary,
budget, protocol and host digests matched. No desktop campaign ran, no apps were
restarted, and no build assets were replaced. Product approval remains open.

Subsequent routing repair: 34 request-decision-router tests and all 32 campaign
tests pass. RECENT permits only local reads; mutation/publication conflicts,
cache refresh and hook installation cannot take that direct route. The phrase
"recent committed files" still triggers the existing commit/committed lexical
ambiguity gate unless recent-context intent is explicit. CC003 validator confirms
nested profile PASS and empty missing_route_policies, but selected binding FAIL
for the changed registry/profile. No frozen candidate or latency budget changed.
