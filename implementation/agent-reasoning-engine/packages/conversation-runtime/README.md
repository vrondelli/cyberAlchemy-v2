# ARE Conversation Runtime

Command examples require Node 26.8.1 on PATH and run from this package directory.

Candidate ARE-owned conversation facade for one-chat interaction adapters.
This component's ownership of its internal conversation record does not by
itself transfer control of a host chat. For an external Codex task, that claim
applies only after the exact handover in the
[activated-session control contract](../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/SESSION-CONTROL-CONTRACT.md).

The runtime owns conversation and turn identity, request-intent compilation,
ordered immutable events, pending human decision gates, and fail-closed
decision validation. An interaction adapter may submit commands and render
events; it does not select capabilities or reinterpret decision eligibility.

The prototype composes the verified request decision router behind the facade
and accepts route-owner handlers plus an optional decision handler. Provider
transport, complete route-handler coverage, durable session storage, and
effectful application remain deferred. All records carry `authority_effect:
none`.

Current usability classification uses the interface-neutral
`interaction-adapter-improvement-candidate` disposition for adapter-owned
failures. It cannot enter the engine-only Evolution handoff. Older sealed
records that say `tui-improvement-candidate` remain historical evidence; the
runtime does not rewrite their digests.

Run tests with Node 26.8.1:

```text
node --test test/*.test.mjs
```

The following deterministic single-chat benchmark belongs to the discontinued
TUI prototype and is retained only as historical usability evidence. It is not
a current runtime or Companion acceptance gate. To reproduce that historical
fixture with the repository's Node 26.8.1 runtime, run from the TUI package:

```text
node bin/single-chat-benchmark.mjs
```

The benchmark collects every check. Its deterministic run intentionally leaves
human comprehension as `NOT_EVALUATED`; only a participant run can close that
evidence gap.

## Open Questions

- Which active client, if any, will bind this internal facade to the gateway's
  durable conversation identity? The discontinued TUI benchmark cannot prove
  that binding or control of an existing desktop task.
