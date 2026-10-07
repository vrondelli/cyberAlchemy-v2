# D0b: pinned DSH final Inbox mutator diagnostic

Status: **candidate feasibility evidence**, 2026-10-04. Authority effect:
none. This does not select a DSH patch/fork, activate a Web profile, or close
D0b/D1.

## Question and method

Does the pinned Web runtime have a lower in-process point where a normal
`session/prompt` and direct Inbox structural insertion can be stopped before
the native `agent/inbox/spliced` event? Can a same-process plugin bypass that
point by writing through the Agent's Session? This matters because
`Agent.send` and `Inbox.splice` are not the last writers.

The inspected `@deepseek-ai/dsh@0.1.5-rc.2` graph uses nested
`dsh-agent-loop@0.1.5-rc.3`. In its runtime JavaScript,
`ReactLoopAgent.send` calls `inbox.splice`; `ReactLoopInbox.splice` calls
`this.mutate`; and the runtime-callable `mutate` method directly calls
`session.append("agent/inbox/spliced", splice)`. The typed Inbox surface
includes `splice`, while `mutate` is an implementation method, not a
maintainer-supported extension contract. `claim` also calls `mutate` for
removal. Consequently an insertion guard at this level must distinguish
insertions from removals. The Agent also exposes its Session instance, and
`Session.append` accepts an `agent/inbox/spliced` event with a valid user-role
message independently of the Inbox API.
A bounded literal scan of the pinned nested `@deepseek-ai` JavaScript (excluding
generated Typert declaration bundles) found only this Inbox mutator calling
`append("agent/inbox/spliced"`. This is not a closed-world proof: dynamic
plugins and indirect Session writes remain possible.

The disposable probe at
`implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/fixtures/web-inbox-mutate-probe.mjs`
uses an unsupported per-instance override of `agent.inbox.mutate` after
`agent/created`. It rejects calls with nonempty inserted messages while
delegating removals. The authenticated loopback Web fixture uses a temporary
`DSH_HOME`, the pinned read-only patch, and no model request. It invokes
direct `mutate` and direct `splice`; both are rejected before an Inbox event.
With the same guard active, it then calls `agent.session.append` with a valid
synthetic user-role message. The Session accepts the event and the Agent inbox
projects that message. The fixture synchronously removes the message before
any turn starts. A later `session/prompt` through authenticated Web RPC is
rejected by the mutator guard without another Inbox event. This tests the
live-profile bypass and its timing only; the override and synthetic message
must never ship as the ARE admission implementation.

## Validation and claim ceiling

`node --test test/web-inbox-mutate-seam-probe.test.mjs` passed 1/1 after the
direct Session append extension. The source conformance test asserts that the
pinned `mutate` body does not route back through `splice`. The full adapter
`npm test` suite passed 29/29 after this extension. This proof covers only
the pinned graph and one disposable
Web Agent. The synthetic message was canceled before a turn; the test does
not claim model dispatch. It does not prove a stable hook, all Agent
generations, a closed plugin graph, crash/replay safety, authenticated Host
identity, or ARE admission.

## Consequence for D0b

The pinned graph has **no universal Inbox-only insertion point** for a profile
that allows same-process Session writers. A supported contract must either
enforce an event-specific permit at the Session append/journal boundary or
prove an effective loaded-plugin graph that forbids every direct Session
writer while enforcing the Inbox mutator. A versioned DSH-owned hook should
leave claims/removals and other native maintenance behavior intact. An
arbitrary untrusted same-process plugin is outside a simple method-hook trust
boundary; stronger isolation or capability control would be required for that
claim. Full DSH Web still requires producer migration or effective profile
closure, P1/P2/P3, and a D1 first-turn witness.

## Open Questions

- Which maintainer-supported DSH hook or owner-approved pinned patch will
  enforce the final mutation boundary across all Agent generations?
- Will the selected full-Web profile use an event-specific Session append
  permit, or a closed trusted-plugin graph plus an Inbox mutator permit?
- What is the trust boundary for user-installed or dynamically loaded
  same-process plugins that can access the Session instance?
- How will a prepared ARE permit survive or reconcile an append/ACK crash
  without producing a duplicate native prompt?
