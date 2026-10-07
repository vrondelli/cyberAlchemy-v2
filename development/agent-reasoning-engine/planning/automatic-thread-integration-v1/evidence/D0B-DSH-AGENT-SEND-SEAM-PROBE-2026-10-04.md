# D0b disposable DSH Web Agent-send seam probe

Status: **candidate diagnostic evidence**, 2026-10-04. Authority effect: none.
Route: `CA2-ROUTE-IMPLEMENT`. This is a local, disposable test of one
pre-inbox behavior; it is not an ARE-controlled Web profile or an admitted
runtime integration.

## Bounded context and construction gate

The D0a controller probe reaches authenticated Web mutations, but P2c found
default Web/base services that call `followup`, `steer`, or `inject` outside the
controller. The pinned AgentLoop's `agent/pre-step` runs after inbox claim.
The relevant evidence is the D0a and P2c reports, pinned AgentRegistry
`announce`, AgentLoop `send`, and Web SessionController `prompt`. The task
boundary was a new disposable test and fixture, not a live Host, plugin
installation, profile activation, model turn, or change to the user's desktop.
The local gate passed for a denial-only diagnostic: fresh temporary `DSH_HOME`,
authenticated Web RPC, loopback port, read-only patch, no model call, and
cleanup on both success and failure. Product admission remains gated.

## Observation

The test inserts a diagnostic Cordis service into a disposable pinned DSH Web
Host. A synchronous `agent/created` listener replaces that Agent instance's
`send` method with a denial function. The test will not submit a prompt unless
the service recorded `agent-patched` after native `session/create`. An
authenticated `session/prompt` then returns a rejection carrying the fixture's
diagnostic string. The marker records `send-denied-before-inbox` and no
`agent/inbox/spliced` event. No model call is made.

This establishes that, on this pinned package graph, the Web controller's
normal prompt path can reach a synchronous Agent method **before** the inbox
append. It does not establish a supported admission hook: overwriting an
instance method is a private runtime mutation, may break across DSH versions,
does not prove that every plugin calls the same method, and has no durable ARE
admit/dispatch/recovery chain. It must not be shipped as the gateway boundary.
The `agent/created` announcement is synchronous, but its listener contract
does not promise Agent-method substitution as an extension point.

The first isolated test timed out during Host startup at 20 seconds without a
Web-ready line; it sent no prompt. A second isolated run passed. In the first
parallel package run, the older controller probe also timed out at its 20-second
startup deadline while the new probe passed. Both Web tests now allow 45 seconds
for startup with a 65-second test limit; the subsequent full package run passed
**25/25** tests. This is a startup/test-budget adjustment, not an ingress fix.

## Next decision and open questions

Before D0b or D1 can close, obtain a documented DSH pre-inbox admission
extension or construct and qualify an exact restricted Web profile that
disables every unmediated writer. A maintainable upstream hook would need a
typed per-Agent admission callback that runs before `inbox.splice`, carries
source/request identity, returns a durable accept/reject outcome, and cannot
be bypassed by default and dynamically loaded services. Verify cancellation,
subagent creation, goal/command/plan writers, direct inbox access, and
multi-writer/restart behavior. If DSH cannot expose this contract, keep full
DSH Web ownership unsupported; a native/ACP custom client is a different
branch, not a Web substitute.

## Reproduction and source

- `node --test test/web-agent-send-seam-probe.test.mjs`: passed isolated.
- `npm test` in the DSH adapter package: 25/25 passed after startup-budget
  adjustment.
- Fixture: `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/fixtures/web-agent-send-probe.mjs`.
- Test: `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/web-agent-send-seam-probe.test.mjs`.
- Pinned package source: `node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-agent/lib/index.js`
  (`announce`) and `node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-agent-loop/lib/index.js`
  (`send`, `followup`, `steer`, `inject`) under the DSH adapter package.

## Open Questions

Which maintainer-owned DSH extension can make pre-inbox admission a supported,
versioned contract, and how will it cover writers that do not enter through
Agent `send`?
