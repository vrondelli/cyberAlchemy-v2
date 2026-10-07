# G1 disposable read-only host write probe

Status: bounded construction evidence, 2026-09-26. Authority effect: none.
The current desktop task and active host configuration were untouched.

The selected installed `codex-cli 0.155.0-alpha.16.4` binary (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`)
ran one fixed-provider turn through the actual ARE gateway and wrapper. The
disposable thread used `sandbox: "read-only"`. Its provider returned a shell
tool call that attempted to write one marker in a uniquely created temporary
directory beneath this checkout. The marker was not created. The turn reached
terminal completion, the script removed the temporary config and marker
directory, and the native child was reaped. There were zero external model
calls. The canary mode is `--gateway-wrapper-sandbox` in
`implementation/agent-reasoning-engine/scripts/test-native-prompt-hook.mjs`.
The existing `--gateway-wrapper-approval` mode also passed after that change:
one approval-requested harmless command was declined and no success marker
appeared.
In a second disposable `--gateway-wrapper-approved-write` turn, the client
returned `accept` to one exact approval request, the fixed command wrote the
expected bytes to its isolated marker, and the script removed that directory
afterward. Both modes used zero external model calls and did not contact the
desktop task. The positive canary initially failed only because its assertion
looked for a Reasoning State checkpoint in the runtime journal; after checking
the actual file marker instead, it passed.

At the time of this probe, this supported a *candidate* read-only host posture
but did not change the client default. It does not prove all file tools,
network paths, host permissions, repeated approval behavior, or exclusive
desktop-task handover. The hosted client was subsequently pinned to read-only
with on-request approval, and the Codex gateway gained a closed lifecycle
parameter contract; see [later method-guard evidence](G1-ALTERNATE-HOST-METHOD-GUARD.md)
and [parameter evidence](G1-HOST-PARAMETER-CONTRACT.md). G1/O1 and universal
effect-interception proof remain open. The historical native prompt-hook
canary's trust-bypass parameter is no longer admitted by that contract; its
earlier result is not a current safe-gateway hook-delivery proof.

## Open Questions

- Which installed-host tool classes can write without emitting an approval
  under each selected sandbox/approval profile?
- Does a one-use approved write preserve ARE's exact effect binding without
  granting later writes or broadening network/permission scope?
