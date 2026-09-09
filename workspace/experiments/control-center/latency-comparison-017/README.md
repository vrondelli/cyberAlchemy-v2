# WLC-017: current-source Linux candidate and resumed diagnostic

One candidate was built from the current source at the user's explicit request,
including the WorkspaceApp, OntologyCanvas and graph edits that invalidated the
WLC-015 binding. Earlier evidence and source edits were preserved. No product
approval, conformance, publication or release is claimed. Authority effect: none.

## Built artifact

`native/artifact/essays-desktop` is retained outside the disposable Cargo target.
SHA-256: `5d0ac80ec9f7dcba29a01788104076a1951a853ad3194a66f3a615bc1c429bf6`.
`native/identity.json` binds this executable to `native/inputs.json` and the fresh
WDIO frontend. Selected source and frontend bytes stayed unchanged through the
offline, locked, two-job native build. This is selected-input local build evidence,
not transitive hermetic closure. The builder is create-only and must not be rerun
over this candidate. The standard production output was not replaced.

Validation: two profiler/identity regression tests passed; frontend typecheck
passed; frontend suite 85 passed and 1 failed. The remaining failure is the
previously known implementation-manifest `chat source 4` hash mismatch. That
manifest was not rewritten and product conformance remains unresolved.

## Native diagnostic evidence

`runs/unified-tDO5eZ/result.json` reports DIAGNOSTIC_FAILED with a qualified host,
no source/binary drift, no interruption and no timeout. The unchanged smoke spec
failed in inspectOntology, expecting the previous canvas heading. Source review
shows WorkspaceApp now imports RuntimeOntology instead of OntologyCanvas. The
old canvas source still contains that heading, but is no longer the selected
surface. The current smoke workflow needs reconciliation with the current UI;
failure must not be suppressed or treated as product success.

`runs/unified-tDO5eZ/artifacts/profile-1.json` contains a real webview trace:

- Coverage: page-relative 3208–23665 ms; not pre-WebDriver/native startup.
- 904 frame intervals, maximum 557 ms, 51 intervals above 50 ms.
- 802 timer intervals, maximum 186 ms, 15 intervals above 50 ms.
- Page remained visible; sample arrays were not capped.
- Long-task observation unsupported; absence of entries is not proof of no work.
- Recorded startup context: handshake 93 ms, connect dispatch 784 ms, readiness
  889 ms, replay 11 ms. These are single instrumented-session observations, not
  population p95 or proof that dispatch satisfies its 50 ms budget.

The trace establishes frame and timer stalls but does not identify their cause.
It cannot partition the slow native connect into lock, service or renderer time.
Instrumentation overhead has not been quantified. The research-evidence-harness
boundary keeps fixture, instrumented diagnostic and acceptance evidence separate.

## Uninstrumented smoke and current result

The unified spec now checks the RuntimeOntology shell and explicitly selects
"Show Workspace graph" before retaining the existing graph assertions. This
does not prove the event-backed v4 API integration. `smoke.mjs` runs the same
frozen executable using the base WDIO configuration without the diagnostic probe.
Both changed JavaScript files passed syntax checks.

`runs/unified-3a40wD/result.json` reports FAIL on a qualified host, with no drift,
timeout or interruption. The workflow reached performance validation. Unchanged
budgets failed for editor projection (samples 32, 3 ms; budget 16.7 ms), chat
connect dispatch (716 ms; budget 50 ms), and chat delta-to-paint (234 ms; budget
16.7 ms). Navigation's reported within-session p95 was 64 ms against 120 ms.
These are observations from one session, not a population-level cold-session
p95 campaign. Synthetic-fixture evidence is not real Codex conformance.

The campaign stopped at this failure. Candidate identity was verified again
afterward; no approval or automatic successor is claimed.

## Plan: construction versus operational support

Product-construction frontier:

1. Diagnose the three failing latency paths using the retained evidence; avoid
   inferring native lock or renderer causation from frame-gap correlation alone.
2. Implement bounded fixes under a separately identified successor if candidate
   bytes change. Keep every existing budget unchanged. Resolve the existing
   implementation-manifest mismatch without manufacturing conformance by rehash.
3. Test the exact candidate through Rust tests, frontend tests and typecheck,
   the WDIO-specific build, and qualified unified native smoke. Only after this
   gate passes, collect the required repeated cold sessions and identity-bound
   differential evidence against the retained baseline. Single-sample p95 labels
   do not satisfy that requirement.
4. Complete production-build restoration/verification and prepare the exact
   tested candidate for a separate product approval decision. Reconciliation,
   commit, merge, publication and release remain deferred separate decisions.

Operational support (test operator): provide a qualified host window for native
measurement. It was satisfied for this run; it is not the present blocker.
The causal construction blockers are the measured budget failures and existing
manifest mismatch. Event-backed ontology integration also needs separate coverage.

Operational cleanup (completed at user request): moved only WLC-003's
`native/baseline/essays-desktop` and `native/treatment/essays-desktop` to desktop
Trash after checking exact regular-file targets and active process executables.
The two files total 567,913,952 bytes (about 542 MiB). This is recoverable removal,
not reclaimed disk space. All source snapshots and evidence were retained;
WLC-008 remains the differential baseline and WLC-017 the current candidate.
