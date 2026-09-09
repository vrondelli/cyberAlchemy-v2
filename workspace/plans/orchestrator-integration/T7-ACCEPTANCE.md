# T7 Whole Workspace acceptance

Status: candidate, in progress. Authority effect: none. Owner request: `next`.
Construction boundary: [DAG.json](DAG.json), T7, after T5 and T6. Reuse the existing
Workspace and sibling orchestrator frontend. No installed service, history,
fixture allowance, credential, or VPS changes are part of this campaign.

## Acceptance DAG

| Task | Depends on | Acceptance | Status |
| --- | --- | --- | --- |
| T7A Browser regression | T5, T6 | Current candidate navigation, ontology keyboard access, Essays editing/layout and unavailable web Chat pass against an isolated dashboard | See [T7A evidence](T7A-EVIDENCE.json) |
| T7B Instrumented browser performance | T7A | Collect the browser metrics and sample counts in the existing performance budget; retain failures and distinguish unavailable native metrics | PASS after timing correction, see [evidence](T7B-FIX-EVIDENCE.json) |
| T7C Native desktop integration | T7A | Existing Tauri journey and native IPC/Chat budgets pass with an explicitly bounded local fixture and preserved installed histories | PASS in isolated software-composited Xvfb fixture; [trace evidence](T7C-TRACE-EVIDENCE.json) |
| T7D Accessibility completion | T7A | Recheck automated accessibility after fixes, resolve WebKit prerequisites, and record real keyboard/screen-reader observations | PASS within local candidate boundary; see [evidence](T7D-EVIDENCE.json) |
| T7E Acceptance closeout | T7B, T7C, T7D | Join current browser/native evidence with T5E source handoff and T6D recovery; resolve or explicitly retain each release blocker | Pending |

T7 remains incomplete until these checks close. T8 activation and T9 planner work
still depend on T7; MCP remains last.

## T7A implementation and reproduction

[The runner](test-workspace-browser.mjs) starts an ephemeral loopback dashboard
using the [scheduler fixture](scheduler-fixture.mjs), runs the existing broad
[browser suite](../../runtime/scripts/browser-acceptance.mjs), and closes the
fixture. It rejects any scheduler mutation during navigation. No native provider
or installed service is called. Build with
`node workspace/plans/orchestrator-integration/build-dashboard.mjs`; this preserves
bundled snapshot bytes instead of regenerating them.

Run from the repository root with `WORKSPACE_PLAYWRIGHT_ROOT`,
`WORKSPACE_CHROMIUM_EXECUTABLE`, and any required browser `LD_LIBRARY_PATH` set:
`node workspace/plans/orchestrator-integration/test-workspace-browser.mjs`.
Optional positional arguments select the static build and screenshot prefix.

The initial run reproduced the obsolete web Chat assertion after the preceding
ontology and Essays checks passed. Chat renders its diagnostic directly on the full page and in the expandable
Decisions & receipts panel in the dock. The suite handles that disclosure and verifies
that the composer, Send and Auto approve are all disabled. The web-only error
now displays the readable desktop requirement and an unavailable state instead
of `ARE_CHAT_WEB_MODE`. Other connection errors retain their diagnostic.
Browser cleanup now runs on assertion failure; locator waits are bounded.

The dashboard does not serve the new `/api/ontology-v4` read model. The isolated
runner explicitly selects an unavailable-endpoint expectation: the suite requires
exactly a 404 response and the visible unavailable alert before opening the
bundled graph. Only that endpoint’s expected resource error is excluded from
unexpected-error checks. Default runs retain strict HTTP/console error checks.
This is unavailable-state acceptance, not a working live ontology integration.

## T7B instrumented browser campaign

[Runner](test-workspace-performance.mjs), [evidence](T7B-EVIDENCE.json).
Run the candidate build first, then invoke
`node workspace/plans/orchestrator-integration/test-workspace-performance.mjs`
with the browser library environment used for T7A. An optional output-directory
argument preserves separate campaigns. The runner uses the existing TypeScript
budget evaluator and exits nonzero for exceeded budgets or insufficient samples.
It collects real application samples; it does not inject timing records.

| Metric | Samples | p95 | Limit | Result |
| --- | ---: | ---: | ---: | --- |
| Repeat surface navigation | 25 | 21.4 ms | 120 ms | PASS |
| First surface visits | 3 | 82.6 ms | 1000 ms | PASS |
| Essays input to projection | 124 | 24.1 ms | 16.7 ms | FAIL |

Chromium, 1440 × 1000, local ephemeral dashboard. Visits cover Dashboard,
Explore, Essays and Chat; input uses five typed phrases in the actual Milkdown
editor. The initial insertText automation did not emit a sample, so the campaign
uses sequential key input. Four evaluator tests and the candidate build pass.
No HTTP, console or page errors, scheduler mutations, or model calls occurred.

The navigation metric ends at the next animation-frame boundary; it does not
establish feature-ready latency. Cold means first mount in this context, not
process startup. Registered orchestrator navigation uses a separate unbudgeted
hash-navigation metric. Ten native IPC/Chat metrics remain NOT_MEASURED for T7C.
The raw sample list retains editor input/update/serialization details. The slow
samples are dominated by input-to-update time; whether this is scheduling cost
or an instrumentation interval problem requires a focused diagnosis. Do not
weaken the budget or treat this failed campaign as complete T7 acceptance.

### T7B timing correction

The original failure above is retained as historical evidence. The input listener
ran after ProseMirror/DOM observation had already published the change: the first
key produced no timing, and subsequent samples included the pause before the next
key. The [event probe](t7b-fix-evidence/before-event-probe.jsonl) demonstrates this
with 300 ms pauses and approximately 350 ms samples.

The [editor adapter](../../../essays/runtime/src/adapters/milkdown-editor.tsx)
now starts timing in `beforeinput` capture, before the DOM edit. Starting in
`input` capture was still too late for the first insertion. This corrects the
measurement interval; it is not evidence of an editor execution speedup.
The [browser regression](test-editor-timing.mjs) verifies the first isolated
insertion, one sample per spaced key, no idle samples, and retained text.

The final unchanged-budget campaign passed: 25 repeat-navigation samples at
20.3 ms p95, 3 first-mount samples at 100.1 ms, and all 125 typed characters at
3.0 ms editor p95. See [correction evidence](T7B-FIX-EVIDENCE.json). Existing
first-mount/frame-boundary limitations and the ten unmeasured native metrics
remain. The regression covers ordinary text input, not a full IME/composition
performance campaign.

Next runnable task: T7C bounded native desktop integration and IPC/Chat budgets.
Accessibility and the absent live ontology endpoint still require closeout;
operational activation remains deferred.

## T7C native preflight

The existing WDIO frontend built successfully. The native smoke runner binds a
temporary SQLite database and the local mock Codex server. Its new
[preflight](../../runtime/wdio/preflight.mjs) checks the binary, frontend, mock,
bridge, Linux GTK/WebKit build metadata and display before creating the temporary
database or launching WDIO. The WDIO configuration shares the exact binary path.

Current result: `pkg-config` is absent and the native desktop binary does not
exist. Display and fixture files pass. The guarded runner exits 2. The locked
Cargo build began through `tools/toolchain/run`, then was interrupted after the
missing prerequisite was confirmed; this is not a compiler failure receipt or
a completed build. No native performance metric or desktop journey was measured.

Reproduce preflight from the root:
`node workspace/runtime/wdio/preflight.mjs`.
Once native prerequisites are available, build the WDIO frontend from
`workspace/runtime` with `node_modules/.bin/vite build --config wdio/vite.config.mjs`,
then build the desktop from the repository root using `tools/toolchain/run cargo
build --locked --manifest-path essays/development/agent-runtime/implementation/desktop/src-tauri/Cargo.toml
--features wdio`. Run `node wdio/run-smoke.mjs` from `workspace/runtime` under an
available display and select a persistent evidence directory with
`WORKSPACE_WDIO_OUTPUT`.

Next exact prerequisite: resolve user-local pkg-config and GTK/WebKit development
metadata/libraries using the existing shared native toolchain. The local toolchain
owner owns this support work; it blocks T7C only. A missing pkg-config means the
library check is not evaluable, not proof that every library is absent. T7D
accessibility work can continue independently. Installed services and VPS
activation remain outside this task.

### T7C dependency resolution and startup result

The earlier missing-dependency receipt remains historical. The new
[desktop dependency overlay](../../../tools/toolchain/README.md#optional-linux-desktop-dependencies)
locks 188 Ubuntu archives, verifies SHA-256 values, and extracts into user data.
It delegates compilation to the existing shared toolchain. Host runtime library
bindings are recorded; redundant glibc linker scripts are omitted so LLVM lld
uses the shared compiler sysroot. No system packages or services were changed.

The locked WDIO desktop build now passes, as do native preflight, a GTK/WebKit C
link-and-run check, and bootstrap reuse. The smoke runner also isolates XDG data,
configuration and cache alongside its temporary SQLite database and mock Codex.

Run native commands through `tools/toolchain/run-desktop`. For the smoke test,
from `workspace/runtime`, use the absolute path to that wrapper followed by
`node wdio/run-smoke.mjs`, with `WORKSPACE_WDIO_OUTPUT` pointing to retained evidence.

Current blocker: the executable exits with SIGSEGV before embedded WebDriver
becomes ready, both on the current display and under Xvfb. Backend log capture
was enabled but did not reveal a more specific cause. The separate warning about
missing WebKitWebDriver is retained; the configuration selects the embedded
driver, and that warning has not been established as the crash cause. No native
journey or timing acceptance is claimed. [Evidence](T7C-DEPS-EVIDENCE.json).

Next runnable task: collect a native startup backtrace with the isolated profile,
identify the failing library or initialization step, and repair that cause before
rerunning the existing journey. Independent accessibility work remains runnable.

### T7C startup repair and measured native journey

[Startup evidence](T7C-STARTUP-EVIDENCE.json) supersedes the earlier startup
blockers while preserving their logs. GDB located the first crash in statically
linked glibc startup, before Rust main. Removing `libc.a` from the dependency
overlay restored shared `libc.so.6`; the new Rust link doctor verifies this exact
search-path case and executes its probe.

The next abort identified the missing hard-coded WebKitNetworkProcess path.
`tools/toolchain/run-desktop-webview` now delegates to the existing desktop
wrapper and uses bubblewrap to expose the private helpers inside a temporary
mount overlay. A check verifies the helper is executable inside the namespace
and its system path remains absent outside. The fixture still has temporary
SQLite and XDG data/config/cache and uses the local mock Codex server.

The complete desktop build passed. A subsequent final-crate link used
`cargo rustc -j 1 --locked --manifest-path essays/development/agent-runtime/implementation/desktop/src-tauri/Cargo.toml
--features wdio -- -C link-arg=-Wl,--strip-debug -C link-arg=-Wl,--threads=1`
through `run-desktop`; this limits linker memory for the local test binary.

Run the smoke fixture from the repository root with a retained
`WORKSPACE_WDIO_OUTPUT` and `GDK_BACKEND=x11`:
`xvfb-run -a tools/toolchain/run-desktop-webview sh -c 'cd workspace/runtime && node wdio/run-smoke.mjs'`.
It now reaches the final performance evaluation after editor, Chat, relaunch
and mobile assertions. Ten budgets passed; three failed unchanged:

| Native metric | p95 | Limit |
| --- | ---: | ---: |
| Repeat navigation | 125 ms | 120 ms |
| First surface visits | 1251 ms | 1000 ms |
| Chat delta to paint | 81 ms | 16.7 ms |

All native metrics were measured in this campaign. It is still a FAIL, not T7C
acceptance. Next: diagnose the native navigation and Chat painting intervals,
separate measurement issues from real latency, then rerun the unchanged budgets.

### T7C detailed timing diagnostics

[Timing evidence](T7C-TIMING-EVIDENCE.json) retains the final native samples,
navigation destinations, screenshots and prior failure diagnostics. The recovery
test now navigates to Explore before measuring its return to Essays; a restored
Essays route otherwise made that click a no-op with no emitted sample.

The Chat projection timestamp previously preceded `scrollHeight` and scrolling.
Those operations can force layout, so projection now finishes afterward and
records `scrollMs`. This fixes accounting, not execution speed. The final sample
contains 8 ms transport, 17 ms projection including 14 ms scrolling, then 75 ms
waiting for the next frame: 100 ms total. A separate 20-frame idle diagnostic,
collected after the budget samples, has 17 ms p95. No long-task records were
emitted; that is not evidence that no long tasks occurred.

The final native journey reached budget evaluation. Eight budgets passed; five
failed: repeat navigation 258/120 ms, snapshot IPC 87/50 ms, Chat connect dispatch
54/50 ms, delta-to-projection 25/16.7 ms, and delta-to-paint 100/16.7 ms. First
surface visits passed this run at 874/1000 ms; earlier failures remain retained.
Eleven focused Chat tests, TypeScript, frontend and native builds passed.

### T7C rendering trace and bounded pass

[Trace evidence](T7C-TRACE-EVIDENCE.json) retains the failed accelerated-Xvfb
run, the first software-composited failure and the final pass. Accelerated Xvfb
missed frame deadlines across unrelated surfaces and IPC delivery: repeat
navigation reached 185 ms p95, cold Essays 3206 ms and snapshot 174 ms, while
the native connect phases totaled 0.071 ms. Setting
`WEBKIT_DISABLE_COMPOSITING_MODE=1` for this headless X11 fixture removed that
global contention without changing the budget file.

The first software-composited run reduced navigation to 29 ms, cold mounts to
24 ms and snapshot to 28 ms, but retained three failures. The rebuilt final run
passed the complete journey and all 13 unchanged budgets: repeat navigation
16/120 ms, cold mount 8/1000 ms, snapshot 16/50 ms, connect dispatch 38/50 ms,
delta projection 14/16.7 ms and delta paint 16/16.7 ms. Its idle frame p95 was
17 ms. The Chat completion handler now preserves one presented streaming frame
before replacing it with the durable transcript message when delta and completion
arrive in one burst. Screenshot overlap is settled before the repeat-navigation
campaign. Eleven Chat tests, TypeScript, frontend/native builds and the 21-check
Chromium regression pass.

Reproduce with the existing isolated command plus the explicit compositor mode:
`WORKSPACE_WDIO_OUTPUT=<evidence-directory> GDK_BACKEND=x11
WEBKIT_DISABLE_COMPOSITING_MODE=1 xvfb-run -a
tools/toolchain/run-desktop-webview sh -c 'cd workspace/runtime && node
wdio/run-smoke.mjs'`.

This pass qualifies the local software-composited Xvfb fixture. It does not
qualify accelerated Xvfb, a physical desktop compositor, real Codex or a
cross-platform performance population. T7C is complete within its stated local
fixture boundary. T7D accessibility also passes below; T7E closeout is next.

## T7D accessibility completion

[T7D evidence](T7D-EVIDENCE.json) closes the local accessibility prerequisite.
The current source build passed the complete browser journey in Chromium 153,
Firefox 146 and WebKit 26 at 1440 and 320 CSS px. WebKit uses a checksum-locked,
user-local compatibility overlay; no system packages were installed. Axe-core
4.13.0 found zero violations across 12 application states after correcting two
roleless ARIA labels in the owning sibling frontend.

Orca 50.2 produced actual AT-SPI speech output for the representative critical
path from Dashboard to the completed run and its default Overview tab. Keyboard
End selected Lifecycle and Home returned to Overview with selected state and
focus preserved. The [assistive-technology record](UX6-SCREEN-READER.md) retains
the worksheet rows that were covered only by automated browser checks. T7E must
decide whether those, an additional supported-host Safari run, or wider manual
contrast review are release requirements. T7D does not infer that broader
product certification.

## Evidence boundaries

This browser suite uses a synthetic scheduler observation and the real dashboard
gateway. It does not establish native execution or recovery: those are covered
by [T6D](T6D-ACCEPTANCE.md). It checks the preserved catalog and ontology bundle,
not their freshness. It does not claim Tauri, performance-budget or manual
screen-reader acceptance. The installed frontend remains its earlier candidate.

## Open Questions

- Startup and renderer-fixture faults are repaired. The unchanged native budgets
  pass under software-composited Xvfb; physical compositor and population evidence
  remain outside this local fixture acceptance.

- The dashboard lacks `/api/ontology-v4`; connecting its existing read-only
  adapter requires a bounded integration step before whole-product closeout.
- `WORKSPACE_CATALOG_SNAPSHOT_DRIFT` still prevents standard snapshot regeneration;
  which source changes should be promoted into a new catalog snapshot?
- T7B timing was corrected and the browser budgets pass. IME/composition and
  registered orchestrator feature-ready timing remain outside this measurement.
- The existing native smoke runner meets the full Tauri/Chat budget in the bounded
  software-composited Xvfb fixture. Whether a physical desktop target also needs
  qualification remains an operational/product acceptance question.
- WebKit and a representative real Orca journey now pass. The unperformed
  spoken-output rows and scanner-indeterminate contrast cases are retained in
  [UX6-SCREEN-READER.md](UX6-SCREEN-READER.md) for T7E release disposition.
