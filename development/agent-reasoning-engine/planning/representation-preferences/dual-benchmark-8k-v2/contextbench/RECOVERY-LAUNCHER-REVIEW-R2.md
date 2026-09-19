# Supervisor candidate review R2

Approved as an offline candidate, not for live dispatch. Rejected R1 artifacts remain unchanged.

All 12 focused tests passed independently, including four real synthetic child-process tests. Both R1 defects are resolved: settlement now runs despite absent/invalid terminal or terminal-write failure, and cancellation during scoring suppresses success. Known attached costs survive failure; a missing terminal remains explicitly unknown with the configured full campaign reservation.

The process adapter waits for child close, preserves nonzero-exit evidence, limits IPC buffers and escalates cancellation. This establishes closure of child-owned local sockets only. It does not establish remote completion, descendant cleanup or a hard bound on waiting for inherited pipes to close.

Exact source/dependency hashes accompany this review. No provider calls, gold reads or frozen implementation edits occurred.

## Open Questions

RECOVERY-LAUNCHER.md owns the production qualifier/freeze, exact cohort and receipt reconciliation, forced native-subprocess cleanup, aggregate capacity including the additional 32 MiB supervision stage, and qualification/scoring deadlines. These remain live admission requirements.
