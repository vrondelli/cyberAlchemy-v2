# Verified WSL backing-volume storage guard

`storage-host.mjs` is additive infrastructure; no frozen wrapper or freeze was changed. `storage-host-binding.json` records the coordinating agent's Windows Lxss registry verification of Ubuntu at `D:\WSL\Ubuntu`, virtual disk `ext4.vhdx`, and hashes the [correction provenance](cleanup-20260918/HOST-STORAGE-CORRECTION.md). This binding must itself be included in any successor source freeze. A changed registry registration requires renewed verification and a new binding; the Linux guard cannot independently query the Windows registry.

The guard requires an explicit verified binding, exact D: drive agreement with the Windows base path, an existing canonical `/mnt/d` directory, and one matching root mount in `/proc/self/mountinfo`. The mount source must identify D: and the filesystem must be drvfs or 9p with drvfs metadata. An ordinary guest directory at `/mnt/d`, a C: mount, missing mount, bind subtree, duplicate or redirected directory fails closed. Measurements use bigint `statfs` available blocks; no fallback to C: or guest capacity substitutes for host capacity.

Admission retains 12 GiB host and 8 GiB guest reserves. Optional nonnegative evidence-growth bytes are added to both required capacities. Failure receipts retain both actual capacity measurements and the binding provenance; inability to verify or measure fails before admission. Guest output resolves to an existing directory ancestor, rejects `/mnt` host output locations, and requires one deepest covering ext4 mount with the same device/source as the Ubuntu root mount. Duplicate drvfs metadata or ambiguous guest mounts fail closed.

Eleven synthetic tests pass, covering thresholds, reservations, missing and wrong mounts, registry/drive mismatch, provenance drift, redirected directory, measurement failure and supported Windows path forms. No network, root, provider or live execution was performed. The actual local mount schema was inspected read-only to construct the parser fixture. The previous wrappers' C: checks remain preserved historical evidence and are not corrected retrospectively.

## Open Questions

Successor wrappers still need to adopt this guard and bind the verified metadata in a separately reviewed freeze. Current D: capacity and any reclamation from TRIM must be measured independently before live admission. This module does not perform TRIM, compaction, cleanup or automatic registry refresh.
