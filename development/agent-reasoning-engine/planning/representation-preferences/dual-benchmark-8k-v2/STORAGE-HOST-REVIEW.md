# Verified backing-volume guard review

Approved **offline** at the exact hashes in [STORAGE-HOST-REVIEW.json](STORAGE-HOST-REVIEW.json). No live approval is granted. The earlier blocked review is preserved as [STORAGE-HOST-REVIEW-R1.json](STORAGE-HOST-REVIEW-R1.json).

The repaired guard requires the bound D: drive, a unique canonical D-root drvfs mount, and unambiguous 9p `aname=drvfs` / `path=D:\` metadata. Guest capacity must come from an unambiguous covering mount on Ubuntu root's ext4 device/source. Synthetic contradictory metadata, duplicate metadata, tmpfs, alternate devices and stacked guest mounts now reject.

The unchanged 12GiB host and 8GiB guest floors use bigint available-byte measurements. Optional evidence-growth reservation adds to both. Failure to establish identity or measure never substitutes C: or guest capacity for the backing volume. Eleven guard tests and 26 packet successor integration tests pass (37 total); no actual storage measurement, registry query, provider or network call occurred in this review.

The registry-to-VHDX mapping remains coordinator-verified evidence bound through the correction document. This is a trusted frozen mapping, not automatic registry refresh. Historical C: guards remain historical evidence and do not establish D: admission.

## Open Questions

Live execution remains held until current D: capacity meets the unchanged floor plus evidence growth and a reviewed successor freeze includes guard, binding and provenance. Reported D: capacity is below the floor. No threshold relaxation was authorized. [STORAGE-HOST.md](STORAGE-HOST.md) owns remaining capacity and integration questions.
