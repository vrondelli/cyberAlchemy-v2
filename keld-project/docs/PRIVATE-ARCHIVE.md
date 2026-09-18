# Private ARE archive candidate

This is a local packaging proof for the complete engine, not a sale-approved
download. Distribution ownership and license materials remain under review in
[the distribution audit](DISTRIBUTION-AUDIT.md).

## Verified candidate: 2026-09-17

- 3,426 files; compressed archive 11,079,667 bytes.
- Archive SHA-256: `a81380ca8e14f948dd7c87575b4ed9bd5e38892fab4f25c723a55120c57469d6`.
- Source closure: `24688ae36896adf30f83ecc80650368cb34e186b3e9cd5d8a12ca953317a4464`.
- Two builds produced identical bytes; extracted integrity and doctor passed.
- Extracted full suite: 156 test files, 1,244 test cases, PASS using workstation tools.
- Five archive tests passed, including malformed member and symlink rejection.
- Isolated Linux container doctor passed without mounting the source checkout,
  host home or toolchain, with network disabled and a read-only root filesystem.

The container uses the already-local `node:26.8.1-bookworm-slim` image, identity
`sha256:367679cf9792759492a486e4aa4b421764d71a9546a6dae8aab81a99eb797b3e`.
This is startup evidence, not full native tests or an actual agent connection.
Reproduce with `python3 keld-project/scripts/check-container-startup.py`.
The command verifies the archive hash first, never pulls an image, and removes
its container afterward. Its evidence is `private-candidate/container-startup.json`.

## Build and validate

From the CyberAlchemy v2 root:

```sh
python3 keld-project/scripts/test_archive.py
tools/toolchain/run node keld-project/scripts/build-private-archive.mjs --full-tests
```

The builder materializes the engine's complete declared source closure, builds
two reproducible gzip/tar archives and compares SHA-256, extracts one into a new
temporary directory, verifies all files, symlinks and modes, and runs doctor.
`--full-tests` also runs the full product suite against that extracted copy.
Without it, the manifest explicitly records `full_tests: null`.

Successful output replaces one bounded local candidate under ignored
`keld-project/evidence/private-candidate/`:

- `are-private-candidate.tar.gz`: actual engine closure with required directory layout.
- `source-closure.json`: exact per-file inventory used to construct and verify it.
- `manifest.json`: archive digest, size, version, source identity and test summary.

Temporary archives and extraction trees are removed even when a build fails.
An unsuccessful build does not promote a newly generated archive. Consumers must
always compare the actual archive hash with its manifest before using it.

## Local inspection

The Python helper unpacks only members described by the trusted closure inventory:

```sh
python3 keld-project/scripts/archive.py unpack \
  keld-project/evidence/private-candidate/source-closure.json \
  keld-project/evidence/private-candidate/are-private-candidate.tar.gz \
  /tmp/are-customer-inspection
```

The destination must not exist. The helper validates member names, uniqueness,
types, sizes, modes, symlink targets and content hashes. It does not use tar's
general-purpose filesystem extraction. Only direct internal file symlinks are
supported; chains and directory links are rejected.

With Node 26.8.1 available, the extracted startup check is:

```sh
cd /tmp/are-customer-inspection/cyberAlchemy-v2/implementation/agent-reasoning-engine
node bin/are.mjs doctor --json
```

This remains a developer inspection flow. It does not yet provide a customer
installer, signed delivery manifest, verified license bundle or fresh-machine
prerequisite setup. The archive contains private source and review evidence;
`publication_approved` and `sale_approved` remain false regardless of test results.
Do not serve the ignored evidence directory from the storefront preview.

## Open Questions

The trusted manifest delivery mechanism, distribution materials, supported OS,
clean-machine installation and first real host integration remain open. Owners
and dependencies are in [the delivery plan](DELIVERY-PLAN.md) and
[project intake](PROJECT-INTAKE.md#open-questions).
