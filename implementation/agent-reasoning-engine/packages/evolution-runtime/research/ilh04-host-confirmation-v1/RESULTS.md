# IL-H04 Host-Confirmation Results

Status: headless host confirmed  
Production activation: none

## Outcome

The shared RPC client now accepts an optional closed continuity consumer. The
consumer verifies the protocol method, exact projection shape, retained package
and decision bindings, deterministic response, and projection digest before it
calls the host surface. It creates structural receipts and suppresses a replayed
projection when initialized from recovered digest state.

| Check | Result |
| --- | --- |
| High-risk host surfacing | 6/6 |
| Low-risk false triggers | 0/6 |
| Disabled-profile false triggers | 0/1 |
| Tampered projection | rejected before surfacing |
| Recovery replay | duplicate suppressed |
| Focused tests | 23/23 passed |
| Full Codex wrapper tests | 214/214 passed |
| Full evolution-runtime tests | 128/128 passed |
| Coordinator settlement | 5/5 tasks completed |
| Restart / SQLite-loss recovery | verified / verified |

- Canary result digest: `9c24091ce1e53ba0d4c4f89cd5903c6ef39dbc847b5c1e341105041c116d1335`
- Validation digest: `7d2c23fe85336e28513094f18eba58cfd98b6f92d7a1e6d959b46bd545b582c7`
- Confirmation package digest: `34c2eb72c39011d2d1cb863eb16c719c7d7d1664598cf9f88ebdae6b0c1a1f13`
- Coordinator settlement digest: `a53840ecc719007c06ba66c726fb05d93d4adb4294959b4846513d9037523206`

## Decision

`confirm-headless-host-surface`. A later controlled-upgrade decision may
consider the shared RPC/headless scope. Codex Desktop/Windows remains blocked
from the claim until a supported adapter and its own canary exist.

The subsequent
[`ilh04-continuity-provider-v1`](../ilh04-continuity-provider-v1/RESULTS.md)
cycle supplied and validated the required engine-owned state provider without
activating the renderer.

## Claim boundary

This is a local protocol-path confirmation using deterministic host scenarios.
It is not a real-user effectiveness result, desktop UI proof, activation,
deployment, publication, or authority grant.

## Open Questions

Open questions are owned by [README.md](README.md#open-questions).
