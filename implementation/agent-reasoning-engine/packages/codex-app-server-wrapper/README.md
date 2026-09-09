# Codex app-server wrapper candidate

## Objective resolution before routing

Opt in with `"objective_resolution": {"enabled": true, "provider_timeout_ms": 1000}`
in an explicitly selected repository profile. The default remains disabled.

```text
request + consumer/task objective state
  → resolve continue / refine / replace / interrupt / new
  → append transition + checkpoint existing reasoning ledger
  → route resolved objective → fresh Context Envelope
  → context-bound intent compilation → verified Codex dispatch
```

The original user input is preserved. Routing uses the resolved objective text
with original input and resolution digests as evidence; explicit effect, target,
and constraint hints still pass through existing checks. Codex receives an
`are.codex-objective-fragment/v1` with the active objective, transition, provenance
digest, and completion posture. Resolution does not establish task completion.

Objective state is isolated by profile, consumer, and Codex thread. The existing
append-only ledger retains immutable transitions and restores their verified
predecessor chain on restart. Diagnostics retain identifiers and digests, not
objective text. A failed ledger checkpoint prevents forwarding and requires a
restart before further interpretation writes. A recovered compact cache summary
is diagnostic evidence, not a full reusable projection: the next dispatch starts
with a cache miss and freshly verified context.

Requests use `clientUserMessageId` when present, otherwise the JSON-RPC ID within
the scoped thread. Reusing a recorded identity returns an explicit result without
redispatch; changed text under that identity blocks. Supply a new ID for a new
request. A transition records interpreted intent even if subsequent preflight
fails: it does not assert that dispatch occurred. Crash delivery reconciliation
is not replaced by automatic retries.

The deterministic path recognizes bounded English cues. An optional native
`objective_provider` receives the request and immutable objective state with one
deadline-bounded call. Configure `objective_resolution.meaning_selection` with
`definition_ids`, `node_ids`, `edge_ids`, and optional `max_bytes` (at most 32768)
to supply a bounded meaning subset. Exact selected edges also require their
endpoint nodes. Missing, duplicate, malformed, or oversized selected records
block without calling the provider or truncating text. These are interpretation
inputs, not a substitute for the full route-owned Context Basis.

Only a provider fallback loads this subset; deterministic cues avoid that work.
The normal verified live-source loader supplies one snapshot shared with the
subsequent preflight. No old envelope is asserted current, and no repository-wide
discovery is performed. A selection receipt binds text projection, source digests,
authority posture, selectors, and byte count into the existing transition event.
Unrelated records do not change the selected-context digest. Definitions and
ontology text remain context, never automatically admitted observations or facts.
Unresolved interpretations stop before routing.
Automatic successors also pass through objective preflight, so a proposal without
enough transition evidence stops instead of bypassing it. Existing continuation
and effect checks remain mandatory.

Construction frontier: wrapper integration and local regression tests. Runnable
next work: evaluate a real interpretation provider against the language challenges.
Operational residue: source-binding/projection reconciliation belongs to the ARE
model owners; Craft's thesis bindings belong to Craft's owners. Neither changes
this prototype's runtime behavior. No default activation, publication, or adoption
is performed here.

Open questions: how should broader conversational evidence resolve an ambiguous
transition, and which explicit completion evidence should retire an objective?
The historical interaction-learning plan remains unchanged.

Run `node scripts/objective-language-benchmark.mjs` for the authored 20-case
challenge set. It currently measures the deterministic path only and reports
unresolved known intents separately from unexpected resolutions. Scripted provider
tests establish wiring and provenance, not language-model accuracy or market value.

This package implements the selected `ARE-CODEX-OPEN-002` boundary against the
version-bound Codex app-server JSON-RPC protocol. It is a client-owned stdio
proxy around `codex app-server`.

## Reusable reasoning state

Every forwarded `turn/start` passes through an explicit reasoning-state
boundary. The wrapper appends the request interpretation and selected Context
Envelope as immutable reasoning events, seals their exact event digests into a
Reasoning State epoch, materializes the complete canonical JSON-RPC request and
request-series header, reconstructs and verifies those bytes, and checkpoints
the epoch before forwarding.

Accepted effects and automatic continuations have independent required
checkpoints. A sink append, verification, or flush failure blocks that boundary.
The repository profile defaults to explicit process-memory operation. Supplying
`--reasoning-state-log <path>` to `are-codex-app-server` uses the append-only
file sink and `fsync` barriers. Before accepting a client message, the wrapper
verifies the complete existing log, selects its final valid checkpoint,
rebuilds disposable indexes, and resumes the event chain. Empty paths create a
new explicitly identified ledger. Torn, malformed, tampered, mixed-ledger, or
uncheckpointed logs fail startup; existing bytes are never rewritten or
silently truncated. Recovery metadata is recorded without copying event
contents into the diagnostic journal.

At `turn/completed`, the wrapper seals the exact semantic result, continuation
result, completion identity, and relevant context identities into a Reasoning
State Frontier before any automatic successor is forwarded. A recovered
frontier replays the prior client-visible decision with zero semantic provider,
evaluator, continuation-provider, effect, or successor calls. Reusing the same
turn identity with different completion bytes blocks. Automatic continuation is
therefore at-most-once across recovery: a crash after the completion checkpoint
but before forwarding is not silently retried, and delivery reconciliation
remains explicit residue.

The ledger contains explicit system reasoning products, not hidden model
chain-of-thought. Its epochs, dispatch records, and checkpoints have
`authority_effect: none` and do not authorize effects or continuations.
The wrapper package also exports the bounded branch, replay-fixture,
append-only reduction, risk-scaled checkpoint, counterevidence, portable-epoch,
and provenance-comparison operations from the Reasoning State runtime. These
operations are opt-in: the wrapper does not autonomously branch, reduce,
compact, export, or import a consumer's state.
Before every model request, the wrapper also projects a stable request header
and reusable explicit reasoning state ahead of a volatile turn suffix in
`additionalContext`. It measures exact and common prefix bytes, estimated
reusable tokens, projection cost, and invalidation reasons. Explicit normalized
provider usage can be attached through `recordCacheTelemetry`, producing an
exact projection-bound hit/miss observation and measured token/time savings.
Before reuse is eligible, the wrapper verifies the exact Context Refresh
Assessment and binds the canonical current selected-dependency digest into the
reusable state. Tampered refresh evidence, stale selected dependencies, or a
tampered prior projection block dispatch. Selected drift creates a successor;
only an exact current plan prefix receives `reuse-current`. The resulting
`are.context-bound-reuse-receipt/v1` is stored with the dispatch. Configured
provider usage is then bound to that exact projection and receipt, checkpointed,
and recovered after restart. When no provider usage exists, posture stays
`unobserved` instead of inferring a cache hit.

It also provides a persistent local gateway. The gateway listens on a
permission-restricted Unix socket, creates one isolated ARE wrapper and
upstream app-server connection per declared consumer, and preserves that
consumer's Context Views, turn state, and runtime journal across transport
reconnects. The repository profile additionally gives each consumer a distinct
append-only, checkpointed Reasoning State log. Startup obtains an atomic
single-writer lock, verifies and recovers that log before accepting the client,
and releases the lock only after clean wrapper shutdown. A second live attachment for the same consumer, lane
substitution, unknown consumers, oversized messages, and detached-buffer
overflow fail closed. Detach and detached-idle deadlines, retained protocol
bytes, and append-only Reasoning State log bytes are profile-bounded. Expiration
first requires the wrapper to prove no in-flight turn, approval, internal, or
stable request and to append/fsync a manual checkpoint. Unsafe eviction retries
without closing. A successfully expired resume secret authenticates an explicit
`gateway.session-expired` tombstone; the gateway never silently recreates that
session, and it never truncates a ledger to satisfy a size limit.

Programmatic gateway transports opt into `acknowledged-v1` continuity. The
first connection receives a 256-bit resume secret; a later attachment must
present that secret, while diagnostic state exposes only its digest. Downstream
messages are wrapped in monotonically sequenced delivery envelopes and removed
from the replay frontier only after an acknowledgement. Client requests may
carry an exact idempotency key: the gateway rewrites the first dispatch to an
internal correlation identity, adopts an identical unfinished request after a
client crash, and never forwards that request upstream twice. Reusing the key
with different method or parameter bytes fails closed. Responses to
server-initiated approval/tool requests are also digest-bound and forwarded at
most once. Legacy transparent stdio clients retain the unacknowledged v1 byte
stream and therefore do not receive these stronger continuity guarantees.

The currently bound `0.153.0-alpha.5` server accepts JSON-RPC 2.0 client messages but
omits the `jsonrpc` member on its own responses and notifications. The wrapper
admits both exact framings while rejecting any explicit non-2.0 version.
Because the wrapper projects the envelope through `turn/start.additionalContext`,
the connected client must declare `capabilities.experimentalApi: true` in its
`initialize` request. Codex rejects the field when that capability was not
negotiated.

For every `turn/start`, it reloads and structurally verifies the configured live
context sources, constructs an ARE Context Basis, assesses selected-dependency
freshness, and projects an immutable inline Context Envelope before forwarding
the request. Live-source refresh always reads and hashes every selected source;
it does not treat size, modification time, inode, or a cache hit as freshness
evidence. The repository profile selects Node's native SHA-256 implementation
for this byte-identical operation, while the portable JavaScript SHA-256 remains
available as a controlled compatibility baseline. A client may supply an exact
`are.request-context-hint/v1` so the
human utterance and explicit capability objective remain distinct; malformed
hints block. Deterministic request-term selection adds matching canonical
definitions, ontology nodes and bounded related edges to a minimal baseline.
The repository profile also binds root `AGENTS.md` as an exact
`repository-instruction` item and projects the read-only ontology registry as a
compact `ontology-catalog` item only for matching requests. Direct requests
therefore receive the bounded meanings of selected definitions, instructions,
catalog records, and selector-locked ontology records through the
protocol-supported `params.additionalContext` field, not only their digests.
The projected fragment also carries an `are.codex-context-use-contract/v1`.
It marks request-matched definitions and ontology catalogs as direct answer
sources, keeps dependency nodes, edges, and instructions available as
supporting context, and tells the consumer to report the exact item identities
it materially used. This ordering is a context-use hint with
`authority_effect: none`; it does not promote relevance, cache reuse, or a
model citation into freshness, correctness, admission, or authority evidence.
The default inline budget is 32 KiB. Optional diagnostics are excluded first
and recorded; mandatory overflow blocks without truncation or model-generated
summarization. Gates and blocks are not forwarded.

Plan-bound consumers reuse an envelope identity only after a real currentness
comparison produces a reuse receipt. Interaction-bound consumers always
receive successor view, context-epoch, and reasoning-epoch identities. When the
full Context Basis, request selection, and selected dependencies are still
exactly current, an interaction successor may reuse the prior immutable
content-addressed envelope projection instead of rebuilding it. The successor
fragment and diagnostic event expose an exact reuse receipt, predecessor
envelope digest, reused byte count, and `identity_retained: false`. The profile
switch `context_projection.reuse_compatible_interaction_projection` can disable
this optimization for a controlled comparison. Selected dependency drift
always bypasses reuse and constructs a successor projection; unrelated source
drift remains diagnostic. Cache or projection reuse never establishes
freshness, provenance, correctness, or authority. Diagnostic state records
envelope identity and refresh events without copying full context contents.

During a turn, command, file-change, and permission approval callbacks are
evaluated before the client response can reach Codex. A direct engine decision
still requires the independent client approval. A gate is forwarded to the
client as the exact human decision boundary. A block is denied locally.

After `turn/completed`, the wrapper joins observed lifecycle evidence with both
continuation lanes. Interaction-bound proposals always gate. Exactly one safe,
reversible plan-bound proposal may start one successor turn, but only after
that successor passes its own preflight.

Plan-bound proposals may carry an `objective_binding` that classifies them as
`advances-active-objective`, `changes-active-objective`, or
`deferred-residue`. Classification alone cannot select a continuation.
`advances-active-objective` requires an exact `are.causal-marker/v1` binding
an unresolved obligation to the proposed action and declaring whether its
causal dependency is `ready` or `blocked`. Product-direction and residue
candidates require `are.opportunity-marker/v1`; an opportunity can never
bypass a blocked causal obligation. A legacy `rank` may be retained for
diagnostics but has no selection effect.

The wrapper materializes `are.objective-frontier-materialization/v1` before
consequence assessment. One ready causal candidate is evaluated as the
continuation. Multiple ready causal candidates require a real choice. A
blocked causal candidate blocks the frontier, while product-direction changes
and other opportunities remain inspectable without becoming false co-equal
next steps. Marker relevance, causality, and readiness still grant no effect
authority.

For short continuation references such as `What is next?` or `Do it`, the
selected frontier is projected into the next `turn/start` as an exact request
context hint and an inspectable `cyberalchemy.are.objective-frontier`
fragment. This lets route selection inherit the selected objective rather than
re-run lexical routing against an anaphoric phrase. Longer or explicit new
requests are never rebound by this mechanism, and the projection grants no
effect authority.

Semantic evaluation at `turn/completed` is generic and explicitly opt-in. The
repository profile defaults to `{enabled: false}`, which produces no semantic
notification, provider call, evaluator call, or semantic ledger event. An
enabled profile must exact-bind a verified semantic-input profile. The wrapper
then binds the preflight request, route decision, and Context Envelope to the
actual Codex turn identity and asks an explicit input provider for observation,
owner, temporal, challenge, and journal inputs. It never derives those facts
from Codex output or Context Items.

Matching domains invoke the context-bound semantic lifecycle once and emit a
compact `cyberalchemy/semantic` notification containing only disposition,
materialization identity, outcome, and Reasoning Receipt digest. Non-matching
domains are `not-applicable` without calling the input provider or evaluator.
Duplicate completion notifications verify and replay the immutable recorded
result instead of repeating semantic calls.

A plan-bound proposal may explicitly declare `semantic_dependency` with
`required: true` and optional exact `binding_id` or `conclusion_domain`
selectors. For those proposals only, the wrapper recomputes the Reasoning
Receipt digest and verifies its exact turn, Context Envelope, materialization,
domain, and terminal-outcome binding before consequence assessment. Invalid,
unauthorized, defeated, insufficient, or invalidated outcomes make that
proposal ineligible. `EscalateOwner` requires a human gate.
`RecommendedUnderSnapshot` is advisory only: it can never make a structurally
invalid, consequential, protected, unknown, or irreversible proposal direct.
`OutOfDomain`, disabled evaluation, and non-matching domains preserve the
ordinary continuation result. Independent proposals are never constrained by
another proposal's semantic dependency.

Blocked semantic input remains visible and cannot suppress the original Codex
completion or authorize an effect. It constrains continuation only when a plan
proposal explicitly declares the semantic dependency. Constraint records and
ledger events contain identities, digests, outcomes, and reason codes, never
the Reasoning Receipt or context contents.

The wrapper owns a bounded in-memory runtime journal. Events are canonical,
immutable, hash chained, and idempotency-keyed. Before semantic materialization
it cuts the exact current thread and turn; the semantic input runtime verifies
that cut and binds its digest into the Reasoning Receipt metadata. Duplicate
completion uses deterministic external-call-free replay and cannot call the
provider or evaluator or start a second successor. Configured retention evicts
only closed turns and records an eviction receipt; active-turn events are never
evicted to satisfy a bound. This is not durable or cross-session storage.

Run with a repository-bound profile:

```sh
node bin/are-codex-app-server.mjs \
  --config profiles/repository-v1.json \
  --repository-root /absolute/path/to/domainspec-core
```

Run the persistent gateway against an already-running, exact-version managed
app-server daemon:

```sh
node bin/are-codex-gateway.mjs \
  --config profiles/repository-v1.json \
  --repository-root /absolute/path/to/domainspec-core \
  --listen /tmp/are-codex-gateway.sock \
  --backend daemon-proxy
```

The gateway does not install or start the managed daemon. It checks both the
local CLI binding and the running daemon version before listening. For an
isolated app-server process it can instead use `--backend websocket` with an
explicit loopback `--upstream-url`.

An app-server protocol client launches the lane-specific stdio adapter:

```sh
node bin/are-codex-client-proxy.mjs \
  --socket /tmp/are-codex-gateway.sock \
  --consumer codex:human-chat \
  --lane interaction-bound
```

`codex:plan` is separately configured as `plan-bound` with a stable request and
window identity. Exact reconnect resumes the same gateway session. The gateway
retains the first successful app-server `initialize` request binding and result,
includes their non-authorizing state in the reconnect receipt, and replays that
result locally for an identical programmatic client initialization. It never
forwards the duplicate upstream. A changed client identity, capability set, or
other initialization parameter fails closed with an exact binding mismatch.
Reconnect during a pending initialization binds the new correlation identity
to the single upstream response. Process restart creates a new transport
runtime epoch while the verified per-consumer Reasoning State log and
completed-turn frontiers recover. The diagnostic runtime journal remains
process-local. A stale crash lock is fail-closed and requires separate operator
reconciliation.

Programmatic consumers use `connectGatewayRpcTransport` with
`createAppServerRpcClient`. The shared client owns JSON-line parsing, request
correlation, bounded notification waits, streamed agent-text collection, and
default approval refusal. `request`, `startThread`, and `runTurn` accept an
`idempotency_key`; callers that reconstruct a client after a crash reuse that
key and pass the prior handshake's `continuity.resume_token` to
`connectGatewayRpcTransport`. The transport unwraps each sequenced delivery and
acknowledges it only after writing the exact JSON-RPC message to its local output
boundary. This proves exactly-once upstream dispatch and acknowledged-once
transport delivery, not durable processing inside an arbitrary application.
With a configured file-backed gateway session store, a gateway restart restores
completed stable requests and every sequenced but unacknowledged delivery before
accepting an authenticated resumption. Acknowledgements are durable before the
corresponding bytes are dropped. An in-flight request with no recorded outcome
remains blocked as `gateway.dispatch-outcome-unknown` and is never silently
redispatched. Without a file-backed store, process loss still returns
`gateway.resume-session-missing`. `spawnAppServerRpcTransport` provides an explicit
strict direct-process transport for diagnostics and tests; it does not bypass
the wrapper's version gate.

Session expiration is appended to the file-backed session index when configured;
the in-memory tombstone remains time-bounded. Process-memory mode intentionally
loses resumability across gateway restart.

Run the controlled version-bound semantic continuation matrix with:

```sh
npm run canary:semantic
```

It exercises recommendation, insufficient evidence, owner escalation,
tampering, disabled evaluation, and interaction precedence against a real
`codex app-server` while requesting no tools, network access, or effects. The
matrix reuses one app-server and one ephemeral thread so startup/index loading
is measured once while each scenario retains its own turn, semantic posture,
continuation decision, and receipt evidence. Each RPC request and completion
wait is bounded, redacted progress is emitted on stderr, and an infrastructure
timeout stops the remaining matrix. Override the defaults with
`ARE_CANARY_REQUEST_TIMEOUT_MS` and `ARE_CANARY_EVENT_TIMEOUT_MS` when the
local state index has known startup latency.

Run the isolated persistent transport canary with `npm run canary:gateway`.
It exercises two exact plan-bound turns across a disconnect/reconnect and two
interaction-bound turns through a real long-lived loopback WebSocket
app-server. It then interrupts a real turn after agent output begins, restarts
the file-backed gateway, authenticates both recovered sessions, verifies exact
replay of the unacknowledged delivery, locally replays a completed stable
request without upstream redispatch, and verifies recovery of the per-consumer
checkpointed log, completion frontiers, exclusive writer, and an
exact-prefix-reusing post-restart model dispatch.
The official daemon-proxy command surface is covered separately;
the canary intentionally does not mutate the user-global managed daemon.

The repository default adopts no production semantic-domain catalog. The
wrapper is a candidate implementation. It does not modify Codex desktop
configuration, grant effect authority, treat a recommendation as permission,
adopt a capability, establish conformance, publish, deploy, or start any
successor that is gated or blocked.
