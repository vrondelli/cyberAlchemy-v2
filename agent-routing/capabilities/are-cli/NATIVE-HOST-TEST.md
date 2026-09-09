# Native prompt-hook test

Status: native loopback canary tested. Authority effect: none.
Route: CA2-ROUTE-IMPLEMENT. The existing CLI/hook scaffold and D65/D67 bindings
remain the construction basis. MCP stays last.

## Exact test scope

Use the ARE-pinned `codex-cli 0.153.0-alpha.5` in a disposable installation.
Start its actual app-server with isolated Codex configuration and a loopback
Responses fixture. The fixture returns a fixed text response and no tool calls.
No credentials, external model service, user transcript or existing session is
used. Repository work remains read-only inside the test host.

Before starting a thread, inspect native hook discovery and require exactly the
intended prompt hook. The pinned app-server also needs the explicit
`thread/start.config.bypass_hook_trust` override for this test. The top-level
flag alone left the discovered hook untrusted and produced no callbacks in the
first probe. Both overrides apply only to this inspected disposable configuration;
no persisted hook trust or active configuration is changed. The hook delegates
to the existing rendered adapter command and records synthetic callback metadata.

The canary must join native session and turn IDs to the callback, verify the
original prompt and callback timing, observe the exact advisory context in the
outbound request to the loopback fixture, and see native turn completion. Repeat
on another turn and another session. Report the binary digest, source digests,
isolated configuration identity, evidence checks and zero external model calls.
Do not treat a fixture response as model comprehension or behavior evidence.

## Run and observed result

```sh
node implementation/agent-reasoning-engine/bin/are.mjs hook native-test \
  /absolute/path/to/codex-0.153.0-alpha.5
```

The runner requires that exact version, hashes the binary, emits one JSON
receipt, and removes its scratch configuration after completion. The test binary
can be prepared with `npm install --prefix /your/disposable/directory
--ignore-scripts --no-audit --no-fund @openai/codex@0.153.0-alpha.5`; use the native
binary inside the installed platform package. This does not replace PATH Codex.

Observed: three native turns across two sessions completed; each callback matched
its session and turn, preserved the prompt and preceded its provider request.
The complete advisory context was present in each outbound loopback request.
The middle “next” prompt remained unresolved for conversation-aware handling.
Distinct turns produced distinct receipts. No external model was used and the
fixture generated no tool requests. The compact receipt lives under `receipts/`.

This establishes native delivery on one pinned Linux host, using a scoped test
trust override. Persisted trust approval, desktop behavior, production models,
in-flight steering, hook timeout policy and tool/completion hooks are separate
tests. It does not certify every host configuration or activate the adapter.

## Product and operational frontier

Runnable construction: native canary runner, exact adapter compatibility repairs
if the native payload exposes a mismatch, local tests, router rebuild, and an
observed receipt. Test state is disposable; a compact receipt is retained under
`receipts/`. The existing prototype is extended, not promoted into governance.

Following stages: source-bound operational selection of a compatible host;
request-bound tool/completion adapters; Workspace/VPS gateway continuity; MCP.
Global installation, desktop switching, remote deployment and real model calls
are outside this test. Their absence does not block the local fixture test.

## Open Questions

- Which real host will use this exact binary and its own reviewed hook trust?
- How should in-flight steering and hook timeouts be tested before that rollout?
- Which runtime operator will select the tested binary for a real host rollout?

The parent sequence is [PLAN.md](PLAN.md); hook behavior is [HOOKS.md](HOOKS.md).
