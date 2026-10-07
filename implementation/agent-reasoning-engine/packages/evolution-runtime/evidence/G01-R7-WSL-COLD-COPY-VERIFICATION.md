# G01 r7 private WSL cold-copy verification

Status: **non-destructive copy verified**, 2026-09-29. This is private storage evidence, not a benchmark result or permission to remove either VPS source copy.

The existing VPS archive `/opt/are/evolution-runtime/archives/g01-product-replication-r7-59d9bf27620441fa2be59da37273a9969de7a7530f93a36fd6cbb8ba66783b14.tar.zst` was copied to WSL ext4 at `/home/vlad_/are-benchmark-archive/g01-r7/g01-product-replication-r7-59d9bf27620441fa2be59da37273a9969de7a7530f93a36fd6cbb8ba66783b14.tar.zst`. The destination directory is mode `0700`, the archive mode `0600`, and the local archive is 591,181,469 bytes with the expected SHA-256 `59d9bf27620441fa2be59da37273a9969de7a7530f93a36fd6cbb8ba66783b14`.

WSL lacked the standalone `zstd` command, so the installed Node 26 Zstandard decompressor streamed the copied archive into `tar`. A full archive traversal returned **200,144 members**, and extracting `g01-product-replication-r7/CAMPAIGN-FREEZE.json` to stdout yielded SHA-256 `258164a3e34ce406f6074c6ec1fa7aff5130976da66e66b05d4c0ae600f6576a`, matching the recorded frozen campaign. No archive member was written outside the copy during verification. The original VPS archive and live raw campaign root remain intact; this copy did **not** increase VPS free space.

## Open Questions

- Which non-destructive storage/streaming arrangement will preserve a new G01 live run and its raw archive while the VPS root has about 2.1 GiB free?
- If space recovery later requires deleting an exact prior VPS copy, which exact source object and restore proof will the owner approve? This verification alone authorizes no deletion.
