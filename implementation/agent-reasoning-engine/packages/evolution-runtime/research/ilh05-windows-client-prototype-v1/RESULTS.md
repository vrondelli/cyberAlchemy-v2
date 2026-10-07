# IL-H05 Results

## Outcome

The Windows-facing ARE app-server client prototype is implemented and validated
for controlled local use.

- Focused host tests: 4/4 passed.
- Complete wrapper suite: 226/226 passed.
- Installed Codex binding: `codex-cli 0.155.0-alpha.16.3`.
- Real gateway and app-server initialization: passed.
- Node loopback health and UI probes: HTTP 200.
- Windows PowerShell to WSL loopback UI probe: HTTP 200.
- Model turns started by the operational canary: 0.
- Operational canary output SHA-256:
  `2a15672edf04569d5677df0d315ba181f960d621569e7b8207de4515f075286a`.

The canary consumed the IL-H04 continuity activation manifest and observed the
`activated` disposition. Temporary sockets, session logs, and reasoning-state
files were removed after the canary. No credential or environment dump was
stored.

## Product and operational lanes

Product frontier: the local browser client can drive a real ARE-governed
app-server session after the user starts the admitted gateway.

Operational residue: native installer signing, automatic startup, durable token
custody, remote/TLS exposure, and production protocol support are separate
future scopes. They do not invalidate this local prototype result.

## Open Questions

Open questions are owned by [README.md](README.md#open-questions).

