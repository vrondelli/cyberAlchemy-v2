# IL-H05 Windows App-Server Client Prototype

Status: prototype validated  
Cycle kind: `controlled-upgrade`  
Phase: `prototype-construction`  
Activation: none

## Objective

Provide a usable Windows-facing client for the existing ARE-governed Codex
app-server gateway without forking Codex, exposing the Unix socket remotely, or
moving ARE state and evidence out of WSL.

## Boundary

The bounded product is a loopback-only browser client and local host. The host
uses authenticated HTTP/SSE on `127.0.0.1`, connects to the existing gateway's
acknowledged Unix-socket transport, and relies on the installed official Codex
app-server as the model runtime.

This record does not claim native Windows packaging, installation into the
stock ChatGPT desktop interface, publication, remote deployment, production
support, or app-server protocol stability.

## Result

The prototype supports app-server initialization, new and resumed threads,
turn start and interrupt, streamed events, command and file-change approvals,
fail-closed permission expansion, repository-root confinement, and an
ephemeral launch credential that is not persisted in evidence.

Exact validation observations are in [RESULTS.md](RESULTS.md) and the structured
[result record](../../evidence/ilh05-windows-client-prototype-v1/result.json).

## Open Questions

- Should the next product boundary be signed native Windows packaging or local
  MCP integration with the stock desktop app?
- Which durable secret store should own a future persistent host credential?
- How should `tool/requestUserInput` and richer elicitation forms be rendered?
- What supported transport replaces the experimental upstream boundary for a
  production release?

