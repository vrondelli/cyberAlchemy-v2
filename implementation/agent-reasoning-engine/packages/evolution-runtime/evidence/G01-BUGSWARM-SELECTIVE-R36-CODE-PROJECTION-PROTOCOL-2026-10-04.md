# G01 BugSwarm selective-GLM r36 — code-only projection protocol

Status: prospectively fixed, network-free materialization protocol for the 24
archives admitted by r35.

## Objective

Materialize deterministic failed-source roots containing only bounded regular
Python or Java source members. Produce one Git index and one path/size/SHA-256
manifest per slot so the unchanged ARE and graph-r2 rankers can consume the
population without opening labels or passing source.

The sole archive input is the r35 result at SHA-256
`5ef1dfeeb71d4df32d166ffab322aabdd9fda32e592ab4e9a7c8b93a27b3e1ff`.

## Frozen projection rule

- Reverify the r35 result, each case identity, archive byte count, archive
  SHA-256, expected tar root, and 24/24 admission before materialization.
- For Python slots, project only regular `.py` members. For Java slots, project
  only regular `.java` members.
- Exclude members over 1 MiB, any path containing `.git`, absolute paths,
  backslashes, `..`, duplicate relative paths, and every non-regular member.
- Read at most 1 MiB plus one byte from any eligible member. The extracted byte
  count must equal the tar declaration. Per-slot projected bytes must not exceed
  64 MiB.
- Require projected file and byte totals to exactly reproduce the r35 archive
  inspection counts.
- Write files with mode `0600` below a new private per-slot root. Do not preserve
  or execute archive metadata, modes, links, or hooks.
- Initialize an isolated Git repository and force-add exactly the projected
  paths. Do not commit or contact a remote.
- Write a sorted JSONL manifest of relative path, byte count, and file SHA-256.
  Bind each manifest and its deterministic path/hash tree in the case receipt.

The gate passes only if all 24 roots reproduce their archive inspection counts,
all Git indexes equal their manifests, and the terminal result accounts for all
files and bytes.

## Boundaries

R36 makes no network, label, diff, passing-tree, score, GLM, VPS, publication,
or superiority operation. A passing projection gate proves only the integrity
and availability of the failed-source input roots for later source-only ranking.

## Open Questions

- What are the unchanged ARE and graph-r2 top-1 predictions on these roots?
- How many slots trigger the frozen disagreement router before gold access?
- Does the later adaptive multi-view retrieval hypothesis improve candidate
  reach without destroying the selective router's efficiency advantage?
