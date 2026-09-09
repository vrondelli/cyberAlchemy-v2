---
title: TUI control-center patterns for CyberAlchemy coding sessions
status: research-candidate
date: 2026-09-04
owner: CyberAlchemy coding-agent product owner
authority_effect: none
---

# Research question

Which open-source terminal interfaces provide safe, reusable patterns for one
CyberAlchemy control center that manages multiple sessions, background bounded
agents, queued work, and explicit human decisions?

# Recommendation

Keep the current React/Ink stack. Build the control center primarily from
Gemini CLI and Qwen Code interaction patterns, translate Codex's typed approval
queue into the same stack, and use pi's session/event interfaces as an
architectural reference. Study Crush's workspace UX, but do not copy its source
without a separate license review.

Do not fork an entire TUI. Copy small attributed components or patterns behind
CyberAlchemy-owned state and authority contracts.

# Ranked references

## 1. Gemini CLI — direct component donor

- Repository: https://github.com/google-gemini/gemini-cli
- License: Apache-2.0.
- Stack: TypeScript, React, Ink; this is the closest implementation match.
- Inspect first:
  - `packages/cli/src/ui/components/AskUserDialog.tsx`
  - `packages/cli/src/ui/components/shared/BaseSelectionList.tsx`
  - `packages/cli/src/ui/components/shared/TabHeader.tsx`
  - `packages/cli/src/ui/hooks/useTabbedNavigation.ts`
  - `packages/cli/src/ui/components/InputPrompt.test.tsx`
  - `packages/cli/src/ui/App.test.tsx`
  - `packages/core/src/confirmation-bus/message-bus.ts`
  - `packages/core/src/confirmation-bus/types.ts`
  - `packages/core/src/core/coreToolScheduler.ts`
- Reuse value: selection dialogs, tabs, mouse/keyboard parity, text-buffer
  separation, settings dialogs, confirmation-event separation, and Ink test
  patterns.
- Constraint: copy only bounded components with Apache attribution and NOTICE
  handling; do not inherit Gemini-specific configuration or tool authority.

## 2. Qwen Code — multi-agent control-center donor

- Repository: https://github.com/QwenLM/qwen-code
- License: repository `LICENSE`; Apache-2.0 posture must be retained with copied
  source.
- Inspect first:
  - `docs/users/features/sub-agents.md`
  - `docs/users/features/arena.md`
  - `docs/developers/tools/task.md`
  - `packages/core/src/config/config.ts`
  - the CLI arena tab/status components resolved from `/arena`
- Reuse value:
  - independent agent sessions in one process;
  - background completion notifications;
  - bounded context inheritance with `fork_turns`;
  - per-agent tool scopes;
  - tab status glyphs for running, completed, failed, and cancelled;
  - per-agent confirmation dialogs;
  - isolated worktrees and compare/select-result flow;
  - `/tasks`, `/agents`, `/arena`, and workflow inspection surfaces.
- Constraint: do not copy permissive `auto-edit` or `yolo` defaults. Background
  permission bubbling is useful only when every request remains typed, scoped,
  origin-bound, and explicitly decidable by the user.

## 3. OpenAI Codex — attention-queue contract donor

- Repository: https://github.com/openai/codex
- License: Apache-2.0.
- Inspect first:
  - `codex-rs/tui/src/bottom_pane/approval_overlay.rs`
  - `codex-rs/tui/src/bottom_pane/pending_thread_approvals.rs`
  - `codex-rs/tui/src/bottom_pane/mod.rs`
  - `codex-rs/tui/src/bottom_pane/footer.rs`
  - `codex-rs/tui/src/app_event.rs`
  - `codex-rs/app-server/README.md`
- Reuse value:
  - FIFO approval requests independent from safety evaluation;
  - jump from an attention item to its originating thread;
  - turn-scoped versus session-scoped choices;
  - typed command, patch, permission, MCP, and user-input requests;
  - inactive-thread approval indicators above the composer;
  - queued-draft previews and pure footer rendering.
- Constraint: translate the state machine into TypeScript/Ink instead of copying
  Rust rendering code. Preserve CyberAlchemy's exact-digest and claim-ceiling
  rules rather than adopting Codex approval semantics wholesale.

## 4. pi — session-runtime interface donor

- Repository: https://github.com/earendil-works/pi
- License: MIT.
- Inspect first:
  - `packages/coding-agent/docs/sdk.md`
  - session manager and interactive-mode sources linked by that SDK
  - extension event bus and custom-tool examples
- Reuse value:
  - `AgentSession` as a lifecycle boundary;
  - event subscriptions rather than UI polling;
  - queued steer/follow-up messages;
  - persistent, in-memory, forked, and resumed sessions;
  - tree navigation, compaction, abort, and disposal;
  - headless/RPC/runtime separation from the interactive UI.
- Constraint: CyberAlchemy already owns a governed runtime. Use these interfaces
  as patterns; do not replace authority, sandbox, patch, or journal code with a
  foreign agent runtime.

## 5. Crush — UX reference only until license review

- Repository: https://github.com/charmbracelet/crush
- License: FSL-1.1-MIT, not a simple MIT grant at the current version.
- Inspect first:
  - `internal/ui/`
  - `internal/ui/dialog/commands.go`
  - `internal/agent/coordinator.go`
  - `internal/pubsub/`
  - `internal/session/`
- Reuse value:
  - persistent session picker;
  - workspace-scoped shared session list, history, and permission queue;
  - `IsBusy` and `AttachedClients` session signals;
  - decoupled pub/sub between services and UI;
  - desktop/OSC notifications for approvals and completed turns.
- Constraint: emulate behavior only unless a separate legal review approves
  source reuse under the exact FSL terms.

# Proposed CyberAlchemy control center

```text
┌ CyberAlchemy ─ project ─ provider ─ sandbox ─ 3 running ─ 4 need attention ┐
│ Sessions              │ Active conversation              │ Attention inbox │
│ ● Main chat           │ transcript                       │ 1 Approve patch │
│ ◐ Tests agent         │                                  │ 2 Decide option │
│ ! Definition review   │ tool/progress cards              │ 3 Define term   │
│ ✓ Research agent      │                                  │ 4 Resolve BLOCK │
│                       │ composer                         │                 │
├───────────────────────┴──────────────────────────────────┴─────────────────┤
│ Queue: 2 ready · 1 blocked · 3 completed   Ctrl+P commands  Ctrl+A inbox   │
└─────────────────────────────────────────────────────────────────────────────┘
```

For narrow terminals, collapse the three columns into `Sessions`, `Chat`, and
`Attention` tabs. Never hide an attention count when another tab is active.

# Required domain model

## Session record

- `session_id`, title, project/root, provider, model, created/updated time;
- status: idle, queued, running, waiting-human, blocked, completed, cancelled;
- active agent count, unread count, attention count;
- current immutable baseline and authority ceiling;
- journal locator and context/compaction state.

## Bounded agent dispatch

- `dispatch_id`, parent session, agent identity, objective;
- explicit read/write scope and forbidden scope;
- tool policy, sandbox policy, maximum steps/time/context;
- baseline digest, done criteria, cancellation token;
- status and typed terminal receipt;
- no inherited effect authority unless the exact dispatch says so.

## Attention item

- `attention_id`, kind, severity, origin session/agent/turn;
- kinds: patch approval, tool approval, product decision, definition attention,
  ambiguity, blocker resolution, comparison selection;
- immutable subject digest and concise human projection;
- allowed decisions and consequences;
- state: pending, viewed, decided, superseded, cancelled;
- decision receipt and actor; no generic boolean approval.

## Action queue item

- `action_id`, origin, dependency list, scope, estimated risk;
- states: proposed, ready, running, waiting-human, blocked, verified, rejected;
- executor may be the main session or one bounded subagent;
- successors never run merely because a predecessor produced output.

# UI and event architecture

1. A headless `ControlCenterStore` owns sessions, dispatches, queue items, and
   attention items. Ink components render projections only.
2. Every background runtime emits typed events into one local event bus.
3. Reducers are deterministic and independently tested; rendering never mutates
   runtime state.
4. The attention inbox is global, but each item retains its origin and offers a
   jump-to-session action.
5. Approval overlays consume one item at a time while preserving the FIFO queue.
6. Background agents run with bounded contracts and can only enqueue candidates
   or attention requests; they cannot approve their own work.
7. Notifications fire only for completion, failure, or required human action.
8. Session persistence and runtime execution remain separate services so the
   TUI can restart without pretending an unknown process is still running.

# Copy plan

Safe first extraction candidates:

1. Gemini `BaseSelectionList`, `TabHeader`, tab-navigation hook, and their test
   structure, rewritten only where needed and imported with attribution.
2. Codex approval-queue state machine translated into a small TypeScript model:
   enqueue, resolve, supersede, advance, jump-to-origin.
3. Qwen status-tab and work-comparison concepts reimplemented against
   CyberAlchemy receipts.
4. pi-style event subscription/session interface expressed over the existing
   ARE runtime rather than importing pi's agent engine.

Do not copy:

- provider authentication or secret storage;
- tool-execution engines or permissive approval modes;
- foreign session authority or automatic worktree cleanup assumptions;
- entire application shells;
- Crush source before license review;
- any UI path that lets a background agent silently bypass the global attention
  inbox.

# Construction sequence candidate

1. Control-center state schemas and deterministic reducers.
2. Static three-pane/tabs shell with fixture sessions and attention items.
3. One real existing coding session wired through the store.
4. Global typed attention queue with jump-to-origin and exact-digest approval.
5. One read-only bounded subagent and cancellation flow.
6. Multiple concurrent agents with status/unread/attention counts.
7. Action DAG and comparison/recommendation views.
8. Persistence, restart reconciliation, notifications, and full product test.

This sequence is a research recommendation, not an implementation binding or
authority grant.

# Primary sources

- https://github.com/google-gemini/gemini-cli
- https://github.com/google-gemini/gemini-cli/blob/main/packages/cli/src/ui/components/AskUserDialog.tsx
- https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md
- https://github.com/QwenLM/qwen-code
- https://github.com/QwenLM/qwen-code/blob/main/docs/users/features/sub-agents.md
- https://github.com/QwenLM/qwen-code/blob/main/docs/users/features/arena.md
- https://github.com/QwenLM/qwen-code/blob/main/docs/developers/tools/task.md
- https://github.com/openai/codex/blob/main/codex-rs/tui/src/bottom_pane/approval_overlay.rs
- https://github.com/openai/codex/blob/main/codex-rs/tui/src/bottom_pane/mod.rs
- https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md
- https://github.com/openai/codex/blob/main/docs/license.md
- https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md
- https://github.com/earendil-works/pi
- https://github.com/charmbracelet/crush
- https://github.com/charmbracelet/crush/blob/main/internal/ui/dialog/commands.go

# Claim ceiling

These sources establish reusable implementation and interaction precedents.
They do not prove that the proposed control center is usable, safe, adopted, or
authorized. Any copied source requires exact provenance, license notices,
independent tests, and a new CyberAlchemy product-candidate epoch.
