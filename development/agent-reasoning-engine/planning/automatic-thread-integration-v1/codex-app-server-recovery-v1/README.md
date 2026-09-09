# Durable recovery through the real app-server

This private Linux prototype connects the existing recovery supervisor to a source-built Codex app-server over its normal stdio JSON-RPC protocol. A checksummed, fsynced routing store binds each handover capsule to a native task. A kernel writer lock and persisted PID/start-time/boot identity prevent a replacement coordinator from dispatching while the previous server is still alive.

The adapter saves dispatch intent before sending `turn/start`. After a crash it uses `thread/read` to match the full operation marker and digest, exact turn ID when available, completed status, and completion timestamp. An incomplete, missing, ambiguous, or interrupted turn stays uncertain: recovery stops and does not replay it. A request that never reached the adapter's dispatch-intent journal can safely recycle into a fresh task. Completed task replay performs no model requests.

The app-server gets the same existing native request gate through an explicit `experimental_context_gate` ConfigToml value. Its endpoint and provider must remain literal loopback HTTP for this construction candidate. The gate still blocks native compaction and unsupported transport paths. Nothing is enabled in the installed desktop host.

The mock provider has no credentials and returns only short assistant messages. Its independently counted requests detect duplicate dispatch. The synthetic policy allows two answers per context, then requests recycling; it is not a measurement of Luna's tokenizer, model quality, or live context bounds. Restored capsule fragments are capped at 3,500 UTF-8 bytes in this fixture.

Run with Node 26 after applying SOURCE-BINDING.json's patch chain and building the isolated binary:

```sh
ARE_APP_SERVER_BINARY=/absolute/path/to/isolated/codex-app-server \
  node --test /absolute/path/to/this/package/app-server-crash.test.mjs
```

Tests use newly created `/tmp/are-real-app-server-*` stores and do not read a production login. `ARE_TEST_RECEIPT` optionally selects a test receipt output file. The test driver intentionally kills its own coordinator and app-server with SIGKILL at selected boundaries. The live-lease rejection case uses the test runner's process identity as an explicitly synthetic still-live lease; it does not kill that process.

## Open Questions and limits

See CONTRACT.json for the exact product, business, DomainSpec, scaffold, and test contract. Hardware power loss, distributed writers, arbitrary external tool effects, live model bounds/cost, and installed-host activation are outside this evidence. A lost `thread/start` acknowledgement before routing persistence may leave an unused empty native task; no provider turn is dispatched before the route is durable. Lost provider outcomes require reconciliation, not automatic retry.

The adapter is a prototype selected by an explicit local caller. These tests neither approve the product nor confer admission, publication, deployment, or operational authority. Deferred operational work is separated from product construction in PLAN.md and PROGRESS.json.
