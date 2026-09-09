---
document_id: domainspec-v2-project-inventory/v1
status: current
authority_effect: none
visibility: private
updated_at: 2026-08-30
---

# DomainSpec v2 Project Inventory

This package is the non-authoritative read model for the current
`projects/domainspec-v2/` tree and its migration into CyberAlchemy v2. It exists so the project can
be understood, compared, and migrated without relying on agent memory or silently losing frozen evidence.

The inventory includes every Git-tracked path and every non-ignored untracked path. Each present file is
identified by byte count and SHA-256 digest. Tracked paths that are currently absent remain visible as
missing entries. Ignored dependency caches, build output, temporary files, and other ephemeral paths are
excluded explicitly; they are environment material, not migration inputs.

## Package contract

- [`index.json`](index.json) is the machine-readable inventory index.
- [`index.md`](index.md) is its generated human projection.
- [`source-manifest.json`](source-manifest.json) is the exact source ledger.
- [`path-consumers.json`](path-consumers.json) records files outside the source tree that contain its literal path.
- [`entries/`](entries/) explains the project surface, layer mapping, risks, contradictions, and readiness.
- [`schema.md`](schema.md) defines the inventory semantics.
- [`tags.md`](tags.md) owns the local tag vocabulary.
- [`log.md`](log.md) is the append-only inventory history.
- [`scripts/build-inventory.mjs`](scripts/build-inventory.mjs) reproduces and validates generated artifacts.
- [`snapshot-inputs/`](snapshot-inputs/) contains digest-bound raw Git enumeration evidence captured outside
  the container, because the Node 26 runtime image intentionally does not ship Git.

## Reproduce

Run through the repository-owned Node 26 environment with one explicit snapshot timestamp:

```text
node cyberAlchemy-v2/inventory/domainspec-v2/scripts/capture-git-inputs.mjs --captured-at 2026-08-30T00:00:00Z
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- node ../../../cyberAlchemy-v2/inventory/domainspec-v2/scripts/build-inventory.mjs --captured-at 2026-08-30T00:00:00Z --write
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- node ../../../cyberAlchemy-v2/inventory/domainspec-v2/scripts/build-inventory.mjs --captured-at 2026-08-30T00:00:00Z --check
```

The first command only captures Git's file list, working-tree status, tool version, and repository HEAD. It is
the narrow host adapter; all semantic generation and validation run in Node 26. The timestamp is explicit so
repeated builds over unchanged bytes are identical. A new source snapshot uses a new timestamp and produces a
new manifest digest.

## Authority boundary

Inventory evidence does not make its proposed layer map canonical. It grants no authority to copy, move,
delete, promote, publish, release, or deploy any source. Canonical documents and implementation bytes remain
owned by their declared authority surfaces until a migration decision and exact successor baseline are accepted.

## Open Questions

- Which repository-extraction mode will the owner select: governed adoption, staged successor migration,
  or direct relocation?
- Which historical development evidence must remain addressable forever at its original path?
- What is the accepted successor baseline ID after migrated paths and consumers are rebound?
