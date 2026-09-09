# Native ARE canary: blocked before execution

This is a test procedure, not a completed native test or an installed hook package.
Available tools were checked in this session. No native host test, hook attachment,
or task turn submission operation is exposed. The repository entry instructions
prohibit a nested model CLI fallback when native operations are missing. No host
or experimental model call was started. RESULT.json records the exact source-hash
comparison against the adapter receipt; previous integration tests were not rerun.

## Product construction

Frontier: prove host-driven invocation and context delivery for the isolated adapter.
The causal dependency is access to an allowed host interface that can create an
isolated test session, bind its root identity, configure its private hooks, inspect
the outgoing model request, and submit bounded turns. Providing that interface
unblocks this test; repeated synthetic subprocess tests do not.

Use a disposable workspace and ledger, with no production hooks or existing
conversation history. Bind session ID, cwd and transcript from the native host's
own session metadata before the first prompt. Do not derive the trusted binding
from an unverified callback payload. Register UserPromptSubmit, Stop and Interrupt
only in that isolated host. Set an execution timeout and retain exit statuses.

Bound the canary to four sequential turns, no retries, tools or research:

1. Ask for a short explanation of a cache. Capture native prompt and Stop events.
2. Submit `/are mode apply-scoped`. Capture the durable control and completion.
3. Submit `/are learn examples`. Confirm the ARE lesson cites the preceding native
   episode and is checkpointed before context emission.
4. Ask for another short cache explanation. Capture the exact outbound model
   context and response, then native Stop and the correlated ARE outcome.

Stop on the first callback failure, identity mismatch, uncertain delivery, missing
completion, budget exhaustion or unsupported native operation. Select the model
and account budget explicitly before an executable run is dispatched. Do not
substitute a different client for the user's current conversation.

PASS requires native event identity and order; automatic adapter invocation;
checkpointed feedback and persistence; a projection digest matching the actual
model-request context; and a correlated completion without a synthetic extra turn.
A response containing an example alone does not prove context delivery. A fake
provider capture can support host transport evidence only, not a model-response
claim. This four-turn smoke test cannot establish general learning quality, cost
advantage, steering, subagent coverage or safe current-conversation activation.

## Operational support

Owner: host integrator. Affected stage: isolated native test execution.
Required now: expose a permitted host test interface. This dependency blocks the
native test, not unrelated adapter construction. Deferred: desktop trust/reload,
current-conversation installation, rollback, product approval and activation.
The previous adapter and all old candidates remain unchanged.
