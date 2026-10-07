# Craft source consolidation

This began as an additive local copy of the DomainSpec v2/Craft product lineage
on 2026-09-19. On 2026-09-20 the owner selected it as the active local source
for Alch and repository routing. This is not a release or product-authority
admission, and historical source evidence has not been rewritten.

- Product source, definitions, formalization, development and implementation:
  [projects/domainspec-v2](projects/domainspec-v2/README.md).
- Current work frontier and unresolved product choice:
  [execution status](projects/domainspec-v2/development/authoring-to-runtime-v1/EXECUTION-STATUS.md).
- Copy scope, findings, validation and remaining dependency work:
  [migration audit](migration-audit/AUDIT.md).
- Active-consumer cutover, validation, and bounded residue:
  [cutover report](migration-audit/CUTOVER-2026-09-20.md).
- Exact source/destination paths and byte identities:
  [source manifest](migration-audit/source-manifest.json).

The `projects/domainspec-v2` and `toolchains` hierarchy is intentional: it keeps
the existing internal relative source bindings resolvable while the external
workspace consumers are audited. Package names and immutable historical IDs
have not been renamed. The parent workspace manifests under `support/core`
are provenance copies, not a new active workspace configuration.

The active resolvers do not require the original checkout. Deleting any recovery
copy remains a separate operation and was not authorized by this cutover.
