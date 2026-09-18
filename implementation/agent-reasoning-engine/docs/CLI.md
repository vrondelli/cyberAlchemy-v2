# CLI and routing

The executable entrypoint is `node bin/are.mjs`. Unknown commands exit with
status 2 and print the supported surface.

## Commands

| Command | Purpose |
| --- | --- |
| `doctor --json` | Inspect runtime, profile, components, integrations, and closure health. |
| `closure --json` | Materialize the current content-addressed source closure. |
| `test` | Run every suite derived from the product closure. |
| `candidate freeze` | Test and freeze a new immutable candidate identity. |
| `candidate inspect --json` | Compare current source and evidence with the frozen candidate. |
| `decide route\|context\|effect\|continue` | Evaluate the repository decision lifecycle from one JSON request on stdin. |
| `hook ...` | Adapt prompt/host events and run native delivery canaries. |
| `gateway ...` | Start the persistent Unix-socket gateway. |
| `interaction ...` | Run or inspect interaction-review state. |
| `benchmark ...` | Run the supported real-reasoning benchmark surface. |
| `improve ...` | Run or inspect the failure-learning canary. |
| `define ...` | Invoke the integrated Define CLI. |
| `coding-agent demo ...` | Run the fixture-only controlled coding flow. |
| `coding-agent live-demo ...` | Run the bounded live gateway path. |

## Decision lifecycle

1. `route` validates the request and selects one route contract.
2. `context` assembles the route's source-bound context.
3. `effect` evaluates an exact consequential proposal before execution.
4. `continue` evaluates completion and possible next objectives.

Use one stable `session_id`, a distinct `request_id` for each objective, and
carry the exact route receipt into later operations. Preserve the user's raw
text and mark whether structured fields were explicit or inferred.

The complete request and result schemas, exit codes, and examples are owned by
the [ARE CLI contract](../../../agent-routing/capabilities/are-cli/README.md).

## Exit behavior

- Exit 0: direct decision or completed continuation.
- Exit 2: block or schema/engine error.
- Exit 3: a consequence or owner gate requires host handling.

A gate does not necessarily mean missing authorization: callers must combine
the directive with authorization already present in their session.

## Hooks

`hook prompt` produces advisory route evidence. `hook config` renders candidate
configuration and `hook inspect-host` reports observed host support. Native test
commands exercise pinned loopback fixtures and do not prove general host or
model reliability.

## Open Questions

- Should the CLI gain generated `--help` for each subcommand from its request
  schema instead of relying on linked contracts?
