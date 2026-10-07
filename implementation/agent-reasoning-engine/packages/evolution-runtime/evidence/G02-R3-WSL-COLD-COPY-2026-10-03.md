# G02 r3 private WSL cold copy

Status, 2026-10-03: **archive copied and verified; no VPS reclaim**.

The exact terminal G02 r3 compressed campaign archive and its sidecar were
copied from `/opt/are/evolution-runtime/archives/` on the VPS to the private
WSL root
`/home/vlad_/are-benchmark-archive/g02-product-replication-r3-vps-cold-20261003/`.
The tarball has **10,283,234,182 bytes** and SHA-256
`305838d4a842d8590aecee7ec6fbb25a8f8adb0c4d6b915931a7d3bca81cd76b`,
matching the frozen VPS sidecar's archive size and digest. The copied
sidecar's SHA-256 is
`00db07f0af47b5eada6ebd635cebf5d904348ec9a02e2f79e7c35633a5338c0b`,
identical to the VPS sidecar. A full local streaming zstd/tar listing read
**100,060 members** without error using Python 3.14's `compression.zstd`
and `tarfile`; this is a readability check, not a full member-by-member
restore comparison. One named live r3 run root was rechecked as present on
the VPS after transfer.

A subsequent read-only selected-member restore streamed the WSL archive again,
extracted `ARE-SETTLEMENT.json` in memory from **12/12** sidecar-named roots,
and SHA-256-compared each restored file to its exact live VPS counterpart:
**12/12 matched, zero missing or mismatched**. The full second stream again
read 100,060 members. A VPS file-mtime census found zero regular files in the
12 live roots newer than the VPS archive. The live roots occupy approximately
10,277,224,448 allocated bytes. These checks strengthen recoverability but
do not prove full tree equivalence; mtime alone cannot establish file identity.

A later full read-only comparison used
[`compare-g02-cold-live-r1.py`](../research/g02-product-r4/compare-g02-cold-live-r1.py)
to hash every regular file, record every directory and symlink target, and
compare canonical per-root manifests. **11/12 roots matched exactly**. The
remaining `g02-cross-layer-pr3-elem-5c001746` archive root is a strict
superset of its live VPS root: 8,098 archive-only members (6,846 files,
1,250 directories, two symlinks), mainly under `sources/session/base`; there
were **zero live-only members and zero changed common members**. Across all
12 roots the archive had 100,060 members (81,184 files, 13,012 directories,
5,864 symlinks) versus 91,962 live members (74,338 files, 11,762
directories, 5,862 symlinks). Every live member compared is therefore
represented identically in the archive on the checked fields. The verifier
does not compare ownership, timestamps, permissions, or a concurrent
whole-tree snapshot, so a restored-run smoke test remains separate.

The VPS compressed archive and all live r3 run directories remain intact.
This operation used no model calls, opened no evaluator labels, and freed
**zero** VPS disk bytes. Reclaim of any live directory or VPS archive remains
a separate exact destructive-effect and retention decision after additional
restore and active-user checks; this cold copy alone does not authorize it.

## Open Questions

- What retention period, restored-run smoke test, and final no-active-user
  check should precede any separately authorized VPS reclaim?
