# G02 r2 private WSL cold copy

Status, 2026-10-03: **archive copied and verified; no VPS reclaim**.

The exact terminal G02 r2 compressed campaign archive and its sidecar were
copied from the approved VPS `/opt/are/evolution-runtime/archives/` to the
private WSL directory
`/home/vlad_/are-benchmark-archive/g02-product-replication-r2-vps-cold-20261003/`.
The rsync process exited successfully with one 20,454,719,665-byte archive
transferred and zero source files deleted. The local archive is mode `0600`.
Its freshly computed SHA-256 is
`f080561f09ffcff48ee1712ae20ad8aa3c254792fe7ff248b09cb48152d73a25`,
matching the frozen VPS sidecar's expected size and hash. The copied
sidecar has SHA-256
`597a0b0f332ba99de56c7ac83d3cf108300ea57320e501cfc671afe1887e89e2`,
identical to the VPS sidecar.

A full local streaming zstd/tar listing using Python 3.14 read **182,446
members** without error and found **24 top-level run roots**, the same count
as the sidecar's `source_names`. This is archive readability evidence, not
a member-by-member full restore comparison. The VPS archive, sidecar, and
live run roots remain intact; this operation freed **zero** VPS disk bytes.
It made no model call and opened no benchmark labels or scores.

A subsequent read-only selected-member restore streamed the WSL archive again,
extracted `ARE-SETTLEMENT.json` in memory from **24/24** sidecar-named roots,
and SHA-256-compared each restored file to its exact live VPS counterpart:
**24/24 matched, zero missing or mismatched**. The full second stream again
read 182,446 members. A VPS file-mtime census found zero regular files in the
24 live roots newer than the VPS archive. The live roots occupy approximately
22,815,129,600 allocated bytes. These checks strengthen recoverability but
do not prove full tree equivalence; mtime alone cannot establish file identity.

A later full read-only comparison used
[`compare-g02-cold-live-r1.py`](../research/g02-product-r4/compare-g02-cold-live-r1.py)
to hash every regular file, record every directory and symlink target, and
compare canonical per-root manifests between the WSL archive and VPS live
roots. **24/24 roots matched exactly on these fields**: both sides had
182,446 members comprising 147,982 regular files, 22,756 directories, and
11,708 symlinks; regular-file content totaled 22,444,387,422 bytes on each
side. There were no missing, extra, or changed members in this comparison.
The verifier rejects unsupported archive member types and files that change
during their individual live read. It does not compare ownership, timestamps,
permissions, or a concurrent whole-tree snapshot, so this is content/tree
identity evidence rather than a complete operational restore test.

The verified WSL copy improves recoverability and creates a concrete
retention option, but does **not** authorize deletion of either VPS copy,
settle the archive retention period, or support a G02 superiority claim.

## Open Questions

- What exact retention and restore test should precede any separately
  authorized removal of the redundant VPS archive or live r2 roots?
- What retention period, restored-run smoke test, and final no-active-user
  check should precede any separately authorized VPS reclaim?
