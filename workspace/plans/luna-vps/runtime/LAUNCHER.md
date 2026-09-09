# Private Luna pilot service

The tested launcher owns the full repository wrapper, native Codex App Server,
gateway client, callback bridge and provider proxy in one supervised process.
`are-luna-pilot.service` runs as `are-luna`. Its control socket is
`/run/are-luna-pilot/control.sock`, mode 0600; both HTTP listeners bind loopback
and require separate process-private bearer credentials.

The live pilot passed with `gpt-5.6-luna`, returning exactly
`ARE_LUNA_LIVE_OK`. [Live evidence](../evidence/luna-live-test.json) records the
native thread/turn and ARE completion binding. The proxy allows one provider
request for this pilot, forces the selected model and a 512-output-token limit,
and removes tools. This proves a no-tool native model turn through ARE; it does
not prove live shell execution, general task scheduling or RWO integration.

## Installation and trust

[The candidate receipt](../evidence/launcher-candidate.json) binds all launcher
sources, configuration and unit hashes. The selected base runtime remains at
`/srv/are-luna-pilot/candidates/04384954e710e58f`. Launcher sources are installed
at `/srv/are-luna-pilot/launchers/22ddddd79b0f96af`, owned by root and readable by
the service group. Runtime writes stay under `/var/lib/are-luna-pilot/host`
and `/run/are-luna-pilot`.

Preparation inspects exactly three enabled, unmanaged native hooks, verifies
their commands, and persists their current hashes using Codex's configuration
write operation. Normal startup requires that approval record, matching
callback bytes, and native `trusted` status. There is no hook-trust bypass.
The [native trust experiment](../evidence/persisted-hook-trust-native-test.json)
also exercised the tool callback without a bypass. Hook definitions and changes
require exact review, as described in the [official hook documentation](https://learn.chatgpt.com/docs/hooks).

The service uses systemd `LoadCredential` with the existing VPS worker's
`/run/cyberalchemy-orchestrator/openai_api_key` reference. Key contents were not
printed or copied into repository artifacts. Only the provider proxy reads the
real key; native Codex receives a separate token for the loopback proxy.

`install-launcher.py --remote-stage /tmp/<tested-stage>` checks the candidate
hashes, rejects an existing target or unit, installs the sources, prepares hook
trust in a transient service, verifies the unit, and enables/starts the service.
It expects the four candidate `.mjs` files to have been uploaded and tested in
that private staging directory. Existing installations require a separately
bounded update; the installer does not overwrite them.

## Operations and recovery

Read status on the VPS:

```sh
runuser -u are-luna -- \
  /srv/are-luna-pilot/candidates/04384954e710e58f/bin/node \
  /srv/are-luna-pilot/launchers/22ddddd79b0f96af/pilot-control.mjs \
  /run/are-luna-pilot/control.sock status
```

The control protocol accepts `status` and the fixed `smoke` operation only.
Replaying `smoke luna_live_20260907_01` returns its verified result without a
new model call. A different request ID is rejected because this pilot's one
attempt is already recorded. No general prompt or shell endpoint is exposed.

The durable attempt is written and fsynced before dispatch. An unsuccessful or
uncertain outcome keeps its intent and process lock; a restart cannot erase
the attempt limit. Each clean process generation has separate gateway and
reasoning journals. Resume credentials and callback bindings are process-local,
so process-loss recovery is explicitly blocked rather than claimed to work.
Systemd uses `Restart=no`. The service can be stopped with
`systemctl stop are-luna-pilot.service`; preserve its state and journals during
rollback. Never remove a stale lock or invent a new request ID to retry an
uncertain task without first resolving that outcome.

Startup is conditional on the existing key-file reference being present. Its
recreation after reboot remains with the existing secret owner. A process crash
or native-host exit requires inspection; this single-pilot service does not
implement automatic recovery or indefinite multi-task capacity.

## Tests

`test-pilot-host.mjs /absolute/candidate` runs real native Codex with a loopback
fixture. It verifies persisted trust, ARE context on the provider request,
private control, rejection of extra operations, one-call limits, exact output,
cached replay after clean restart, and blocking after stale locks or failed
outcomes. The same test passed locally and on the VPS. The live test and its
cached replay passed; the existing orchestrator remained healthy with the same
start timestamp and a working state endpoint.

## Open Questions

[HOST-PLAN.md](../HOST-PLAN.md#open-questions) owns the next RWO executor/source
binding, Workspace event projection, broader worktrees, multi-task budgets,
and process-loss recovery. MCP remains last. This file also owns unresolved
questions for the generated host configuration and systemd unit beside it.
