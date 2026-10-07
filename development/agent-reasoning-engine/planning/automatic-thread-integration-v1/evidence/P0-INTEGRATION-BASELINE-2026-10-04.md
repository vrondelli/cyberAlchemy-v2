# P0 — Codex / DSH integration baseline

Status: bounded local evidence, 2026-10-04. Authority effect: none. This
freezes inputs for the next candidate construction slice; it does not activate
ARE for Codex desktop or DSH Web, validate an installed UI path, or approve a
product. Source checkout: Git HEAD
`fb23addf01acc82d9ae6db99eddde9ead53e3e1a`, with 1,622 porcelain-status
entries at inspection. Those entries are existing working-tree state and were
not cleaned, staged, or normalized for this probe.

## Observed host and dependency identities

| Surface | Current observation | Evidence / claim ceiling |
| --- | --- | --- |
| WSL Codex CLI selected by `command -v codex` | `codex-cli 0.155.0-alpha.16.4`; SHA-256 `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520` | Read-only `codex --version` and `sha256sum` of `/mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex`. PATH identity does not prove which process the desktop app uses for New Chat. |
| Installed Windows app package | `OpenAI.Codex` `26.917.9434.0` | Read-only `Get-AppxPackage *Codex*`; no launch, login, project selection or app-owned shim trace. |
| Local Node/npm | Node `v26.8.1`, npm `11.19.0` | Version commands only; no install or dependency update. |
| [ARE Codex wrapper](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/package.json) | package `0.1.0-candidate`; package SHA-256 `19448b4ef3636abe678061fc8a16bf52f085062b9853d5bd9390fc7b73cc8a31`; [gateway source](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway.mjs) SHA-256 `3cc1be4cda16bfc53209a367e8265f8ee8d69785274846b1bc0a4315a1abdc12` | Working-tree bytes, not an immutable release. Gateway source is already modified locally. |
| [ARE DSH adapter manifest](../../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/package.json) | direct `@deepseek-ai/dsh` pin `0.1.5-rc.2`; manifest SHA-256 `063dd131819f2b959b5d162bc5a91d6cf153b0c94d3bf863d574c69ec1d7f196` | Package declaration, not a DSH Web integration or runtime test. |
| [DSH lock graph](../../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/package-lock.json) | lock SHA-256 `5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896`; top `dsh` is rc.2 and 230 matching nested `dsh-*` packages are rc.3 (the 231st path match is nested `chokidar` 5.0.0) | Exact lockfile inspection; mixed release-candidate versions require a compatibility gate before reuse of native DSH session-controller or third-party ACP components. No `npm install` occurred. |

The local [headless DSH adapter](../../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/README.md)
still reports its own replayed-history design, not native DSH Web sessions.
The [G1 desktop feasibility record](../G1-CODEX-NEW-CHAT-FEASIBILITY-PLAN.md)
still reports no app-owned shim invocation. These are the current **claim
ceilings** for C0 and D0, not proof that either cannot be implemented.

## P0 decision and next frontier

P0's bounded local identity freeze is complete. It supports P1's pure
conversation-binding contract and P2's versioned protocol matrix. It does
**not** satisfy C0's graphical New Chat witness or D0's native DSH Web
session-controller mediation proof. No plan edge into C1 or D1 may be marked
ready on this evidence alone. Recheck this manifest after an installed app,
CLI, DSH package or gateway-source change.

## Open Questions

- Which backend binary does an authenticated, submitted desktop New Chat use?
- Does this mixed DSH rc.2/rc.3 lock graph preserve the native session writer
  and journal semantics required for a future DSH Web adapter?
- Is a disposable authenticated desktop profile available for the C0 witness?
