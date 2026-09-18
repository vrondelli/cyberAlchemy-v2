# Customer state failure and recovery

Status: tested failure handling, not automatic crash recovery. This supplements
[CUSTOMER-PROFILES.md](CUSTOMER-PROFILES.md) and the bundled README.

## What happens today

| Situation | Observed result | Customer action |
| --- | --- | --- |
| Normal completed session closes | Completed frontier can be restored and replayed without another upstream call | Restart using the same customer profile and supported agent |
| Another persistent writer is alive | Outer OS lock refuses the competing launcher | Close the original session normally before starting another |
| Writer is killed | OS lock releases; engine's internal ledger lock remains and blocks startup | Preserve state and reconcile the stopped session before retrying |
| Ledger contains partial JSON, invalid records or a blank record | Wrapper refuses startup; ledger bytes remain unchanged | Preserve the original; do not truncate or replace it to force startup |

## Recovery procedure and limits

1. Stop the launcher and confirm its actual Node writer and agent child have also
   stopped. A terminated terminal or launcher alone is insufficient evidence.
2. Copy the complete `.are-keld` directory to private backup storage while no
   writer is active. It may contain customer context; keep it private.
3. Record the engine version, exact error, last requested action and independently
   observed action result. A reasoning checkpoint does not prove that an external
   write, purchase or deployment did or did not happen.
4. Distinguish `writer.flock` (stable OS-lock inode), legacy `writer.lock`, and
   `reasoning-state.jsonl.writer.lock` (engine lock). Do not delete `writer.flock`.
   Internal/legacy lock removal requires verified absence of all writers and
   deliberate operator reconciliation; use the explicit command below only for this local stopped-writer case.
5. Retry only after reconciliation. The engine still validates ledger contents;
   a remaining recovery error must not be bypassed by trimming the log. Restoring
   an older backup can lose action records and requires separate review before
   any consequential action is repeated.

A clean new project can start independently, but it does not recover the failed
session's reasoning state or resolve its outstanding actions. No support endpoint
has yet been selected; this document does not promise an operational service.

## Explicit stopped-writer reconciliation

Linux/local storage only. First confirm that all writers are stopped and that
this directory has not been copied from another machine or PID namespace. PID
absence alone cannot establish ownership of a copied lock. A reused PID causes
refusal; do not kill that process merely to make reconciliation pass.

From the extracted customer bundle, inspect with:

```sh
python3 tools/reconcile-customer-state.py ./engine ./example-project
```

For a valid checkpointed ledger, this returns a `lock_sha256`. After reviewing the
stopped-session situation, supply that exact digest:

```sh
python3 tools/reconcile-customer-state.py ./engine ./example-project \
  --expected-lock-sha256 DIGEST_FROM_INSPECTION \
  --confirm-local-stopped-writer
```

The command acquires the launcher's OS lock, refuses an existing PID, verifies
the ledger and its final checkpoint with the installed engine, and copies the
complete state into a private `are-recovery-*` directory under the project. It
syncs the backup, checks that the original bytes are unchanged, then removes only
the internal ledger lock. Ledger bytes and the stable OS-lock inode remain.
Inspection can create the stable OS-lock file; it does not change the ledger or
remove locks. The command never starts an agent or replays an action.

A malformed or uncheckpointed ledger is refused even with confirmation. Backup
retention is deliberate; review and remove old backups manually once recovery
has been verified. Concurrent hostile filesystem changes and remote filesystems
are outside the supported local-operator contract.

## Verification

`node --test keld-project/scripts/customer-recovery.test.mjs` passes four cases:
three malformed-ledger cases preserve bytes, and a real Node customer wrapper
killed with SIGKILL leaves the internal lock and refuses a replacement wrapper. The same test then
checks live-PID refusal, missing confirmation, stale digest, malformed and
uncheckpointed ledger refusal, verified backup, unchanged ledger bytes, and
successful wrapper startup after explicit reconciliation.
The tests use temporary customer projects, no model calls, and clean up afterward.
They exercise the checkout engine. Separate real-model completed-state evidence
and exact distributed artifact identities are in [CUSTOMER-BUNDLE.md](CUSTOMER-BUNDLE.md).

## Open Questions

How should stopped-writer ownership be established across PID reuse and machines?
What explicit operator decision permits reconciliation of an interrupted action?
Repair of invalid or uncheckpointed ledgers, migration, and transport resumption remain unimplemented.
Commercial support ownership is tracked in [PROJECT-INTAKE.md](PROJECT-INTAKE.md).
