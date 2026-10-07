# P1e — Codex Host assertion source check

Status: candidate planning evidence, 2026-10-04. Authority effect: none. No
desktop task, profile, process, or app setting was changed for this check.

## Documented surface

The current official [Codex app-server protocol](https://learn.chatgpt.com/docs/app-server)
documents client-supplied `initialize.clientInfo`, `thread/start` and its
thread metadata, and optional `requestAttestation`. The latter is a
server-initiated `attestation/generate` request answered by desktop hosts with
an opaque upstream token. The documented creation response names a native
thread; it does not claim a desktop-owned client, workspace, gateway route, or
exclusive writer. The official [developer commands](https://learn.chatgpt.com/docs/developer-commands)
describe `codex remote-control` as a local app-server daemon for managed remote
clients, not as a replacement for the local protocol client or as a stock
desktop writer-ownership proof.

Inference: none of these documented fields by itself satisfies the P1
authenticated creation/writer contract. This is not a universal impossibility
claim. A Host-private or version-specific capability may exist; the exact
installed desktop and its supported extension boundary still need testing.

## Current local probe limit

This run confirmed the selected WSL CLI still reports
`codex-cli 0.155.0-alpha.16.4` at
`/mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex`.
Both a read-only `Get-AppxPackage -Name OpenAI.Codex` through `powershell.exe`
and `cmd.exe /c ver` failed before producing Windows command output with WSL
`UtilAcceptVsock:273: accept4 failed 110`. The WindowsApps package directory
was not readable from this WSL account (`Permission denied`). Consequently
the prior P0 Windows package version is **not refreshed in this run**, and no
claim about the currently installed desktop build or its internal launch path
follows from these attempts. No Windows shell command completed and no WSL
restart was performed.

The repository gateway's `conversation_binding_gate` accepts Host callback
functions (`host_context_for`, `verify_host_context`, `verify_release`) and
checks the verified assertion against the durable native creation acceptance.
That is a verifier *slot*, not an installed desktop assertion provider. A
fixture-supplied callback cannot satisfy this P1e proof.

## Separate app-API task witness

With the user's approval, one disposable read-only task was created through
the Codex app task API in this saved local checkout:
`01a1087f-183f-7b42-b5ad-6d180c563ce5` (title: `ARE Host creation probe`).
The create call returned that ID; a first wait could not resolve its host, but
`read_thread` then showed the task active and a later wait showed its turn
completed. Do not treat the transient wait error as a failed creation or create
a duplicate probe.

The task reported cwd `/home/vlad_/projects/cyberAlchemy-v2`. Its read-only
`/proc` inspection found a `codex` process with seven arguments including
`app-server`, no argument containing `gateway`, and no standalone `are`
argument; the accessible parent was a local relay. This is evidence that this
**API-created task's visible local backend path** is native Codex app-server,
with no ARE gateway shim visible in the inspected arguments. It does not
establish the entire upstream transport,
exclusive-writer state, or the behavior of the desktop UI's New Chat button.
The task's own ARE route call returned `selection.no-match`; that diagnostic
did not authenticate its creation path and is not counted as an ARE-controlled
session. No repository files were edited by the probe task.

This API path is now a distinct **unproven ingress** in any future claim that
*all* Codex tasks are ARE-controlled. It must either be proven mediated by a
supported Host integration or explicitly excluded from a per-surface opt-in release.
Neither the API witness nor the earlier WSL interop failure closes C0/C1.

## Next bounded proof

1. Freeze the exact desktop/CLI build and source or generated protocol schema
   used by the disposable profile; retain current P0 evidence separately from
   any new version.
2. Observe a real desktop-created WSL New Chat at C0 and correlate its app
   process, gateway-shim invocation, native `thread/start`, and visible thread.
   Trace only identifiers and digests, not prompt text or credentials.
3. Identify a Host-owned assertion channel with an independently verifiable
   principal/client/workspace/creation/writer statement. Reject a callback
   populated only from client-controlled JSON-RPC fields or gateway labels.
4. Prove the desktop cannot issue a parallel direct write for that thread
   while ARE owns it, including resume, fork, steer, review and reconnection.
5. If step 3 or 4 is unsupported on the pinned version, close stock-desktop
   C1 as unsupported for that version and branch to an explicitly named
   ARE-owned Codex app-server client. Do not equate that branch with desktop
   New Chat or existing-task handover.

This proof precedes any claim that the P1d/P3b synthetic Host callbacks
represent real stock-app control. It also precedes C1 even if C0 sees a shim
launch. A negative result changes the per-surface plan, not the general ARE
gateway architecture.

## Open Questions

- Is there a supported desktop extension or launch handshake that can bind a
  Host assertion to one native creation acceptance without exposing secrets?
- Can a stock desktop prevent or expose alternate writers for the same thread?
- What is the disposal-safe profile and exact user-visible witness for C0?
- When will Windows interop or an app-owned UI probe be available to refresh
  the installed version and observe the actual New Chat launch path?
- Can the app task-creation API select the same verified Host-owned gateway
  path, or must its native path be excluded from the first opt-in profile?
