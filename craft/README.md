# Craft source consolidation

This is an additive local copy of the DomainSpec v2/Craft product lineage,
created on 2026-09-19 at the owner's request. It is not a release or an authority
switch. Original files in `domainspec-core` have not been removed or rewritten.

- Product source, definitions, formalization, development and implementation:
  [projects/domainspec-v2](projects/domainspec-v2/README.md).
- Current work frontier and unresolved product choice:
  [execution status](projects/domainspec-v2/development/authoring-to-runtime-v1/EXECUTION-STATUS.md).
- Copy scope, findings, validation and remaining dependency work:
  [migration audit](migration-audit/AUDIT.md).
- Exact source/destination paths and byte identities:
  [source manifest](migration-audit/source-manifest.json).

The `projects/domainspec-v2` and `toolchains` hierarchy is intentional: it keeps
the existing internal relative source bindings resolvable while the external
workspace consumers are audited. Package names and immutable historical IDs
have not been renamed. The parent workspace manifests under `support/core`
are provenance copies, not a new active workspace configuration.

Do not delete the original checkout based on this copy. See the audit's
remaining work before selecting this location as the active dependency.
