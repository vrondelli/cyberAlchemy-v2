# G1 managed hosted-effect recheck — 2026-09-30

Status: disposable integration evidence, not activation of the current desktop task. The TUI is discontinued and was not involved.

The current checkout's `restricted-lifecycle-canary.mjs` passed `managed-wire-guard-effect-accept-turn` against the pinned WSL `codex-cli 0.155.0-alpha.16.4` (SHA-256 `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`). The supervised launcher started a restricted App Server, gateway, hosted client and model-wire guard. A local fixed-response provider saw only `are_effect_request` on the model turn. The test's one-use `ACCEPT` passed the ARE assessment and broker; the sandboxed command result returned to the provider through the same turn. The report was `PASS`, `BOUND_AND_BROKERED_ACCEPT_ONE_TURN`, four local provider requests, zero external model calls, `current_desktop_task_touched:false`, and temporary configuration removed. This is one new ARE-owned disposable session, not a handover of the existing Codex desktop conversation.

The separate `managed-hosted-effect-turn` mode reached its browser approval gate and timed out when no manual click was supplied (`canary.managed-turn-not-dispatched`, three of four expected provider requests). That mode deliberately requires a human browser click; its timed-out run is not evidence of an effect rejection or a regression in the automated accept path. Its disposable configuration was removed. The wrapper suite then passed 677 of 696 tests, with 19 platform/browser skips and zero failures.

The [official Codex App Server command documentation](https://learn.chatgpt.com/docs/app-server#command-execution) describes `command/exec` as sandboxed but does not document a Windows output-memory bound. It identifies experimental `process/spawn` as running outside Codex's sandbox, so that API cannot substitute for the missing bounded sandboxed effect path. The [pinned native Windows probe](G1-WINDOWS-SANDBOX-MANAGED-PREFLIGHT.md) still rejects custom `outputBytesCap` and streaming under its sandbox. Native Windows hosted commands remain denied; a successful WSL managed canary does not change that boundary.

## Claim ceiling

The candidate now has a current supervised WSL managed-effect acceptance sample and a green wrapper regression suite. It does not establish an exclusive writer handover of this desktop task, a safe direct-client release of persisted dynamic tools, native Windows effect execution, power-loss recovery, or product admission. The [release probe](G1-DYNAMIC-TOOL-REVOCATION-2026-09-30.md) remains a separate negative capability: direct resume of a persisted ARE tool does not revoke it on this pinned host.

## Open Questions

- Which host-supported mechanism can exclusively hand over and later release this exact desktop conversation without racing its current client?
- Which sandboxed native Windows execution path can prove a bounded output-memory limit before effects are enabled?
- What independent, same-scope tests and owner decisions are required before the candidate becomes a supported operating mode?
