---
deliveryId: LOCAL-STORE-001
status: candidate-local-ready-for-use
completedAt: 2026-08-16T15:57:56Z
authorityClass: private-local
evidenceCeiling: local-single-user
---

# Consolidated Closeout: Local SOPS And Age Secret Store

## Outcome

`projects/secret-management` now provides an installable Python package, the
`secret-store` launcher, a real SOPS-backed resolver, and a local age identity.
The default empty vault passes a permanent-path synthetic
put/describe/list/reveal/delete lifecycle and finishes with `record_count=0`.

This is ready for use by the current local developer account. It is not a
shared, CI, cloud, deployed, or production secrets service.

## Authorization And Historical Boundary

- One-time user authorization: `GO: complete the local SOPS+age secret store`.
- Fast-lane notice: `HN-DC640BF5D2FA`.
- Earlier L0/L1A evidence remains under
  `development/secret-resolution-l1`; its Work Pack is preserved unchanged.
- This consolidated epoch does not retroactively claim that the old Work Pack
  admitted SOPS or CLI work. It records a separately authorized candidate-local
  delivery.

## Delivered Surface

- Pinned SOPS `v3.13.3` and age `v1.3.1` user-local executables.
- Runtime SHA-256 verification for SOPS, age, and age-keygen before execution.
- One age identity with private ownership and mode `0600`.
- One SOPS-encrypted vault with private ownership, mode `0600`, authenticated
  decryption, encrypted atomic replacement, and a stable file lock.
- CLI commands: `init`, `put`, explicit `reveal --stdout`, `list`, `delete`,
  `describe`, and `doctor`.
- Python `SopsAgeStore` resolver and bounded callback consumption.
- Standard `pyproject.toml`, module entry point, user-local launcher, README,
  and real-binary integration tests.

## Default Paths

| Role | Path |
| --- | --- |
| CLI | `/home/vrondelli/.local/bin/secret-store` |
| SOPS | `/home/vrondelli/.local/bin/sops` |
| age | `/home/vrondelli/.local/bin/age` |
| age-keygen | `/home/vrondelli/.local/bin/age-keygen` |
| identity | `/home/vrondelli/.config/sops/age/keys.txt` |
| encrypted vault | `/home/vrondelli/.local/share/secret-management/secrets.yaml` |
| writer lock | `/home/vrondelli/.local/share/secret-management/secrets.yaml.lock` |

No private-key bytes or real secret values are present in this closeout.

## Validation Result

- Secret-management suite: 27/27 pass.
- Voice-production regression suite: 85/85 pass.
- ElevenLabs static projection: 7/7 pass.
- Voice network-denied suite: 3/3 pass.
- Real permanent-path synthetic lifecycle: pass; final record count zero.
- Binary digest verification, key/vault/lock modes, launcher, doctor,
  packaging, scoped whitespace, private-key-marker, and cache-residue checks:
  pass.
- Network syscall trace: unavailable because `strace` is not installed; no
  network claim is inferred from that missing diagnostic.

Machine evidence is in
`runs/20260816T155756Z/validation-receipt.json` and
`runs/20260816T155756Z/terminal-receipt.json`.

## Operator Action

Run `secret-store doctor`, then use the hidden prompt:

```bash
secret-store put elevenlabs/api-key --purpose elevenlabs-api
```

Back up the age identity to an offline encrypted location. The store cannot
verify that external recovery step and does not copy the private key.

