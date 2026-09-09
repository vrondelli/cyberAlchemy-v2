---
document_id: domainspec-v2-path-and-evidence-risk/v1
status: current
authority_effect: none
visibility: private
updated_at: 2026-08-30
---

# Path and Frozen-Evidence Risk

The active runtime baseline binds exact files under `projects/domainspec-v2/`. Files elsewhere in the repository
also contain that literal path; the exact current list and occurrence counts are generated in
[`../path-consumers.json`](../path-consumers.json).

A direct move would therefore change more than location:

- historical receipts and manifests could stop resolving their named sources;
- baseline digests could no longer be reproduced from the declared paths;
- validators, package scripts, examples, and documentation links could point at absent targets;
- currently dirty source bytes could be mistaken for migration-authored changes; and
- a partial rewrite could create two competing “canonical” homes.

## Required controls

1. Freeze one exact source snapshot and distinguish pre-existing dirty bytes from migration bytes.
2. Select the migration mode through the repository-extraction Decision Gate.
3. Create one successor path map and compatibility policy.
4. Rebind active consumers and validate them before changing the source location.
5. Mint a new baseline identity for moved authority-bearing or executable bytes.
6. Preserve old frozen evidence in place or through a content-addressed, validator-supported archive.
7. Delete nothing until the successor baseline and all reachable consumers pass.

## Open Questions

The owner must choose whether frozen evidence remains at its current path or is imported into a separately
addressable archive. That choice determines whether source deletion can ever be safe.
