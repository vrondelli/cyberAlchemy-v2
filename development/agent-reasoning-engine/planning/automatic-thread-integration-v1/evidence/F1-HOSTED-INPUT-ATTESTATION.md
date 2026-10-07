# F1 hosted-input attestation and backend credential isolation

Status: bounded source and disposable managed-session evidence, 2026-09-28.
TUI is discontinued and was not used. No current desktop-task handover,
product activation, installer release, or deployment is claimed.

## Contract and implementation

The managed launcher creates a fresh 32-byte hosted-input key for its gateway
and hosted-client processes. The hosted HTTP client marks only browser-submitted
`turn/start`, feedback submission, pending-feedback application, and dismissal
as hosted input. Its RPC client HMAC-binds the exact consumer, method, params,
and optional stable request key. The gateway verifies the MAC before passing a
content-free verified-input posture to the wrapper; it strips the proof before
any backend forwarding. Invalid proofs fail before wrapper dispatch. With the
production gateway's interaction-learning profile enabled, the wrapper refuses
unverified feedback mutations and does not infer a chat correction from an
unverified turn. Ordinary turns remain possible without silently learning.
An enabled-learning gateway refuses startup without the key.

The Codex backend spawn now receives an environment with gateway connection,
observation, and hosted-input credentials removed. The DSH adapter rejects
explicit passthrough of those same gateway-only keys. This isolation is a
prerequisite for the HMAC to distinguish the hosted client from model-run
commands. It does not prevent a same-user process that already has access to
the hosted-client process or browser bearer token from acting as that client.

## Verification

- Hosted-input signer tests: 2/2. Exact consumer, operation, text, and stable
  request-key changes invalidate the proof.
- Linux full wrapper suite after the change: 564 passed, 14 platform skips,
  0 failed. The focused gateway proof test rejects a forged MAC and delivers
  distinct verified/unverified postures to the wrapper. A separate gateway
  startup suite passed 4/4, including refusal of a learning-enabled profile
  without the key.
- Full DSH adapter suite: 17/17. Its private-key passthrough negatives passed.
- Native Windows Node 26.8.1 source suites: gateway 134/134, hosted HTTP host
  59/59, RPC 23/23, hosted-feedback cues 6/6, backend adapter 5/5, managed
  launcher 3/3, and signer 2/2.
- A disposable Linux managed-session canary used the installed Codex binary,
  created one owned thread, saved then dismissed one pending feedback record
  through authenticated HTTP, and inspected the actual backend child
  environment. All three gateway-only credential names were absent. It made
  zero model turns and zero external model calls, and did not touch this task.
- The existing isolated Ubuntu 26.04 builder container then passed the joined
  Linux source UI smoke: orb and dashboard rendered, seven panels appeared,
  and the same managed gateway/client showed running/ready/connected. No model
  call or installation occurred. The direct WSL-host attempt failed before UI
  load because that host lacks `libwebkit2gtk-4.1.so.0`; the container has it.
- The source dashboard suite passed 41/41. A new unsigned Windows NSIS
  development build at
  `D:\are-companion-attested-jAYjg8\ARE_Companion_attested_20260928.exe`
  has SHA-256 `428c2d723f61d578848efd2114a88d6d6bfcda608dc82c3dcb4cccffee1a6711`.
  Its retained stage passed the 11-check bundled feature probe and the native
  36-check WebView2 default journey. A native managed-session UI smoke using a
  hash-verified disposable copy of the installed Codex executable rendered the
  orb and seven-panel dashboard with gateway running, backend ready, and
  hosted client connected. It truthfully showed desktop-task control
  unverified and model-turn ingress paused. No model calls or installation
  occurred. The installer archive itself was not extracted or run.
- The disposable hosted-input canary then passed natively on Windows against
  the same hash-verified Codex copy: one owned thread, pending feedback, and
  exact dismissal crossed authenticated HTTP and the gateway with zero model
  turns. Its temporary state was removed. The Windows canary does not inspect
  the backend process environment; that credential-isolation observation is
  Linux-only.
- The subsequent [read-only Companion status check](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-HOSTED-INPUT-PROVENANCE-2026-09-28.md)
  shows gateway key configuration independently from model-entry pause and
  desktop-task control in a fresh staged Windows build. It does not turn key
  presence into proof that a specific request was attested.

## Claim ceiling and open questions

This proves a bounded hosted-client ingress distinction, not physical-human
identity. A bearer-token holder or compromised hosted-client process remains
within the trusted ingress boundary. Programmatic direct-wrapper clients may
still select experimental learning without this production gateway requirement;
they are not thereby authenticated hosted human input. Broad task/one-time/
reusable feedback classification, historical lesson precedence, an installed
Windows package check for these exact bytes, complete host effect interception,
and control of this already-open desktop task remain unverified.

Should a future host provide an authenticated user-message/session claim that
can replace this process-local ingress attestation across other adapters and
after desktop-task handover? Until then, do not call this a human-identity or
exclusive session-control proof.
