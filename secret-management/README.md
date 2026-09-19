# Secret Management

This project provides a usable local, single-user secret store backed by SOPS
and age. The default installation keeps:

- executables in `/home/vrondelli/.local/bin`;
- the age identity in `/home/vrondelli/.config/sops/age/keys.txt`;
- the encrypted vault in
  `/home/vrondelli/.local/share/secret-management/secrets.yaml`.

The key and vault are created with mode `0600`; their owned directories and the
store lock use private permissions. Secret names, purposes, opaque reference
inputs, and material are packed inside one SOPS-encrypted value. Python sends
plaintext to SOPS over pipes and never writes a plaintext temporary file.

## Quick Start

The installed launcher is `secret-store`.

```bash
secret-store doctor
secret-store put elevenlabs/api-key --purpose elevenlabs-api
secret-store list
secret-store describe elevenlabs/api-key
secret-store reveal elevenlabs/api-key --stdout
secret-store delete elevenlabs/api-key
```

`put` uses a hidden prompt and confirmation by default. For automation, `--stdin`
reads exact bytes; use `printf`, not `echo`, when a trailing newline is unwanted:

```bash
printf %s 'value' | secret-store put example/token --stdin
```

`reveal` refuses to run without the explicit `--stdout` acknowledgement. Normal
receipts, errors, `describe`, and `doctor` never include material or logical
names. `list` intentionally reveals names because listing is its sole purpose.

## Python Consumption

Application code can consume a secret inside a bounded callback without making
the material the function's return value:

```python
import secrets

from secret_management import SopsAgeStore
from secret_management.canonical import canonical_sha256

store = SopsAgeStore()
nonce = secrets.token_hex(16)

def use_secret(view: memoryview) -> None:
    api_key = bytes(view)
    # Construct and call the client here. Do not retain api_key.

store.consume(
    "elevenlabs/api-key",
    use_secret,
    consumer_id=f"co_{nonce}",
    request_digest=canonical_sha256({"operation": "voice-generation"}),
)
```

The package remains directly runnable without the launcher:

```bash
PYTHONPATH=projects/secret-management /usr/bin/python3.12 -m secret_management --help
```

It also has a standard `pyproject.toml` and console-script entry point for an
independent Python installation.

## Recovery

The age identity is the only local decryption identity. Back up
`/home/vrondelli/.config/sops/age/keys.txt` to an offline encrypted location and
retain mode `0600`; never commit it, paste it into chat, or place it beside the
vault in a shared backup. `doctor` reports recovery as `not-verified` because the
store cannot safely infer that an external backup exists.

Losing the identity makes the vault unrecoverable. Re-running `init` never
overwrites an existing key or vault and fails closed on partial initialization.

## Security Boundary

This is ready for local developer use, not a shared or production secrets
service. SOPS authenticates and encrypts the vault at rest, while age owns the
local identity. The implementation also checks ownership and permissions,
rejects symlinks at key/vault/lock leaves, serializes writers with a file lock,
and atomically replaces only encrypted bytes.

It does not protect against compromise of the same operating-system account or
root, malicious trusted callback code, process-memory inspection, terminal or
pipeline capture during explicit reveal, filesystem snapshots of older
ciphertext, or loss of the age identity. Python and subprocess pipes can retain
uncontrolled plaintext copies despite best-effort clearing of owned mutable
buffers. Names and purposes supplied as CLI arguments may also appear in shell
history or process listings; use non-sensitive aliases. CI identities, teams,
cloud backends, rotation automation, migration, voice-provider calls, and
deployment remain separate work.

The coding-agent integration uses `python -m secret_management.bridge` as a
dedicated one-request process protocol. Configuration and a logical locator are
sent as JSON on stdin; successful stdout is raw material consumed by the parent
provider and cleared from owned mutable buffers. Failures are silent and
non-zero. This is a private integration boundary, not a human reveal command or
a general secret-export interface.

## Pinned Local Tools

- SOPS `v3.13.3`, Linux AMD64 binary SHA-256
  `e5bec3346a873ae91d871550f3e698c1aad962aff462a080e40f25fde17fef6b`
- age `v1.3.1`, Linux AMD64 release archive SHA-256
  `bdc69c09cbdd6cf8b1f333d372a1f58247b3a33146406333e30c0f26e8f51377`

The runtime re-hashes all three installed executables before use and fails
closed if they no longer match the pinned extracted bytes.

## Validation

Run the complete package suite from the repository root:

```bash
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3.12 -m unittest discover \
  -s projects/secret-management/tests -p 'test_*.py' -v
```

The suite covers references, grants, fake resolution, real temporary SOPS/age
round trips, encrypted-byte privacy, explicit CLI reveal, tamper and wrong-key
failure, permission rejection, concurrent writers, subprocess argument and
environment redaction, deletion, and idempotent initialization.

## Retrieval Benchmark

Run the SOPS-age retrieval benchmark against an isolated synthetic vault:

```bash
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3.12 \
  projects/secret-management/scripts/benchmark_retrieval.py
```

Pass `--enforce` to enforce the default p95 ceiling of 200 milliseconds. Use
`--budget-p95-ms`, `--iterations`, and `--warmup` to select an explicit local
regime. Setup and encryption are excluded from the timed region. The script
never reads the live vault and emits no material or logical secret name.
