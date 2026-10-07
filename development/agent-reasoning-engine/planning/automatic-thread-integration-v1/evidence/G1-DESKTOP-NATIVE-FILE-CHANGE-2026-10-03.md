# G1 native file-change approval reachability — 2026-10-03

Status: bounded negative capability evidence, not a completed D2 approval test.
Authority effect: none. No desktop activation, installation, release, or
current-task handover occurred.

## Exact probe

The isolated managed desktop gateway canary used the installed WSL
`codex-cli 0.155.0-alpha.16.4` binary, SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
Its fixed loopback Responses provider requested a disposable file change only
if the host advertised a native `apply_patch` function tool. The private
gateway/client state and proposed sentinel were under task-owned `/var/tmp`
scratch; both launch profiles used the same pinned backend and the existing
`interaction-bound` managed path. There were zero external model calls and no
contact with this desktop task.

Both `desktop-wsl-base/v1` and `desktop-wsl-app-tools/v1` reached the provider.
Each advertised `exec_command`, `write_stdin`, `request_user_input`,
`view_image`, `multi_agent_v1`, `get_goal`, `create_goal`, and `update_goal`, but
not `apply_patch`. The canary therefore stopped with the explicit reason
`canary.native-file-change-tool-not-advertised` before sending an impossible
function call or waiting for `item/fileChange/requestApproval`. Neither run
applied the sentinel; each reported complete scratch cleanup. The exact
task-owned scratch parents were empty and removed afterward.

An intervening base-profile retry failed with `ENOMEM` before reaching the
provider. The canary had read the 281 MB backend executable into memory for
its SHA-256 check. That check now streams the bytes instead; the subsequent
base-profile run reached the catalog and computed the same pinned digest. The
`ENOMEM` run is inconclusive about file-change support.
After the hash change, the base-profile `approval-decline` control run passed:
it delivered a native command approval, durably recorded the declined response
intent and resolution, completed the turn, made zero external model calls, and
cleaned its isolated scratch state. This checks canary continuity, not
file-change semantics.

## Claim ceiling

The pinned host's normal model-tool catalog under these two isolated launch
profiles does not expose a route to the native file-change approval request.
The fake-backend gateway fixture still proves its scoped protocol handling;
it is not installed-host parity. Separate installed-host command-approval
decline and one-use tests remain positive evidence only for
`item/commandExecution/requestApproval`. No claim is made that all Codex
versions, host modes, or future tool catalogs lack file-change approval. No
stock desktop UI ingress, D3 clean resume, D4 writer handover, or control of
this chat follows from this probe.

## Open Questions

- Can a supported mode of this pinned host advertise a native file-change
  tool, or is `item/fileChange/requestApproval` reachable only through a
  different host edit path?
- What exact installed-host canary will exercise decline and one-use
  acceptance if that tool becomes available, without substituting a command
  approval for file-change semantics?
