# Explorer returns

The sections below preserve the substantive explorer returns verbatim. They are research evidence, not implementation or effect authority.

## Turing, Alan

## Turing — semantic compatibility, persistence, migration, and D65 ledger

Status: read-only research evidence under `CA2-ROUTE-RESEARCH` (candidate). No source was changed, compiled, installed, migrated, launched, or externally contacted. This report is not implementation authority, equivalence evidence, acceptance, or permission to add a Rust runtime, SQLite, browser control, local IPC, remote HTTP, or network effects.

### Compatibility contract

| Property | Current denominator | Rust compatibility requirement | Status |
|---|---|---|---|
| Workspace identity and lifecycle | `workspaceId`, writer, title, `intent → plan → draft → review → validated`, workspace revision and last event. [model.ts:95-127](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/model.ts:95) | Preserve exact identifiers and transition guards, or create a versioned successor with explicit migration semantics. | Behavior-compatible minimum |
| Monotonic optimistic revision | Each mutation compares `expectedRevision`; persistence compare-and-swaps the stored revision; conflict is mapped to `REVISION_CONFLICT`. [runtime.ts:371-404](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/runtime.ts:371), [local-storage-repository.ts:20-27](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/adapters/local-storage-repository.ts:20) | A Rust transaction must atomically load/check/update the workspace revision, advance it exactly once, and return a typed conflict containing expected and actual values. Transport acknowledgement cannot substitute for this semantic commit. | Behavior-compatible minimum |
| Stable Markdown blocks | Each draft has block IDs/part IDs/ordinals; revisions retain block indexes and history. [model.ts:29-42](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/model.ts:29), [runtime.ts:192-215](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/runtime.ts:192) | Preserve block reconciliation behavior and identity continuity across admitted edits. Byte-identical reconciliation is not established because the selected `markdown` implementation was outside the packet. | Behavior-compatible; algorithm exactness unknown |
| History and deterministic IDs | Essay revision history is retained; identity allocation uses `nextIdentity`; events record revision/time/type. [model.ts:37-42](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/model.ts:37), [runtime.ts:71-79](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/runtime.ts:71), [runtime.ts:427-437](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/runtime.ts:427) | Preserve identity uniqueness, ordering, current state, historical snapshots, and event semantics. Exact byte-for-byte timestamps/serialization are deliberately not a requirement evidenced here. | Behavior-compatible |
| Intent and plan attribution | Intent and plan carry `acceptedAt`; plan is local deterministic; plan cannot precede intent. [model.ts:12-27](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/model.ts:12), [runtime.ts:158-188](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/runtime.ts:158) | Keep intent/plan as product state; any agent or browser service may propose data only. It cannot set accepted state without the corresponding product operation. | Required |
| Writer-approved prose | Review disposition can carry Markdown only when the disposition is accepted; it then creates a new draft revision. [runtime.ts:238-275](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/runtime.ts:238) | A proposal must remain separate from `ResolveEditorialReview`/`SaveDraftRevision`; only a writer-authorized command may alter accepted Markdown. | Required |
| Addressable review | Reviews bind comments to `blockId`, `partId`, selected/original text, priority, state, and reviewed revision. [model.ts:44-66](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/model.ts:44) | Preserve selectors and stale-review semantics; amendments that change Markdown stale the review. | Required |
| Visible residue and validation | Validation creates named residue, counts blocking items, invalidates on state changes, and gates export. [model.ts:68-83](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/model.ts:68), [runtime.ts:278-324](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/runtime.ts:278) | Preserve all blocking semantics. A Rust validator may add versioned rules only through a new admitted definition/binding chain. | Required |
| Clean, non-publishing export | Export requires current ready validation, no blocking residue or comments, produces a manifest, and declares `publicationEffect: "none"`. [runtime.ts:327-368](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/runtime.ts:327), [model.ts:129-140](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/model.ts:129) | Preserve authoring/audience separation and `none` effect. Browser-control output/evidence is not an export or publication authorization. | Required |
| Typed problems | The existing vocabulary includes absence, duplicate, revision, lifecycle, input, review/comment, and export-block errors. [model.ts:142-158](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/domain/model.ts:142) | Retain a stable, transport-independent problem code mapping; wire errors must not erase conflict/gate detail. | Behavior-compatible |
| Replaceable adapters | Product thesis declares editors, storage, and model providers subordinate to Essays contracts. [PRODUCT-THESIS.md:65-78](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/PRODUCT-THESIS.md:65) Repository port is only `load` plus expected-revision `save`. [workspace-repository.ts:3-6](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/ports/workspace-repository.ts:3) | Rust persistence, UI, browser worker, and transport must remain implementation bindings/adapters, not product-meaning owners. | Required |
| Single-writer / no network effect | Current first vertical is local and single-writer. [PRODUCT-THESIS.md:61-63](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/PRODUCT-THESIS.md:61) Candidate baseline names browser local storage and `network_effect: none`. [REALIZATION-BASELINE.candidate.json:23-31](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json:23) | Rust, SQLite, local server, remote HTTP, or collaboration are deliberate changes, not compatible replacements. | Deliberately changed; owner decision required |

### Proposed transport-neutral boundary

This is a candidate shape only; it does not select a framework or transport.

- `Query { request_id, workspace_id, known_revision?, kind }` → `WorkspaceSnapshot | Problem`.
- `Command { command_id, workspace_id, expected_revision, actor, kind, payload }` → `Committed { workspace, event } | Problem`. `command_id` is an idempotency identity; semantic success remains the revision-checked committed transaction.
- `Proposal { proposal_id, source, workspace_id, base_revision, kind, payload, evidence_refs }` → an inert, addressable proposal record. It is never a `Command`.
- `Event { event_id, workspace_id, workspace_revision, type, occurred_at }` → durable state-change projection only after a successful commit.
- `BrowserAction` and `BrowserEvidence` belong to a separate adapter contract. Completion/evidence may create or update a proposal, but cannot mutate accepted essay state.

An in-process Rust core may invoke this boundary directly. Local IPC and remote HTTP must map the same envelope, retain command/proposal/attempt identities separately, version the payload schema, and preserve the expected-revision check at the core. This follows the selected migration precedent’s separation of durable coordinator, semantic reducer, raw provider evidence, and identities—not as direct Essays proof. [rwo…synthesis.md:85-115](/home/vrondelli/projects/domainspec-core/.arcanum/inventory/entries/rwo-codex-runtime-migration-research-audited-result-synthesis.md:85)

### Persistence and migration ledger

| Area | Candidate preservation rule | Open decision / witness |
|---|---|---|
| SQLite state | One transaction should commit workspace snapshot, workspace revision, event, and idempotency outcome together; a normalized revision/event journal is optional. | Current port proves snapshot/CAS semantics, not journal schema, SQLite choice, backup, FTS, encryption, or migration mechanism. |
| Existing browser records | Read and validate `essays-workspace/v1`, import only after exact schema/identity checks, preserve source bytes and an import receipt. Existing adapter rejects incompatible schema/workspace identity. [local-storage-repository.ts:10-17](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/runtime/src/adapters/local-storage-repository.ts:10) | No migration code or fixture is in scope; rollback, corruption, duplicate import, and partial import behavior are unknown. |
| Schema evolution | Keep the existing schema as an explicit source format; introduce a Rust-owned persisted schema/version only with forward/rollback policy and deterministic fixture set. | Bit-compatible JSON serialization is unspecified; do not promise it. |
| Revision/history import | Preserve `currentRevision`, draft `revisionHistory`, `nextIdentity`, events, review/residue ties, and block IDs; reject/freeze ambiguity rather than silently regenerating identities. | Full block reconciliation behavior was not read; therefore no exact identity-preservation claim for transformed Markdown. |
| Recovery | Failed import or stale write must leave the accepted source state intact; write new state atomically; preserve raw source receipt before normalization. | Crash-cut, filesystem durability, concurrent process, and backup witnesses are unexecuted. |
| Multiple essays | Workspace key is already the repository identity; one logical database can support multiple workspaces without altering semantics. | Cross-workspace indexes, search, deletion/archive, and tenancy are unspecified. |

The current baseline explicitly says changed implementation target, acceptance obligations, or other bound items require a new digest and renewed owner acceptance. [REALIZATION-BASELINE.candidate.json:150-153](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json:150)

### CAV2-D65 predecessor ledger for a Rust/network revision

| D65 predecessor | Current exact evidence | Required before implementation claim |
|---|---|---|
| Canonical definitions | Not read in the permitted source set; unknown exact definition records/selectors. | Owner must select/author canonical definitions for Rust ownership, proposal, browser action/evidence, local IPC, remote HTTP, persistence/migration, and effect boundaries. |
| Product Capability | Baseline points to `CA2-CAP-DEVELOP-GOVERNED-ESSAY`. [REALIZATION-BASELINE.candidate.json:5-8](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json:5) | Capability owner must decide whether browser control/network/desktop runtime belongs in scope; current product boundaries do not imply it. |
| Capability-local business ontology | Not read/identified in packet. | Define state/transition, proposal-versus-command, authority, persistence, migration, browser evidence, and transport identities. |
| DomainSpec v2 authored source | Current baseline binds a DomainSpec graph/build receipt by digest. [REALIZATION-BASELINE.candidate.json:9-21](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json:9) | New authored source must bind new concepts/operations/rules before a Rust/network realization can claim conformance. |
| Deterministic compiled graph/system ontology | Existing candidate bindings exist, but baseline remains `candidate-awaiting-owner-acceptance` and `not-accepted`. [REALIZATION-BASELINE.candidate.json:3-5](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json:3), [REALIZATION-BASELINE.candidate.json:144-149](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json:144) | Recompile/rebind the changed authored source and obtain fresh owner acceptance; existing candidate graph cannot admit a different target. |
| Exact implementation binding | Current binding is TypeScript/Vite/local browser storage/React-Milkdown and no network. [REALIZATION-BASELINE.candidate.json:23-68](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json:23) | A new immutable Rust/SQLite/desktop/IPC/browser binding, license and dependency record, migration boundary, and exact effect ceiling are needed. |
| Conformance evidence | Existing obligations name command ownership, writer approval, deterministic blocks, accessibility/browser evidence, and no added network. [REALIZATION-BASELINE.candidate.json:125-134](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json:125) | Future fixtures must witness revision conflicts, migration/recovery, proposal non-mutation, review/residue/export gates, browser evidence isolation, and any explicitly accepted transport/effect behavior. |

### Explicit non-collapse constraints

- A Rust wrapper is not Rust-owned product semantics.
- A SQLite commit is not writer acceptance unless it passed the command, lifecycle, and revision rules.
- A browser or agent result is a proposal/evidence input, not accepted prose, validation truth, export, or publication.
- Localhost/IPC is not equivalent to offline or trusted; remote HTTP is a new product/effect decision.
- The current baseline’s `publication_effect: none` and the thesis’s external-effect prohibition remain controlling. [PRODUCT-THESIS.md:96-106](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/PRODUCT-THESIS.md:96)

### Unknowns and residue

1. Exact canonical-definition and Essays business-ontology selectors are unknown within this packet.
2. Exact Markdown reconciliation, deterministic formatting denominator, and all permissible edit classes are unknown because its implementation was not a named target.
3. SQLite journal/schema/migration/backup/encryption/crash behavior is unselected and unwitnessed.
4. UI framework, IPC/HTTP protocol, browser protocol, supervision model, licenses, versions, security behavior, and performance are outside this explorer’s local-only source set.
5. No current authority admits a server connection, agent proposal protocol, Rust realization, or baseline replacement; the packet states all of those gaps explicitly. [strategy-inventory-packet.json](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/essays/research/2026-09-01-rust-desktop-runtime/strategy-inventory-packet.json)

No semantic equivalence has been demonstrated. The safe conclusion is a preservation target and predecessor queue, not a migration authorization.

## Shannon, Claude

Shannon / Claude — read-only desktop-shell report (as of 2026-09-01)

Status and scope: CA2-ROUTE-RESEARCH, candidate route. This is external upstream evidence only; it neither admits an architecture nor authorizes replacement, installs, benchmarking, browser launch, persistence migration, network effect, publication, or acceptance.

Ranking (desktop/editor delivery only; not a final architecture decision)
1. Tauri 2 + retained React/Milkdown — strongest candidate. It retains existing HTML/JS frontend and Milkdown rather than reauthoring the high-risk WYSIWYG/Markdown/IME/clipboard surface; application logic can be Rust-side behind explicit commands. Tauri says it accepts any HTML/JS/CSS frontend, packages platform installers, and uses a native WebView protocol rather than a localhost server; platform support is Windows, macOS, Linux (Tauri 2: WebKitGTK 4.1), iOS, Android. Official source: https://github.com/tauri-apps/tauri (features/platforms); architecture/update details: https://github.com/tauri-apps/tauri/blob/dev/ARCHITECTURE.md. Milkdown is a ProseMirror/remark-based plugin-driven WYSIWYG Markdown editor, MIT: https://github.com/Milkdown/milkdown.

Official security claim: Tauri v2 runtime authority checks invoking webview origin/capability/scope before dispatch; denied commands are not invoked. Sources: https://v2.tauri.app/security/runtime-authority/ and https://v2.tauri.app/security/permissions/. This is an IPC exposure control, not semantic authority for Essays: Rust commands still must enforce expected revision/writer approval/proposal state. Updater is an optional effectful feature; dangerous updater commands are blocked until capability permission is added: https://v2.tauri.app/plugin/updater/. Do not enable it in an initial no-network-effect candidate.

Tradeoffs: system WebView makes engine and assistive behavior platform-variable (WebView2 Windows, WKWebView macOS, WebKitGTK Linux); it also leaves the existing React/Milkdown compatibility work principally as regression testing rather than a rewrite. There is no current official, comparable startup/idle-memory/binary-size benchmark for this product: measure it.

2. Wry — viable only where minimum shell surface outweighs Tauri capability/bundling/updater/packaging infrastructure. Wry is a low-level cross-platform Rust WebView library requiring an event loop and a suitable window/GTK host; it runs WebKitGTK on Linux, native WebKit macOS, and WebView2 Windows. Its own docs call out separate GTK integration for Linux and advise special construction for X11+Wayland. This creates an owned security/packaging/accessibility/focus/IPC responsibility rather than reuse of Tauri’s permission model. Official source: https://github.com/tauri-apps/wry (especially platform considerations); Apache-2.0 OR MIT. Latest release visible on 2026-09-01: wry 0.56.1, signed release 2026-08-13: https://github.com/tauri-apps/wry/releases. It retains React/Milkdown similarly to Tauri, but has lower framework overhead and substantially higher integration/risk cost.

3. Dioxus desktop — credible Rust-first alternative, not a low-cost migration. Desktop renderer uses a WebView through Wry/Tao, runs Dioxus VirtualDOM on a native thread, exposes window/webview/JS hooks, and claims macOS/Linux/Windows support. Official sources: https://github.com/DioxusLabs/dioxus and https://github.com/DioxusLabs/dioxus/tree/main/packages/desktop. It is MIT OR Apache-2.0. The upstream repo’s latest release shown is v0.7.9 (2026-05-08). Its sub-5MB / sub-3MB claims are upstream project claims, not Essays measurements. It would require a React+Milkdown replacement or embedding/rearchitecting; native system access without IPC means the product must supply its own trust boundary.

4. Slint — Rust-native declarative UI and meaningful accessibility surface, but not a Milkdown-compatible editor stack. Slint’s UI language connects to Rust; current source version says 1.18.0 and license choice is GPL-3.0-only OR Slint Royalty-free-2.0 OR paid software license: https://github.com/slint-ui/slint/blob/master/Cargo.toml. The royalty-free route permits desktop/mobile/web proprietary distribution only subject to its attribution obligation; confirm it fits the intended distribution: https://github.com/slint-ui/slint/blob/master/FAQ.md. Accessibility is feature-gated and attempts OS accessibility-tree exposure: https://github.com/slint-ui/slint/blob/master/api/rs/slint/Cargo.toml. It has native TextEdit/context menu improvements, but that is not evidence of parity with ProseMirror/Milkdown semantics, IME edge cases, plugins, addressable stable blocks, or review anchors. Better fit only after a deliberate native-editor product decision.

5. egui/eframe — good Rust-native operational console/prototype, weak primary Essays editor candidate. egui is immediate-mode; official maintainers say it is not for apps needing a native look or upgrade stability, and that integrations own input/output/painting: https://github.com/emilk/egui. It provides text edit, clipboard/undo/emoji and AccessKit accessibility, but that does not establish rich Markdown editor parity. MIT OR Apache-2.0.

Comparator only: Electron. It preserves React/Milkdown and ships a consistent Chromium+Node runtime/process separation, but it is not a presumption. Electron says each BrowserWindow/web embed gets its own renderer process; main process exposes OS APIs: https://www.electronjs.org/docs/latest/tutorial/process-model. Its security guidance explicitly warns that Electron is not a browser and arbitrary untrusted content is a severe risk, requiring current framework/dependency maintenance: https://github.com/electron/electron/blob/main/docs/tutorial/security.md. MIT: https://github.com/electron/electron/blob/main/LICENSE.

Accessibility, keyboard, IME, clipboard: Official sources establish platform technology/capabilities, not cross-platform Milkdown regression parity. Mandatory spike witnesses: composition with CJK/emoji/dead keys; multi-line selection, paste/cut, undo/redo; focus transitions between editor/menu/dialog; screen reader traversal/announcements; keyboard-only review controls; clipboard rich/plain Markdown round trip; stable block/review anchors through edits.

Versions/license evidence (pin only after fresh verification): Wry 0.56.1 (2026-08-13); Dioxus 0.7.9 (2026-05-08); Slint source 1.18.0; egui published 0.34.3 (2026-05-27) while main indicates 0.35.0; Milkdown 7.21.1 (2026-05-13), all via the linked official release/repo artifacts. Tauri 2 and Electron current stable exact version were not reliably extractable from the allowed official pages in this pass; do not state a numeric lock until rechecked against their release pages at decision time. Every dependency needs a generated, target-specific license/SBOM review: framework top-level licenses do not clear transitive platform WebView/runtime licenses.

Measurements still required (none performed): reproducible clean-machine cold start, idle working set, installer/binary/package size, editor keystroke-to-paint p50/p95/p99, paste/undo/review-anchor repair, accessibility smoke tests, startup with cold WebView cache, multiple essays/windows, updater/signing artifact sizes, crash/relaunch/state recovery, and Linux X11/Wayland plus Windows/macOS WebView version matrix. Treat upstream ‘small/fast’ statements as official marketing/project claims, not requirements evidence.

Decision boundary: this ranking does not pick final browser/control process architecture. The smallest credible desktop recommendation is Tauri 2 retaining existing React/Milkdown, Rust domain persistence behind narrow commands, with no updater/network features enabled. Wry is fallback only if evidence shows Tauri’s framework layer blocks a required capability; Dioxus/Slint/egui are deliberate editor rewrites, not shell swaps. A new CAV2-D65 chain and owner decision remain prerequisites for any Rust runtime/desktop shell/persistence or connectivity change.

## Hewitt, Carl

Research report — Hewitt, Carl

Primary: link the Essays Rust core directly into the desktop shell. Use Tauri commands for request/response and Tauri channels for bounded streaming; use events only as lossy, resynchronizable UI notifications. [Tauri commands](https://v2.tauri.app/develop/calling-rust/), [Tauri frontend communication](https://v2.tauri.app/develop/calling-frontend/)

Fallback: when an independently restartable companion, multi-client local service, or later non-desktop client actually exists, move the same core behind a supervised local daemon over a pathname Unix-domain socket on Unix and a DACL-restricted named pipe on Windows. Do not introduce loopback HTTP merely to decouple modules. Remote HTTPS is a later deployment topology, not a local-runtime substitute.

Use one versioned application envelope regardless of in-process, IPC, HTTP, or gRPC mapping:

```json
{
  "protocol": "essays.v1",
  "kind": "command | query | event | proposal",
  "request_id": "UUID",
  "schema_version": 1,
  "method": "essay.save",
  "body": {},
  "expected_revision": 42,
  "idempotency_key": "opaque, caller-stable for a logical command",
  "deadline_ms": 0,
  "trace_id": "opaque",
  "capability": "locally evaluated, least privilege"
}
```

- `command`: intent to change candidate or accepted state; every accepted-state command carries `expected_revision` and an idempotency key.
- `query`: read-only, cacheable only when response declares its revision/snapshot.
- `event`: sequenced, replayable-or-resync-required notification; never an acceptance acknowledgement.
- `proposal`: agent/browser output with provenance and evidence references. It has no transition to accepted prose or external browser action without the existing writer/owner gate.
- `result`: `ok | conflict | rejected | cancelled | timeout | unavailable | protocol_mismatch`, returning resulting revision plus a stable receipt ID where applicable.

JSON-RPC 2.0 is a reasonable wire shape for daemon IPC because it is transport-agnostic and specifies requests, correlated results/errors, and notifications. It does not define authorization, cancellation, flow control, idempotency, or version negotiation; Essays must define those fields itself. [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification)

For HTTP, map commands to explicit resource/action endpoints with an idempotency key and conflict result; map queries to GET or revision-qualified endpoints; map events to WebSocket/SSE only when a web or remote client needs them. [RFC 9110, HTTP semantics](https://datatracker.ietf.org/doc/html/rfc9110)

Tauri permissions/capabilities can scope which commands a given window/WebView may invoke; they are the right first boundary for an in-process desktop design, not a substitute for application-level revision or writer-acceptance checks. [Tauri permissions and capabilities](https://v2.tauri.app/security/permissions/)

For Unix IPC, use a pathname socket in a per-user private runtime directory, not Linux abstract sockets. [Linux `unix(7)`](https://www.man7.org/linux/man-pages/man7/unix.7.html). For Windows, use a named-pipe DACL restricted to the intended user/session SID. [Microsoft named-pipe security](https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipe-security-and-access-rights)

Linux may use a child process group/session and, where available, a pidfd for race-resistant exit observation and signaling. [Linux `pidfd_open(2)`](https://www.man7.org/linux/man-pages/man2/pidfd_open.2.html). Windows should use job objects with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`. [Windows job objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects). macOS process-group and exact Rust crate support remain unverified.

No latency, throughput, or resource claim is established. Before selecting a daemon or transport, measure warm/cold p50/p95/p99 for in-process calls; UDS/named-pipe requests; save conflicts and duplicate keys; cancellation; crash/restart/reconciliation; orphan cleanup; hostile local clients; and upgrade/protocol mismatch. Budgets must be owner-selected after baseline measurement; labels such as “fast” are not currently supported.

Unknowns include whether a daemon has a concrete first-release requirement, exact state ownership for browser actions/evidence, platform policy, remote identity and retention, SQLite migration/backup, and the complete new CAV2-D65 predecessor chain. Classification: cited platform/protocol statements are official-source observations; envelope, ranking, security design, and measurements are derived candidates; performance and compatibility remain unverified.

## Simon, Herbert

Simon explorer receipt (read-only, no browser/process/port/package/file effects). Non-authority candidate research; no measured performance or compatibility/admission claim.

FINITE DENOMINATOR (each must be tested independently; protocol/API presence != implementation parity): D1 navigate + lifecycle/cancel; D2 enumerate/create/close tabs, frames, isolated user/browser contexts; D3 DOM query/snapshot + AX tree; D4 JS eval + handles; D5 pointer/keyboard/touch/input + locator semantics and deterministic waits; D6 request/response observe, intercept, continue/abort/fulfill, body access; D7 downloads with destination/events + file upload; D8 permissions; D9 cookies plus local/session/IndexedDB storage; D10 screenshot + print/PDF; D11 console/log + trace artifacts; D12 per-command timeout/cancel; D13 browser/target crash detection; D14 reconnect semantics; D15 whole-process-tree cleanup. Exclude OS-native dialogs/keychain/credential stores, CAPTCHA/site-control evasion, sandbox escape, hostile-site permission, and any unapproved network/external effect.

1) Direct Chromium CDP over `--remote-debugging-pipe`: minimum transport path: Rust controller -> inherited pipe -> Chromium DevTools dispatcher. Chromium source documents default JSON (or CBOR), pipe FDs 3/4 on POSIX, and NUL-delimited JSON handling: https://chromium.googlesource.com/chromium/src/+/main/content/public/common/content_switches.cc and https://chromium.googlesource.com/chromium/src/+/main/content/browser/devtools/devtools_pipe_handler.cc and https://chromium.googlesource.com/chromium/src/+/78004dcca96b8e122dedc3b94d9ee94d19cb8cdd/components/devtools/devtools_pipe/devtools_pipe.h. Strongest evidenced Chromium denominator: Target creates contexts/tabs and disposal-on-detach https://chromedevtools.github.io/devtools-protocol/tot/Target/; CDP domains cover DOM, Runtime, Input, Fetch/Network, Storage, Browser permissions/downloads, Page screenshot/PDF, Log/Console, Tracing and Accessibility https://chromedevtools.github.io/devtools-protocol/tot/. AX remains Experimental and enablement can affect performance https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/. Tip-of-tree changes frequently with no backward-compat guarantee; pin browser build and generated schema: https://chromedevtools.github.io/devtools-protocol/.

2) CDP protected local socket adds HTTP/WebSocket discovery and framing. Chromium officially exposes discovery and target endpoints: https://chromedevtools.github.io/devtools-protocol/. Evidence does not establish per-client authentication. Pipe is preferred when controller owns child lifetime; socket only for justified attach/reconnect/multi-client behavior.

3) Playwright driver/server adds at least a driver protocol boundary. It offers high-level selectors, auto-waits, contexts, downloads, routing, permissions, and tracing across supported engines, but Rust has no official binding in the documented supported languages. `launchServer` exposes WebSocket control and warns that anyone knowing the path can control the OS user; `connect()` requires major/minor version match. `connectOverCDP` is Chromium-only and officially lower fidelity than Playwright protocol: https://playwright.dev/docs/api/class-browsertype. Current release evidence v1.62.1: https://github.com/microsoft/playwright/releases/tag/v1.62.1.

4) WebDriver BiDi is the cross-browser standards candidate. The current W3C spec includes user contexts/download behavior, navigation/tree/capture/print/locators, script, network interception, input, storage, logging and subscriptions: https://www.w3.org/TR/webdriver-bidi/. Treat permissions, storage breadth, AX, trace, upload, crash/reconnect and cancellation as gaps until per-browser conformance evidence.

5) WebDriver Classic retains stable navigation/windows/elements/scripts/cookies/actions/prompts/screenshots/print and upload: https://www.w3.org/TR/2026/WD-webdriver2-20260528/. It cannot satisfy rich interception/event/AX/trace/context control alone.

6) Rust clients. chromiumoxide is direct async CDP, Chrome/Chromium only; do not infer pipe support or complete high-level waits. Dual MIT/Apache-2.0: https://github.com/mattsse/chromiumoxide. fantoccini 0.22.1 is a WebDriver client requiring a driver; MIT/Apache-2.0: https://docs.rs/crate/fantoccini/latest and https://github.com/jonhoo/fantoccini. No evidenced maintained Rust Playwright client should be considered official.

Linux supervision: dedicated session/process group; close unintended inherited FDs; bounded stdout/stderr; pidfd for pollable exit identity where available https://man7.org/linux/man-pages/man2/pidfd_open.2.html; graceful close/deadline then process-group termination and reap. cgroup v2 may bound whole-tree accounting/kill. Namespaces/seccomp are separately designed defense-in-depth and must not disable Chromium’s sandbox. macOS uses process groups and platform-specific sandbox/IPC. Windows uses Job Objects with kill-on-close https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects and explicit handle inheritance https://learn.microsoft.com/en-us/windows/win32/procthread/inheritance.

Future benchmark: pinned browser and profile; at least 30 warm repetitions plus cold runs; p50/p95/p99, bytes, CPU/RSS and failures for Runtime.evaluate RTT at concurrency 1/8/32/128; context/tab creation; deterministic navigation; DOM+AX; interception; screenshot/PDF; cancellation; crash detection; reconnect where promised; orphan cleanup; restart recovery. Run the same fixture via pipe CDP, loopback WS CDP, Playwright, BiDi, and Classic. No speed ranking is established beyond expected protocol hop count.

Recommended boundary: primary Linux-first Chromium worker = directly supervised dedicated Chrome-for-Testing/Chromium process, non-default ephemeral profile, CDP pipe, generated/pinned schema, controller-owned typed adapter, bounded queues/timeouts and capability probing. Fallback = Playwright driver/server when cross-engine high-level behavior outweighs the extra boundary. Standards fallback = BiDi only after a browser capability matrix passes D1-D15. Do not silently fall from pipe to an exposed socket or from CDP to Classic.

Unknowns: exact chromiumoxide release and pipe transport; Playwright redistribution/license closure; per-browser BiDi implementation; authenticated CDP endpoint; measured latency; macOS pipe details; true cancellation and crash recovery semantics. None grants browser launch, prose acceptance, or external-effect authority.
