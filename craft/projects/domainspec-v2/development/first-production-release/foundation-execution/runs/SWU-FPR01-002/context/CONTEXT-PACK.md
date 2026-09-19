---
artifact_kind: task-session-context-pack
task_id: SWU-FPR01-002
mode: standard
strict: true
status: pass
evidence_date: 2026-07-16
authority: session-evidence-only
---

# Strict Context Pack — SWU-FPR01-002

This pack selects only evidence required to synchronize the verified
`SWU-FPR01-001` receipt, select `SWU-FPR01-002`, and validate/adopt its existing
owner-disposition packet unchanged. It is Task Session evidence, not a planning,
definition, authority, or continuation source.

## Target

- Task: `TASK-FPR-01-AUTHORITY-BASELINE`
- SWU: `SWU-FPR01-002`
- Objective: close the owner-disposition SWU by binding the already accepted
  decisions and machine packet to a verified Task Session receipt.
- Runtime: local; no runtime adapter and no subagents.
- Recomposition target: FPR-01 authority baseline, followed by separately
  synchronized selection of `SWU-FPR01-003`.

## Obligation coverage

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| O1 | Predecessor is complete and verified | `runs/SWU-FPR01-001/TASK-SESSION-RESULT.md`; census SHA-256 `35ee6b...e78f` | covered |
| O2 | Exactly one SWU is selected before execution | adoption activation decision plus apply-approved refresh | covered |
| O3 | All census disagreements are dispositioned | census has `FPR01-D001..D012`; packet has the same 12 unique IDs | covered |
| O4 | Every owner queue is approved | `OD-001..OD-005` exist in census and packet owner review, all `approved` | covered |
| O5 | Dispositions use the allowed vocabulary and carry owner/reason/effective condition | packet `allowed_dispositions` and every `disagreements[]` row | covered |
| O6 | Existing decisions remain unchanged | activation decision selects digest-bound unchanged adoption | covered |
| O7 | Write scope is exact | existing Markdown/JSON packet plus Task Session receipt only; refresh controls are Invoke-owned | covered |
| O8 | Positive and negative validation are available | JSON/schema-shape checks, exact-set checks, digest checks, deliberate mutated-copy failures | covered |
| O9 | Authority boundaries remain false | packet records no authority mutation, no FPR completion, no production authorization, and no successor execution authorization | covered |
| O10 | Continuation synchronization remains separate | execution protocol and activation decision require a verified receipt before post-task Craft sync | covered |

Coverage: **10/10 obligations, 100%**. No strict-context blocker remains.

## Selected evidence

1. `foundation-execution/work-pack/tasks/TASK-FPR-01-AUTHORITY-BASELINE.md`
   - selectors: `SWU-FPR01-002`, write scope, done criteria, validation, owner,
     and handoff;
   - covers: O2, O3, O5, O7, O8, O10.
2. `foundation-execution/runs/SWU-FPR01-001/TASK-SESSION-RESULT.md`
   - selectors: status/result, census digest, validation, stop condition;
   - SHA-256: `d251d95c8642f9fa60039f8e9ef2a259dc8f7e86fda37cd3ea202588d42001d8`;
   - covers: O1, O3, O4.
3. `evidence/authority-census.json`
   - selectors: census ID, 21 sources, 12 disagreements, five owner queues,
     authority boundary;
   - SHA-256: `35ee6bbd258fa8b0fd16575228d96bf246bf2dbd4ac30a8324ce3bf8d6e6e78f`;
   - covers: O1, O3, O4, O9.
4. `evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md`
   - selectors: five owner choices, owner review trace, remaining blockers, gate
     result;
   - SHA-256: `b1d6b0682aacfdf698ea308cce9434e25498bf874845bb72ce4296f587653459`;
   - covers: O3, O4, O5, O6, O9.
5. `evidence/authority-source-dispositions.json`
   - selectors: census binding, allowed dispositions, 12 rows, five owner
     reviews, direction dependency, authority boundary, handoff;
   - SHA-256: `4b42980eb706d7c43cd81d9eec2b3c37596584a41a115e127b336d3847c75b5a`;
   - covers: O1, O3, O4, O5, O6, O8, O9.
6. `evidence/FPR01-002-ADOPTION-ACTIVATION-DECISION.md`
   - selectors: selected activation, selected adoption, adoption contract,
     authority boundary, gate result;
   - covers: O2, O6, O7, O8, O10.
7. `foundation-execution/WORK-PACK.md`
   - selectors: control fields, SWU table, gate checks;
   - covers: O2, O7, O10.
8. `foundation-execution/EXECUTION-PACK.md`
   - selectors: execution protocol and current execution state;
   - covers: O2, O7, O10.
9. `foundation-execution/work-pack/waves/W1-AUTHORITY-BASELINE.md`
   - selectors: order, entry, promotion gate;
   - covers: O2, O10.
10. `projects/domainspec-v2/.craft/ledger.yml` and `projects/domainspec-v2/CRAFT.md`
    - selectors: `CTX-DSV2-FIRST-PRODUCTION-RELEASE` state and next move;
    - covers: O2, O10.

## Exact write boundaries

### Invoke refresh owns

- `foundation-execution/WORK-PACK.md`
- `foundation-execution/EXECUTION-PACK.md`
- `foundation-execution/work-pack/waves/W1-AUTHORITY-BASELINE.md`
- `projects/domainspec-v2/.craft/ledger.yml`
- `projects/domainspec-v2/CRAFT.md`
- `foundation-execution/refreshes/2026-07-16-fpr01-002-adoption-activation/`
- generated visibility roadmap read models after Craft settles

### Task Session owns

- unchanged adoption/tracking of:
  - `evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md`
  - `evidence/authority-source-dispositions.json`
- creation of:
  - `foundation-execution/runs/SWU-FPR01-002/TASK-SESSION-RESULT.md`

The Task Session must not edit the content of either adopted packet artifact.
Any digest change before receipt emission is a blocker and requires renewed
validation and owner review.

## Validation contract

Positive checks:

1. parse both JSON evidence files;
2. verify the packet binds census ID and digest;
3. verify exact disagreement set `FPR01-D001..D012` with no duplicates;
4. verify exact owner-review set `OD-001..OD-005`, all approved;
5. verify every disagreement disposition and nested source disposition belongs
   to `allowed_dispositions`;
6. verify every disagreement has non-empty owner, reason, and effective
   condition;
7. verify the Markdown contains all five queues, `Remaining Blockers: None`,
   and `Result: PASS`;
8. verify authority and production flags remain false; and
9. verify two clean reads produce identical content hashes.

Negative checks must reject disposable mutated copies for at least:

- missing disagreement;
- duplicate disagreement ID;
- unknown disposition;
- missing owner;
- unapproved owner review; and
- `next_swu_execution_authorized: true`.

## Stop conditions

Stop before adoption or receipt emission when:

- a source digest differs from this pack;
- the census binding is wrong;
- any disagreement or owner queue is missing or duplicated;
- the packet and Markdown disagree;
- a validation is vacuous or false-green;
- an accepted disposition would need editing;
- the write scope expands; or
- any artifact claims FPR completion, production authority, or FPR01-003
  execution authorization.

## Excluded context

- FPR02-FPR04 task detail: excluded because it closes no FPR01-002 obligation.
- FPR01-003 implementation design: excluded until the FPR01-002 receipt is
  verified and synchronized.
- Definitions and import repair implementations: excluded from this Task
  Session; their blocking relation is evaluated at the FPR01-003 readiness
  boundary.
- Public Arcanum and cyberAlchemy-v2 authority prose: excluded because this is
  a private DomainSpec-v2 continuation task.
