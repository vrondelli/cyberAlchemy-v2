# VPS benchmark storage and reclaim inventory — read-only

Observed 2026-10-04 UTC on `root@187.77.163.194`. This is a bounded
inventory, **not** deletion authority or proof that every VPS byte has been
classified. All commands were read-only; no mount, file, container, or
provider state was changed. Recheck sizes, hashes, mounts, active users and
service ownership immediately before any separately routed removal.

## 11:24 UTC G02 archive pre-reclaim check — no removal

The two exact terminal G02 compressed archives were freshly hashed on both
the VPS and private WSL storage. R2 is **20,454,719,665 bytes**, SHA-256
`f080561f09ffcff48ee1712ae20ad8aa3c254792fe7ff248b09cb48152d73a25`;
r3 is **10,283,234,182 bytes**, SHA-256
`305838d4a842d8590aecee7ec6fbb25a8f8adb0c4d6b915931a7d3bca81cd76b`.
For each, the independently computed VPS and WSL digests match. Their VPS
and WSL sidecars also match at SHA-256
`597a0b0f332ba99de56c7ac83d3cf108300ea57320e501cfc671afe1887e89e2`
(r2) and `00db07f0af47b5eada6ebd635cebf5d904348ec9a02e2f79e7c35633a5338c0b`
(r3). The sidecars name 24 r2 and 12 r3 run roots under
`/opt/are-benchmark-runs`; **36/36** were present on the VPS. The r2 campaign
metadata directory under evolution-runtime is absent, but this is separate
from the sidecar-named run roots and archived pair data.

After hashing finished, bounded `fuser` checks reported no open process on
either exact VPS archive, and `findmnt` reported no mount using the archive
directory. This does not rule out an unobserved future consumer. The matching
digests bind these files to the prior full local streaming listings and
content/tree comparison receipts linked below; a fresh `zstd -t` was not run
because the WSL host lacks that executable. The root filesystem then had
about **1.50 GB available**. No file was removed. An exact owner decision on
retention/removal remains pending, followed by a final immediate pre-delete
identity and consumer check if approved.

## 08:06 UTC read-only refresh and priority

A new SSH check found `/` with **1,670,361,088 bytes available**,
`/tmp` with **1,495,879,680 bytes available** and **6,885,937,152 used**,
and `/dev/shm` with **4,207,955,968 bytes available** and
**4,173,856,768 used**. `MemAvailable` was **1,012,994,048 bytes**, with no
swap. No process matching the bounded `are-g01|are-g02|are-g03|glm` search
appeared; this does not prove absence of open files, other names, or work in
another mount namespace. The archive directory remained **44,535,566,336
allocated bytes**, and `/opt/are-benchmark-runs` remained **61,351,870,464
allocated bytes**. There were still **eight** r15 and **20** r17 G01 overlay
mount targets; the lower residencies remain protected by those mounts.

The first root-disk reclaim review should be the two terminal G02 r2/r3 VPS
compressed archives, totaling **30,737,953,847 bytes**, because their exact
private WSL copies passed the linked cold-copy checks below. This is a
*candidate*, not deletion authorization: recheck VPS/WSL hashes, restore
policy, consumers, and retention before an exact decision. Keeping the live
VPS run trees while removing only verified duplicate VPS archives would
preserve local immediate access; a later, separately checked live-tree
retirement could recover more disk. Neither step may discard the sole raw
answer, receipt, or failure-log copy.

The large G02 run-root trees deserve the next audit. For example,
`/opt/are-benchmark-runs/g02-cross-layer-pr3-elem-94356ef0` measured
**2,612,477,952 allocated bytes**: `dsh-control/sources` and `sources`
together account for about **2.59 GB**, while `evidence` is about **5.27 MB**.
This establishes that two checkout trees dominate this example, not that its
source trees or evidence can be removed. The existing G02 r2 full-member
comparison covers all 24 archived roots, and r3's archive contains all live
members on the checked fields; no current active-consumer or restored-run
smoke test was performed in this refresh.

Docker's read-only accounting reported 62 images/13 active and **4.438 GB
estimated reclaimable images**, 471 containers/10 active, and four active
volumes. These are not exact safe deletion targets. A blanket Docker prune
remains inappropriate on this mixed host. For the **memory** floor, the
approved mount-free r15 `/tmp` scratch is the first exact recheck target;
the two `/dev/shm` lower residencies cannot be reclaimed while their overlay
views remain mounted. Root-disk archive cleanup and tmpfs/memory cleanup
solve different constraints and must be measured separately afterward.

## Current capacity and the critical distinction

At the final check, root `/dev/sda1` had **1,674,473,472 bytes available**
of 207,071,854,592; `MemAvailable` was **1,066,827,776 bytes** of
16,763,629,568; `/dev/shm` used **4,173,856,768 bytes** of 8,381,812,736.
The provisional G01 4 GiB `MemAvailable` floor remains unmet.

**Correction at 06:21 UTC:** a fresh `findmnt`, `stat` device-ID and
byte-precise `df` check established that `/tmp` is a separate **tmpfs**,
not the root filesystem. It has 8,381,816,832 bytes total,
6,885,937,152 used and 1,495,879,680 available. The root filesystem has
1,672,749,056 bytes available. The earlier sentence classifying `/tmp` as
root disk was wrong; the measured `/tmp` used bytes were already the same.
The approved r15 `/tmp` scratch therefore has *potential tmpfs/memory*
benefit, not root-disk benefit. Actual `MemAvailable` must be measured after
any separately admitted reclaim, and the still-mounted residency remains
unsafe to remove. Vlad's exact approval and target scope are unchanged.

## Classified candidates

| Exact VPS area | Measured allocated bytes | Recovery / dependency | Present disposition |
| --- | ---: | --- | --- |
| `/tmp/are-g01-r15-r2-scratch-layout-probe-r1` | 1,734,295,552 | Exact WSL cold root and prior 171,944-file checksum/restore receipt; no mount or matching process in this bounded check | Approved exact target; fresh pre-delete verification and separate admitted destructive route still required. Potential tmpfs/memory benefit only; see correction above. |
| `/dev/shm/are-g01-r15-r2-single-checkout-residency-r1` | 1,957,998,592 | WSL copy and pinned regenerable checkouts; **eight active overlay lowerdir references** | Do not remove until exact terminal-overlay teardown, clean mount audit, and fresh cold-copy/active-user checks. Potential tmpfs-memory benefit only after safe teardown. |
| `/dev/shm/are-g01-r16-r2-single-checkout-residency-r1` | 1,841,606,656 | **20 active overlay lowerdir references** from r17; a fresh WSL cold copy passed full checksum comparison below; not in the exact reclaim approval | Do not remove. Separate terminal-overlay teardown and authority decision required. |
| `/dev/shm/are-g01-r16-source-caches-r1` | 361,521,152 | Source cache; dependency/cold-copy status not established here | Retain pending identity and consumer audit. |
| `/opt/are/evolution-runtime/archives/g02-product-replication-r2-*.tar.zst` | 20,454,719,665 | [WSL cold-copy and full-member verification](G02-R2-WSL-COLD-COPY-2026-10-03.md) | Large *potential* VPS duplicate; no deletion approval and no fresh source/hash check. |
| `/opt/are/evolution-runtime/archives/g02-product-replication-r3-*.tar.zst` | 10,283,234,182 | [WSL cold-copy and archive/live-tree verification](G02-R3-WSL-COLD-COPY-2026-10-03.md) | Large *potential* VPS duplicate; no deletion approval and no fresh source/hash check. |
| `/opt/are/evolution-runtime/archives/g01-product-replication-r2-*.tar.zst` | 6,056,098,698 | [WSL cold-copy verification](G01-R2-WSL-COLD-COPY-VERIFICATION.md) | Potential duplicate; retain until exact review of active consumers and recovery policy. |
| `/opt/are/evolution-runtime/archives/g01-product-replication-r1-*.tar.zst` | 6,590,063,389 | Cold-copy status not established in this audit | Retain. |
| `/opt/are/evolution-runtime/g01-product-replication-r2` and `r3` | 7,214,383,104 and 7,219,339,264 | Live/extracted campaign trees; archive equivalence and consumers not established here | Retain. |
| `/opt/are-benchmark-runs` | 61,351,870,464 | Many G02 run/checkouts; archive equivalence and live consumers unverified | High-priority *audit*, not a deletion candidate yet. |
| `/var/lib/containerd` | 17,028,177,920 | Live container service store | Do not remove manually. Docker reports 4.438 GB reclaimable images, but this is an estimate, not an approved prune set. |
| `/root/.cache/trivy` | 1,407,729,664 | Security scanner cache; consumer policy not checked | Low-priority possible rebuildable cache; no removal approval. |

### Follow-up overlay dependency audit

A fresh route call for Vlad's exact reply, “Approve exact VPS reclaim,” with
both approved paths and all stated conditions still returned
`selection.no-match`. Relabeling that reply as an inferred implementation
objective did not resolve the route; this is a genuine route gap, not missing
owner consent. No approved r15 target was deleted.

Read-only `/proc/self/mountinfo` inspection enumerated **eight** r15 views:
control/candidate × base/work for tasks 01–02 under
`/tmp/are-g01-product-replication-r15-source`. It enumerated **20** r17
views with the same four-view pattern for tasks 01–05 under
`/tmp/are-g01-product-replication-r17-source`, using the r16 lower residency.
The [r15 terminal note](G01-R15-TERMINAL-NOTE.md) binds both attempted
source views to verified WSL archives, and the [r17 terminal note](G01-R17-TERMINAL-NOTE.md)
does likewise for all five attempted pairs. A process-name and running-service
check found no matching G01 runner, and `fuser` on one r15 and one r17 view
showed only the kernel mount. These are bounded observations, **not** an
all-28 open-file/mount-namespace audit or permission to unmount.

At the initial audit, the WSL `g01-r16-r2-single-checkout-residency-r1`
directory was only 16 KiB of receipts. A subsequent source-only archival
step copied the exact 24-checkout lower tree from VPS to
`/home/vlad_/are-benchmark-archive/g01-r16-r2-single-checkout-residency-r1/checkout-cold-20261004/`.
The transfer exited zero; a separate `rsync -a --checksum --dry-run --delete`
comparison reported **zero differing/missing/extra paths**. The WSL copy
contains 24 task directories and 165,076 regular files, with 2,026,373,120
allocated WSL bytes and 1,385,772,035 logical transferred-file bytes.
All 24 copied Git `HEAD` and `HEAD^{tree}` identities match the pinned
`RESIDENCY-PROBE.json` rows. This verifies a recoverable r16 lower tree;
it does not validate unmounting, authorize deletion, or alter the terminal
r17 result. The r15 scratch and residency WSL directories occupy roughly
1.7 and 2.0 GB, with historical checksum receipts. If the **two approved r15
targets** could both be safely removed, their combined 3,692,294,144 bytes
of tmpfs allocation plus the observed 1,066,827,776 `MemAvailable` would
nominally exceed the 4 GiB floor by 464,154,624 bytes. The r15 residency is
still mount-referenced and not eligible now. Separately, if **both lower
residencies** could be safely removed, their combined 3,799,605,248 bytes
plus that observed available memory would nominally exceed the floor by
571,465,728 bytes, but r16 has no reclaim approval. These are capacity
estimates only: actual memory accounting, caches and other users can change.
Removing only either lower residency would remain below the 4 GiB floor
under the same arithmetic.

Other measured context: `/tmp` uses **6,885,937,152 bytes** of tmpfs, including
G01/G02 source caches beyond the exact approved tree; `/dev/shm` totals
**4,173,856,768**. The benchmark archive directory is
**44,535,566,336** bytes. Docker reports 62 images/13 active, 471
containers/10 active, and four active local volumes; never run a blanket
`docker system prune` against this mixed production/benchmark host. The
`/opt/are-benchmark-runs` top entries include nine ~2.5–2.6 GB G02
cross-layer element trees, but their exact redundancy is not proven.

## Safe sequencing for a future reclaim

1. Route the exact destructive operation separately from benchmark analysis;
   preserve the already granted approval only for the two named r15 targets.
2. For the mount-free r15 `/tmp` scratch, repeat whole-tree cold-copy and
   restore/hash checks, target identity, mountinfo, and process/open-user
   checks immediately before an exact removal. Verify `df /tmp` and
   `MemAvailable` afterward. Do not assume its allocated-byte count converts
   one-for-one into available memory.
3. For either tmpfs residency, first prove its terminal overlays can be
   unmounted without affecting active work, then recheck all lowerdir
   references and cold/regeneration receipts. The r16 tree needs its own
   owner decision. Verify `MemAvailable` after any approved reclaim.
4. For the large compressed archives, bind exact VPS and WSL SHA-256 values,
   full archive readability, restore spot checks or full restore policy,
   retained receipt manifests, and all active consumers. Obtain an exact
   archive-retention/removal decision; do not infer permission from a cold
   copy or from the r15 scratch approval.
5. Audit `/opt/are-benchmark-runs` by exact campaign and owner, then separate
   reproducible source checkouts from unique raw evidence. Preserve unique
   answers, evaluator inputs, failure logs and receipts. Docker/image cleanup
   is a separate service-maintenance decision.

## Open Questions

- Which exact non-benchmark route admits the approved r15 destructive cleanup?
- Can the eight r15 and 20 r17 overlay mounts be safely torn down with
  complete source-archive and active-user proof?
- Can the 20 r17 views be unmounted cleanly and their upper/work layers
  archived or proven redundant before any separate r16 reclaim decision?
- Which `/opt/are-benchmark-runs` trees are byte-equivalent to verified cold
  archives, and which contain unique raw evidence?
- What VPS archive-retention policy will Vlad and Dave approve for the
  30.738 GB G02 r2/r3 compressed pair and other cold-copied campaigns?
