---
decision_id: DEC-FPR01-002-ADOPTION-ACTIVATION
task_id: SWU-FPR01-002
status: accepted
decided_on: 2026-07-16
selected_activation: combined-narrow-activation
selected_adoption: validate-and-adopt-unchanged
production_authorized: false
fpr01_003_execution_authorized: false
---

# FPR01-002 Adoption And Activation Decision Gate

## Decision scope

This record authorizes the narrow prerequisite route needed to close
`SWU-FPR01-002` without replaying its five accepted owner decisions. It does
not itself synchronize Craft, execute a Task Session, close FPR-01, select
`SWU-FPR01-003`, mutate canonical definitions, or grant production authority.

## Controlling evidence

- `foundation-execution/runs/SWU-FPR01-001/TASK-SESSION-RESULT.md` records a
  complete deterministic census and PASS receipt.
- `FPR01-OWNER-DISPOSITIONS-DECISION.md` records five accepted owner queues,
  no remaining queue blocker, and a PASS disposition result.
- `authority-source-dispositions.json` is the corresponding approved machine
  packet but explicitly denies production and successor execution authority.
- `projects/domainspec-v2/.craft/ledger.yml` still selects the already-complete
  `SWU-FPR01-001`, so continuation state is stale.
- `foundation-execution/EXECUTION-PACK.md` permits one selected SWU and requires
  continuation synchronization only from a verified receipt and with explicit
  approval.
- The accepted async-execution findings identify the current `EXECUTE` queue as
  empty and require an explicit pre-existing-packet adoption route.

## Decision 1 — activation boundary

### Considered options

| Option | Benefit | Cost or risk | Downstream impact |
|---|---|---|---|
| 1. Combined narrow activation | Synchronizes the verified predecessor, refreshes/selects FPR01-002, and immediately hands off to one exact Task Session. | A larger authorization boundary must remain exact and fail closed. | Fastest evidence-preserving route to the missing FPR01-002 receipt. |
| 2. Split activation and execution | Maximizes separation between continuation refresh and Task Session execution. | Adds another approval round without changing the known task scope. | Refresh/select first; later approval required before adoption. |
| 3. Stop or defer | Preserves current state. | Leaves Craft stale and the execution queue empty. | No code-capable successor can be reached. |

### Selected option

**Option 1 — combined narrow activation.**

Source of decision: the user replied `1` on 2026-07-16.

Authorized sequence:

1. consume and verify the `SWU-FPR01-001` receipt;
2. apply a narrow continuation refresh that marks FPR01-001 complete and
   selects exactly `SWU-FPR01-002`;
3. run one local Task Session for exactly `SWU-FPR01-002`; and
4. stop the Task Session after its candidate receipt and validation evidence.

The later synchronization of FPR01-002 remains evidence-dependent and may run
only from its verified receipt. Combining the activation steps does not merge
task completion with post-task synchronization.

## Decision 2 — treatment of the existing packet

### Considered options

| Option | Benefit | Cost or risk | Downstream impact |
|---|---|---|---|
| 1. Validate and adopt unchanged | Preserves the exact accepted owner decisions and minimizes semantic drift. | Any validation failure must block rather than be silently repaired. | Bind current artifacts by digest, track them, and emit the missing Task Session receipt. |
| 2. Normalize and re-emit | Could make the packet structurally cleaner. | Mechanical edits may change meaning or hide provenance. | Enlarges write and review scope before receipt emission. |
| 3. Re-run all owner decisions | Reconstructs every choice from a clean gate. | Duplicates completed owner work and risks contradictory replay. | Reopens all five queues and delays execution. |

### Selected option

**Option 1 — validate and adopt unchanged.**

Source of decision: after the recommended option was presented, the user
explicitly delegated the remaining work with: `do everything, i just want to
code`. This is recorded as affirmative delegation to the recommended
fail-closed option, not as silence or permission to bypass evidence.

Adoption contract:

1. compute and bind the current Markdown and JSON packet digests;
2. verify both artifacts against the FPR01-001 census, all twelve disagreement
   IDs, all five owner queues, allowed dispositions, owner/reason/effective
   condition coverage, and the `SWU-FPR01-002` done criteria;
3. preserve the packet content unchanged when every check passes;
4. place the existing artifacts under governed Git tracking as Task Session
   outputs without committing unrelated work;
5. emit a Task Session receipt that records inputs, outputs, digests,
   validation, result, and non-authority boundaries; and
6. if any material check fails, stop and reopen only the affected owner queue.

## Authority boundary

Authorized:

- the narrow FPR01-001 continuation refresh and FPR01-002 selection;
- creation of refresh and session evidence;
- validation and unchanged adoption of the two existing FPR01-002 artifacts;
- creation of the missing FPR01-002 Task Session receipt; and
- machine/read-model synchronization required by those exact lifecycle steps.

Not authorized:

- changing any accepted owner disposition during adoption;
- canonical definition, relationship, taxonomy, or import-manifest repair;
- `SWU-FPR01-003` mutation before a verified FPR01-002 receipt is separately
  synchronized and the successor is selected;
- FPR-01 ratification or FPR-02 entry;
- production, release, or canonical promotion claims; or
- unrelated cleanup, commits, pushes, or subagent dispatch.

## Deferred decisions and assumptions

- Whether Definitions Governance reconciliation is a formal predecessor of
  FPR01-003 remains deferred until FPR01-002 closes; it is outside the adoption
  write scope.
- Whether import-manifest repair blocks FPR01-003 remains deferred to the same
  post-receipt readiness check.
- Existing accepted dispositions are presumed immutable inputs unless their
  digest or validation fails.
- The user's delegation permits auto-selection of routine reversible mechanics;
  it does not permit guessing a new authority or product decision.

## Gate result

- Result: `PASS`
- Decisions resolved: 2
- Blockers remaining for FPR01-002 activation/adoption: 0
- User override/delegation: yes, bounded to recommended fail-closed mechanics
- Next route: Invoke refresh in `apply-approved` mode, then one local Task
  Session for `SWU-FPR01-002`
