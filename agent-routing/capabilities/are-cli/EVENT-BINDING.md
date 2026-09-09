# Request-bound hook events

Status: implemented local candidate; native canary passed. Route: CA2-ROUTE-IMPLEMENT.
Authority effect: none. This extends the tested CLI and native prompt adapter.

## Plan and prototype meanings

The host owns one in-memory event adapter. A prompt observation binds the exact
native session ID, turn ID, canonical cwd, original request and current ARE route
receipt. Tool callbacks must match that binding before the adapter evaluates
their exact proposals. Missing bindings, changed identities, conflicting retries
and source drift produce diagnostics, never a guessed request or an approval.

A Stop callback is an observation that the host is attempting to finish. It is
not successful completion. Only the host's `turn/completed` notification can
close the turn. Its status is transport evidence, not proof that the user's
objective was achieved. Continuation evaluates that limited completion evidence
and never starts another turn automatically.

Exact prompt retries are recomputed against current sources. A different prompt
inside an already-bound turn invalidates that binding because subsequent tool
events carry no prompt revision. Changed proposals under one tool-use ID are
likewise conflicts. A fresh native turn is required to recover an invalidated
binding. Separate sessions and turns may interleave safely.

## Construction sequence

1. Extract the existing prompt request preparation without changing its contract.
2. Implement a bounded in-memory adapter for prompt, PreToolUse, Stop and native
   turn/completed events. Reuse ARE `effect` and `continue`; emit advisory hook
   output and source-bound observation receipts. No transcript parsing, approvals,
   persistent session storage or tool dispatch belongs to this adapter.
3. Test ordering, cross-session isolation, replay/conflict, source drift,
   interrupted/failed completion and the distinction between Stop and completion.
4. Extend the pinned native canary with a local callback transport and one
   harmless fixed shell proposal from the loopback fixture. Verify native tool
   attribution and terminal notification binding, with no external model.
5. Bind sources in the existing ontology scaffold and router projection; rebuild
   and run appropriate product checks. Keep MCP last.

## API and verification

Import `createHookEventSession` from
`implementation/agent-reasoning-engine/src/hook-event-session.mjs`. A host creates
one instance and feeds `observe(event)` in observed order. Supported input is the
native UserPromptSubmit, PreToolUse and Stop hook payload, or the full native
`turn/completed` notification. Hook callers forward only `result.stdout` to
Codex; the remaining result fields are host-side evidence. Failed observations
carry `ok:false`, a bounded diagnostic and empty hook output. This is advisory
integration, not mandatory governance enforcement.

The default limits are 32 retained turns and 64 distinct tools/Stop observations
per turn. `size()` reports retained turns; `releaseCompleted(sessionId, turnId)`
explicitly releases a terminal turn and refuses an active turn. `clear()` drops
all bindings. There is no silent eviction. Exact terminal retries return historical
evidence with `replayed:true`; a replay after explicit release has no binding.
Neither replay nor a receipt authenticates the host or grants an effect.

```sh
node --test implementation/agent-reasoning-engine/test/hook-event-session.test.mjs
node implementation/agent-reasoning-engine/bin/are.mjs hook native-events-test \
  /absolute/path/to/codex-0.153.0-alpha.5
```

The pinned native canary uses three turns across two sessions. Its first turn
executes one fixed `printf ARE_NATIVE_TOOL_OK` proposal and observes its output.
PreToolUse reports an ARE gate for the unknown command effect, with the same
request binding later used by native completion. Stop yields an observation
without a completion claim. The remaining turns test a short unresolved “next”
and a separate session. The callback transport is token-bound loopback HTTP
inside the disposable canary; it is not an installed production daemon.

## Operational support and limits

The adapter's lifetime belongs to its host. Restart loses all bindings and later
events fail without a new prompt. This does not implement the blocked durable
repository SESSION capability. Native canary state and callback transport are
disposable; operational host installation remains separate.

The test-only host may execute exactly one fixed `printf` command supplied by the
local fixture in a read-only workspace. The adapter evaluates it as an unknown
command effect and reports a gate; this does not revoke the test's existing
authorization or override host approval policy. No arbitrary model output is
executed. The loopback fixture emits no other tool calls.

The next construction frontier is Workspace/VPS gateway continuity and the
operational selection of a compatible host. Runtime owners still own deployment,
credentials, persisted trust and later effect enforcement.

## Open Questions

- Which operational host will own and feed the in-memory adapter?
- What host evidence can distinguish prompt revisions during in-flight steering?
- What task-specific evidence, beyond native turn completion, should later
  continuation policies require?
