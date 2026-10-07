# ARE integration topology: discovered entrypoint delta

Status: candidate research with bounded registry follow-up, 2026-09-26. Owner: ARE product and
host-integration owners. This compares runnable source paths with the
[integration surface registry](../../../../implementation/agent-reasoning-engine/src/integration-surface-v1.json)
and [consolidation map](INTEGRATION-MAP.md). It neither activates a host task
nor retires an adapter.

Current product scope: the TUI is discontinued. Its source, registry entry,
and test results below are historical provenance only; no TUI mode is a target
for integration, recovery, or UI implementation. The active interaction UI is
the desktop Companion.

## Findings

1. The [Define CLI agent](../../../../implementation/define-cli/src/app-server-agent.mjs)
   is a distinct interaction client that was missing from the registry. Its default
   mode connects to the acknowledged gateway; an explicitly selected direct
   mode spawns the direct Codex stdio wrapper. It also owns Define-specific
   conversational scope and option review. That is not a new global ARE
   session controller, but its two transports have different continuity
   guarantees. Its [implementation binding](../../../../implementation/define-cli/implementation-binding.json)
   is marked `candidate-stale-provider-drift`, so no stable installation claim
   follows. The default gateway call supplies a fixed consumer ID unless
   configured. A later bounded repair pins `codex-app-server/v1`, carries the
   configured connection token, supplies stable mutation keys, and aligns the
   read-only lifecycle parameters with the gateway's closed policy. A local
   actual-wrapper fixture now completes one Define turn with a scripted backend;
   the focused Define/host-policy suite passed 50/50, the gateway suite 68/68,
   and all Define Node tests 71/71. A later isolated installed-host canary
   completed one Define turn through the real gateway and selected Codex binary
   using a fixed loopback provider, with structured output on the provider wire
   and no desktop-task access. The standalone checkout's generated Alch/Craft
   mirrors were refreshed from the current compiler after deterministic rebuild
   comparisons; all five fresh-recompile verifiers and the 71-test full
   `npm test` now pass. This is candidate construction evidence, not product
   approval or live-model validation.
   Define now uses its own exact `codex:define-cli` interaction consumer instead
   of the hosted client's `codex:human-chat` consumer. The source profile and
   generated runtime bundle allowlist both bind this separate identity; a local
   real-wrapper fixture held both consumers concurrently and rejected the
   hosted consumer's read of Define's backend thread. This removes a cross-client
   attachment collision without migrating older gateway sessions. The fixed
   Define consumer still permits only one attached Define process, not a unique
   invocation identity, durable Define conversation, exact desktop-task identity,
   or multi-invocation ownership proof. The bounded evidence is in
   [G1 Define consumer isolation](evidence/G1-DEFINE-CONSUMER-ISOLATION.md).
2. The [TUI coding proposal adapter](../../../../implementation/cyberalchemy-tui/src/codex-coding-agent.mjs)
   was also absent as its own registry entry when this inventory was made. It
   launched a direct Codex stdio wrapper for a bounded coding proposal, distinct
   from the mapped [TUI Conversation Runtime client](../../../../implementation/cyberalchemy-tui/src/conversation-client.mjs).
   Both are now discontinued product paths, retained solely to explain the
   historical overlap and evidence.
3. The earlier [registry test](../../../../implementation/agent-reasoning-engine/test/integration-surface.test.mjs)
   validated every **declared** path and overlap group, but had no discovery
   check for executable consumers outside its declared set. The added scoped
   API-use scan detects omitted clients in selected source directories. Its
   passing result still cannot establish whole-repository completeness.
4. The 2026-09-28 active executable-bin scan found further registry gaps:
   [the canonical gateway CLI](../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-gateway.mjs)
   was missing from the persistent-gateway entry's source refs, and
   [the coding-agent live demo](../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/bin/live-demo.mjs)
   was absent as an interaction-client mode. The latter launches one ephemeral
   Codex thread through the direct stdio wrapper and may apply a bounded
   fixture patch after explicit approval; it has no acknowledged gateway
   continuity or existing-desktop-task ownership. The registry now records
   both. The same scan found the wrapper's local interaction-review CLI, the
   configured coding-agent runner, and the scripted coding-agent demo. These
   are distinct experimental ingress, execution, and fixture modes, not
   additional owners of the current desktop task. The registry now records
   all eight executable `.mjs` files in the selected wrapper and coding-agent
   bin directories with one explicit owner each; the discovery test scans
   those directories. The seven-test integration-surface suite passes. A first assertion accidentally
   made Core's broad repository-path scanner include the optional live demo
   and its Evolution dependency; the final test constructs that expected
   path without adding a false release dependency. The Core closure test now
   directly rejects the live demo in the required package, and the ARE
   product suite passes 102/102. This is bounded source coverage,
   not a complete repository-wide executable inventory.

The public website's edge, quota broker, provider egress, and chat controller
remain separate privilege/ownership boundaries, not redundant gateways. The
legacy proxy, customer direct wrapper, persistent gateway, and DSH backend
likewise cannot be collapsed by name: they differ in writer ownership,
continuity, and protocol/effect capabilities as the parent map records.

## Proposed integration update

- Done locally: registered Define CLI as a gateway-default/direct-compatible
  interaction client. The two TUI modes remain separately recorded in the
  inventory as discontinued historical paths, not integration targets.
- Done locally: added scoped executable API-use discovery in the registry
  test, excluding tests, generated output, benchmarks, fixtures and canaries.
  The five-test registry suite passes. Per-mode controller/backend identity
  binding and broader discovery remain open. Define now has a bounded Codex
  adapter binding, one actual-wrapper local turn, and one installed-host
  fixed-provider turn; concurrent invocation and same-desktop-task binding
  still need separate evidence.
- Done locally: registered the canonical gateway executable, distinct
  coding-agent live-demo client, local interaction-review CLI, configured
  coding-agent runner, and scripted coding-agent demo. A bin-ownership guard
  covers the eight selected executable entrypoints, and the scoped API-use
  discovery guard scans those directories. None of the added modes is
  activation-eligible; the discontinued TUI remains historical provenance only.
- Before any common session-control claim, prove one exclusive writer,
  exact consumer/backend-thread/host-task binding, recovery watermarks, and
  effect-boundary behavior per selected mode. No existing UI observation or
  product-health PASS supplies that proof.

## Open Questions

- Should Define remain one attached process per dedicated fixed consumer, or
  gain per-invocation durable identity and a corresponding credential policy?
- Which owners will approve a coverage rule and eventual retirement of each
  compatibility path after migration and rollback evidence?
