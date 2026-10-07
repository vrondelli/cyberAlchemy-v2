# G01 r15 exact VPS reclaim — owner approval, route unresolved

Status, 2026-10-03: **Vlad approved the exact reclaim; no deletion performed**.

Vlad answered “Approve exact VPS reclaim” to the question naming only these
two terminal r15 VPS tmpfs trees, subject to rechecking their WSL cold copies
and confirming no mounts or active users:

- `/tmp/are-g01-r15-r2-scratch-layout-probe-r1`
- `/dev/shm/are-g01-r15-r2-single-checkout-residency-r1`

The prior read-only [r17 terminal inventory](G01-R17-TERMINAL-NOTE.md)
measured 3,692,294,144 bytes across the two trees and reported matching WSL
cold copies. That is historical evidence, **not** a fresh pre-deletion check.
No other VPS root, source cache, campaign evidence or WSL cold copy was
included in Vlad's approval.

Read-only checks on 2026-10-03 (tree and mount checks near 12:51 UTC; memory
recheck at 13:21 UTC) found both exact trees still present at measured sizes
1,734,295,552 and 1,957,998,592 bytes. The scratch
probe has no nested mount or overlay lowerdir reference. **The r15 residency
tree is referenced as the lowerdir of eight still-mounted r15 campaign overlay
views** under `/tmp/are-g01-product-replication-r15-source`; it is therefore
not safe to remove now, even though the campaign is terminal and no matching
benchmark process appeared in the bounded process check. The VPS also has
20 r17 campaign overlay mounts using its separate r16 residency tree. No
unmount or deletion was performed. The historical claim that both approved
trees were mount-free has been superseded by this live observation.

The same read-only check found 1,129,566,208 bytes `MemAvailable`, below the
provisional 4 GiB (4,294,967,296-byte) G01 floor by 3,165,401,088 bytes.
Reclaiming only the mount-free scratch tree would still leave a nominal
1,431,105,536-byte gap; this arithmetic is not a promise of realized memory
gain. The approved pair may be reconsidered only after an exact, separately
admitted terminal-overlay teardown, fresh backup/identity/user checks, and
resolution of the destructive effect route.

The local ARE router returned `selection.no-match` for the exact reply
“Approve exact VPS reclaim”. The active `CA2-ROUTE-BENCHMARK-RUN` route also
does not permit the destructive effect class required to remove the VPS
copies. This route gap is distinct from Vlad's approval; consent alone does
not make a rejected effect admissible. The trees therefore remain untouched.
Do not ask Vlad to repeat this same approval. Resolve the exact repository
route/effect boundary first, then perform fresh checksum, mount, active-user,
and target-identity checks immediately before any separately admitted reclaim.

## Open Questions

- Which exact repository route and effect contract covers verified archival
  followed by removal of only these two redundant VPS scratch copies?
- Do the cold copies still checksum-match and restore, and can the eight r15
  overlay views be safely torn down before any fresh pre-deletion check?
