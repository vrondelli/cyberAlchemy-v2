# ARE prompt hook adapter

Status: tested local adapter candidate. Native delivery passed an isolated
loopback canary on pinned Codex 0.153.0-alpha.5; see [NATIVE-HOST-TEST.md](NATIVE-HOST-TEST.md).
Authority effect: none. Construction route: CA2-ROUTE-IMPLEMENT.

`are hook prompt` maps a Codex `UserPromptSubmit` event to the same `route` and
`context` functions as `are decide`. It emits advisory evidence in the documented
`hookSpecificOutput.additionalContext` output. Commands receive JSON on stdin;
Codex provides session and turn identifiers. The transcript format is unstable,
so this adapter never reads it. See the
[official hook contract](https://learn.chatgpt.com/docs/hooks).

## Run and inspect

From the checkout root:

```sh
node implementation/agent-reasoning-engine/bin/are.mjs hook inspect-host
node implementation/agent-reasoning-engine/bin/are.mjs hook config
node --test implementation/agent-reasoning-engine/test/prompt-hook.test.mjs
```

`hook native-test /exact/path/to/codex` runs the isolated pinned-host canary.
`config` prints the exact candidate registration JSON using the current Node and
adapter paths, shell-quoted for POSIX hosts. It writes nothing and enables no
feature. `inspect-host [codex-command]` reads version and feature information;
it never declares native delivery verified, even when the feature is enabled.

Pass a real or synthetic event to `hook prompt`:

```json
{
  "hook_event_name": "UserPromptSubmit",
  "session_id": "example-session",
  "turn_id": "example-turn",
  "cwd": "/absolute/path/to/cyberAlchemy-v2",
  "prompt": "Explain the repository routing architecture"
}
```

The checkout path must resolve inside this adapter's checkout. Existing
subdirectories work; relative paths and symlink escapes do not. The adapter
requires nonblank session, turn, cwd and prompt fields. Optional fields are
`transcript_path`, `model` and `permission_mode`, each string or null. Unknown
fields fail explicitly so a changed host payload needs a reviewed contract.
Input is at most 1 MiB and the prompt at most 65,536 characters.

## Meaning and behavior

The prototype's hook event is host-supplied observation, not authenticated
identity. Session correlation hashes session ID and checkout; request correlation
hashes turn ID, exact prompt and canonical cwd. Steering with changed text gets
a distinct receipt even inside the same turn. Exact retries replay the same
deterministic computation. No session store or exactly-once delivery is claimed.

No objective is inferred inside this adapter. A self-contained prompt may
resolve directly; conversation-dependent input such as “next” remains unresolved.
The output tells the agent to retain the active objective, label inferences and
consult the ordinary CLI with conversation context. It never substitutes a new
objective or erases prior authorization.

Successful direct routing also runs real context preflight. Output contains
the route contract, receipt, source-related digests and reason codes. Raw prompt,
raw host IDs, model metadata, transcript and envelope text are not copied into
developer context. The original prompt remains with the host. This adapter
does not dispatch effects, approve tools, read transcripts, learn preferences,
or write state. The earlier
[learning-hook prototype](../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/hook-adapter-v1/README.md)
owns its separate persistence experiments; none are implicitly activated here.

Malformed or out-of-scope input returns `{}`, exit 1 and a bounded diagnostic on
stderr. Engine/source failures produce advisory diagnostics with no route
authority. Unresolved routing is advisory as well: no host block or permission
output is manufactured. Agents still follow the registry and its failure rules.

## Construction and operational frontier

The local product is the prompt adapter, executable, candidate configuration
renderer, host inspector and subprocess tests. Their source hashes are bound
into the router projection and ARE source closure. The CLI ontology scaffold
records hook input and advisory projection as candidate navigation concepts.

The default PATH host currently reports `codex-cli 0.114.0` and
`codex_hooks under development false`. This is a current machine observation,
not a compatibility claim about all Codex installations. The candidate is not
installed in `.codex/` or global configuration. Unit tests invoke the rendered
shell command with simulated events. The separate pinned native canary proves
dispatch and wire delivery to a local fixture using a scoped trust override;
it does not prove persisted trust approval or production model behavior.

Remaining host tests cover persisted trust, timeout/failure behavior and in-flight
steering on the selected operational host. Hook enablement and registration are
separate operational steps. The [event adapter](EVENT-BINDING.md) now binds
PreToolUse and native completion to their originating request without parsing a
transcript. Gateway/VPS continuity follows. MCP is last.

## Open Questions

- Which operational host will use the tested binary and reviewed hook trust?
- Which host event binding will connect tool proposals to the active request?
- What completion evidence will a later continuation adapter verify?

The broader sequence and operational owners remain in [PLAN.md](PLAN.md).
