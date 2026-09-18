# ARE Conversation Runtime

Command examples require Node 26.8.1 on PATH and run from this package directory.

Candidate ARE-owned conversation facade for one-chat interaction adapters.

The runtime owns conversation and turn identity, request-intent compilation,
ordered immutable events, pending human decision gates, and fail-closed
decision validation. An interaction adapter may submit commands and render
events; it does not select capabilities or reinterpret decision eligibility.

The prototype composes the verified request decision router behind the facade
and accepts route-owner handlers plus an optional decision handler. Provider
transport, complete route-handler coverage, durable session storage, and
effectful application remain deferred. All records carry `authority_effect:
none`.

Run tests with Node 26.8.1:

```text
node --test test/*.test.mjs
```

Run the deterministic single-chat benchmark from the TUI package with the
repository's Node 26.8.1 runtime:

```text
node bin/single-chat-benchmark.mjs
```

The benchmark collects every check. Its deterministic run intentionally leaves
human comprehension as `NOT_EVALUATED`; only a participant run can close that
evidence gap.
