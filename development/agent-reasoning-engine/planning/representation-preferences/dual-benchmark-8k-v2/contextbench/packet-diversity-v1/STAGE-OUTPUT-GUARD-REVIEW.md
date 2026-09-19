# Stage output guard review

Eight synthetic tests independently pass. Integration approval is withheld for the entry-capacity gap: admission scans current entries but does not reserve prospective or pending entries. A compliant create at 4,096 existing entries is admitted and then poisons settlement, preventing the final seal. Count targets, missing parents and temporary entries before admission and preserve final-artifact entry capacity.

Final writes must also follow drained ordinary leases, or ordinary settlement may count final bytes against the 24 MiB ordinary limit and poison valid concurrent activity. Enforce or document and test this phase boundary.

Exact source hashes and findings are in `STAGE-OUTPUT-GUARD-REVIEW.json`. No runtime integration, end-to-end cap or live clearance is established.

## Open Questions

Writer integration and corrected boundary behavior are owned by `STAGE-OUTPUT-GUARD.md`.
