# IL-H04 Continuity-Provider Cycle

Status: completed construction integration  
Cycle kind: `engine-improvement`  
Phase: `provider-integration`  
Activation: none

## Objective

Supply the existing IL-H04 continuity renderer with exact engine-owned cycle
state through the real Codex wrapper and gateway entrypoints.

## Boundary

DG-CP-01=A authorized a bounded provider construction, entrypoint wiring, local
gateway canary, and repository evidence. The provider loads a closed,
digest-bound JSON snapshot, resolves an exact thread selector before a consumer
default, classifies transition risk deterministically, retains structural
receipts, and fails closed for an unknown selector.

The repository profile remains disabled. No provider/model call, deployment,
publication, serving-pointer change, or credential processing occurred.

## Result

The real Unix-socket gateway path resolved a new objective as low risk and
surfaced one continuation notification through the validated host consumer.
The focused suite passed 28/28, the full wrapper suite 219/219, and the
evolution-runtime suite 128/128. Six coordinator tasks settled, with restart
and SQLite-loss reconstruction verified.

Exact evidence and digests are in [RESULTS.md](RESULTS.md).

## Operator contract

When continuity rendering is explicitly enabled, both app-server entrypoints
require `--continuity-state <snapshot.json>`. A missing, unreadable, malformed,
tampered, or selector-incomplete snapshot blocks the relevant boundary.

## Open Questions

- The separately authorized
  [`ilh04-headless-activation-v1`](../ilh04-headless-activation-v1/RESULTS.md)
  cycle now retains the provider behind a local evidence-owned headless pointer.
  Automatic operator-launcher consumption remains open.
- What supported adapter, if any, should carry the projection into Codex
  Desktop/Windows UI?
- What retention and archival policy should apply to provider receipts after a
  cycle closes?
