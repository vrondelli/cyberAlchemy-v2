# WORK-PACK: ARE Companion adapter observation

Status: **candidate, execution gate blocked**, 2026-09-26. Owner: ARE
product/runtime owner; Companion owner for the desktop projection. This plan
does not authorize implementation, deployment, or release. Complexity: high.
Source design is [candidate UX](../ux/ADAPTERS.md), not an approved interface.
[Implementation analysis](IMPLEMENTATION-ANALYSIS.md) and
[layering](IMPLEMENTATION-LAYERING.md) constrain every task.

Construction update: an `are.adapter-observation/v1` in-process projection,
negative-claim tests, opt-in POSIX development socket, fixed CLI read, and
Companion development bridge now exist in source. No default or packaged
endpoint is enabled. A staged native Windows development harness now proves
the private named-pipe projection and selected-path UI with a pinned installed
Codex binary, including a gateway restart. This is construction evidence, not
an installed-package or desktop-task-control claim. Final access, freshness,
resource-budget, and installed-package proof remain open; I/H/B/J are not
complete overall.

### Native Windows construction evidence (2026-09-27)

- The final current-source unsigned NSIS artifact was built without
  installing it: `D:\are-companion-build-x7MEK4\ARE_Companion_scroll_fix_20260927.exe`,
  29,369,955 bytes, SHA-256
  `c1880904b06f0def9940a8c989f5c8e2891bccdfe18fb5343011987c1d14d20a`.
  Its isolated test stage is
  `D:\are-companion-build-x7MEK4\acw-oRTewK`; the native-Windows Core
  closure digest is `619bf742d3daeaca6ddffb51570a14098f4d78141e794c8a367b3c13cb43a18c`.
  The development observer is not a packaged default endpoint. The earlier
  `ARE_Companion_path_20260927_2l2bmu.exe` is superseded; its stage was
  moved intact to `D:\ARE_Companion_superseded_stage_acw-HVv1gf` to free C:.
- The final staged `test-windows-features.mjs` passed 11 checks, including product
  closure, route/context, Reasoning State, and fail-closed Evolution writer.
  Staged `test-windows-ui.mjs` passed both unconfigured and live-fixture
  seven-panel journeys. The fixture correctly shows a running backend with
  same-session path `not-observed`, not `ready`. A linked-panel scroll reset
  fixed a clipped Adapters heading; the source browser check and final staged
  WebView2 check pass, and the final screenshot shows the full heading.
- Final-stage `test-windows-live-gateway.mjs --gateway-recovery` passed with installed
  `codex-cli 0.155.0-alpha.16.4` (SHA-256
  `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`).
  Its disposable local turn produced one observed backend thread and two
  gateway decisions; the staged UI showed same-session path `ready`, a
  completed Reasoning State frontier, and linked decisions while desktop-task
  control stayed `unverified`. The two-phase `--gateway-recovery` rerun passed:
  after restart the thread remained, process-local decisions were zero, and
  the UI did not invent them. Both runs made zero external model calls and did
  not touch this desktop task.
- Native Windows `gateway-windows-ipc.test.mjs` passed both local named-pipe
  path and authenticated observation tests. It covered denied wrong tokens,
  no backend spawn on observation-only reads, and pipe reuse after close; it
  is not a cross-user ACL proof.
- The source Core product suite passed 843 cases after excluding retired TUI
  provenance and unselected DSH/Evolution source from the default closure.
  A no-debug orb-only 10-second process-tree sample on the superseded stage measured seven
  Companion/WebView2 processes, 158,363,648 private bytes, and 0.15625 CPU
  seconds. A two-cycle dashboard sample passed nonblank reopen checks; the
  orb baseline was 153,247,744 private bytes, the first open dashboard
  236,867,584, and post-close samples 252,825,600 then 194,592,768.
  WebView2 reclamation was not immediate. These are machine-specific samples,
  not acceptance against an owner-set resource budget.
- A later source-loss slice built an additional unsigned Windows development
  artifact at `D:\are-companion-build-x7MEK4\ARE_Companion_source_failure_20260927.exe`
  (SHA-256 `9a8295b22114672ddf9667547ba1cb5e5bc72b8425a53aa9df3d1fdaa10b8884`).
  Source-browser failure fixtures passed twice and show that loss of the
  Adapters read immediately withdraws a prior Threads "same gateway epoch"
  caption; product, decision, ledger, and candidate-inbox failures retain
  independent postures. The new staged executable passed 11 bundled-feature,
  34 unconfigured WebView2, and 40 local-gateway WebView2 checks, including
  correlation withdrawal after gateway loss. Its tested stage was moved
  intact to `D:\are-companion-build-x7MEK4\acw-source-failure-20260927` and
  passed the feature check again there. This advances H failure recovery but
  does not complete native Linux validation, resource-budget acceptance, B,
  or J. The installer remains uninstalled.
- A new opt-in native WebView2 harness kept one dashboard open across a
  gateway-instance restart on the same authenticated observation pipe. The
  disposable gateway fixture passed 42 checks twice; its preexisting
  40-check connected path still passed. The installed-Codex variant passed
  41 UI checks twice against desktop `codex-cli 0.155.0-alpha.16.4` (SHA-256
  `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`).
  The old Threads/Decisions epoch claims were withdrawn as `Source changed`
  (or `Stale` when the observation TTL had expired); after a new Threads read,
  the recovered frontier correlated with the new adapter
  epoch and Decisions showed no process-local records. The canary reused a
  durable session store but restarted the gateway instance inside the same
  test process, so this is not a whole-process crash or power-loss proof.
  It made zero external model calls, left desktop-task control `unverified`,
  and did not touch the current task or install the unsigned package.
  The unchanged two-window `--gateway-recovery` journey also passed again
  (39 pre-restart and 38 post-restart UI checks). One intermediate rerun had
  no verdict because Windows briefly locked the canary's disposable SQLite
  files during teardown. The canary now retries exact scratch cleanup within
  a bound and reports failed teardown explicitly instead of masking it; the
  single exact residue directory from that run was removed after the child
  exited. This does not establish crash-safe whole-process cleanup.

## Objective and boundary

Show which ARE gateway/backend path is actually selected and observed, with
separate configured, running, connected, ready, stale, and unavailable claims.
First delivery is read-only, local, and per-user. It must not spawn a backend,
join a normal gateway session, read raw session stores, expose secrets, or
operate an adapter. Other optional integrations (MCP, hooks) remain declared
or unverified until each has its own source-owned proof.

## Dependency DAG

```text
A -> C -> D -> G          schema, projector, fixtures, fixture-backed UI
     C,D -> E -> F        development-only local read, Companion bridge
       E,F,G -> I         Windows development harness
       F,G,I -> H         functional checks and resource measurements
             H -> B -> J final security gate, then package/installed checks
```

No edge from product `doctor` to live adapter status: product health and live
connection remain independent. The existing gateway handshake is not an
observation edge because it creates a session and backend.

## Delivery slices and smallest working units

| ID | Layer / parent task | Smallest working unit; candidate write scope | Dependencies | Done evidence / verification |
| --- | --- | --- | --- | --- |
| A | L0 / schema | Specify `are.adapter-observation/v1`: path/link IDs, exact state/evidence fields, source, epoch, request nonce, observed time, freshness, reason codes, byte/cardinality limits; `packages/codex-app-server-wrapper` schema/docs. | None | Schema review against [UX states](../ux/ADAPTERS.md), no raw identifiers/tokens/paths. |
| B | L3 / final security | After functional checks, owner selects and proves production per-user endpoint discovery/authentication, Linux socket and Windows named-pipe ACL rules; perform threat/privacy review and adversarial access, replay, and redaction tests. | H | Explicit owner decision and passing unauthorized-client/cross-user tests. Blocks J and packaged enablement, not L0–L2 development work. |
| C | L0 / projector | Add gateway-owned observation counters for child/initialization lifecycle and pure `projectAdapterObservation(observationState, clock)`; derive only allowlisted aggregates, never raw `gateway.inspect()` output. | A | Node unit tests; observation and projection perform no spawn, RPC, filesystem read, pruning, or session mutation. |
| D | L0 / fixture matrix | Gateway-projector fixtures: no session, child started/not initialized, initialized/child exited, failed, DSH selected. Separate CLI/UI fixtures: no gateway, stale, optional disabled, incompatible schema. | A, C | Expected claim/negative-claim table passes; assert output contains no consumer ID, request, resume material, or private content. |
| E | L1 / development-only read API | In an isolated same-user harness, gateway hosts a separate local observation path; fixed `are adapter-status --json` reads an explicit endpoint, checks a fresh nonce, enforces private local access, timeout/size limits, and schema validation. No default listener or packaged enablement. | C, D | Linux harness probe creates no session/backend/store record; unreachable/replayed response is non-green. If private local access is unavailable, remain fixture-only. |
| F | L1 / desktop bridge | Add fixed `get_adapter_snapshot` Tauri command with no arbitrary path/command input; validate schema, bound duration/output, avoid exposing auth material to JS. Companion Rust/capability/tests. | E | Unit/component tests for success, timeout, missing configuration, incompatible schema, stale data; only allowlisted projection reaches webview. |
| G | L1 / fixture-backed UI | Add Adapters navigation and selected-path states; Overview links to it; accessible status/freshness and quiet explicit refresh. Use test fixtures, never hard-coded production success. Companion UI/CSS/tests. | D | UI fixtures distinguish doctor PASS from gateway unknown and gateway running from backend ready; keyboard/screen-reader and failure-state review. |
| I | L2 / functional Windows harness | Exercise Windows local read/discovery in a private development harness; keep the endpoint disabled in packaged builds. Verify restart and timeout behavior without weakening Linux. Gateway/CLI/Companion/platform tests. | E, F, G | Native Windows same-user functional tests and Linux regression; no ACL or installed-product claim. If private access cannot be enforced, use fixtures only. |
| H | L2 / functional completion | Join G/F and I, expand Linux/Windows functional UI tests, measure idle and refresh resource cost, and review missing-gateway/restart behavior. No installer enablement. | F, G, I | Exact functional test matrix and measurements; no “secure,” release, or installed-product claim. |
| J | L3 / package gate | Only after B passes, enable the endpoint in exact Linux/Windows packages and run installed-resource, unauthorized-access regression, restart, rollback/uninstall, and freshness checks. Companion build/test docs and evidence. | B | Exact package and native test evidence; any candidate freeze or release remains a separate owner-authorized action. |

The IDs are the proposed SWU manifest: each has one parent task, write area,
dependencies, acceptance evidence, and check. Execution handoff must split
them into task-local contracts with exact file scope, command, owner, and
one selected SWU. This work-pack remains blocked until that split and the
applicable owner decisions are made; it is not a mutation-capable task sheet.

## Implementation detail rules

The projector must apply precedence per link: source absent → not configured or
not observed; current read failure → unavailable (prior success stale); gateway
response → running; attached client → client connected; backend child alive →
backend running; successful protocol initialization **while that child remains
alive** → backend ready. Do not
derive higher claims from lower ones. Use a monotonic read deadline locally;
include wall-clock observation time for display. Compare runtime epoch on
successive reads and discard old-instance status after restart. Aggregate
counts only after privacy review. Distinct adapter IDs are selected from the
gateway's actual configuration, not product metadata. Normalize error details
to stable reason codes before any renderer handoff.

## Validation and non-regression

| Check | Required evidence |
| --- | --- |
| Source | Existing gateway/backend tests plus new pure projection and negative-claim fixtures. |
| Effect boundary | Probing cannot call normal gateway connect, create a session, spawn Codex/DSH, append session store records, or execute an ARE decision/effect. |
| Minimum L1 boundary | Development harness is same-user, explicit-endpoint, private local access only; no renderer secrets, token/path/private thread data, default listener, or packaged enablement; output bounded. If this fails, use fixtures only. |
| Final L3 security | Cross-user and unauthorized renderer-origin requests denied on native Linux/Windows; threat/privacy review, replay and redaction tests pass before package enablement. |
| Failure recovery | Missing gateway, refused/slow endpoint, stale receipt, restart, backend crash, schema drift, and malformed response produce precise non-green states. |
| Platform | Native Linux and Windows development-harness tests at L1/L2; packaged resource discovery and installed UI smoke only after B at L3. Source-only tests do not establish OS behavior. |
| UX/accessibility | Selected adapter, source, time, and uncertainty understood without color; focus and status announcements stable. |
| Resource | Dashboard-closed idle path creates no polling/model process; measured CPU, total memory, and refresh cost meet owner-set budgets. |

## D65 two-lane status and blockers

- Product frontier: L0 projection and fixtures; **planning-ready**, not
  execution-authorized. A separately routed bounded implementation request is
  required even after schema review.
- Product work: A, C, D, then G fixture UI and E/F development-only live path,
  followed by I/H functional checks. B is the final security gate before J.
- Operational support: product owner defines supported OS and resource budgets;
  platform owner verifies final Windows ACL and Linux peer isolation at B. Signing,
  updater, deployment, and macOS remain deferred operational residue.
- Causal blockers: failure to guarantee a private local L1 harness blocks
  live E/F/I but not fixture-backed G. No final IPC/auth/privacy proof blocks J
  and normal packaged use, not earlier functional work. Goals validation
  blocks admitted execution-state registration, not drafting this plan.
- Gate status: **block** for mutation-capable execution and any release claim.

## Open Questions

- Which minimum private local transport can be used in the isolated L1/L2
  harness? Full authentication and cross-user proof are B's final gate.
- Who owns exact schema and redaction approval for aggregate session state?
- What is the supported OS matrix, and what numerical idle/freshness budgets
  are acceptance criteria?
