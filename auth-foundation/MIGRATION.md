# Auth Foundation source relocation

Source home: `cyberAlchemy-v2/auth-foundation`.

Imported on 2026-09-19 from `domainspec-core/projects/auth-foundation`.
The import preserved 2,889 files (362,868,023 bytes), including the three
uncommitted authorization implementation/test changes. Every copied file was
SHA-256 verified before any relocation edits. See
`../migration/auth-secrets-20260919/source-manifest.json` for original hashes.

Definitions, generated source, contracts, tests and historical evidence retain
their original bytes and authority status. Relocation is not new admission,
security approval, validation of historical receipts, or production readiness.
Opaque historical snapshots and deployment archives were preserved locally but
are ignored by Git; they are not required to import or build the source.

## Consumer cutover

KELD's session-core dependency and runtime staging, AlchLang's Auth imports,
and ARE's secret-management helpers now resolve inside CyberAlchemy.
Dependency caches must be installed from the package lockfiles in this checkout;
Rust executables must be rebuilt here. No dependency cache or old executable was
copied from DomainSpec-core.

## Remaining runtime boundary

The original Auth directory has **not** been deleted. Running HTTPS proxy and
Keycloak containers still bind-mount its configuration, TLS material, themes,
and security extension. Operator state, keys and databases were not copied.
Source consumers now point here, but live/rehearsal launchers need separately
provisioned runtime configuration before use. Do not run setup as an implicit
migration: it may create or replace identity/security state.

The session-core test suite currently loads the old deployment's private test
database configuration by relative location. It cannot run in a clean source
checkout without explicit test provisioning. No live database test was run as
part of this relocation.

Historical validation/freezing scripts also encode the old umbrella layout and
frozen `projects/...` identities. Those records have not been bulk rewritten or
re-certified. A source copy is not proof that every historical reproduction
command is portable. DomainSpec source is available under
`../craft/projects/domainspec-v2`; reproduction needs an explicit local-layout
binding before the old repository can be retired completely.

## Open Questions

Owner decision needed: schedule a controlled Auth service cutover, preserving
existing identities/keys/data, before removing the original runtime directory.
Historical reproduction portability is tracked here, not hidden by rewriting
frozen hashes or adding a dependency on the old checkout.
