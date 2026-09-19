---
mode: refresh
mutation_mode: proposal-only
status: applied-to-ape-docs
created: 2026-07-12
---

# Refresh Patch Proposal: APE Backend Graph Verification Lane

## Proposal Boundary

Applied with explicit `apply-approved` authorization on 2026-07-12 to the seven
APE planning documents. Craft state remains deferred to receipt-backed Craft
synchronization. The applied refresh does not implement dynamic enforcement,
mutate root relationship authority, promote patterns, or close evidence gaps.

## File-Level Deltas

| Target | Proposed delta | Signals |
| --- | --- | --- |
| `README.md` | Advance `updatedAt`; replace "tooling runs vacuously" with witnessed static node-plus-edge verification on financial-settlement; route dynamic enforcement to `../r3-closeout-plan/WORK-PACK.md` / `SWU-R3C-001`; keep L1 cleanup and breadth open. | APE-RF-002, 004, 005, 007 |
| `SPEC.md` | Change C-A from 14 to 13 backend schemas; change EdgeLaw from 31 to 30 active signatures; replace R3 dependency row with active DS-D8 plus dynamic-enforcement route; retain C-B as incomplete until the code-tag checker consumes root authority. | APE-RF-001, 003, 004, 006 |
| `GLOSSARY.md` | Replace `R3-pending`, "only sample exists", and "R3 gates all edge work" with current root-authority, financial-settlement witness, and R3A-complete wording. | APE-RF-002, 003, 005 |
| `architecture-bundle.md` | Remove diagrams/prose showing R3 blocking C-B; state that spec-level endpoint checks are live while dynamic code-tag composability remains pending; link the existing R3 closeout task. | APE-RF-002, 003, 004, 006 |
| `implementation-layering.md` | Preserve APE's local L0-L3 semantics, but add an explicit cross-plan mapping: R3-closeout L0 `SWU-R3C-001..003` realizes APE C-B/S-004. Do not imply that APE L1 is complete or that the two plans use the same layer numbering. | APE-RF-004, 007 |
| `execution-pack.md` | Replace `TASK-EDGE ready-after-L1` and "block until R3" with `routed to TASK-R3C-EDGE`; keep `TASK-UNCONSTRUCT` blocked on formalism; preserve L1 cleanup/CI dependencies for APE repeatability. | APE-RF-003, 004, 006, 007 |
| `WORK-PACK.md` | Update 14/31 references to 13/30; mark B-001 resolved by R3A; remove `blocked (R3)` from SWU-APE-007; mark `SWU-APE-EDGE-*` superseded/routed to `SWU-R3C-001..003`; keep S-003 open; record the validated successor dispatch and exact next unit. | APE-RF-001, 003, 004, 005, 007 |
| `.craft/ledger.yml` | Through Craft only: add a new description/next-move receipt pointing to `TASK-R3C-EDGE`; refresh APE artifact notes to 13/30; preserve historical 14/31 and "edges omitted" descriptions as history rather than rewriting them. | APE-RF-001, 002, 004 |
| `CRAFT.md` | Re-export from the ledger only after the Craft mutation is approved and recorded. | APE-RF-004 |

## Proposed Status Transitions

| Item | Current projection | Proposed projection | What it does not mean |
| --- | --- | --- | --- |
| B-001 / R3 blocker | active/stale in APE work-pack | resolved by R3A | Dynamic enforcement is not complete. |
| `TASK-EDGE` | `ready-after-S-003`, not-started | routed to ready `TASK-R3C-EDGE` | S-003/CI is not complete. |
| `SWU-APE-EDGE-*` | blocked on R3 placeholder | superseded by `SWU-R3C-001..003` | No implementation receipt exists yet. |
| Static backend graph verification | inconsistently node-only/vacuous | witnessed on one real pack: 13 schemas, 30 signatures, 5 edges | No multi-corpus or CI proof. |
| APE package | candidate / gate flag | candidate / gate flag | No authority promotion or package completion. |

## Existing Execution Route To Preserve

Do not author another edge-enforcement work-pack. Continue through:

1. `SWU-R3C-001`: load and classify root DS-D8 signatures dynamically.
2. `SWU-R3C-002`: add discriminating active/generated/deprecated/deferred and
   wrong-endpoint fixtures.
3. `SWU-R3C-003`: document the authority path and, if safe, wire aggregate
   validation without regression.
4. `SWU-R3C-004`: broaden evidence to a second pack/corpus.
5. `SWU-R3C-005..006`: triage backend and relationship cards against current
   authority states.
6. Later closeout: synchronize Craft/observability and preserve the attestation
   blocker if no real capability exists.

## Validation Required If Applied

- `python3 .agents/skills/dispatch-spec/scripts/validate-dispatch.py projects/domainspec-v2/development/r3-closeout-plan/r3-closeout.dispatch.json`
- `npm --prefix projects/domainspec-v2/impl run validate:rels`
- `npm --prefix projects/domainspec-v2/impl run validate:content`
- `npm --prefix projects/domainspec-v2/impl run tools:test`
- `npm --prefix projects/domainspec-v2/impl run tags:test`
- JSON parse for `refresh-report.json`
- YAML parse and Craft index-pointer check if the ledger is changed
- `git diff --check` over the approved scope

## Not Proposed

- Editing `definitions/relationships/relationships.yml` or meta-type authority.
- Marking dynamic code-tag composability complete before `SWU-R3C-001..003`
  receipts exist.
- Closing S-003, second-corpus, card-triage, formalism, promotion, mint, drift,
  or attestation work.
- Rewriting historical Craft descriptions.
- Publishing any private DomainSpec or Saturn material into public Arcanum.
