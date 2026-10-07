# Certificate staging retention — candidate operating procedure

Status: candidate, 2026-10-02. Owner: CyberAlchemy v2 product owner.
This is separate from W3-04's atomic no-replace publication predicate. It
authorizes no deletion, publication, release, or cleanup automation.

## Retention and inspection

- Failed `certify` staging is retained. Its error carries a structured
  `domainspec.retained-certification-stage/v1` observation with the attempt
  name, target, creation-time stage and parent device/inode/UID, failure-time named-path state,
  and a seven-day **review alert**. The interval is not a deletion deadline or
  hard cap. A missing or replaced name may mean the owned tree moved; it does
  not mean the tree was removed.
- `inspectRetainedCertificationStage` takes that observation and opens the
  named directory through a held, identity-checked parent without following a
  symlink. It reports only a bounded
  direct-entry snapshot. `same-inode-snapshot` is not a durable ownership or
  quiescence proof. Entry-limit overflow and symlink/special entries require
  escalation. The function does not traverse file contents or mutate paths.
- `certify-check` also retains its regenerated proof tree. Its v2 result names
  `retained_evidence_directory` and sets `cleanup_authorized:false`. A failed
  check reports the retained parent in its error. This avoids an unsafe
  recursive pathname deletion after a same-user path swap, at the cost of
  disk residue after both pass and fail.

## Manual review before any separate cleanup

1. Record the original error/result and exact attempt path. Confirm whether
   publication succeeded, failed, or is indeterminate; inspect the target
   before retrying an indeterminate publication.
2. Confirm the operator owns the exact affected run and has stopped every
   process that can write to its staging or check directory. The code cannot
   establish quiescence.
3. Compare current device/inode and parent identity with the structured
   observation, inspect direct entries and provenance, and treat a changed,
   missing, symlinked, oversized, or otherwise uncertain tree as unapproved.
   An inode match alone is insufficient because names and contents can change.
4. Separately review the exact files, ownership, retention obligations, and
   disk impact. Obtain an explicit cleanup decision for those exact objects.
   Do not use a broad glob or recursive deletion of a path supplied only by
   the diagnostic. This document deliberately provides no deletion command.

## Validation boundary

The focused publication/interleaving and retention tests exercise target
competition, post-rename indeterminacy, swapped/missing/symlinked staging
names, a replaced staging parent, and a swapped `certify-check` temporary
parent. They do not run Lean,
authenticate ownership, prove an idle writer set, or perform manual cleanup.

## Open Questions

- What owner-approved retention period and disk quota should replace the
  candidate seven-day alert after operational measurements?
- What independent cleanup primitive and reviewer procedure can safely act
  on a held tree without deleting a foreign replacement?
- How should retained successful `certify-check` proof trees be archived or
  reclaimed once that procedure is approved?
