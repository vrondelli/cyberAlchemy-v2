# CyberAlchemy Agent Reasoning Engine

For the enduring objective and criteria for selecting future experiments, read
the [project lighthouse](../../agent-reasoning-engine/LIGHTHOUSE.md).
The complete product manual starts at [docs/README.md](docs/README.md); its
[coverage map](docs/DOCUMENTATION-COVERAGE.md) identifies the guide that owns
each reader question and the lifecycle state of each release-readiness guide.
The [Candidate 018 release note](docs/releases/0.10.0-self-contained-candidate.7.md)
and [changelog](CHANGELOG.md) describe the current private history.

The companion Product identity, Product Capability, and business ontology live at
[`../../agent-reasoning-engine/`](../../agent-reasoning-engine/README.md). This
directory owns the working runtime and exact tested implementation candidates;
the development directory owns research, designs, and historical decisions.

The request-intent vertical compiles user language into immutable Intent
Contracts before model dispatch, separates construction instructions from
visible product requirements, records explicit corrections as successor
reflections, and exposes quiet, explain, inspect, and control projections.
Codex app-server integration is opt-in and defaults to no-op; the intent
benchmark lane measures these distinctions directly.

This directory is the supported product surface for the integrated ARE
stability candidate. It composes deterministic routing, request-aware Context
Envelopes, automatically evolved append-only Reasoning State, an exact-bound
opt-in definition-readiness semantic domain, authenticated restartable Codex
app-server continuity, an ARE-owned conversation runtime, measured
cache-affinity telemetry, and the real-reasoning benchmark.

Use Node `26.8.1` and begin with:

```sh
node bin/are.mjs doctor --json
node bin/are.mjs test
npm run distribution:materialize -- /tmp/are-standalone
```

Repository sessions can consult the engine without starting a host or model:
`node bin/are.mjs decide route|context|effect|continue < request.json`.
The [CLI contract](../../agent-routing/capabilities/are-cli/README.md) defines
session correlation, receipt bindings, examples, exit codes and open questions.
MCP is deferred until the CLI and later host integration stages are tested.

`node bin/are.mjs hook prompt` adapts prompt events to advisory routing evidence.
`hook config` prints candidate registration; `hook inspect-host` reports the
selected host's observed feature state. See the
[hook adapter contract](../../agent-routing/capabilities/are-cli/HOOKS.md).

`node bin/are.mjs hook native-test /exact/path/to/codex` runs a pinned native
app-server canary against a loopback response fixture. It tests hook delivery
without an external model; [scope and evidence](../../agent-routing/capabilities/are-cli/NATIVE-HOST-TEST.md)
describe its isolated configuration and test-only trust override.

`node bin/are.mjs hook native-events-test /exact/path/to/codex` additionally tests
request-bound tool and completion events, using one fixed harmless shell command.
The [event adapter contract](../../agent-routing/capabilities/are-cli/EVENT-BINDING.md)
describes the in-memory API, replay rules, limits and native evidence.

Freeze and inspect the exact integrated product candidate only after the source
surface is ready:

```sh
node bin/are.mjs candidate freeze
node bin/are.mjs candidate inspect --json
npm run release:verify
```

The [release process](RELEASE.md) defines the private candidate boundary,
verification gates, and the separate lifecycle of ContextBench research.

The freeze command materializes a content-addressed source closure, runs the
complete product suite, runs the registered failure-to-learning canary, and
writes immutable candidate, compact canary, and test-receipt records under
`evidence/`. A fixed candidate identity is never overwritten with different
bytes. The inspection command re-materializes the current closure and blocks on
source drift or evidence tampering. These records leave product approval as
`not-requested`; commit, push, activation, publication, release, and deployment
remain separate owner actions.

Start the configured app-server gateway with:

```sh
node bin/are.mjs gateway \
  --config packages/codex-app-server-wrapper/profiles/repository-v1.json \
  --repository-root /path/to/are-workspace \
  --listen /run/user/$(id -u)/are-codex/gateway.sock
```

The gateway supports the exported
`are.gateway-backend-adapter/v1` contract in
`packages/codex-app-server-wrapper/src/backend-adapter.mjs`. Codex remains the
default backend. Any agent process that implements the validated JSON-RPC 2.0
over JSON-lines transport can use the same authenticated continuity protocol
through `createJsonLineProcessBackendAdapter`. Adapter selection grants no
effect authority and does not install or deploy an agent process.

`packages/conversation-runtime` is a required product component. It owns
conversation identity, ordered turns, pending-decision gates, internal route
changes, usability observations, and bounded improvement handoff while keeping
the user in one conversation.

`node bin/are.mjs benchmark --mode core` exposes the benchmark through the same
product entrypoint. Define remains a separate CyberAlchemy workflow and is not
part of the self-contained ARE distribution.
The improvement surface runs the registered failure-to-learning canary and
shows a compact view of any saved result:

```sh
node bin/are.mjs improve run-canary --output /tmp/are-failure-learning.json
node bin/are.mjs improve inspect --report /tmp/are-failure-learning.json
```

Every benchmark result now projects failed checks into exact-bound Improvement
Signals and Research Hypotheses. The canary executes the complete chain from a
real stale-reuse failure through the context-bound implementation pattern,
development replay, disjoint holdout, `KEEP`/`REJECT` comparison, and retained
learning epoch. It does not activate the candidate.

Run the fixture-only model-driven coding-agent vertical with explicit
per-action approval:

```sh
node bin/are.mjs coding-agent demo --approve --keep
```

This command uses the scripted model transport, changes only a newly created
temporary fixture, runs its tests in a separate verifier process, and returns
a bounded patch-candidate receipt. The package also exposes a Codex App Server
transport adapter for an already initialized RPC client and thread. Run the
combined live path with `npm run coding-agent:canary`; it invokes one real model
turn through the restartable gateway and applies the captured candidate only to
an ephemeral fixture after authenticated gateway recovery.

The default product performs no semantic evaluation or effects. The configured
definition-readiness domain activates only when explicitly enabled. Cache
affinity is an optimization, provider cache use is reported only from configured
provider fields, and session expiration never truncates an append-only ledger.
Exact-prefix eligibility is bound to the current Context Refresh Assessment;
selected dependency drift creates a successor projection. Its receipt and any
observed provider cache telemetry are checkpointed and recovered together.
Restart recovery replays completed stable requests and blocks unknown crash-time
outcomes instead of redispatching them. This
engineering stability candidate does not itself grant acceptance, publication,
deployment, or external-effect authority. The coding-agent vertical is an L2
live-session candidate with one controlled gateway restart/reconnect canary;
it does not claim general live-model reliability, proxy installation, network
isolation, or a production sandbox.


The reusable `src/gateway-session-client.mjs` client retains gateway credentials,
stable request identities and hook bindings across a transport reconnect. Its
[construction contract](../../agent-routing/capabilities/are-cli/GATEWAY-CONTINUITY.md)
contains the API, verification command and open questions. The [native gateway canary](../../agent-routing/capabilities/are-cli/NATIVE-GATEWAY.md)
now verifies callback delivery through a reusable loopback bridge during client
disconnect and completion recovery after reconnect. Client process restart and
operational installation remain separate.
