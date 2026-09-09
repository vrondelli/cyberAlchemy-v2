# Rust desktop runtime and controlled-browser candidate

## Decision

**DERIVED — Primary candidate: shortest-boundary Chromium-specific candidate.** Retain the current React/Milkdown editor inside a Tauri 2 desktop shell; put Essays domain operations and persistence in an in-process Rust core backed by SQLite; and run a separately supervised, dedicated Chromium worker controlled through its inherited `--remote-debugging-pipe`. **OFFICIAL** Chromium source documents pipe handling; **DERIVED** controller → inherited pipe → Chromium DevTools dispatcher is the shortest selected control boundary, without a listening debug port or a Playwright process boundary. It is a candidate architecture and makes no speed ranking: benchmarks, browser launch, installation, compatibility, and security are **NOT_EVALUATED**.

**DERIVED — Fallback.** Where cross-engine, high-level browser behavior is an accepted requirement, retain the same core and envelopes but use Playwright's driver/server boundary. **OFFICIAL** Playwright documents its supported browser abstraction; **DERIVED** the extra protocol hop buys that abstraction. WebDriver BiDi is a standards fallback only after a per-browser D1–D15 capability matrix passes. **DERIVED** never silently downgrade CDP to Classic WebDriver or pipe control to an exposed socket.

**OFFICIAL (local source)** The current accepted product boundary is a local browser application with `network_effect: none`; this recommendation does not authorize a Rust replacement, SQLite, browser control, local server, remote HTTP, credentials, or external effects. The local compatibility target is the existing model/runtime and candidate realization baseline: [model](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/model.ts:12), [runtime](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/runtime.ts:158), and [baseline](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json:23).

## What remains product-owned

**OFFICIAL (local source) / DERIVED preservation rule.** The Rust core must preserve workspace identity/lifecycle, monotonic `expectedRevision` conflict handling, stable Markdown block/part identities, history and deterministic identity allocation, intent/plan attribution, addressable reviews, writer-approved prose, validation residue, typed problems, clean export, replaceable adapters, and `publicationEffect: "none"`. **DERIVED** a SQLite acknowledgement, IPC response, browser completion, or agent output is not writer acceptance; a proposal can become accepted Markdown only through the existing revision-checked product command and writer/owner gate. The preservation ledger and selectors are in [research evidence](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/research/2026-09-01-rust-desktop-runtime/research.md:7).

### Finite browser-control denominator

| ID | Required witness | Candidate protocol status |
|---|---|---|
| D1 | navigation lifecycle and cancellation | CDP candidate; **NOT_EVALUATED** |
| D2 | tabs, frames, isolated contexts, close | CDP candidate; **NOT_EVALUATED** |
| D3 | DOM snapshots/query and accessibility tree | CDP candidate; AX is experimental; **NOT_EVALUATED** |
| D4 | JavaScript evaluation and handles | CDP candidate; **NOT_EVALUATED** |
| D5 | input, locators, deterministic waits | adapter responsibility; **NOT_EVALUATED** |
| D6 | request/response observation, interception, body access | CDP Fetch/Network candidate; **NOT_EVALUATED** |
| D7 | download destination/events and upload | candidate; **NOT_EVALUATED** |
| D8 | permissions | candidate; **NOT_EVALUATED** |
| D9 | cookies and local/session/IndexedDB storage | candidate; **NOT_EVALUATED** |
| D10 | screenshot and print/PDF | candidate; **NOT_EVALUATED** |
| D11 | console/log and trace artifacts | candidate; **NOT_EVALUATED** |
| D12 | per-command deadline/cancellation | controller responsibility; **NOT_EVALUATED** |
| D13 | target/browser crash detection | supervisor responsibility; **NOT_EVALUATED** |
| D14 | reconnect semantics | explicitly unpromised for pipe; **NOT_EVALUATED** |
| D15 | whole process-tree cleanup | supervisor responsibility; **NOT_EVALUATED** |

**OFFICIAL** Chromium CDP documents the relevant Target and domain surfaces, and warns that tip-of-tree compatibility is not guaranteed; **DERIVED** pin a browser build and generated schema before any spike ([Target](https://chromedevtools.github.io/devtools-protocol/tot/Target/), [protocol domains](https://chromedevtools.github.io/devtools-protocol/tot/), [versioning warning](https://chromedevtools.github.io/devtools-protocol/)). **DERIVED exclusions:** OS-native dialogs, keychains and credential stores, CAPTCHA or site-control evasion, sandbox escape, hostile-site permissions, and every unapproved network/external effect.

## Components, topology, and trust zones

Primary topology, in prose:

```text
React/Milkdown WebView --Tauri capability-scoped commands--> Rust Essays core
                                                       |--> SQLite state/journal
                                                       |--> proposal/evidence store
Rust browser controller --inherited CDP pipe--> supervised Chromium worker
```

**DERIVED** The application WebView is the editor surface, not the controlled browser. **OFFICIAL** Tauri capabilities restrict which frontend can invoke commands; **DERIVED** application code still owns revision, writer-approval, and proposal checks ([Tauri runtime authority](https://v2.tauri.app/security/runtime-authority/), [permissions](https://v2.tauri.app/security/permissions/)). **DERIVED** keep updater and network features disabled initially.

**DERIVED** The Chromium worker receives an ephemeral non-default profile, bounded queues/deadlines, closed unintended inherited descriptors, captured stdout/stderr, and a controller-owned typed CDP adapter. **OFFICIAL** `pidfd_open` gives a pollable process identity; **DERIVED** on Linux use a dedicated session/process group, pidfd where available, deadline-based graceful close, then group termination/reaping ([Linux `pidfd_open(2)`](https://man7.org/linux/man-pages/man2/pidfd_open.2.html)). **DERIVED** cgroups/namespaces/seccomp are separately designed defense-in-depth, never a way to weaken Chromium's sandbox. **DERIVED** pipe is preferable for a controller-owned child because no debug listener is created; a CDP socket is only a separately justified attach/reconnect design, whose authentication is **NOT_EVALUATED**.

**DERIVED** Fallback topology substitutes `Rust controller → Playwright driver/server → browser`. **OFFICIAL** Playwright documents that a server endpoint is controllable by anyone who knows its path and documents `connect` version matching; **DERIVED** protect it as a secret-bearing control plane, never a default local service ([BrowserType](https://playwright.dev/docs/api/class-browsertype)). **OFFICIAL** BiDi specifies a protocol surface; per-browser portability remains **NOT_EVALUATED** ([WebDriver BiDi](https://www.w3.org/TR/webdriver-bidi/)).

### Seven trust zones and crossings

| Zone | Owner / trust | authenticated crossing | failure behavior |
|---|---|---|---|
| Z1 editor WebView | untrusted/limited renderer | Tauri capability + core actor policy | deny; no semantic mutation |
| Z2 Rust semantic core | product authority | in-process typed call | reject invalid lifecycle/revision; emit typed problem |
| Z3 accepted-state SQLite | private durable accepted state | core-only file handle/transaction | rollback/leave prior accepted state on uncertain commit |
| Z4 proposal/evidence store | private but non-authoritative artifacts | core writes immutable refs; no direct frontend write | quarantine missing/invalid artifact; no acceptance |
| Z5 browser controller | least-privilege control adapter | typed action capability + action ID | cancel/record unavailable; no inferred evidence |
| Z6 Chromium worker | sandboxed external-content process | inherited private CDP pipe, no listener | kill/reap; action becomes uncertain, never successful |
| Z7 remote peer (later) | separately authenticated principal | explicit mTLS/token/authorization design **NOT_EVALUATED** | reject unavailable/unauthenticated peer; no fallback to local trust |

**DERIVED** Browser evidence crosses Z6 → Z5 → Z4 as an inert proposal and only enters Z2 through an allowed command; it neither accepts prose nor authorizes a site action. **DERIVED** credentials never enter essays, envelopes, logs, debug URLs, or evidence exports. Z7 is absent from the initial no-network-effect candidate.

## State and communication boundary

**DERIVED ownership:** Rust owns `domain` (lifecycle/revisions), `application` (commands/queries), `persistence` (SQLite transaction/migration), `desktop` (Tauri binding), `browser` (typed CDP and supervision), and `transport` (wire mapping). React/Milkdown remains a replaceable editor adapter. **DERIVED candidate rule:** SQLite is the accepted-state store; one transaction must atomically check `expected_revision`, write state/event/idempotency outcome, and return the new revision. The journal shape, migrations, backup, encryption, rollback, corruption recovery, and crash durability are **NOT_EVALUATED**. **DERIVED** preserve raw `essays-workspace/v1` bytes and an import receipt before normalization; reject ambiguous identities rather than regenerating them.

One transport-neutral envelope maps to every boundary:

```json
{"protocol":"essays.v1","kind":"command|query|event|proposal","request_id":"UUID","schema_version":1,"method":"essay.save","body":{},"expected_revision":42,"idempotency_key":"caller-stable","deadline_ms":0,"trace_id":"opaque","capability":"least-privilege"}
```

**DERIVED contract:** `command` changes product state only after core revision/lifecycle checks; `query` returns a revision-qualified snapshot; `event` is sequenced and replayable-or-resync-required, never an acceptance acknowledgement; `proposal` carries base revision, source, evidence references, and no mutation authority. A `BrowserAction` carries action ID, capability, deadline, target policy and explicit authorization reference; `BrowserEvidence` carries action ID, immutable artifact ref, timestamps and outcome. Both remain proposals until an allowed product command consumes them. Results are `ok | conflict | rejected | cancelled | timeout | unavailable | protocol_mismatch` with stable receipts.

**DERIVED decision rules:** use direct in-process calls for the desktop core; introduce a supervised per-user UDS (Unix) / DACL-restricted named pipe (Windows) daemon only for a concrete independently restartable or multi-client need; map the same envelope to remote HTTPS only after remote identity/effect decisions. **DERIVED** do not add loopback HTTP solely to decouple modules: browser-origin, DNS-rebinding and CSRF exposure require distinct design. **OFFICIAL** pathname sockets and Windows pipe ACLs are available primitives ([`unix(7)`](https://man7.org/linux/man-pages/man7/unix.7.html), [named-pipe security](https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipe-security-and-access-rights)); **OFFICIAL** HTTP semantics are transport semantics, not local trust ([RFC 9110](https://datatracker.ietf.org/doc/html/rfc9110)).

## Dependency matrix (decision-time pins still required)

| Component | Candidate role | version evidence | license/status |
|---|---|---|---|
| Tauri | **DERIVED** shell/capability boundary | **OFFICIAL:** v2 family; exact version provisional / **NOT_EVALUATED** | **OFFICIAL:** dual license in repository; target SBOM **NOT_EVALUATED** ([source](https://github.com/tauri-apps/tauri)) |
| Milkdown | **DERIVED** retained editor | exact 7.21.1 is **NOT_EVALUATED** for this decision | **OFFICIAL:** MIT repository license ([source](https://github.com/Milkdown/milkdown)) |
| Chromium/CDP | **DERIVED** primary controlled engine/protocol | pinned build/schema **NOT_EVALUATED** | redistribution/license closure **NOT_EVALUATED** ([pipe source](https://chromium.googlesource.com/chromium/src/+/main/content/browser/devtools/devtools_pipe_handler.cc)) |
| chromiumoxide | **DERIVED** possible Rust CDP adapter | exact release and pipe compatibility **NOT_EVALUATED** | repository license evidence is **OFFICIAL**; target closure **NOT_EVALUATED** ([source](https://github.com/mattsse/chromiumoxide)) |
| Playwright | **DERIVED** fallback driver/server | 1.62.1 is release evidence, not a pin | **OFFICIAL:** Apache-2.0 repository/release; redistribution closure **NOT_EVALUATED** ([release](https://github.com/microsoft/playwright/releases/tag/v1.62.1)) |
| fantoccini | **DERIVED** Classic client, not primary | 0.22.1 docs evidence, not a pin | **OFFICIAL:** MIT OR Apache-2.0 docs/repo evidence ([docs](https://docs.rs/crate/fantoccini/latest)) |
| Wry | **DERIVED** lower-level alternative | exact version **UNRESOLVED / NOT_EVALUATED** | license/target closure **NOT_EVALUATED** ([source](https://github.com/tauri-apps/wry)) |
| Dioxus / Slint / egui | **DERIVED** editor-rewrite alternatives | exact versions **NOT_EVALUATED** | license and parity review **NOT_EVALUATED** ([Dioxus](https://github.com/DioxusLabs/dioxus), [Slint](https://github.com/slint-ui/slint), [egui](https://github.com/emilk/egui)) |

**DERIVED:** every row needs a fresh exact version, lockfile, target-specific SBOM and transitive-license review before implementation. No row is an approval to install.

## Measurements, failure plan, and migration

### Owner-revisable hypothesis budgets

Every figure below is a **DERIVED HYPOTHESIS / NOT_EVALUATED**, not a requirement, current result, or performance claim. Run at least 30 warm repetitions plus 10 cold runs against a pinned browser/profile and record p50/p95/p99, CPU, RSS, bytes and failures; compare pipe CDP, justified loopback WS CDP, Playwright, BiDi and Classic on the same fixture.

| Witness | HYPOTHESIS budget | required percentile / failure condition |
|---|---:|---|
| cold desktop-ready | ≤ 2,000 ms | p95; no crash in 10 cold runs |
| warm desktop-ready | ≤ 500 ms | p95 |
| idle RSS | ≤ 350 MiB | p95 after 60 s idle |
| installer artifact | ≤ 80 MiB | single artifact bytes |
| editor key-to-paint | ≤ 32 ms | p95; ≤ 80 ms p99 |
| accepted SQLite save | ≤ 20 ms | p95; no partial accepted state on injected crash |
| in-process command RTT | ≤ 2 ms | p95 |
| local UDS/pipe RTT, if introduced | ≤ 5 ms | p95 |
| CDP `Runtime.evaluate` RTT | ≤ 25 ms | p95 at concurrency 1; report 8/32/128 separately |
| navigation / DOM query / interception | ≤ 3,000 / 100 / 50 ms | p95, fixture-specific |
| screenshot / PDF | ≤ 750 / 2,000 ms | p95 |
| cancellation / crash detection | ≤ 500 / 1,000 ms | p95; action recorded uncertain |
| orphan cleanup / restart recovery | ≤ 2,000 / 5,000 ms | p95; no surviving worker/process group |

The owner may revise these units and bounds before a spike; every witness remains **NOT_EVALUATED** until a reproducible receipt exists.

**DERIVED / NOT_EVALUATED failure plan:** inject stale revisions, duplicate idempotency keys, protocol mismatch, unauthorized local client, migration rollback, crash during save, browser crash, daemon crash, lost transport, partial import, orphan process, and restart recovery. A failed or uncertain import/action leaves accepted source state unchanged and records visible residue.

### Stable-ID and authority trace

1. **DERIVED / NOT_EVALUATED:** retain immutable `essays-workspace/v1` import bytes, SHA-256 and import receipt; validate schema/workspace ID before an open.
2. **OFFICIAL (local source) / DERIVED:** `open(workspace_id)` returns the persisted workspace/revision and stable essay, block, part, review and event IDs; unknown or ambiguous identity rejects rather than regenerates.
3. **DERIVED / NOT_EVALUATED:** a Markdown edit runs the selected reconciliation algorithm, preserves provable block/part IDs, and records which anchors became stale; exact algorithm parity is unproven.
4. **OFFICIAL (local source) / DERIVED:** `save(command_id, expected_revision)` atomically checks the revision. A committed ID is idempotent; stale `expected_revision` returns `REVISION_CONFLICT` with expected/actual revisions, never a transport-success substitute.
5. **DERIVED / NOT_EVALUATED:** after restart/reload, `workspace_id`, current revision, history, IDs, command outcome and visible residue reload exactly; uncertainty means `unavailable`, not success.
6. **DERIVED / NOT_EVALUATED:** an agent/browser proposal gets immutable `proposal_id`, `base_revision`, provenance and evidence refs; an authorized `BrowserAction` gets `action_id`; returned artifacts receive immutable evidence IDs. No one of these IDs mutates accepted prose.
7. **OFFICIAL (local source) / DERIVED:** writer acceptance issues a revision-checked product command. Review anchors retain `block_id`/`part_id`; a conflicting edit marks the review stale rather than silently retargeting it.
8. **OFFICIAL (local source) / DERIVED:** validation emits named residue; export binds revision and validation result and retains `publicationEffect: none`. Export is not publication.
9. **DERIVED / NOT_EVALUATED:** cutover is a versioned import/migration receipt; rollback restores the immutable import bytes or prior accepted SQLite snapshot, without inventing IDs. Crash during save/migration, lost response, or browser death produces an uncertain outcome requiring reload/reconciliation, never inferred completion.

**DERIVED / NOT_EVALUATED staged migration:** (0) freeze the semantic fixture/compatibility ledger; (1) retain the current frontend while adding no runtime replacement; (2) implement a Rust core only after its D65 chain; (3) shadow/import with fixtures and rollback receipts; (4) bind Tauri to the retained React/Milkdown adapter; (5) add disabled browser-worker seams and D1–D15 tests; (6) request a separate owner decision for any enabled browser or network effect. **OFFICIAL** Windows provides Job Objects and requires an explicit handle-inheritance design ([job objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)); macOS/system-WebView behavior and cross-platform parity are **NOT_EVALUATED**.

## Predecessors, rejected alternatives, residue

**OFFICIAL (local governance source):** the named CAV2-D65 chain is canonical definitions → Product Capability → capability-local business ontology → DomainSpec v2 authored source → deterministic compiled graph/system ontology → exact implementation binding → conformance evidence. **DERIVED:** the new decision must define Rust ownership, proposal/action/evidence authority, persistence/migration, browser control, IPC/remote identity and effect limits; compile/rebind changed source; obtain a fresh immutable owner decision; then execute conformance fixtures. **OFFICIAL (local source):** the current candidate baseline cannot admit a different target ([predecessor ledger](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/research/2026-09-01-rust-desktop-runtime/research.md:62)).

**DERIVED rejected primary alternatives:** direct Wry (version **UNRESOLVED / NOT_EVALUATED**, and no claim of comparative shell size), Dioxus/Slint/egui (editor rewrite and Milkdown parity **NOT_EVALUATED**), Electron (resource/operational comparator only), always-on local daemon/loopback HTTP (unjustified trust/lifecycle cost), exposed CDP socket (authentication **NOT_EVALUATED**), WebDriver Classic (D1–D15 sufficiency **NOT_EVALUATED**), and a browser WebView treated as the controlled browser. These are not permanent rejections: new evidence can reopen them.

**NOT_EVALUATED residue:** exact Markdown reconciliation, database policy, migration/backup/encryption, CDP crate pipe support, Chromium licensing/redistribution, Playwright packaging, BiDi engine conformance, macOS supervision, hostile-local-client handling, and all performance/security/accessibility claims.

### Skeptic verdict matrix

| Gate | Verdict | Required consequence |
|---|---|---|
| Precedent/licensing (Lakatos) | **DERIVED:** PASS WITH REPAIRS | fresh version/license/SBOM and source-specific capability review before binding; no KILL authority |
| Non-vacuity (Russell) | **DERIVED:** PASS WITH MEASUREMENT GATE | D1–D15 traces, budgets, failure injection and property-preserving migration witnesses are mandatory; all currently **NOT_EVALUATED** |
| Definitional soundness (Quine) | **DERIVED:** PASS WITH BOUNDARIES | preserve distinctions among Rust-owned/wrapped, WebView/controlled browser, local/offline, proposal/acceptance, export/publication, and acknowledgement/semantic commit |

## Claim ceiling

**DERIVED claim ceiling:** this is read-only, cited research and a candidate architecture decision record. It does **not** claim implementation, installation, a launched browser/server, measured speed, full protocol coverage, semantic compatibility, security, owner acceptance, publication, release, deployment, production readiness, or authority for external effects. The recommended path becomes evaluable only through the new D65 predecessors and the explicitly listed witnesses.
