# G01 BugSwarm guarded confirmation r48 — code-only projection protocol

Status: frozen private score-blind projection protocol.

Project each of the 24 r47 archives into an isolated root containing only `.py`
regular files from the exact failed commit. Preserve relative paths and bytes;
exclude archive metadata and `.git`; cap files at 1 MiB and each root at 64 MiB.
Create a deterministic manifest, projected-tree digest, and a fresh Git index so
later target-existence checks can use exact tracked paths.

Frozen r47 result SHA-256:
`5b1428bbf4626ce657efccca225847d2271689fe74ac9d4b92b0389ee76d8d2d`.

There are no network requests, labels, passing sources, patches, rankings, or
model calls. Any mismatch with the r47 archive inspection is terminal.

## Claim ceiling

Failed-source projection integrity only; no benchmark or superiority result.

## Open Questions

- What is the aggregate projected file and byte count?
- Do all 24 projections retain at least one gold-changed Python target?
