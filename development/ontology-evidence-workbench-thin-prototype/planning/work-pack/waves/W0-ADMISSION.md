# W0: Plan and Task Session Admission

- Layer: L0 entry
- Layer question: are the Design, plan, selected SWU, source selectors, write
  scope, validation, and closeout contracts current enough to permit one
  mutation-capable Task Session?
- Mutation: none
- Mapped SWU: SWU-OEWTP-001 preflight only

The work pack starts with SWU-OEWTP-001, but every later selected successor
must re-enter these same admission/attempt-binding actions in its own Task
Session. A predecessor closeout never authorizes the next mutation by itself.

## Entry

- Plan Distill and Dispatch Spec pass.
- Design result digest remains current.
- `selected_swu=SWU-OEWTP-001` and `mutation_authorized=false`.

## Actions

1. Revalidate all selected source paths and digests.
2. Prove no other worker owns an overlapping write scope.
3. Generate a strict Context Builder Markdown plus JSON/index handoff pack.
4. Assign one collision-resistant concrete `attempt_id`; expand every
   `<attempt-id>` source, generated-output, session-receipt, result, and owner
   closeout path for the selected SWU.
5. Reject any remaining placeholder, existing future output, symlink escape, or
   owner collision, then bind current target baselines and declared future
   absence.
6. Let Task Session decide mutation admission; Plan does not toggle it.

## Exit evidence

One Task Session preflight receipt either admits exactly SWU-OEWTP-001 or
blocks with an owned repair route. No implementation file changes in W0.
