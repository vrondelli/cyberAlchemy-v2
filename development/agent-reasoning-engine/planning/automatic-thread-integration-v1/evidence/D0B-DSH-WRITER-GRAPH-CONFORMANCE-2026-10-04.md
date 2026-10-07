# D0b pinned DSH Web writer-graph conformance

Status: **candidate source-conformance evidence**, 2026-10-04. Authority
effect: none. Route: `CA2-ROUTE-IMPLEMENT`. This is a version-drift alarm for
the full-Web admission design, not a runtime ownership proof.

## Task-session boundary

The bounded task was to verify the write paths a future pre-inbox guard must
cover, without selecting an upstream contribution, private fork or restricted
profile. The context pack was the [D0b construction contract](../D0B-DSH-SUPPORTED-ADMISSION-CONTRACT-2026-10-04.md),
[P2c alternate-ingress audit](P2C-DSH-ALTERNATE-INGRESS-AUDIT-2026-10-04.md),
the pinned DSH Agent/AgentLoop types and implementation, base/Web composition,
standard preset and named producer implementations. The gate permits only a
source-level test and this evidence update: no live Host configuration, model
call, dependency patch, release or deployment. The product-path choice remains
deferrable for this diagnostic unit but blocks production D0b implementation.

## Findings

1. `Agent` publicly exposes `readonly inbox: Inbox`; `Inbox.splice` is a
   public structural command. The pinned `ReactLoopInbox.splice` calls
   `mutate`, which appends `agent/inbox/spliced` to the native Session without
   calling `Agent.send`. Therefore a hook or method override placed only in
   `send` is not an exclusive ingress boundary, even though the normal
   `followup`/`steer`/`inject` methods pass through it.
2. The default Web composition retains the Host `goal-round-driver`,
   `subagent` and `cordis-host-runner`. It disables Host `command-goal` and
   `plan-mode`, but the default `standard` agent preset mounts them. The preset
   roster defaults `includeUserRoot` to true. These are exact pinned-source
   facts, not a browser reachability or exploit claim.
3. The corresponding pinned implementations directly call Agent
   `followup`, `steer` or `inject`. Replacing only Web `SessionController`
   cannot mediate those calls. A final-insertion guard plus a closed loaded
   graph is required before claiming a single ARE writer.

The source test in
`implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/agent-ingress-conformance.test.mjs`
now pins these facts. It deliberately fails when package source or composition
changes so the matrix must be re-reviewed. It does not prove that arbitrary
same-process plugins cannot append a Session event directly, nor that the
listed services all produce messages during a particular user journey.

## Validation

- `node --test test/agent-ingress-conformance.test.mjs`: **4/4 passed**.
- `npm test` in the DSH adapter package: **27/27 passed**.
- No runtime/profile activation or model call occurred in this task.

## Next action and open questions

Design the supported admission enforcement at the structural insertion
boundary (or lower), not solely in `Agent.send`; then exercise Web prompt,
goal, command, plan, child and plugin producers in a disposable Host. A
runtime-evaluated Host/preset lock and explicit policy for direct Session-log
writers remain necessary. The owner still needs to choose upstream support,
a maintained private patch, or an explicitly reduced Web profile before
production D0b construction.
