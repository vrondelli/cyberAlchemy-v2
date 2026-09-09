# Isolated VPS fixture runtime

This candidate packages the tested Node and Codex binaries, the ARE product
source closure, and the repository profile's selected sources and provenance.
It does not package account credentials or activate a service. The full-wrapper
patch derives a portable canary from the existing native gateway test; patch
application rejects mismatched source hunks rather than guessing a replacement.

Build with `python3 build-bundle.py --node /absolute/node --codex /absolute/codex
--output /new/absolute/candidate`. Versions and the Codex/base-profile hashes must
match `../host-binding.candidate.json`. The output includes `MANIFEST.json`,
`SHA256SUMS`, and a compressed archive. Every copied source is checked against
the selected snapshot before packaging. Node's exact binary hash is recorded
in the manifest; this is local binary identity, not an upstream signature check.

After extraction, run from the candidate directory:

```sh
sha256sum --check --quiet SHA256SUMS
bin/node cyberAlchemy-v2/implementation/agent-reasoning-engine/scripts/portable-full-wrapper-canary.mjs "$PWD/bin/codex" --gateway
```

The canary starts a loopback fixed Responses fixture, a Unix-socket gateway,
the repository wrapper, native Codex, and the authenticated callback bridge.
It checks three turns across two threads, one fixed `printf`, callback
attribution, disconnection, completion recovery, and replay without redispatch.
Its hook-trust bypass applies only to disposable test configuration. It must
not be used as an operational launcher. The harness cleans its temporary
processes, sockets, configuration, and journals on exit.

The staged snapshot is a fixture execution bundle, not a complete checkout or
a claim that every product command/test can run independently on the host.
No source repository, model account, or RWO deployment is modified by building it.

`run-remote-fixture.py --archive /absolute/bundle.tar.gz --sha256 <archive-hash>
--output /absolute/receipt.json` uses the VPS identity from the host binding and
strict SSH verification. It verifies the transferred archive and all manifest
files, runs as `nobody`, saves the result, and removes the temporary upload.
Bounded failure diagnostics are saved before cleanup.

The optional `--install` flag proceeds only after that disposable test passes.
It calls `install-isolated.py` to create the `are-luna` system identity, private
home `/var/lib/are-luna-pilot`, and a root-owned candidate under
`/srv/are-luna-pilot/candidates/<manifest-hash-prefix>`. Existing identities or
target directories cause rejection, rather than replacement. Source files are
readable but not writable by `are-luna`. The runner then repeats the full native
test under that identity and includes the installation receipt in the result.
No systemd service, global PATH modification, or model credential is installed.

`install-isolated.py /absolute/extracted-candidate <manifest-hash>` performs
validation only; its separate `--install` flag is required for mutation. It
checks exact files and rejects changed content, symlinks, extra files, and path
escapes. Node 26.8.1 requires the host's `libatomic.so.1`; the selected Ubuntu
host needed `libatomic1=14.2.0-4ubuntu2~24.04.1`. That dependency was installed
separately after package simulation showed one new package and no upgrades or
removals. Service restarts were deferred.

The host also needed `bubblewrap=0.9.0-1ubuntu0.1` and the exact Ubuntu
`bwrap-userns-restrict` AppArmor profile. The profile was extracted from
`apparmor-profiles=4.0.1really4.0.1-0ubuntu0.24.04.7`, hash-verified, syntax-checked,
and loaded at `/etc/apparmor.d/bwrap-userns-restrict`. This follows the
[official Ubuntu 24.04 sandbox instructions](https://learn.chatgpt.com/docs/sandboxing).
The global `kernel.apparmor_restrict_unprivileged_userns` setting remains `1`.
The sandbox smoke test passed as `nobody`; exact versions and profile identity
are recorded in [the prerequisite receipt](../evidence/vps-sandbox-prerequisites.json).

Rollback is removal of the exact staged candidate and newly created identity
only after checking for running processes and retained state. Preserve any
later journals or credentials for an explicit recovery decision. Do not remove
the shared `libatomic1` package without checking subsequent consumers.

## Open Questions

[HOST-PLAN.md](../HOST-PLAN.md#open-questions) owns operational hook trust,
supervision, persistent client credentials, live Luna access, and RWO wiring.

The next stage is implemented and active: [private launcher](LAUNCHER.md),
including persisted hook trust and a verified no-tool live Luna turn.
