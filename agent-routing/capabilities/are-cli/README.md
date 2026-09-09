# ARE CLI for repository sessions

The local adapter calls ARE through `are decide route|context|effect|continue`.
It is an instruction-driven integration for agents in this checkout. It does
not intercept the host, replace a running chat's transport, start Codex, or
invoke a model. MCP remains the last stage in [PLAN.md](PLAN.md).

## Bootstrap contract

After loading the three routing bootstrap files, prepare one JSON request using
[request.schema.json](request.schema.json) and invoke from the checkout root:

```sh
node implementation/agent-reasoning-engine/bin/are.mjs decide route < request.json
```

Use the user's exact text in `request.raw_request`. Carry the active objective,
constraints and prior authorization from the conversation; label interpreted
fields `inferred` in `field_postures`, and user-supplied fields `explicit`.
Unprovided postures remain `unknown`. Never rewrite the request or relabel an
inference as explicit to obtain a preferred decision. Classification is caller
evidence, not independently verified meaning. This adapter does not run ARE's
model-assisted intent resolution.

Choose a session correlation ID once per conversation and a distinct request ID
for each request. Reuse neither another conversation's ID nor its receipt. These
IDs are caller labels, not authenticated Codex thread identities.

For `direct`, announce the returned `route_contract.route_id` and `read_first`
before opening route content; retain all registry ceilings and blockers. A
routing `gate` selects the registry's AMBIGUOUS handling and the smallest missing
decision. A `block` or `ok:false` is a diagnostic: report its reason, and repair
an exact source or runtime defect only within existing authorization. Do not
invent another router or refresh provenance digests to conceal drift.

`context`, `effect`, and `continue` require the same request and the `receipt`
object returned by `route` as `previous_receipt`. The adapter recomputes that
route and compares the whole receipt against current sources. Changed request,
session, profile or route identity requires a fresh route call. Receipts are
unsigned, caller-carried integrity bindings, not approvals, authenticated
history, replay prevention or durable repository sessions.

## Operations and results

| Operation | Additional input | Result |
| --- | --- | --- |
| `route` | None; predecessor forbidden | Verified registry selection and complete route contract. |
| `context` | `previous_receipt` | Actual repository-profile preflight and context envelope, with current source snapshot. |
| `effect` | Predecessor and `effect` | Existing ARE effect-boundary assessment of the exact proposal and caller-supplied metadata. |
| `continue` | Predecessor and `continuation` | Existing ARE continuation decision over completion evidence and proposed next options. |

Before preparing task context, call `context`. Before a proposed consequential
effect or crossing an authority boundary, use `effect` to assess it. At a
completed work boundary with a possible next objective, use `continue`; route
any selected new objective as a new request before work. Routine tool calls do
not each need an effect assessment. All operations are non-executing.

Effect metadata and completion evidence are caller claims. The adapter never
executes proposals or verifies that completion actually occurred. A `direct`
decision grants no permission. A consequence `gate` identifies evidence or an
authorization boundary; honor authorization already given in the conversation
and ask only when a real missing decision remains. Host approval behavior is
unchanged. The blocked durable SESSION route remains blocked.

The context wrapper adds input evidence and normalizes its projection; the CLI
retains the exact caller-input digest and original field postures separately.
Context files are read locally using the configured source/selector set. There
is no ontology-runtime prerequisite or hidden global context scan.

Stdin is one JSON document, at most 1 MiB; stdout is exactly one JSON result.
Unknown fields and wrong types are rejected at the closed request boundaries;
`effect.proposal` is an opaque JSON object whose bytes are bound into the input
and effect digests. Exit codes: `0` direct/complete, `2` block/error, `3` gate.
Success and failure shapes are in [result.schema.json](result.schema.json).

## Try it and verify

```sh
node implementation/agent-reasoning-engine/bin/are.mjs decide route \
  < agent-routing/capabilities/are-cli/route.example.json
node agent-routing/capabilities/are-cli/session-example.mjs demo-session-a
node agent-routing/capabilities/are-cli/session-example.mjs demo-session-b
node --test implementation/agent-reasoning-engine/test/decision-cli.test.mjs
node implementation/agent-reasoning-engine/bin/are.mjs doctor --json
```

The example carries a route receipt through all four operations and prints a
compact result. It evaluates a sample read proposal but performs no proposed
effect. Reuse the same protocol from any other local session; it creates no
shared mutable session store. A new session in this checkout reads `AGENTS.md`;
an already-running session must explicitly adopt these instructions. Other
repositories and VPS clients need their own declared host integration.

## Open Questions

Host hooks, the exact Codex binary, VPS continuity and MCP are staged in
[PLAN.md](PLAN.md#open-questions). No host hook or MCP server is installed by
this implementation.

The next local adapter is implemented in [HOOKS.md](HOOKS.md): advisory prompt
events, a candidate configuration renderer, and a read-only host inspector.
Native delivery passed the [pinned loopback canary](NATIVE-HOST-TEST.md).
Active hook configuration remains unchanged; MCP stays last.
