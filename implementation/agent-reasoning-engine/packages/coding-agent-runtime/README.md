# ARE Coding-Agent Runtime

Command examples require Node 26.8.1 on PATH and run from this package directory.

This package is an `L2` candidate implementation of one model-driven coding
turn. It captures an exact read-only observation set, builds a deterministic
prompt, obtains final bytes through an injected model transport, and passes
those bytes unchanged to the bounded executor. The executor accepts one typed
`NextActionCandidate`, requires explicit per-action approval, replaces one
allowlisted existing file without following symlinks, and asks a separate
verifier process to check the exact postimage and run the fixture's declared
test command.

The package includes an adapter and a live-session owner for Codex App Server.
The live session performs `initialize`, emits `initialized`, starts one
ephemeral read-only thread, runs one model turn, and always closes the client.
Both thread and turn deny model-side approvals; the existing App Server wrapper
remains transport owner.

The package also includes a Codex-independent OpenAI-compatible model
transport. It can call a compatible hosted endpoint or a local Ollama endpoint
through the same injected `generate()` boundary used by the existing
controller. Provider credentials may be supplied explicitly in memory or by a
named environment variable; the transport receipt records only the source name
and never the credential value. This first provider-independent slice performs
one model turn and does not grant the model tools, shell access, network policy
authority, or direct write access.

```js
import {createOpenAICompatibleModelTransport} from "./model-transport.mjs";

const localModel = createOpenAICompatibleModelTransport({
  base_url: "http://127.0.0.1:11434/v1",
  model: "qwen-coder"
});
```

The implementation sequence for a general agent is saved in
`IMPLEMENTATION-DAG.md` with a machine-readable `implementation-dag.json`
companion. DAG node completion is prototype evidence only.

## Integrated bounded agent loop

The package now exposes an integrated prototype surface:

- `prepareIntegratedContext()` composes an explicit Context Basis lifecycle and
  compiles a bound Intent Contract.
- `openPersistentCodingSession()` owns a single-writer, append-only reasoning
  log with fsynced recoverable checkpoints.
- `applyIntegratedCorrection()` binds intent successors and reflection while
  withholding improvement signals unless the user explicitly selects the
  engine-candidate path.
- `runIterativeCodingAgent()` accepts only typed tool-request or final-candidate
  events, checks repository drift on every step, and invokes allowlisted
  read-only list/read/search tools only after an allow/deny/ask decision.
- `assessPatchSemantics()` and the continuation/effect adapters reuse existing
  ARE judgment and policy owners without turning their output into authority.
- `projectAgentImprovementSignals()` emits recommend-only evolution records;
  it cannot adopt an upgrade.

The loop still ends at the existing exact candidate boundary. A final candidate
cannot mutate anything without the existing explicit approval and independent
verification path.

Run the credential-free integrated latency harness with:

```bash
npm run benchmark:integrated
```

It reports p50/p95/p99 for event parsing, one allowlisted file read, and literal
search over a synthetic temporary fixture. It performs no model or network
calls and is performance evidence, not a product acceptance gate.

ACP is intentionally not advertised as implemented. The repository currently
classifies its ACP contract as discovery-only; the DAG records `CAR-090` as
`blocked-external-contract` until an exact owner-admitted protocol and
conformance surface exist.

## Direct iterative CLI

The configured CLI can now run the bounded iterative loop directly:

```bash
node bin/run.mjs \
  --iterative \
  --config /exact/path/agent-config.json \
  --root /exact/path/repository \
  --request "Repair the selected implementation." \
  --session /tmp/are-agent-session.jsonl \
  --max-steps 8 \
  --tool-policy /exact/path/tool-policy.json \
  --context-config /exact/path/context-config.json \
  --cancel-file /tmp/are-agent-cancel
```

Use `--resume` with the same session path after an interrupted run. Session and
cancellation paths must remain outside the target repository so they cannot
change the candidate's exact base-tree digest. Creating the cancellation file
causes a typed `CANCELLED` result before the next model request. Resumed history
counts against the same maximum-step ceiling.

Example policy:

```json
{
  "allow": ["list-files", "read-file", "search-text", "repository-map", "run-command"],
  "ask": [],
  "deny": []
}
```

`run-command` is exposed only when a sandbox is configured. It never falls
back to host execution. The container image must be digest-pinned; source is
mounted read-only, networking is disabled, capabilities are dropped, and CPU,
memory, process, timeout, command, and output bounds are explicit.

Add these optional fields to the run configuration:

```json
{
  "iterative": {
    "maximum_steps": 8,
    "session_path": "/tmp/are-agent-session.jsonl",
    "resume": false,
    "tool_policy": {
      "allow": ["list-files", "read-file", "search-text", "repository-map"],
      "ask": [],
      "deny": []
    }
  },
  "sandbox": {
    "type": "container",
    "engine": "/usr/bin/docker",
    "image": "registry.example/agent@sha256:<64 lowercase hex characters>",
    "allowed_commands": ["node", "npm"],
    "timeout_ms": 30000,
    "maximum_output_bytes": 131072,
    "memory": "512m",
    "cpus": "1",
    "pids_limit": 128
  },
  "repository_map": {
    "maximum_files": 256,
    "maximum_bytes": 262144,
    "include_extensions": [".js", ".mjs", ".ts", ".json"]
  },
  "advanced_reasoning": {
    "maximum_event_count": 32
  },
  "evolution": {
    "enabled": true,
    "user_selected": true
  }
}
```

The repository map examines only the configured observation allowlist. It
records file digests, imports, exports, symbols, and test classification within
explicit file and byte budgets. Advanced reasoning adds alternative branches,
verified replay fixtures, deterministic non-generative reduction, source-bound
counterevidence reuse, runtime-journal cuts/replay/eviction, and portable epoch
exports.

Every iterative final event is normalized to an exact transactional patch-set
proposal. Application still requires the proposal's exact approval digest.
Writes are rolled back when sandbox verification fails; an unprovable rollback
returns `EFFECT_AMBIGUOUS` and forbids automatic retry.

Tool names are accompanied by exact argument contracts in every model prompt.
A sandboxed diagnostic command that exits nonzero is returned to the model as
an observation, so the agent can diagnose a failing test; sandbox setup,
timeout, output-limit, and command-policy failures still stop the run.

## Automatic product canary

Run the deterministic end-to-end product candidate test with:

```bash
npm run test:product
```

The canary creates a new disposable repository with a known failing test,
advertises exact tool contracts, observes the failure through the fail-closed
container sandbox, produces a proposal without changing files, binds an
automatic approval to that proposal's exact digest, applies the patch
transactionally, and verifies the passing test in the same sandbox. Automatic
approval is confined to the newly created temporary fixture; the canary cannot
approve or modify a user repository. On success the fixture is deleted. On
failure it is retained and its exact path is included in the JSON receipt.

The default image is the current digest-pinned Node product-test image. Override
either runtime binding without editing source when validating another host:

```bash
ARE_PRODUCT_CANARY_ENGINE=/usr/bin/docker \
ARE_PRODUCT_CANARY_IMAGE='node@sha256:<64 lowercase hex characters>' \
npm run test:product
```

A `PASS_BOUNDED` receipt is current product-candidate test evidence. It does not
constitute product approval, adoption, publication, release, or deployment.

## Runtime-only candidate and product suite

`npm run candidate:manifest` now emits a v2 source manifest for this
coding-agent runtime package only. `npm run test:product-suite` binds its v2
receipt to that freshly computed manifest and runs the runtime tests, the
disposable product canary, and the credential-free provider matrix. The
discontinued TUI is neither included in the current source digest nor required
by this test command. Earlier TUI-bound v1 candidate manifests and receipts
remain historical evidence; they are not rewritten or silently promoted into
this runtime-only candidate.

The suite honors `ARE_PRODUCT_CANARY_ENGINE` and
`ARE_PRODUCT_CANARY_IMAGE` for an already available digest-pinned container
image. A missing image blocks the canary and reports its reason codes; the
sandbox never pulls an image automatically. Passing the runtime-only suite
does not establish UI conformance, desktop-task control, or product approval.

## Preflight, scoped secrets, and provider matrix

`runCodingAgentPreflight()` performs collect-all launch checks before a model
request. It validates configuration, repository scope, session/proposal paths,
the Codex executable and profile when selected, and the digest-pinned sandbox
engine/image. Dependent checks remain explicit as `not_evaluable` when a causal
prerequisite fails.

`createToolSecretBinding()` binds named secret references to one sandbox command
and explicit environment names. Values exist only inside the secret-provider
consumer, are inherited by Docker through names rather than command arguments,
and are redacted from stdout/stderr before a receipt is built. Ordinary tools
receive no secret registry. Missing bindings, command mismatch, resolution
failure, or uncertain injection blocks without host fallback.

Native SDK-shaped adapters normalize OpenAI Responses, Anthropic Messages, and
Google Generate Content results into the existing model transport contract,
including provider cache-usage telemetry. SDK clients are injected by trusted
deployment code; the core package neither installs provider SDKs nor owns
credentials. Run the credential-free governed-loop matrix with:

```bash
npm run test:provider-matrix
```

The matrix exercises a local OpenAI-compatible fixture plus OpenAI, Anthropic,
and Google native fixtures through the same iterative proposal boundary. It
performs no live provider calls and leaves every fixture unchanged.

Evolution remains recommend-only. Explicitly selected run evidence can create
an improvement signal, research result, hypothesis, experiment, reproduction,
variant, comparison, scheduled cycle, and upgrade recommendation. The coding
agent never activates that recommendation.

## CyberAlchemy capability awareness

The configured runner can project explicitly named CyberAlchemy Product
Capability records into compact, digest-bound `CapabilityDescriptor` records.
It compiles the request through `request-intent-runtime`, selects one route
through `intent-route-resolver`, and supplies only the selected descriptor to
the model. There is no ambient capability discovery. Missing sources, source
drift, ambiguous intent, no eligible route, context-budget overflow, and any
capability with a non-`none` authority effect block before the model call.

Capability lifecycle state is preserved verbatim. A selected
`candidate-not-adopted` capability remains a candidate in model context;
selection proves neither adoption nor implementation availability. Proposal
application re-hashes the explicit source set and blocks if its bytes changed.

Add this optional section to a run configuration:

```json
{
  "capability_awareness": {
    "catalog_id": "cyberalchemy-coding-capabilities",
    "catalog_version": "1",
    "owner_ref": "CyberAlchemy v2 product owner",
    "revision": "explicit-config-1",
    "capabilities": [
      {
        "source_path": "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/coding-agent-runtime/product-capability.json",
        "route_id": "produce-verified-patch-candidate",
        "label": "Produce a verified patch candidate",
        "mode": "propose",
        "owner_ref": "Agent Reasoning Engine runtime owner",
        "intent_kind": "coding",
        "request_terms": ["code", "implement", "repair"],
        "required_inputs": ["intent-contract"],
        "dominates": [],
        "forbidden_effects": ["implicit-effect-authority"]
      }
    ]
  }
}
```

Omit `intent_kind` and `request_terms` only for an explicitly unconditional
single-capability route. This awareness plane does not invoke capabilities,
tools, ACP operations, or external effects.

## Neutral secret providers

Model transports can select credentials through a backend-neutral registry.
The core knows only an opaque reference digest and provider ID. Locators remain
private to the registry, material exists only for the lifetime of a trusted
callback, retained callback bytes are cleared, and normal errors and receipts
remain redacted.

```js
import {
  createEnvironmentSecretProvider,
  createOpenAICompatibleModelTransport,
  createSecretProviderRegistry,
  createSecretReference
} from "./model-transport.mjs";

const apiKeyRef = createSecretReference({
  provider_id: "deploy-env",
  locator: "MODEL_API_KEY"
});
const secrets = createSecretProviderRegistry({
  providers: [createEnvironmentSecretProvider({provider_id: "deploy-env"})]
});
const model = createOpenAICompatibleModelTransport({
  base_url: "https://models.example/v1",
  model: "example-model",
  api_key_ref: apiKeyRef,
  secret_registry: secrets
});
```

Cloud or deployment plugins use `createInjectedSecretProvider()` and return
fresh secret bytes from their own SDK or injection mechanism. The callback is
trusted runtime code: this boundary prevents accidental serialization and
retention but cannot defend against malicious in-process consumers or process
memory inspection. The Python SOPS-age store is connected through a dedicated
bounded process bridge; the general-purpose `reveal --stdout` CLI is not used.

## Configured Codex-independent agent

`bin/run.mjs` executes the existing one-turn bounded agent against a selected
repository. Configuration contains provider references but never secret
material. This local SOPS-age example resolves `model/openai-key` only while
constructing the model request:

```json
{
  "schema_version": "are.coding-agent-run-config/v1",
  "model": {
    "transport": "openai-compatible",
    "base_url": "https://api.openai.com/v1",
    "model": "example-model",
    "credential": {
      "provider_kind": "local-sops-age",
      "provider_id": "local-model-secrets",
      "locator": "model/openai-key"
    }
  },
  "observation_allowlist": ["package.json", "src/example.mjs", "test/example.test.mjs"],
  "mutation_allowlist": ["src/example.mjs"],
  "verification_command": ["node", "--test"]
}
```

The first command always stops with an immutable `AWAITING_APPROVAL` proposal:

```bash
node bin/run.mjs \
  --config /exact/path/agent-config.json \
  --root /exact/repository/root \
  --request "Repair the selected implementation." \
  > /tmp/are-proposal.json
```

After inspecting the candidate bytes and target, apply that saved proposal by
supplying its exact `approval_digest`:

```bash
node bin/run.mjs \
  --config /exact/path/agent-config.json \
  --root /exact/repository/root \
  --apply-proposal /tmp/are-proposal.json \
  --approve-digest 'exact-candidate-sha256'
```

Application performs no second model call and retrieves no secret. Candidate,
configuration, file, or tree drift blocks before mutation. Environment
credentials use `provider_kind: "environment"` with an environment-variable
locator. Programmatic cloud plugins use
`provider_kind: "injected"`; the CLI intentionally has no ambient plugin
fallback. The strict configuration rejects embedded `api_key` fields and
unknown provider fields.

### Secret retrieval benchmark

Run the synthetic provider benchmark from this package directory:

```bash
npm run benchmark:secrets
```

Add `-- --enforce` or use `npm run benchmark:secrets:enforce` to enforce the
prototype budgets: adapter p95 at most 100 microseconds and the complete
Node-to-Python SOPS-age provider path at most 500 milliseconds. The local
measurement creates and removes an isolated vault under `/tmp`; it never reads
the live vault. The standalone Python store-core benchmark retains its 200
millisecond p95 ceiling. Cloud network latency is reported as `NOT_EVALUATED`
until a separately authorized provider canary exists. Results are host-local
performance evidence, not product conformance.

The deterministic demo uses the scripted adapter and does not invoke a live
model or access the network. The opt-in live gateway canary invokes one model
through the version-bound, file-backed ARE Codex gateway, restarts that gateway
after capturing the model output and before applying it, authenticates the
recovered session, and changes only a temporary fixture. This package is not
installed into the live proxy, does not provide a production sandbox, and does
not authorize an effect. An uncertain post-effect state returns
`EFFECT_AMBIGUOUS` and is never retried automatically.

Run the deterministic human-test vertical with Node 26.8.1:

```bash
node bin/demo.mjs --approve --keep
```

Without `--approve`, the command stops before mutation with
`AWAITING_APPROVAL`. `--fault-after-effect` exercises the fail-closed ambiguous
outcome. The returned receipt is candidate evidence only and has
`authority_effect: none`.

Run the controlled combined canary with:

```bash
npm run canary:live-gateway
```

It requires the Codex version bound by the repository profile. The model sees
only the temporary fixture's allowlisted files through a read-only,
network-disabled App Server turn. The mutation step runs only after the gateway
restart and explicit canary approval, then a separate process verifies the
postimage.

For the smallest direct App Server test, run this from the package directory:

```bash
node ../../bin/are.mjs coding-agent live-demo --codex-command /exact/path/to/codex --approve --keep
```

Omit `--approve` to prove that a model-produced candidate stops before fixture
mutation. Add `--model <id>` to override the configured Codex default. This
command invokes a real model but changes only its temporary fixture; `--keep`
prints and retains that fixture for inspection. The selected Codex executable
is version-checked before a fixture or App Server session is created.

## Open Questions

- Which selected active client, if any, should supply a separately tested UI
  candidate for this runtime after the TUI's discontinuation?
- Which digest-pinned Node image should be the default on each supported build
  host? A locally installed alternative can validate the bounded suite without
  changing the frozen default.
