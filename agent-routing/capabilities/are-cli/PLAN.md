# ARE CLI integration

Status: owner-directed implementation candidate, 2026-09-07.
Route: CA2-ROUTE-IMPLEMENT. Authority effect: none.

## Product outcome and construction frontier

Repository agents consult the existing ARE decision engine through one bounded
JSON CLI before choosing a route, preparing context, evaluating an effect, or
selecting a continuation. The route registry remains the definition source.
MCP is the last stage, after the CLI and host integration have been tested.

Current frontier: local CLI and bootstrap implemented; validation records live
under `receipts/`. The source-bound candidate includes strict input/output
schemas, real engine adapters, source checks, two-session isolation, failure
behavior, and router integration. No operational activation is implied.
The advisory prompt adapter, candidate configuration renderer and host inspector
are implemented and locally tested; [HOOKS.md](HOOKS.md) owns their exact scope.
Native prompt delivery passed a pinned Codex 0.153.0-alpha.5 loopback canary
across three turns and two sessions; [NATIVE-HOST-TEST.md](NATIVE-HOST-TEST.md)
owns that evidence and its test-only trust override. Request-bound tool and
completion adapters are now implemented and tested through the same native host;
[EVENT-BINDING.md](EVENT-BINDING.md) owns their in-memory lifecycle and limits.
The reusable gateway client now retains authenticated reconnect credentials,
stable requests and hook bindings; [GATEWAY-CONTINUITY.md](GATEWAY-CONTINUITY.md)
owns this local construction stage. The [callback bridge and native gateway canary](NATIVE-GATEWAY.md) now pass
with reconnect, tool attribution and stable turn replay. Next: select the exact
Workspace/VPS host binding and prepare its rollout candidate. Selecting an operational host
and approving its hook trust remain separate. MCP remains last.

## Prototype meanings and scaffold

A session ID is a caller-supplied correlation label, not authenticated identity.
A request ID identifies one request within that session. A decision receipt
binds those labels, the exact input, source/profile identity, and result. A
caller-carried predecessor receipt is checked for integrity and same-session
binding; it does not establish authenticated provenance or a durable session.
No CLI operation accepts an approval or dispatches an effect.

The local ontology scaffold is `ontology.json`. This extends the existing
CA2-CAP-ROUTE-REPOSITORY-WORK product prototype through its DomainSpec route
rule and generated implementation source bindings. The existing D65/D67,
Product Capability, and routing business-ontology selectors remain unchanged.
The context operation consumes the exact source and selector configuration in
ARE's repository profile; it invokes no ontology-runtime admission gate.

## Sequence and exact implementation surface

1. Add `implementation/agent-reasoning-engine/src/decision-cli.mjs` and
   `bin/are-decide.mjs`; expose `are decide` from `bin/are.mjs`.
2. Add a closed JSON schema, example requests and tests under this capability
   and `implementation/agent-reasoning-engine/test/decision-cli.test.mjs`.
3. Correct the wrapper profile instruction source to the local project's
   `cyberAlchemy-v2/AGENTS.md`. Preserve protocol/version checks and approval
   behavior. Run the real doctor, routing and context checks.
4. Update local `AGENTS.md`, router docs, the DomainSpec route-rule scaffold,
   validator and builder to bind/use the tested CLI. Rebuild projections and
   test failure, ambiguity, blocked routes and deterministic build replay.
5. Local advisory prompt hook adapter implemented; native dispatch and delivery
   tested with a pinned host and loopback fixture. Operational hook configuration
   remains uninstalled; persisted trust and live-host selection are separate.
6. Bind Workspace/VPS clients to the existing gateway using a compatible Codex
   binary and verified session continuity. Do not replace this live chat's
   transport or launch a model as part of this local construction.
7. Add MCP last as an adapter over the same tested operations.

## Verification

Test strict JSON/size bounds; same input replay; two distinct sessions; changed
request/predecessor rejection; missing and stale sources; ambiguous routing;
blocked durable-session routing; unsafe effects; unsuccessful completions;
and context production through the actual ARE preflight. CLI stdout contains
one JSON receipt. Test the real executable, not only direct function calls.
Routing `direct` grants no effects; `gate` does not erase prior user authorization.
Host instructions preserve explicit/inferred input postures and existing scope.

## Operational support and deferred residue

| Task | Owner | Affected stage | Causal effect |
| --- | --- | --- | --- |
| Select the tested binary for an operational host | Runtime operator | Live gateway stage | Codex 0.153.0-alpha.5 passed the isolated native canary; PATH CLI remains 0.114.0. |
| Validate and enable supported prompt/tool hooks | Host owner | Automatic host integration | Current PATH CLI reports hooks under development/disabled; no hook activation in the first slice. |
| Select VPS, transport, credentials and persistence | Deployment owner | Remote rollout | Deferred, no local CLI dependency. |
| Connect MCP | Integration owner | Final adapter stage | Explicitly last. |

## Open Questions

- Which host binary supports the event coverage required by automatic hooks?
- Which live session identifiers can the current client expose reliably?
- Which existing authorization evidence should later host adapters verify?
- Which owner will review the exact tested product before separate operational
  activation? This candidate does not manufacture that decision.
