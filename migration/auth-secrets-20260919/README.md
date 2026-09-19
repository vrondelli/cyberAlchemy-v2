# Body War checkpoint and Auth/secret relocation

Date: 2026-09-19. Authority effect: none. No push performed.

## Checkpoints retained in DomainSpec-core

- `projects/body-war-v2`: standalone local commit `b732367` (1,831 files).
- `projects/body-war-v2-auth-mfa`: parent commit `c952738f7` (455 files).
- No new gitlink was added. The parent's unrelated 10,000 staged removals were
  unchanged, verified by identical staged name/status SHA-256 before and after:
  `c07ed77402ecd4a5ba9f70c2b44627979f15b2f096a5591f7cda5bbafb4356aa`.

## Source relocation

See [Auth migration](../../auth-foundation/MIGRATION.md) and
[secret-management migration](../../secret-management/MIGRATION.md).
`source-manifest.json` records original source hashes before integration edits.
This is an import receipt, not an instruction to freeze these packages forever.
The focused relocation test audits these initial bytes; deliberate later source
evolution should replace that snapshot check with the successor's own evidence,
not silently rewrite the import receipt.

All 2,915 files were copied and hash-verified. Build/dependency caches, operator
runtime state, keys and databases were excluded. Historical opaque payloads
were retained locally and ignored by Git; their optional absence in a clone is
not a missing runtime dependency. Four credential-pattern matches in historical
blobs were inspected: the same library parser checks a PEM marker string, not
private-key material. This targeted scan is not a complete security audit.

## Verification

- Secret-management: 31 tests passed again with the original source directory
  absent from DomainSpec-core; launcher `--help` also passed.
- Auth authorization service: 21 Rust unit/integration tests passed, locked
  build entirely from the copied local crates.
- Auth HTTPS: 19 tests passed after rebuilding its Rust bridge locally.
- KELD: 93 integration tests passed with the local Auth dependency.
- Relocation checks: four passed (hashes, package/lock binding, Auth source
  imports, Git exclusions); 18 changed JavaScript files passed syntax checks.
- Session-core PostgreSQL tests: blocked by missing private runtime config in
  the new checkout. No credentials copied; no live database tests performed.
- Historical freeze/reproduction scripts: not revalidated; they retain old
  layout/provenance assumptions. Full independence is not claimed.

CyberAlchemy migration changes remain uncommitted. Body War commits are local.
No container restart, identity rotation, secret reveal or vault change occurred.

## Open Questions

Auth service cutover needs owner scheduling before retiring the old runtime.
See the Auth migration note for the precise remaining boundary.
