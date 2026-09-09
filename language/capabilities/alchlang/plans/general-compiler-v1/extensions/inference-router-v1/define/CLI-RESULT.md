# Inference definitions through Define CLI

Current CLI candidate: [cli-result.json](cli-result.json). Reproducible scripted input: [cli-input.json](cli-input.json).

The earlier [manual pack](definition-pack.json) remains the semantic/API predecessor. It was not produced by the CLI and its claim that all Define session facilities were unavailable was too broad. The current CLI supports an in-memory session and context assembly; durable continuity remains excluded.

## Validation

- Existing Define CLI suite: 15 tests passed, 0 failed, using Node v26.8.1.
- Scripted CLI returned 4: valid candidate with open meaning.
- The saved pack independently passes validateDefinitionPack().
- A second scripted run produced identical result JSON.
- Eight proposed definitions and five open dispositions; handoff_ready is false.
- Validation scope is deterministic structure only. It does not prove canonical semantic overlap, product approval or inference implementation.

## Proposed definitions

Each proposal remains owned by the Alch product owner. Scripted responses preserve agent-authored proposals; they do not assert human acceptance of individual meanings.

### InferenceAttempt

An attempt executes a pinned binding within one request deadline and concurrency budget. Automatic routing allows at most one fallback, only after a binding-specific outcome proves no execution occurred and before stream output starts. Formal: attempts <= 2; fallback => automatic AND proven_not_executed AND NOT stream_started AND deadline_remaining. Domain example: A fixture pre-execution rejection may try b after a; ambiguous timeout or a partial stream may not.

Plain language: An uncertain timeout must not cause a second generation or charge.

Boundary: Disconnect triggers local cancellation and an upstream cancellation attempt, not proof that remote work or charges stopped.

### ProviderBinding

A versioned operator-owned binding connects an offering to one fixed provider deployment, mapper pair, credential reference, enabled state and execution limits. Formal: Binding = (id, version, offering, deployment_ref, credential_ref, mappers, enabled, limits). Domain example: fixture-provider-a and fixture-provider-b are independent local bindings, both supporting text.generate and streaming.

Plain language: A binding describes how the service reaches an eligible provider.

Boundary: Configuration is private; fixture bindings grant no external-call or spending authority.

### RoutingDecision

A decision pins eligible bindings and the versioned policy. Automatic routing chooses the lowest configured strategy rank, breaking ties by stable binding ID. Explicit model selection restricts eligibility to that alias and never substitutes another alias. Formal: eligible = enabled AND tenant_allowed AND task_supported AND limits_fit AND features_supported; selected = min(eligible, (strategy_rank, binding_id)). Domain example: balanced-v1 ranks fixture-provider-a before fixture-provider-b; disabling a selects b. No eligible binding yields 503.

Plain language: First exclude unsuitable providers; then choose predictably among the remaining ones.

Boundary: Configured cost/latency ranks are operator preferences, not measured price, speed or quality evidence.

### IdempotencyRecord

An optional tenant-scoped key binds to the normalized validated request, its defaults and pinned request record. Matching in-flight duplicates receive a defined in-progress response; different normalized bytes return 409. Completed JSON can replay within retention; streams never re-execute under the same retained key. Formal: Identity = (tenant_id, key); same_identity AND different_request => 409; executions_per_retained_identity <= 1 logical request. Domain example: Two concurrent JSON submissions with the same tenant, key and normalized request share the original request ID; the duplicate gets 409 request_in_progress until completion.

Plain language: Repeating a retained key must not start another inference request.

Boundary: Retention expiry ends deduplication protection; stream resumption and durable cross-restart protection remain open.

### ModelOffering

A versioned public alias describes a task and its supported input, output and streaming limits; discovery includes only offerings allowed for the authenticated tenant. Formal: Offering = (alias, version, tasks, context_limit, output_limit, streaming). Domain example: fixture-chat-a and fixture-chat-b are local test aliases, not claims about real model availability.

Plain language: An offering tells a caller which model option it may request.

Boundary: An alias is neither a provider address nor a quality or availability guarantee.

### InferenceRequest

A tenant-scoped request asks for text.generate over an ordered, nonempty list of text messages, with an optional public model alias, routing strategy, positive maximum output-token count and stream flag. Formal: Request = (request_id, tenant_id, task, messages, model?, strategy, max_output_tokens, stream). Domain example: Example: one user message, no model, balanced strategy, 256 output tokens, JSON response.

Plain language: A caller submits a conversation and chooses automatic routing or one named model.

Boundary: Tenant and request IDs are server-assigned; request fields never select credentials or upstream URLs.

### InferenceResult

A completed result names the request, selected public alias, text output, finish reason and usage. Streaming sends started, zero or more delta events, then one completed or error event while writable; started pins the alias for that stream. Formal: Result = (request_id, model, output.text, finish_reason, usage); Stream = started, delta*, (completed | error). Domain example: A partial stream followed by failure ends with error and is never spliced with a different provider.

Plain language: A caller receives one attributable answer or an explicit failure.

Boundary: Connection loss before a terminal event means incomplete output; fixture text is not evidence of model inference.

### UsageObservation

Each attempt records input and output token counts as nonnegative integers or null, with provider-reported, locally-estimated or unavailable provenance for each count. Unknown values stay null; estimates name their estimator version. Formal: UsageCount = (value: integer>=0 | null, provenance, estimator_version?); Usage = (attempt_id, input_tokens, output_tokens). Domain example: A provider omitting token counts yields null with unavailable provenance, never zero.

Plain language: Usage says what was measured, estimated or remains unknown.

Boundary: Usage is neither billing nor payment verification; failed-attempt observations remain distinct from final-result usage.

## Open Questions

### OQ-COMPILER

Which actual Alch/DomainSpec constructs support selection, mapping and the public API?

Owner: Alch language and inference implementation owner.

Do not treat unsupported syntax as compiled behavior. Affected stage: D3/D4.

Next action: Inspect compiler extension points and derive schemas from authored Alch.

### OQ-DEDUP

What persistence and replay behavior should survive host restart?

Owner: Alch product owner and inference implementation owner.

No cross-restart deduplication claim without a tested storage contract. Affected stage: D7/D9.

Next action: Select retention, terminal-failure replay and persistence semantics before execution implementation.

### OQ-LIMITS

What production deadlines, concurrency, request limits and idempotency retention are required?

Owner: Inference operator.

Do not claim production readiness using local fixture limits. Affected stage: D9 candidate freeze and production readiness.

Next action: Set and test concrete targets before candidate freeze.

### OQ-PROVIDERS

Which two real provider deployments and public aliases should replace the fixtures?

Owner: Inference operator and Alch product owner.

No live calls before provider, credential and budget selection. Affected stage: Live provider verification.

Next action: Select deployments after local contracts and bindings are testable.

### OQ-SESSION

Is durable Define session continuity required for this work beyond the available in-memory CLI context assembly?

Owner: Define runtime owner.

The candidate CLI and context assembly exist and their tests pass; durable sessions and cross-client continuity remain excluded. This does not block local inference modeling.

Next action: Define runtime owner and product owner decide whether a later durable-session capability is needed.

The CLI marks every open disposition blocking for this aggregate pack. Each question retains its affected stage above; that flag does not turn deferred live-operation or durable-session work into a prerequisite for independent local modeling.

Allowed uses: review and meaning refinement; named consumer input after open questions resolve. No canonical promotion, implementation authority or external effect is granted.
