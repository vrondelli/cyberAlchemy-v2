# TASK-AAV-004: Validation Integration And Owner Handoffs

## Objective

Make the candidate validator operable from the CAV2 validation surface and
prepare evidence-backed updates for the authority owners without performing
silent promotion.

## Layer And Slice

- Layer: L2
- Slice: S-AAV-3
- Wave: W3

## Dependencies

TASK-AAV-003 complete with passing receipts.

## Source Contracts

- [Shared context](../shared/context.md)
- [Cross-task gaps](../shared/cross-task-gaps.md)
- [Traceability](../shared/traceability.md)
- SWU-AAV-006 receipts

## Implementation Detail

1. Document install-free Python command, input contract, phases, verdicts, exit
   codes, policy sources, and known limitations.
2. Add a link from `cyberAlchemy-v2/validation/README.md` to the candidate tool,
   fixtures, and latest evidence.
3. Prepare a constitution-governance proposal replacing C18's future-validator
   wording with the exact command and evidence path; do not apply it here.
4. Prepare a discipline-governance proposal synchronizing the card/catalog next
   move and validation result; do not apply it here.
5. Record G-AAV-001 through G-AAV-004 outcomes and leave L3 deferred.
6. Run link, private-boundary, test, and scoped status checks.

## Smallest Working Units

### SWU-AAV-007

- Goal: integrate validation documentation and create owner-specific handoff proposals.
- Source anchors: validation README, C18 adapter row, discipline validation section, and [shared context](../shared/context.md).
- Related context: [all cross-task gaps](../shared/cross-task-gaps.md).
- Dependencies: SWU-AAV-006.
- Write scope: validator README/evidence, `cyberAlchemy-v2/validation/README.md`, and result/handoff files inside this plan package or its task-session evidence child.
- Done criteria: operator can run the validator; handoffs cite exact receipts and preserve owner boundaries; no authority file is directly edited.
- Acceptance evidence: local links pass, boundary scan passes, handoff review identifies owning route and requested delta.
- Verification: documented test command, link check, `git diff --check`, and scoped diff review.
- Execution owner: manual.
- Handoff note: invoke constitution-governance and discipline-governance separately after evidence review.

## Failure Modes

- Documentation must not call C18 canonical or enforced repository-wide.
- Validation README must not become policy authority.
- A handoff without receipt paths is a proposal without evidence and remains flag.
- Public Arcanum files are outside write scope.

## Blocker And Gap State

G-AAV-001 blocks authority promotion, not documentation. G-AAV-004 keeps L3
rollout deferred. Any missing SWU-AAV-006 receipt blocks this task.

## Synchronization

Synchronize validation documentation and plan evidence only. Route proposed
constitution and discipline deltas to their owners as separate handles.
