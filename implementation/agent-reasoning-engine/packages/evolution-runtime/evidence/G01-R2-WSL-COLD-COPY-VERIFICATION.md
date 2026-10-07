# G01 r2 private WSL cold-copy verification

Status: **copy verified; VPS source archive and raw run retained**. Verification completed 2026-09-29 02:13 UTC. This is a private storage receipt, not permission to remove either VPS copy or a benchmark result.

The exact VPS archive `/opt/are/evolution-runtime/archives/g01-product-replication-r2-9c032894c54ca5ce3e1b399bb58cbe605a772d219c42e75be388074cf0f90862.tar.zst` was copied non-destructively to `/home/vlad_/are-benchmark-archive/g01-r2/g01-product-replication-r2-9c032894c54ca5ce3e1b399bb58cbe605a772d219c42e75be388074cf0f90862.tar.zst` on WSL ext4, not `/mnt/c`. The destination directory is mode `0700`; the archive is mode `0600`. Both source and destination are **6,056,098,698 bytes**, with SHA-256 `9c032894c54ca5ce3e1b399bb58cbe605a772d219c42e75be388074cf0f90862`.

The WSL copy passed local `zstd -t` and a complete decompressed `tar -tf` traversal. Two members were restored under `/home/vlad_/are-benchmark-archive/g01-r2/restore-check/` and their hashes matched the live VPS originals:

| Restored member | SHA-256 |
| --- | --- |
| `g01-product-replication-r2/CAMPAIGN-FREEZE.json` | `b43f572ddd4a4d91e6315ed48f694ddc24a5f8a9e8da9266e2d39976fac181b6` |
| `g01-product-replication-input-r4/DEFINITION.json` | `bb5cb1fb1414b694f966d0df3f0cdcae7f64f4e4316801cad0962f9b5c08574e` |

WSL had about 907 GiB free after the copy. The VPS still had about 4.9 GiB free, and read-only checks confirmed that the r2 archive and raw campaign root were both still present. No VPS evidence was deleted. A local unpackaged `zstd` executable was used only for verification; it is not a new project runtime dependency.

## Open Questions

- Does the owner approve removing exactly the verified VPS r2 raw root and content-addressed archive now that the independent WSL copy and restore check passed? No removal is inferred from this copy receipt.
- After any approved space recovery, what headroom and retention reserve should be required before freezing and dispatching G01 r4?
