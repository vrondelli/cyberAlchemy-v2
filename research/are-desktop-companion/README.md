# ARE floating desktop companion — research baseline

Status: candidate research evidence, 2026-09-25. Owner route: `CA2-ROUTE-RESEARCH`.
This record does not admit a design, implementation, release, or OS-support claim.
Source selection follows [SOURCE-MAP.md](../../SOURCE-MAP.md); observed repository
behavior is distinguished from user decisions and design hypotheses below.

## User decisions and desired outcome

- User-stated: a movable, skinnable icon opens an attractive ARE management
  dashboard; the companion should work across operating systems with low
  resource use.
- User-confirmed: the icon is a **floating desktop companion**, not a tray or
  menu-bar icon.
- User-confirmed: the first dashboard is **read-only**. Moving the icon and
  changing its appearance are local UI preferences, not ARE operational writes.
- Interpreted scope: target Windows, macOS, and Linux desktop families first.
  “Any OS” is an ambition, not a testable universal compatibility guarantee.

## Current implementation evidence

1. ARE already exposes `doctor --json`, `decide route|context|effect|continue`,
   and other commands through [its CLI](../../implementation/agent-reasoning-engine/docs/CLI.md).
   Its [local MCP server](../../implementation/agent-reasoning-engine/packages/are-mcp-server/README.md)
   provides decision operations, read-only evolution status, bounded commands,
   and content-addressed evidence retrieval. Decision output grants no effect
   authority.
2. An existing [Tauri 2 desktop shell](../../essays/development/agent-runtime/implementation/desktop/src-tauri/tauri.conf.json)
   hosts the broader Workspace UI. Its [Rust bridge](../../essays/development/agent-runtime/implementation/desktop/src-tauri/src/main.rs)
   connects a Tauri channel to an ARE JSON-lines child process, with bounded
   command queue and event replay. The [TypeScript bridge](../../workspace/runtime/src/features/chat/are-chat-bridge.ts)
   and [chat surface](../../workspace/runtime/src/features/chat/ChatSurface.tsx)
   already render ARE receipts, status, errors, and human decisions.
3. That shell currently starts a single large `main` window, builds against
   `workspace/runtime/dist`, and prewarms the ARE/Codex bridge at setup. Its
   exposed `execute`, `chat_send`, and approval controls are outside this
   read-only dashboard scope. The [implementation status](../../essays/development/agent-runtime/implementation/IMPLEMENTATION-STATUS.md)
   says its test campaign and conformance are pending; code presence is not a
   validated cross-platform desktop product.
4. Workspace already has [visual tokens](../../workspace/runtime/src/styles.css)
   and a [receipt presentation](../../workspace/runtime/src/features/chat/chat.css).
   Reuse tokens and receipt component ideas selectively. The large Workspace
   shell, chat command path, auto-approval, and Essays SQLite runtime should
   not become dependencies of a minimal ARE companion by accident.
   Focused bridge/chat unit tests passed 11/11 on 2026-09-25 with
   `vitest run workspace/runtime/src/features/chat/are-chat-bridge.test.ts
   workspace/runtime/src/features/chat/ChatSurface.test.ts`; this does not
   validate the Tauri build, live ARE connection, or any other OS.
5. The ARE [architecture](../../implementation/agent-reasoning-engine/docs/ARCHITECTURE.md)
   leaves the stable public conversation projection for CLI/desktop/other
   clients open. The [conversation runtime](../../implementation/agent-reasoning-engine/packages/conversation-runtime/README.md)
   calls its facade a prototype and defers durable session storage and
   complete route-handler coverage. A polished dashboard cannot infer a
   historical management API from these candidate surfaces.

## Platform research and candidate choice

| Option | Relevant evidence | Assessment for this target |
| --- | --- | --- |
| Tauri 2 + system webview | [window configuration](https://v2.tauri.app/reference/config/), [process model](https://v2.tauri.app/concept/process-model/), [sidecars](https://v2.tauri.app/develop/sidecar/) | Best first experiment because this repository already has a Tauri/ARE bridge and web visual language. A dedicated small shell should be measured; neither low memory nor reliable floating behavior follows from the framework choice alone. |
| Wails | [frameless windows](https://v3.wails.io/features/windows/frameless/), [window options](https://v3.wails.io/features/windows/options/) | Viable alternative for a native Go bridge, but adds another runtime/language and does not eliminate Linux window-manager variation. |
| Electron | [process model](https://www.electronjs.org/docs/latest/tutorial/process-model), [performance](https://www.electronjs.org/docs/latest/tutorial/performance) | Mature JS path, but bundles Chromium/Node and has multi-process baseline; benchmark rather than assume it satisfies the low-resource requirement. |
| Flutter | [supported platforms](https://docs.flutter.dev/reference/supported-platforms) | Broad desktop support and custom visuals, but adds a distinct UI stack and platform integration work; lower reuse here. |

Tauri is a **candidate**, not a selected implementation dependency. A
drag-capable, borderless, transparent small window and a dashboard window are
supported configuration patterns, but Linux Wayland can refuse programmatic
position and always-on-top behavior. See the [Tauri/tao window note](https://docs.rs/tao/latest/src/tao/window.rs.html)
and [Tauri issue #14913](https://github.com/tauri-apps/tauri/issues/14913).
Linux behavior therefore needs a compositor/window-manager test matrix and a
documented degradation state. Tauri uses WebView2, WKWebView, and WebKitGTK
across the three desktop families; Linux/WebView prerequisites are documented
in [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

Counter-position: leaving the existing Workspace desktop as the only ARE UI
would reuse the most code and avoid another installer, but its full-size window,
prewarmed child, and mixed read/write chat surface conflict with this focused
floating/read-only/low-idle-cost objective. Conversely, building a new shell
from scratch could preserve that objective but duplicates tested transport and
visual patterns. The bounded experiment should isolate those reusable patterns
and measure both paths before committing to a shell topology.

## Smallest coherent product hypothesis

```text
floating ARE mark (drag area + separate click target + status dot)
    click / keyboard activation
        -> on-demand dashboard window
            Overview | Decisions | Activity | Diagnostics | Appearance
```

- The mark is a 64–80 logical-pixel window with three *bundled* skins to start.
  Theme choice and last usable screen-relative position are local preferences;
  recover the mark if monitor geometry changes. A user can hide/pause the
  always-on-top behavior without losing access to the dashboard.
- Distinguish click from drag using a deliberate threshold. Provide keyboard
  activation, an accessible name, visible focus, contrast-safe status, and
  reduced-motion behavior. No continuous animation when idle.
- Construct the dashboard only when opened; hide or destroy it when closed
  based on measured memory/startup trade-offs. Poll diagnostics only while it
  is visible or on an explicit refresh. Avoid a prewarmed ARE/Codex child in
  the idle-mark path.
- Read-only cards show source-bound product/health identity, active connection
  state, selected decision/receipt summaries, and diagnostics with timestamps
  and freshness. Unknown, disconnected, stale, and candidate states remain
  distinct; do not render absence as healthy.
- The renderer receives an allowlisted projection from an ARE-owned local
  adapter. It does not read repository files directly, execute arbitrary
  commands, or hold secrets. Mutation/approval controls are absent in v1.
  A bridge may reuse the existing Tauri channel/JSONL pattern but must use a
  new read-only interface rather than exposing `chat_send` or `execute`.
- A standalone installer needs a per-platform packaging story for the Node
  ARE runtime/sidecar and signed updates. A repo-dev build can use the local
  Node binary first, but that is not portable distribution.

## Validation questions for a later implementation route

- Define supported OS versions and Linux desktop sessions, then smoke-test
  drag, click, focus, transparency, multi-monitor recovery, DPI scaling,
  virtual desktops, and always-on-top degradation on each.
- Measure cold-start, idle CPU, added resident memory, dashboard open/close
  memory, battery impact, and process count against an agreed budget. Include
  the ARE child process and system webview, not only the Rust executable.
- Test disconnected ARE, corrupt/incompatible profile, missing sidecar,
  restart, stale data, renderer crash, and display topology change.
- Verify that no dashboard path can call mutating ARE methods, leak secrets, or
  treat a decision receipt as approval. Check CSP, local IPC/stdio boundary,
  accessibility, keyboard-only use, contrast, and reduced motion.

## Open Questions

1. Which ARE-owned versioned read-only projection/API will supply status,
   decisions, activity, and diagnostics across CLI and desktop? Existing chat
   event views are not yet a complete historical dashboard contract.
2. What are the first supported OS/version/session combinations, especially
   Wayland? Is degraded non-pinned behavior acceptable where the compositor
   refuses always-on-top?
3. What are the numerical idle/startup/memory budgets and reference machines?
4. Should the first deliverable be a repository-local development build or a
   self-contained signed installer for each supported OS?
5. Which skins/brand language should be user-tested, and who owns their
   accessibility and trademark review?

Readiness: enough scope for a bounded design/prototype proposal, **not** for a
cross-platform support or release claim. The user-confirmed floating/read-only
decisions narrow the first slice; interface, packaging, and platform behavior
remain unresolved.
