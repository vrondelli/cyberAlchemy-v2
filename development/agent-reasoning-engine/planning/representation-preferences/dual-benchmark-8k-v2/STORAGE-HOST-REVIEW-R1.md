# Host storage guard review

**Not approved yet.** Existing nine synthetic tests pass, but two additional synthetic counterexamples require correction:

- A 9p mount labeled D: with `aname=drvfs;path=C:\` passes. Validate the drvfs path metadata against the bound D: root, including missing or duplicate metadata.
- An output directory on tmpfs outside `/mnt` passes and its capacity substitutes for Ubuntu guest-disk space. Verify the output's covering mount belongs to the root ext4 device; reject other filesystems/devices before measurement.

The 12GiB host and 8GiB guest thresholds and optional growth reservation are preserved. Bound provenance matches the correction document. Existing missing-mount, wrong-drive, redirected-root and measurement-failure tests demonstrate no C: or guest fallback for host capacity. Exact reviewed hashes are in [STORAGE-HOST-REVIEW.json](STORAGE-HOST-REVIEW.json).

No providers, network, registry calls or real capacity measurements were used. The Windows registry mapping remains coordinator-verified evidence; this review does not independently refresh it or authorize a run.

## Open Questions

Correct both identity gaps and re-review the exact hashes before successor integration approval. Freeze the guard, verified binding and provenance; current D: headroom must independently meet unchanged reserves plus evidence growth. [STORAGE-HOST.md](STORAGE-HOST.md) owns remaining integration and capacity questions.
