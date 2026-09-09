---
document_id: domainspec-v2-project-inventory-schema/v1
status: canonical-local
authority_effect: inventory-only
visibility: private
updated_at: 2026-08-30
---

# Inventory Schema

## `snapshot-inputs/`

`domainspec-v2.git-snapshot-inputs/v1` binds the raw NUL-delimited output of the declared `git ls-files` and
`git status` commands to SHA-256 digests, the repository HEAD, Git version, source root, and capture time. The
Node 26 builder rejects missing inputs, digest drift, or a capture-time/source-root mismatch.

## `source-manifest.json`

`domainspec-v2.source-inventory/v1` identifies one exact source snapshot.

- `source_root` is the repository-relative tree being inventoried.
- `inclusion_rule` is Git-tracked paths plus non-ignored untracked paths.
- `exclusion_rule` excludes ignored and ephemeral paths.
- `content_digest` is SHA-256 over the canonical pretty-printed `{ "entries": [...] }` value.
- `entries` are sorted by source-relative `path`.
- `kind` is `file`, `symlink`, `missing`, or `other`.
- `sha256` hashes exact file bytes, or the UTF-8 symlink target. It is `null` for missing paths.
- `git_state` is the observed working-tree state, not an ownership or acceptance claim.
- `target_layer` and `migration_policy` are inventory classifications only.

## `path-consumers.json`

`domainspec-v2.path-consumers/v1` records non-ignored files outside the source and migration-preparation
packages that contain the literal source-root string. Inventory, successor-document candidates, and the
migration Decision Gate are excluded so their provenance references cannot recursively inflate the active
consumer count. Those preparation artifacts are validated separately. This is a relocation-risk map, not a
semantic dependency graph.

## `index.json`

`inventory.index.v0.1` is the compact lookup surface. Every entry has a stable ID, status, confidence,
authority effect, tags, and source references. Human navigation is derived in `index.md`.

## Status vocabulary

- `current`: observed in the named snapshot.
- `candidate`: proposed organization without authority effect.
- `open`: unresolved contradiction or gap.
- `blocked-on-decision`: mechanically ready only after an explicit owner decision.

## Validation invariants

1. Source paths and consumer paths are unique and lexicographically sorted.
2. Every present source entry has an exact byte count and digest.
3. Every missing tracked entry has null byte and digest values.
4. The manifest digest reproduces from the entries alone.
5. Generated files match the builder output byte for byte in `--check` mode.
6. Inventory classifications never imply migration, acceptance, or promotion.

## Open Questions

No schema question blocks inventory generation. A future successor baseline may add provenance bindings to
the selected migration-decision digest without changing this snapshot's bytes.
