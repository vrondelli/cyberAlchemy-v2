---
title: ARE desktop-task integration implementation layering
status: candidate
updatedAt: 2026-09-26
owner: ARE product owner and Codex host integrator
scope: existing Codex desktop task integration
---

# ARE desktop-task integration implementation layering

This layers the integration of ARE with the *existing* Codex desktop task. A
callable MCP tool or a passing ARE `doctor` check is not evidence that ARE owns
the task. The [parent plan](PLAN.md) owns the intended same-history outcome and
its separate product-construction and operational lanes. The
[session-control contract](SESSION-CONTROL-CONTRACT.md) defines what ARE owns
only after a verified activation of one exact task.

## Context and invariants

- The CLI and MCP decision calls are non-executing, caller-carried interactions;
  they neither authenticate a Codex thread nor replace its transport
  ([CLI contract](../../../../agent-routing/capabilities/are-cli/README.md)).
- The current gateway has tested reconnect primitives, but the callback adapter
  is advisory and process-local; a restart loses its request bindings
  ([event binding](../../../../agent-routing/capabilities/are-cli/EVENT-BINDING.md),
  [gateway continuity](../../../../agent-routing/capabilities/are-cli/GATEWAY-CONTINUITY.md)).
- Current default wrapper settings disable intent compilation, objective
  resolution, continuity rendering, interaction learning, and Evolution signals
  ([runtime profile](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-runtime-v1.json)).
- One task has at most one active writer. No layer may duplicate a turn, import
  old history as newly observed ARE events, change desktop settings, or activate
  an Evolution cycle implicitly. A passing canary or connected MCP server never
  changes the task's active controller.

## Layer decisions

| Layer | Decision question | Minimum working unit | Exit evidence | Deferred |
| --- | --- | --- | --- | --- |
| L0 — host proof | After this layer, do we know whether the selected installed host can deliver the required events to ARE for one disposable thread? | Accurate version/feature probe, version-bound native canary, and a disposable gateway turn with route/context, tool-boundary, completion, and explicit Reasoning State receipt | Exact binary identity, event/receipt trace, zero external model calls, explicit unsupported-path list | This task's handover, learning, UI, deployment |
| L1 — continuity | After this layer, can one ARE-managed thread retain scope and identity across two turns, restart, and supported steering/compaction? | Typed bounded plan-context frontier, host/thread identity binding, checkpoint/recovery, one-writer and unknown-delivery reconciliation | Replay and restart tests; advertised operations recover, unsupported ones are explicit; all parent obligations recovered; no duplicate dispatch | Cross-task reuse, automatic capability change |
| L2 — feedback | After this layer, can attributable corrections become scoped observations and bounded Evolution candidates without self-activation? | Complete-turn feedback classification, source/episode binding, opt-in signal provider and sink, visible pending/disabled states | Positive/negative attribution fixtures, durable signal receipt, no unapproved cycle transition | Broad learning grammar, product-wide preferences |
| L3 — current-task pilot | After this layer, is an explicitly authorized same-history cutover and rollback of this desktop task supportable? | Host feasibility receipt, tested candidate, last-completed-turn watermark, exclusive writer handover, one live exchange, restart and rollback check | Same task identity/history verified before and after; source-bound receipts; operator decision; no silent alternate client | Release, global installation, other tasks |

L0 is the next layer. Its first SWU is only the host probe correction; finishing
that SWU does **not** complete L0. Promotion requires the evidence named in the
[work-pack](INTEGRATION-WORK-PACK.md), not a passing unit test alone.

## Non-regression

Every layer preserves the exact user request and existing host permissions,
keeps ARE receipts non-authorizing, separates model observation from host
acceptance, and fails closed on identity or source drift. L3 additionally
preserves the original stored history and a recoverable rollback route.

## Open Questions

- Can this desktop app hand its exact current task to a selected gateway
  without a second active writer, or only allow a separately selected client?
- Which host-owned stable task/turn identities and compaction events are
  available through the installed desktop/server pair?
- Who owns the long-lived credential, private state root, and final cutover
  decision after the exact product candidate is tested?
