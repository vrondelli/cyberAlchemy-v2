# Verbatim Explorer Returns

## Shannon explorer report — exact local ARE runtime

### Inventory preflight

Inventory lookup was required first and is degraded/discovery-only.

- `.arcanum/inventory/index.json` exists and parses.
- Current validator result: `lookup_readiness=blocked`; source coverage has **7 errors**, tags have 169 warnings. Identity, existence, derived maps, human view, and freshness passed.
- `strategy-inventory-packet.json` records only 6 source-coverage errors, so the packet’s diagnostic count has already drifted.
- Selected Inventory leads were used only to locate direct sources; they close no claims.

No files were mutated.

### Working runtime reconstructed

```text
request
  -> verified request-decision profile / exact-one route
  -> Context Basis:
       definition closure + ontology selector lock
       + selected-dependency refresh
       -> immutable budgeted Context Envelope
  -> wrapper preflight (fail before model turn)
  -> persistent gateway / App Server JSON-RPC
  -> thread/start -> turn/start
  -> ordered runtime-journal events and approval mediation
  -> turn/completed
  -> optional exact-opt-in semantic materialization/evaluation
  -> receipt-bound dual-lane continuation decision
  -> seal Reasoning State frontier + epoch + fsync checkpoint
  -> at most one eligible successor, or gate/block/complete
```

The hot path is already conceptually sound: deterministic local classification and selected-dependency checks precede a thin persistent App Server transport; semantic evaluation is disabled by default and occurs only at completion through an exact profile; replay performs zero external calls.

### Ownership separation

| Concern | Current owner | Boundary |
|---|---|---|
| Product meaning, authority, routing, definitions, ontology status | CyberAlchemy-v2 owners | ARE consumes exact records/selectors/digests; it cannot admit, promote, or authorize |
| Context/reasoning state, semantic reduction, provenance, receipts, continuation constraints | ARE | Explicit inspectable state, never hidden chain-of-thought |
| Coding loop | Not yet a separately closed local owner | Must consume ARE preflight/continuation and App Server turn results; must not become a second state or authority owner |
| Model interface | Codex App Server + ARE wrapper | JSON-RPC/thread/turn/tool streaming; no typed BAML boundary is present locally |
| Environment/sandbox | Codex runtime and permission mechanism | Runtime approval is not an authority decision; ARE binds exact effect envelopes |
| UX/transport | Desktop/client plus persistent gateway | Reconnects transport to the same in-memory consumer session only; no semantic or lifecycle ownership |

### Reuse / extend / do not duplicate

| Reuse now | Extend before production | Do not duplicate |
|---|---|---|
| Request Decision Router | Explicit coding-loop owner and typed action/result protocol | CyberAlchemy routing/governance inside the loop |
| Context Basis closure, selector lock, immutable envelope | Cache keyed by exact immutable dependency digests, with measured invalidation correctness | Provider prompt cache as freshness evidence |
| Append-only Reasoning State, epochs, frontiers, checkpoints | Cross-process locking, multi-writer coordination, compaction, distributed durability | App Server transcript/thread state as Reasoning State |
| In-memory completion Runtime Journal | Durable cross-session journal or deliberate merge into the Reasoning State owner | A second causal/event ledger |
| Persistent per-consumer gateway | Authenticated reconnect, ambiguous-outcome reconciliation, delivery acknowledgement | One shared upstream session across plan/human lanes |
| Dual-lane continuation | Exactly-once delivery contract; branching/fork semantics | Model output or turn completion as continuation authority |
| Existing semantic receipt binding | Typed model boundary if BAML proves lossless identity/receipt carriage | BAML compiler/runtime as evaluator, state, routing, or authority owner |

### Ferrari-fast smallest boundary

Keep only these synchronous before `turn/start`:

1. verified compiled route profile;
2. exact selected-dependency digest/freshness check;
3. immutable Context Envelope projection;
4. append one preflight event;
5. forward through an already-running per-consumer gateway.

Cache compiled catalogs and envelope material only by immutable source/closure/selector digests. Never cache gate outcomes or use cache hits as currency for authority/currentness. Perform semantic evaluation, continuation derivation, frontier sealing, and risk-aligned `fsync` after completion/before successor or effect. This preserves traceability while removing process startup and unrelated ontology scans from the hot path.

### Current measured evidence and claim ceiling

Historical bounded evidence:

- September 2 recovery assessment: 12 reasoning-state tests, 47 wrapper tests, 184 aggregate ARE package tests, 37 Codex regression tests, 22 continuation-integration tests; 100-iteration warm context-lifecycle p95 **94.263 ms** against 250 ms. Status is candidate, not accepted/admitted.
- September 1 controlled live canary: one thread, one turn, one exact-envelope command approval, 17 ordered events; preflight-before-turn, effect-before-approval, and completion-before-continuation all true. It grants no default installation or general effect authority.
- Fresh validation today is **not evaluable**: no Linux Node is installed; the Windows npm shim rejects the WSL UNC cwd, and bundled `node.exe` cannot resolve the WSL script path. The zero-test outputs are not PASS evidence.

Drift:

- The old `ARE-CODEX-OPEN-002` implementation receipt is historical. **15 of its authored-file digests differ from current wrapper bytes**, including README, CLI, package/profile, continuation, preflight, protocol, request-context, source adapters, wrapper, and tests.
- The currently dirty ARE bytes are confined to `benchmarks/real-reasoning-v1`: five modified tracked files plus new fixtures/schema/source/tests. The coding-runtime research folder is untracked. These bytes are not accepted evidence.

### Missing production obligations

- No branching/fork/merge semantics.
- No cross-process lock, multi-writer safety, compaction, or distributed durability.
- Delivery acknowledgement is absent; recovery is deliberately at-most-once.
- Completion journal remains process-memory and cross-session durability is absent.
- Gateway reconnect preserves only same-process session state; authenticated durable reconnect and ambiguous-outcome recovery remain open.
- No production semantic catalog/default activation.
- No closed typed model-interface integration.
- No separately owned minimal coding loop or end-to-end sandbox contract.
- No current cache-affinity/prefix-reuse benchmark proving warm/cold semantic equivalence.
- Current binding is not accepted; whole engine is not admitted, installed, published, or deployed.
- Fresh regression/performance replay needs a native Linux Node runtime.

### Exact source bindings

- `cyberAlchemy-v2/development/agent-reasoning-engine/README.md` §§Product thesis, Current posture, lines 6–140  
  SHA-256 `5434e26b5cf8edee325d89f67da99ed6b9351f6130684bb1c58c94344698f3e0`
- `cyberAlchemy-v2/development/agent-reasoning-engine/design/ARCHITECTURE.md` §§View 1–4, lines 46–162  
  SHA-256 `1958758a104c19af9966fd1460097c18fbf919e480da45e5c8dcc0b5f4ffe0de`
- `.../context-basis-runtime/src/context-envelope.mjs` lines 41–243  
  SHA-256 `93c98f5451946420fee121053e9861e79ff2e2596256ea2d4b3794b28c40f81e`
- `.../context-basis-runtime/src/lifecycle.mjs` lines 14–35  
  SHA-256 `f9d2fbc104653fee51eb007ff27189631d1855f8dc09c4cc70a633069ff5b13e`
- `.../reasoning-state-runtime/README.md` lines 1–63  
  SHA-256 `9c5e6ba523cac144da32a4f1c52fc9a59260829cce4654f60bd6c53a09506d34`
- `.../reasoning-state-runtime/index.mjs` lines 94–135, 207–316, 543–618, 618–806  
  SHA-256 `22d9e2705782df56cf922edb4bda3893609ea10bae003a6c67c218679e22ccd0`
- `.../runtime-journal/index.mjs` lines 94–192, 196–268  
  SHA-256 `e74998467cac6dd04b462d58b73ae98c55ac5412dc7c901d5c06686e92666b37`
- `.../codex-app-server-wrapper/src/gateway.mjs` lines 51–166, 169–290  
  SHA-256 `6ea479d604a4664afab1bcaee76d39249b9052fe197e02c15f58705c8e8532d1`
- `.../codex-app-server-wrapper/src/rpc-client.mjs` lines 180–235  
  SHA-256 `9e505e5d7340c2ab6eb931763f307307d6665a57d00280900ba407fe0d6c3ea8`
- `.../codex-app-server-wrapper/src/continuation.mjs` lines 68–145  
  SHA-256 `a13910408b1875e0725e1cf7beda739ba27ab73e5554f36c7fb74f0952779368`
- `.../reasoning-state-runtime/evidence/implementation-recovery-conformance-assessment.candidate.json` full record  
  SHA-256 `30a4f2e506557743bb55f46e09c8c9870d434ede7f9d0cf72e28610215d44382`
- `cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/receipts/2026-09-01-live-app-server-canary-v2-final.json` full record  
  SHA-256 `1c93f930be47bc8e4eafd0ac637742a4a63619825a68898da7bb8b782759530f`
- `.../codex-integration/implementation-binding.v2.json` full record  
  SHA-256 `e0efea7a88a2c369ede8cce08f9337039b94a6ae44419ca53959e80d7e55cbaf`

## Explorer report: mini-swe-agent v2

### Evaluation selector and evidence status

- Evaluated upstream: `SWE-agent/mini-swe-agent` release `v2.4.6`, commit `a83fcae82d2a08f0ee0c688f9d137b3566c097f8`, published 2026-07-23. The package declares version `2.4.6`, Python `>=3.10`, Development Status Alpha, and MIT licensing ([version/protocols](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/__init__.py#L11-L80), [package metadata](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/pyproject.toml#L6-L47), [license](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/LICENSE.md#L1-L20)).
- Repository Inventory lookup: zero matches for `mini-swe`, `swe-agent`, `coding-agent`, or `trajectory` in `.arcanum/inventory/index.json`. The index is parseable but declares `source_coverage: partial` and `validation_boundary: inventory-read-model-only`; therefore this is a degraded no-match, not absence evidence.
- Source inspection was read-only. No upstream code or benchmark was executed locally.

### What v2 actually is

The irreducible kernel is:

```text
initialize [system,user]
  -> check step/cost/wall-time limits
  -> Model.query(full messages)
  -> parse one-or-more bash actions
  -> [optional interactive confirmation]
  -> Environment.execute(action), sequentially
  -> format observation(s)
  -> append to messages
  -> save whole trajectory
  -> repeat until an exit-role message
```

This is directly implemented by `run`, `step`, `query`, and `execute_actions` ([default.py L88-L157](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/agents/default.py#L88-L157)). The useful minimum is only the coordinator relation `query -> authorize -> execute -> observe -> append -> continue`; its current concrete state and effect semantics are insufficient for CyberAlchemy-v2 + ARE.

V2 uses duck-typed `Model`, `Environment`, and `Agent` protocols ([`__init__.py` L43-L80](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/__init__.py#L43-L80)). Native tool calling is default, with models responsible for action parsing and observation formatting ([migration guide, “Tool calling” and “Architecture changes”](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/docs/advanced/v2_migration.md#L82-L117)). The built-in tool schema is only `{command: string}`; parsing verifies JSON, tool name, and presence of `command`, then emits `{command, tool_call_id}` ([actions_toolcall.py L11-L76](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/models/utils/actions_toolcall.py#L11-L76)).

Trajectories are a mutable in-memory `list[dict]`, serialized by rewriting JSON with configuration, cost/call totals, provider-native messages, and `trajectory_format: mini-swe-agent-1.1` ([default.py L159-L190](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/agents/default.py#L159-L190)). V2 intentionally permits provider-dependent message structures ([migration guide L119-L130](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/docs/advanced/v2_migration.md#L119-L130)). This is inspectable but not a stable typed event contract.

There is no run-level resume: `run()` clears `messages`, and the CLI has no trajectory-input option ([default.py L88-L95](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/agents/default.py#L88-L95), [CLI L53-L105](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/run/mini.py#L53-L105)). Batch “resume” only skips instance IDs already present in `preds.json`; a restarted instance begins over ([swebench.py L228-L233](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/run/benchmarks/swebench.py#L228-L233)).

### Adopt / adapt / benchmark / reject

| Decision | Exact mechanism | Binding |
|---|---|---|
| Adopt | Tiny coordinator topology and independently replaceable model/environment protocols | Adopt as an architectural pattern, not an upstream runtime dependency. |
| Adapt | Limit checks, explicit format-error trajectory events, partial timeout output, independent command invocations | Re-express as ARE typed events and failure states; retain process-group kill behavior ([local.py L72-L92](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/environments/local.py#L72-L92)). |
| Adapt | Human/confirm/yolo interaction | Replace raw regex whitelists and grouped command confirmation with per-effect capability decisions bound to immutable action digests ([interactive.py L124-L181](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/agents/interactive.py#L124-L181)). |
| Benchmark | Release `v2.4.6` loop and v2.0.0 SWE-bench result artifacts | Use as a behavioral/latency baseline only. |
| Reject | `DefaultAgent.messages` as authoritative state; whole-file saves; completion magic string | ARE Reasoning State must own append-only identity, replay, branch, checkpoint, and completion evidence. |
| Reject | Built-in LiteLLM/provider adapters in the hot path | Codex app-server transport must own streaming/reconnect; provider retries cannot imply safe effect retries. Built-in retry defaults to 10 exponential attempts ([retry.py L19-L24](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/models/utils/retry.py#L19-L24)). |
| Reject | Local/Docker/Bubblewrap as production policy | Treat only as benchmark environments; authority and sandbox policy need a separate kernel. |
| Reject | Wholesale fork or library adoption | Most concrete ownership must be replaced, while importing the package also brings broad unpinned runtime dependencies and startup config behavior. Adapt the small loop contract instead. |

### Required replacements

- **ARE Reasoning State:** typed, content-addressed `ModelRequested`, `ModelChunk`, `ActionProposed`, `ApprovalBound`, `ActionStarted`, `ObservationRecorded`, `Checkpoint`, and `CompletionCandidate` events. Upstream `extra` is stripped before model calls ([litellm_model.py L76-L105](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/models/litellm_model.py#L76-L105)); therefore ARE identities/receipts are not carried losslessly by the current provider message path.
- **Codex app-server:** streaming and authenticated reconnect. The inspected model protocol exposes one synchronous `query`; no chunk, reconnect, cursor, or continuation contract exists.
- **Exactly-once continuity:** allocate `action_id = hash(run, branch, parent_state, normalized_action, authority_digest)` before dispatch; persist intent; environment accepts idempotency key; persist result before acknowledging. Upstream has only provider `tool_call_id`, no durable effect key, so a crash after `execute()` and before append/save can duplicate effects.
- **Typed action/result envelope:** replace arbitrary bash string/dict with operation kind, arguments, cwd selector, input-state digest, requested capability, timeout, output digest, return status, truncation metadata, and provenance.
- **Authority:** CyberAlchemy-v2 decides whether an effect is permitted; neither parse success, user interface mode, command exit 0, nor completion-marker output is authority or correctness.
- **Sandbox:** execution kernel pins image/rootfs digest, writable mounts, cwd root, UID, capabilities, seccomp, network/egress, secret handles, resource limits, and artifact export policy.

### Security findings / threat cases

- `mini` defaults to `LocalEnvironment`, documented as “No isolation” ([environments guide L10-L18](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/docs/advanced/environments.md#L10-L18)). It invokes `shell=True`, inherits the full process environment, and permits caller-selected cwd ([local.py L24-L30, L72-L84](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/environments/local.py#L24-L30)): prompt injection can become command execution, path escape, or secret exfiltration.
- Docker defaults to `run_args=["--rm"]`; it does not disable network, drop capabilities, pin image digests, or declare mount policy ([docker.py L15-L42, L74-L89](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/environments/docker.py#L15-L42)).
- Bubblewrap is explicitly experimental and its default arguments do not unshare networking ([bubblewrap.py L1-L10, L29-L65](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/src/minisweagent/environments/extra/bubblewrap.py#L1-L10)).
- Observation dicts are unsigned; any duck-typed environment can forge them. Linear order does not establish provenance.
- Multiple tool calls execute sequentially without transactional boundary; partial execution is possible. Interactive mode records nonexecuted outputs but supplies no compensation or duplicate suppression.
- Dependencies are ranges rather than a lock; exclusions for compromised LiteLLM versions show awareness but do not close provider/dependency drift ([pyproject.toml L33-L47](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/pyproject.toml#L33-L47)).

### Performance and benchmark claim ceiling

The README claims `>74%` SWE-bench Verified and faster startup than Claude Code ([README L23-L31](https://github.com/SWE-agent/mini-swe-agent/blob/a83fcae82d2a08f0ee0c688f9d137b3566c097f8/README.md#L23-L31)). The exact official leaderboard data at `SWE-bench/swe-bench.github.io@193160a463a435d05cf44a1fa9dc5eac832113c3` records a 76.8% bash-only result for mini-swe-agent `2.0.0` with Claude 4.5 Opus high, 500 instances, one attempt, average cost `$0.7539`, average 32.896 model calls, and downloadable trajectory locator. This supports a v2.0.0/model/config result, not v2.4.6 performance or local suitability. No startup or per-step latency distribution is supplied; “starts much faster” remains unverified.

### Reproducible probes

```bash
git clone https://github.com/SWE-agent/mini-swe-agent.git
cd mini-swe-agent
git checkout a83fcae82d2a08f0ee0c688f9d137b3566c097f8
test "$(git rev-parse HEAD)" = a83fcae82d2a08f0ee0c688f9d137b3566c097f8
python -m pytest tests/agents/test_default.py tests/agents/test_interactive.py \
  tests/environments/test_local.py tests/models/test_actions_toolcall.py
```

Run cold/warm deterministic loop microbenchmarks with `MSWEA_SILENT_STARTUP=1` and a temporary `MSWEA_GLOBAL_CONFIG_DIR`; report p50/p95/p99 for import, initialization, query stub, environment round trip, observation formatting, and full trajectory save at 1/10/100 steps.

Crash mutant: environment increments a durable counter, then the process is killed before `add_messages/save`; restart the same task. Upstream is expected to increment twice; the ARE-bound candidate must return the prior observation for the same `action_id`.

Security mutants: malicious repository instruction requesting environment dump; `cwd=../../`; symlink escape; network beacon from Docker/Bubblewrap; oversized output; child-process timeout; forged environment result; two actions with first succeeding and second failing. Production acceptance requires denials/typed failures without secret bytes or duplicate effects.

Benchmark parity: run the same 500 SWE-bench Verified instances with pinned dataset revision, model ID, reasoning effort, container digests, prompts/config, retry settings, and network policy for upstream v2.4.6 and the proposed kernel. Preserve trajectories and independently evaluate `preds.json`; compare resolved rate, empty patches, failures, calls, cost, wall time, and p50/p95 tool overhead.

### Decision

Use mini-swe-agent as a pinned benchmark and as evidence that the fast coding loop can remain conceptually tiny. Do not fork it or install it as the production runtime. Adapt only the four-stage loop and replace its state, transport, action envelope, authority, continuity, and sandbox semantics with ARE-, Codex app-server-, CyberAlchemy-v2-, and execution-kernel-owned contracts.

## BAML exact-binding report

### Scope and evidence status

Inventory lookup against `.arcanum/inventory/index.json` completed with no `BAML` or `BoundaryML` match. Inventory was therefore a successful no-match, not degraded, and supplied no evidence.

Primary upstream evaluation target:

- **BAML v0 `0.225.0`**, non-prerelease release published 2026-08-01.
- Exact peeled tag commit: **`da2a673b52dceea8bc592462ab3b0ba2d965f65e`**.
- The source declares `version = "0.225.0"` in [`engine/Cargo.toml:191-196`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/Cargo.toml#L191-L196); release selector: [`0.225.0`](https://github.com/BoundaryML/baml/releases/tag/0.225.0).
- License: Apache-2.0, including copyright and patent grants ([`LICENSE:1-77`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/LICENSE#L1-L77)).

Do not conflate this with the new full **BAML Language** line. At research time, repository HEAD was `ceccb6f91047270a82500a2905444c975005fc4b`, corresponding to nightly `baml-language-0.18.1-nightly.20260902.a`. Even the pinned v0 tag’s root README advertises the newer programming-language product ([`README.md:9-29`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/README.md#L9-L29)). The requested seam is therefore evaluated from the pinned `engine/` v0 implementation and official v0 documentation; the nightly language is **reject/defer** for this architecture until it has a stable release and compatibility evidence.

### What v0 actually provides

- **Compiler and generated clients.** The Rust workspace contains compiler, runtime, language clients, generators, VM, RPC, and parser components ([`engine/Cargo.toml:1-26`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/Cargo.toml#L1-L26)). Generator targets are OpenAPI, Python/Pydantic v1/v2, TypeScript/React, Ruby/Sorbet, Go, and Rust ([`generator.rs:13-37`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-lib/baml-types/src/generator.rs#L13-L37)). Generator versions are parsed as SemVer, with an unsafe-looking `0.0.0` default if omitted ([`v2.rs:133-153`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-lib/baml-core/src/validate/generator_loader/v2.rs#L133-L153)); the spike must pin `0.225.0`.
- **Model providers.** Source implements OpenAI-family, Anthropic, AWS Bedrock, Google AI, Vertex, plus fallback and round-robin strategies ([`clients/mod.rs:10-40`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-lib/llm-client/src/clients/mod.rs#L10-L40)). Official docs additionally describe OpenAI Responses and generic OpenAI-compatible endpoints under the `client<llm>` section.
- **Schema-aligned parsing (SAP/JSONish).** The parser finds typed objects amid prefix/suffix text, aliases fields, coerces types, wraps arrays, and obeys declared constraints ([`jsonish/README.md:5-24`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-lib/jsonish/README.md#L5-L24)). This is forgiving coercion, not proof that content is true, fresh, authorized, or semantically correct.
- **Structured streaming.** Generated partial types make ordinary fields nullable until available; the final response is the original validated type. `@stream.done`, `@stream.not_null`, and state annotations control partial exposure ([official Streaming, “Semantic Streaming” and “Type Transformation Summary”](https://docs.boundaryml.com/guide/baml-basics/streaming)). Partial objects must remain UX-only candidates.
- **Retries/fallbacks.** Retry policy supports constant or exponential delay ([`retry_policy.rs:31-60`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-runtime/src/internal/llm_client/retry_policy.rs#L31-L60)); fallback walks configured clients in order ([`fallback.rs:68-94`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-runtime/src/internal/llm_client/strategy/fallback.rs#L68-L94)). Official error handling raises only the last aggregate error type while preserving attempt history in `detailed_message` ([“Error Handling,” aggregate clients](https://docs.boundaryml.com/guide/baml-basics/error-handling)).
- **Testing/evaluation.** BAML test blocks support assertions, checks, latency expressions, filtering, and controlled parallelism ([official testing guide](https://docs.boundaryml.com/guide/baml-basics/testing-functions), [`baml-cli test`](https://docs.boundaryml.com/ref/baml-cli/test)). These are useful fixtures, not independent production evidence.
- **Tracing.** v0 trace events have call IDs, event IDs, call stacks, timestamps, request/response events, and raw streamed responses ([`events.rs:15-33`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-lib/baml-types/src/tracing/events.rs#L15-L33), [`events.rs:100-164`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-lib/baml-types/src/tracing/events.rs#L100-L164)). Collector state is in-memory/ref-counted and discarded when unowned ([`storage.rs:31-51`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-runtime/src/tracingv2/storage/storage.rs#L31-L51), [`storage.rs:76-93`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-runtime/src/tracingv2/storage/storage.rs#L76-L93)). It is not an append-only Reasoning State ledger.
- **Deployment.** Embedded generated clients are the mature-looking path. BAML-over-HTTP is explicitly preview ([official Docker REST API](https://docs.boundaryml.com/guide/development/deploying/docker-rest-api)); reject it as an additional production transport.

### Adopt/adapt/benchmark/reject binding

| Mechanism | Decision | Exact boundary |
|---|---|---|
| BAML schema + generated typed function client | **Adapt** | Typed model-output payload boundary only; no routing, authority, coding loop, transport continuity, or state ownership. |
| Modular `request` / `parse` API | **Benchmark** | Best candidate seam: BAML can build a request and parse a separately transported raw response ([official Modular API, “lower level API”](https://docs.boundaryml.com/guide/baml-advanced/modular-api)). |
| SAP final parsing | **Adapt after mutants** | Useful for malformed model syntax; require strict local post-validation because coercion can hide ambiguity. |
| Structured partial streaming | **Benchmark** | Display/progress only. Never dispatch tools, checkpoint, or authorize effects from partials. |
| High-level BAML provider transport | **Reject for primary path** | Conflicts with Codex app-server transport/reconnect ownership and may change exact request bytes and stable-prefix caching. |
| BAML retry/fallback orchestration | **Reject in hot path initially** | It obscures one logical call behind multiple attempts and adds tail latency. If later used, every attempt must become an ARE event and remain upstream of effect dispatch. |
| Collector/tracing | **Adapt as diagnostic projection** | Export into ARE-owned immutable records; do not treat collector IDs or logs as receipts. |
| BAML tests/evals | **Adapt** | Development corpus and parser mutants only; independent runtime benchmarks remain required. |
| BAML-over-HTTP | **Reject** | Duplicates transport/process/reconnect surface; preview status. |
| New BAML Language nightly | **Reject/defer** | Separate unstable product line; no compatibility or migration evidence for this seam. |

### Hot-loop and identity verdict

**BAML belongs outside the execution loop as a typed model boundary.** The minimal path is:

`ARE context/state selection → outer identity envelope → BAML request build → existing app-server transport/stream → raw-byte capture → BAML final parse → strict local validation → ARE append → authority gate → coding-loop action`

BAML can represent IDs/digests as strings, and tags can carry metadata, but that does **not** prove lossless identity or receipt semantics. Model-generated echoes are mutable; BAML call IDs are runtime trace identifiers; collector storage is ephemeral. Therefore ARE request/state/schema/provider/version identities remain in an outer envelope, byte-for-byte, and BAML owns only the typed candidate payload. A receipt must bind at least:

`ARE request_id + state_digest + BAML schema digest + BAML 0.225.0/commit + provider/model/options + exact request bytes + raw response/SSE bytes + final parsed payload digest + parse outcome`.

Replay is deterministic only as a hypothesis for `pinned parser + pinned schema + captured raw bytes`; retries, live providers, and cross-version SAP changes are not deterministic replay.

### Performance evidence and unresolved claims

No applicable upstream cold-start or per-call distribution was found. The integration “performance baseline” merely prints elapsed time and explicitly has no timing assertion ([`test_memory_performance.rs:54-65`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/integ-tests/rust/tests/test_memory_performance.rs#L54-L65)). JSONish has an internal `<20 ms` per-partial-parse assertion and `<2 MB` peak check, but no machine specification or released distributions ([`memory_benchmark.rs:39-84`](https://github.com/BoundaryML/baml/blob/da2a673b52dceea8bc592462ab3b0ba2d965f65e/engine/baml-lib/jsonish/tests/memory_benchmark.rs#L39-L84)). “Rust/fast” claims remain vendor claims.

The release commit reports successful runtime builds but live-provider-dependent integration failures and collector cleanup errors; production reliability is unresolved ([exact release commit](https://github.com/BoundaryML/baml/commit/da2a673b52dceea8bc592462ab3b0ba2d965f65e)).

### Reproducible probes and minimal spike

```bash
git ls-remote https://github.com/BoundaryML/baml.git \
  'refs/tags/0.225.0^{}'
# must equal da2a673b52dceea8bc592462ab3b0ba2d965f65e
```

In an isolated temporary checkout at that commit:

```bash
cargo test --manifest-path engine/Cargo.toml -p jsonish
cargo bench --manifest-path engine/Cargo.toml -p jsonish
cargo test --manifest-path engine/Cargo.toml -p baml-runtime
```

Minimal spike: one non-effectful `NextActionCandidate` BAML function with a closed enum and payload; IDs remain outside its model output. Compare four same-model/mock-provider paths: direct app-server baseline, BAML high-level, BAML modular non-streaming, and BAML modular streaming. Record cold initialization and warm p50/p95/p99 for request build, first partial, per-chunk parse, final parse, total non-provider overhead, allocations, request bytes, token counts, and prefix-diff position.

Required mutants: malformed/truncated JSON, prose prefix/suffix, wrong enum, duplicate fields, missing required field, partial stream without terminal event, cancellation, 429/500, timeout, fallback exhaustion, process death, replay at same version, replay at next BAML version, forged identity in model output, and duplicate logical dispatch. Kill the seam if it changes the cache-stable prefix unexpectedly, cannot preserve raw bytes, permits a partial to trigger an effect, exceeds the local latency budget, or cannot project every attempt/failure into ARE without ambiguity.

Claim ceiling: **BAML v0 `0.225.0` is a plausible typed model-boundary candidate to adapt and benchmark. This research does not establish adoption, latency fitness, replay equivalence, authority safety, conformance, or production readiness.**
