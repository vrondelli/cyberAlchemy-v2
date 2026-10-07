# G1 new Codex desktop chat — implementation layering

Status: candidate planning companion, 2026-10-02. Authority effect: none.
Target: a new Windows Codex desktop WSL chat created through the app's New Chat
action and governed from inception by ARE. Existing-chat handover, TUI, and
cross-OS parity are separate scope. Parent candidate:
[feasibility plan](G1-CODEX-NEW-CHAT-FEASIBILITY-PLAN.md).

## Layer decision rule

Each layer ends when its evidence answers one decision; later layers preserve
the earlier guarantees. Layer value is decision unlocked plus visible outcome
plus risk reduced; layer cost includes code, verification, and host coordination.
Do not pay for D3 hardening or packaging if the app never invokes the shim.

| Layer | Decision question and minimum working unit | Included; deferred | User/operator outcome, risk and main cost | Exit evidence and promotion |
| --- | --- | --- | --- | --- |
| L0 — exact feasibility | **After this layer, we know whether the real stock app's New Chat path can run through ARE on this pinned WSL installation.** One isolated authenticated WSL project, real New Chat, one gateway-owned thread and first bounded desktop-rendered reply. G0 launch trace precedes any turn. | Include per-process shim, pinned host, gateway, creation claim, first turn, visible reply. Defer restarts, broad approvals, existing-chat takeover, native Windows/Linux parity. | User sees one real app chat; removes uncertainty about the version-bound launch seam. Main cost is authenticated isolated UI access and event correlation. | App-owned shim invocation, exact thread/turn receipts, same-window reply, and negative direct-writer check. If the app cannot reach the seam, stop/pivot; do not promote a separate client as equivalent. |
| L1 — interaction coverage | **After this layer, we know whether ordinary new-chat interactions remain mediated.** Repeatable thread/turn lifecycle with native input, approvals, steer/interrupt, compaction, and a closed method/event catalog. | Include exact capability matrix and denied bypass tests; defer crash recovery beyond fail-closed quarantine. | App interactions remain coherent; reduces protocol/bypass risk. Cost is UI/native canary breadth and version-specific method work. | Positive and negative app-owned journeys for each advertised capability; unsupported operations visibly unavailable. Promote only advertised supported subset. |
| L2 — continuity | **After this layer, we know whether the chat survives process failure without losing or duplicating a turn.** Reconcile desktop view, gateway journal and backend history across controlled crashes. | Include receipt/unknown-delivery handling, private state, fail-closed stop and safe rollback. Defer release and cross-OS packaging. | User can resume or sees explicit attention; reduces data/turn-loss risk. Cost is crash-window matrix and native history/UI comparison. | Clean restart or explicit quarantine for every injected window, zero duplicate host turns, no unsafe direct fallback or stale-tool release. |
| L3 — product candidate | **After this layer, we know whether the opt-in integration is maintainable across installs and updates.** Version-pinned packaged setup and teardown with desktop/Companion truth and resource checks. | Include Windows/WSL installer/upgrade, privacy/security review, diagnostics, rollback and update drift. Defer existing-chat D4 and native Windows/Linux parity to separately scoped plans. | An opt-in product candidate with honest status; reduces operational drift. Cost is installer, host-update and resource validation. | Exact product tests, reviewed claim ceiling, separate owner activation decision. No default-on or release from planning evidence alone. |

Current recommended layer: **L0, starting at its G0 launch proof**. The largest
deferred scope is existing-chat handover, which needs a separate writer-transfer
contract and cannot be inferred from a successfully mediated new chat.

## Non-regression and stop rules

- Never replace the installed app, primary process, global `codex`, or this
  task's writer as a feasibility shortcut.
- Every later layer preserves exact new-thread ownership, one writer, pinned
  backend/profile, private state, bounded evidence, and no direct fallback.
- A host update invalidates the version-bound seam until the launch and
  protocol gates are repeated. Failed G0 returns `unsupported for this app
  build`, not an ARE-controlled status or a hidden client substitution.

## Open Questions

- Is a documented desktop integration point available that can replace the
  internal version-bound command selector?
- How can the app itself confirm consumption of a gateway-delivered response
  after a crash without redelivering an accepted turn?
