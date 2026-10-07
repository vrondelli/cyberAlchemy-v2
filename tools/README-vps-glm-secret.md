# VPS GLM secret update

From a WSL terminal in this checkout:

```sh
python3 tools/set_vps_glm_secret.py --check
python3 tools/set_vps_glm_secret.py
```

The second command prompts twice without echoing. Do not put the key in a
command argument, environment variable, repository file, or chat. It travels
only through the existing SSH connection's standard input. The script checks
the exact VPS file's owner (`65532:65532`), mode (`0400`), regular-file identity
and size, then updates that same inode so Docker's file bind mount continues to
see it. It verifies the new bytes without displaying them and attempts to
restore the old value if writing fails. It never creates a disk backup.

Run this when no benchmark is dispatching: an in-place file update is not
atomic for a process reading at the same instant. The command does **not**
restart the gateway or make a model request. Once it succeeds, run a separate
small provider check before resuming benchmarks; a valid new credential alone
does not prove that billing is available. If SSH host-key checking or the
file-metadata check fails, the script refuses the update.

## Open Questions

Whether the gateway caches the credential in memory is not established; the
benchmark worker reads the bind-mounted file for new requests. A gateway
restart, if needed for its own traffic, is a separate operational action.
