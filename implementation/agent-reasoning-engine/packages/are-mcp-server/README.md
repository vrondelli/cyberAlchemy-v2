# ARE MCP server

Status: local owner-directed implementation candidate. Authority effect: none.

This package exposes the existing ARE and evolution-runtime JSON boundaries as
one local STDIO MCP server. It does not run a model, approve effects, activate a
cycle definition, bypass evolution admission, or create a second state machine.

## Tools

- `are_decide`: `route`, `context`, `effect`, and `continue` decisions with the
  existing caller-carried receipts. By default it uses the same verified compiled
  policy bundle as `are decide`; `--development-live` explicitly selects the
  mutable repository-source profile for local development.
- `evolution_status`: read-only coordinator phase inspection or durable-kernel
  diagnosis, so completed cycle tasks are visible to the desktop agent.
- `evolution_command`: exact kernel or coordination commands. Existing schema,
  revision, idempotency, admission, evidence, and effect-envelope checks apply.
- `evidence_get`: content-addressed object retrieval by SHA-256 and byte length;
  arbitrary filesystem paths are never accepted.

## Opt-in hosted hook relay

`bin/are-hook-mcp-server.mjs` is a separate, one-tool MCP server for an
ARE-owned hosted client's private hook connection file:

```sh
node implementation/agent-reasoning-engine/packages/are-mcp-server/bin/are-hook-mcp-server.mjs \
  --connection-file /absolute/private/hosted-hook-connection.json
```

Its only tool, `are_hook_observe`, accepts one structured
`UserPromptSubmit`, `PreToolUse`, or `Stop` event. It relays the event to the
existing hosted controller; it creates no second gateway RPC writer. For an
invoked `PreToolUse`, an unavailable/invalid controller assessment is returned
as a JSON **text-content** deny, the field verified by disposable pinned Linux
and native Windows Codex canaries. It never returns an `allow` or rewrites tool
input. The connection path is fixed at server launch and cannot be supplied by
an MCP caller. The private owner file is not copied into hook output.

This relay is candidate construction, not an active host registration. The
isolated pinned Linux and Windows canaries verify that `required = true` stops
session startup when this MCP server cannot initialize, but an initialized
server with the hook tool unavailable still lets the supported command run.
Codex documents that a missing server at hook delivery or a hook error also
does not block the operation, and some tool paths do not invoke `PreToolUse`.
Therefore this
relay is not a universal fail-closed effect boundary and must not lift the
normal Windows managed-session ingress pause. See the
[transport evidence](../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-MCP-TOOL-HOOK-TRANSPORT.md)
and the [activated-session contract](../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/SESSION-CONTROL-CONTRACT.md).

The configured evolution root owns objects, ledgers, receipts, and its rebuildable
index. The server caps request and response sizes. The kernel continues to reject
secret-bearing artifacts; tool outputs, credential dumps, and environment dumps
must not be submitted as evidence.

## Run in WSL

```sh
node implementation/agent-reasoning-engine/packages/are-mcp-server/bin/are-mcp-server.mjs \
  --evolution-root /absolute/path/to/are-evolution-state \
  --repository-root /home/vlad_/projects/cyberAlchemy-v2
```

For ChatGPT desktop on Windows, add a STDIO server named `are`. When the desktop
agent is Windows-native, use `wsl.exe` as the command and pass arguments that run
the Node entrypoint inside the selected distribution. When the agent itself runs
in WSL, use the WSL `node` path directly. Save and restart the desktop app; use
`/mcp` in a new chat to verify that all four tools are connected.

Example Windows-native command and arguments (replace the distribution and data
root if needed):

```text
command: wsl.exe
arguments: -d Ubuntu-26.04 --cd /home/vlad_/projects/cyberAlchemy-v2 -- /home/vlad_/.local/bin/node implementation/agent-reasoning-engine/packages/are-mcp-server/bin/are-mcp-server.mjs --evolution-root /home/vlad_/.local/share/are/evolution-runtime-v1 --repository-root /home/vlad_/projects/cyberAlchemy-v2
```

## Verification

```sh
npm test --prefix implementation/agent-reasoning-engine/packages/are-mcp-server
```

## Open Questions

- How will the host keep the relay and tool available after startup and make
  every in-scope effect fail closed if either disappears? The verified
  required-server startup guard does not provide that guarantee.
- Can the relay tool be hidden from ordinary model tool calls while remaining
  callable by lifecycle hooks, avoiding model-originated event spoofing?
- What Windows connection-file ACL check should supplement the current private
  LocalAppData path and same-host owner-process binding?
- Which durable evolution root should become the long-lived operational root?
- Should desktop tool approval policy default to `writes` or `prompt` after the
  first real-client canary?
- When should this candidate be packaged as a private plugin rather than kept as
  a project-local MCP server?
