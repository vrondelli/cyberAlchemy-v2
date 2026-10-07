# P2c — DSH Web alternate Agent-ingress audit

Status: **source-level gap evidence**, 2026-10-04. Authority effect: none.
This identifies paths in the pinned installed package graph; it is not a
runtime reachability or exploit proof for every path.

## Finding

Replacing `session-controller` intercepts the seven tested browser Session
mutations, but does **not** establish one exclusive ARE Agent writer. The
default Web composition includes the base bundle's `goal-round-driver`,
`command-goal`, `plan-mode`, and `subagent` rows, plus Web's
`cordis-host-runner`. Their installed implementations call `agent.followup`
or `agent.steer` directly. Those calls bypass the replaced controller method.

| Loaded path | Installed source behavior | Meaning for D1 |
| --- | --- | --- |
| `goal-round-driver` | Builds a `kind: "goal"` user message and calls `agent.followup` for the next round. | Autonomous continuation can start another Agent turn without a Web prompt RPC; ARE continuation must mediate or explicitly exclude it. |
| `command-goal` | Submits goal-command attachments as a `kind: "user"` message through `invocation.agent.followup`. | A human command can inject model-visible content without `session/prompt` mediation. |
| `plan-mode` | Calls `agent.steer` with a `kind: "user"` message when entering plan mode with content or attachments. | A command can steer a live turn outside the controller seam. |
| `subagent` | Its active child delivery calls `agent.steer` or `agent.followup`. | Child-Agent ingress and ownership need a separate scope; parent Web-session interception does not cover them. |
| `cordis-host-runner` | Plugin-run, render and handler outcomes call `agent.steer` with `kind: "plugin"` messages. | Plugin feedback can alter an active turn without the controller. It is Host-originated rather than a human prompt, but must be represented in ARE's turn/context boundary if ARE claims control. |

The base/Web bundle row evidence is under the installed
`@deepseek-ai/dsh-base/cordis.patch.yml` and
`@deepseek-ai/dsh-web-app/cordis.patch.yml`; direct calls were found in the
corresponding pinned package `lib/index.js` implementations. These are
third-party dependency sources, not ARE-owned code. Other packages such as
schedule, webhook, SDK JSON-RPC, ACP and hooks also contain direct Agent
ingress code, but this audit has not established that they are loaded by the
default Web profile. Do not conflate source presence with active reachability.

## Consequence for construction

D0 is an insertion-point proof, **not an exclusive-writer proof**. D1 may not
forward a Web prompt through ARE while leaving these active paths as
unaccounted native writers and then claim `client -> ARE -> Host -> model`.
Two plausible designs remain open:

1. Mediate Agent inbox admission below SessionController for all selected
   sources, preserving DSH native journal, provenance and Host behavior.
   This is the stronger path for a full-featured Web product but requires an
   exact extension/interception seam and negative bypass tests.
2. Build a narrowly declared Web profile that disables every unmediated
   turn-producing component and marks lost features unsupported. This may be
   viable for a first read-only profile, but it is **not** feature parity and
   cannot silently become the default DSH integration.

The product goal favors option 1; no option is selected or activated by this
audit. A dynamic plugin can add new inbox paths, so both designs also need a
profile/plugin admission policy and requalification on version drift.

## Lower-boundary inspection

The pinned `@deepseek-ai/dsh-agent-loop/lib/index.js` implements
`followup`, `steer`, and `inject` through `send` -> `inbox.splice` ->
`session.append("agent/inbox/spliced", ...)`. The public
`agent/inbox/inserted` event fires **after** this append. It is an observation
point, not a pre-append veto. The `AgentRegistry.setFactory` API owns Agent
creation and permits only one registered factory; replacing the loop factory
would be a separate, high-risk driver integration, not a small interceptor.

`agent/pre-step` is a supported waterfall veto before the model step. However,
the loop appends `turn/start` and claims inbox messages **before** calling the
hook. Its public type contract says a rejected claimed message is neither
discarded nor re-emitted as a user message; `ConsumedWork` counts a rejected
turn that claimed input as consumed work. Therefore a denial-only pre-step
guard can fail closed against model dispatch, but cannot provide exclusive
*ingress* or lossless gateway-outage recovery on its own. A controller-only
interceptor plus this hook still needs a replay/reconciliation contract for
claimed prompts and a profile gate for dynamic plugins.

The supported creation `setup` callback can install scoped listeners before
Agent publication and the first prompt assembly. It does not by itself
intercept all later `followup`/`steer` calls; its documented contract is
composition, not driving. This remains a promising place to attach a
defense-in-depth pre-step veto once an actual admission design exists.

This is a source/type inspection, not a dynamic proof that a particular plugin
reaches a model. It narrows D0's next probe: demonstrate a pre-inbox admission
seam or a restricted loaded-plugin profile, then separately verify that a
pre-step guard denies the model without misreporting a claimed prompt as
accepted by ARE.

The candidate [source conformance test](../../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/agent-ingress-conformance.test.mjs)
pins these ordering and consumed-work facts to the installed DSH package. It
passes 2/2 locally; the full DSH adapter suite passes 24/24. It is a
version-drift alarm, not a runtime bypass test.

The later [D0b writer-graph conformance](D0B-DSH-WRITER-GRAPH-CONFORMANCE-2026-10-04.md)
extends the same source test to 4/4 and the adapter suite to 27/27. It also
pins the public `Agent.inbox.splice` path, which bypasses `Agent.send`; the
figures above are the historical result of this P2c audit, not the latest run.

## Open Questions

- Is there a supported DSH Agent inbox hook or service wrapper that can
  serialize all `followup`/`steer` admissions without patching dependencies?
- Which default commands are reachable in Web and which require user action,
  model tool calls, or plugin activation? A disposable runtime probe should
  distinguish these.
- Do subagent children become separately ARE-bound conversations, or remain
  Host-owned nested execution with bounded parent accountability?
- Can a DSH-supported Agent creation/driver extension mediate inbox admission
  before native append without replacing the whole loop factory? If not, what
  exact restricted Web profile can preserve a lossless first-turn path?
