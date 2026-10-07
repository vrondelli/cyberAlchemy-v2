# H0C native approval-boundary canary

Status: passed for one disposable approval-requested command, 2026-09-26;
not a general tool-enforcement or desktop-task handover proof. Authority effect:
none. The installed host binary was `codex-cli 0.155.0-alpha.16.4`, SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.

## Method and result

The [native canary](../../../../../implementation/agent-reasoning-engine/scripts/test-native-prompt-hook.mjs)
ran an ephemeral App Server task through the actual ARE persistent gateway and
semantic wrapper. Its model was a fixed loopback Responses fixture, not an
external provider. The fixture requested only `printf ARE_NATIVE_TOOL_OK` with
explicit escalation; the task used on-request approval and a read-only sandbox.
The gateway stayed connected through approval. The client approval handler
returned `decline`; it never accepted an effect.

The version-bound `--gateway-wrapper-approval` run reported `PASS`: one native
turn, one gateway dispatch, one wrapper `gate`/`block` effect directive, one
host command-approval request, one client decline, and no tool success marker
in the tool result. Prompt, PreToolUse, Stop, and terminal completion were
observed and bound to that turn. Temporary configuration was removed and the
native child reaped. No active configuration, current chat, or real provider
was touched.

The original `--gateway-wrapper` mode was rerun after the change and passed:
one turn, one dispatch, two client generations, detached terminal recovery,
and stable replay without redispatch. Its known counterexample remains: the
same harmless `printf` executes when no host approval request is emitted,
despite an advisory PreToolUse `block`. The two modes therefore test different
boundaries. The approval-path pass must **not** be reported as non-bypassable
effect enforcement for all tools or as an installed desktop integration.

## Reproduction

Set `ARE_NATIVE_CANARY_EXPECTED_VERSION` to the selected binary's exact
`--version` output, then run:

```sh
node implementation/agent-reasoning-engine/scripts/test-native-prompt-hook.mjs \
  /absolute/path/to/codex --gateway-wrapper-approval
node implementation/agent-reasoning-engine/scripts/test-native-prompt-hook.mjs \
  /absolute/path/to/codex --gateway-wrapper
```

The commands create only disposable host configuration and a loopback
provider. They report the binary and source digests in their JSON receipts.
They do not install hooks or transfer any desktop task.

## Open Questions

- Which installed-host boundary can make ARE's effect decision mandatory for
  commands that do not emit an approval request?
- Can a disposable desktop-client equivalent prove exclusive ingress,
  approval and completion coverage across reconnect and rollback?
