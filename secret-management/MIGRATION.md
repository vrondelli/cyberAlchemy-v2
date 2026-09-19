# Secret-management source relocation

Source home: `cyberAlchemy-v2/secret-management`.

Imported on 2026-09-19 from `domainspec-core/projects/secret-management`:
26 source, documentation and test files (165,085 bytes), verified by SHA-256.
This includes the modified store/CLI tests and portable-default regression test.
Original hashes are in `../migration/auth-secrets-20260919/source-manifest.json`.

The local `~/.local/bin/secret-store` launcher and ARE consumers now resolve this
source. The old source directory was moved out of DomainSpec-core into the
recoverable local backup `/tmp/auth-secrets-migration-M5y6kN/secret-management-original`.
The backup is temporary recovery material, not a runtime dependency.

The encrypted vault, age key and SOPS/age executables remain in their existing
user-owned locations outside both repositories. No credential migration,
decryption, rotation or vault initialization was performed. Tests use synthetic
material and temporary stores. The KELD vendored release snapshot is unchanged.

## Open Questions

None for this source relocation. Auth service relocation is separately tracked
in `../auth-foundation/MIGRATION.md`.
