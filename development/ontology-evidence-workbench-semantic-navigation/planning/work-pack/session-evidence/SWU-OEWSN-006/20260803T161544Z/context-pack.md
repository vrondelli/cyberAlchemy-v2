# Strict Context Pack — SWU-OEWSN-006

Evidence kind: Task Session session evidence; not planning authority.

## Identity

- Task/SWU: `SWU-OEWSN-006`
- Parent task: `TASK-OEWSN-02-RELATION-UI`
- Work pack: `planning/WORK-PACK.md`
- Attempt: `20260803T161544Z`
- Continuity chain: `20260803T154203Z-oewsn`
- Builder mode: `standard --strict --emit both`
- Runtime: local Task Session

## Context Pack Summary

- Files selected: 14
- Selector-level obligations: 13
- Strict coverage: **BLOCK**
- Blocking contradictions: 1
- Fallback search: named gap only; completed without widening scope
- Product mutation: prohibited

## Obligation Coverage

| ID | Status | Obligation | Controlling evidence | Resolution |
| --- | --- | --- | --- | --- |
| O1 | covered | Select exactly SWU-OEWSN-006 after SWU005 source and owner PASS. | Work Pack control fields; manifest SWU006; SWU005 receipts; chain/cursor | SWU006 is the unique current selector. |
| O2 | covered | Implement only role-sensitive relation-edge keyboard behavior. | Task SWU006; UX Plan Relation Visual Language; CR-02 | Inert edges stay outside sequential focus; actionable instances alone focus and activate. |
| O3 | covered | Bind one documented direct or roving model, visible focus, exact accessible identity, Enter/Space, result and restoration. | Task done criteria; UX Plan; operations ApplyAccessibleControlContract; planned edge witness | All behavior obligations are explicit. |
| O4 | block | Material writes must be exact, coherent, producer-owned and admissible. | Manifest SWU006; mutation-admission selected-successor contract and forbidden list | The manifest declares four historical overlay files plus patch 0003 as material writes, while the task/admission contract forbids direct historical overlay mutation. |
| O5 | block | Preserve the cumulative-binding model and protected SWU005 identities. | Task failure policy; SWU005 binding; SWU005 terminal receipt | Patch 0003 is digest-bound by the SWU005 binding at `f862611f...`; changing it requires a new per-unit binding/patch seam, but no SWU006 binding or new patch path is declared. |
| O6 | covered | Run focused navigation tests and a keyboard-only Chromium assertion if mutation is admitted. | Manifest validation surface; CR-02; required browser matrices | Acceptance-critical, but unreachable while O4/O5 block admission. |
| O7 | covered | Do not use network, create a package root, mutate Git, publish, deploy, promote or expand scope. | Parent authorization; mutation-admission forbidden list | Hard non-goals. |
| O8 | covered | Preflight exact four-target terminal closeout before any product mutation. | CLOSEOUT-SYNC-INVENTORY row SWU006 | Targets are Work Pack, manifest, parent task and attempt receipt; successor selection is conditional on source and owner PASS. |
| O9 | covered | Stop before SWU007 implementation. | Closeout row; parent instruction | A BLOCK source cannot select SWU007. |
| O10 | covered | Preserve stable chain and continuity evidence. | Chain `20260803T154203Z-oewsn`; its cursor | Current expected selector is SWU006. |
| O11 | covered | Persist the terminal receipt as the Task Session's final execution-evidence write. | Task Session contract | Context/preflight/continuation evidence precedes receipt. |
| O12 | covered | On contradictory context, stop before product mutation and record exact unblock action. | Task Session Step 2/4; parent instruction | Required terminal path is BLOCK. |
| O13 | covered | Close a terminal source through exact Invoke Refresh bookkeeping and update continuity, then stop. | Closeout row; Task Session Step 8 | Invoke owner may change only four declared closeout targets. |

## Selected Sources

1. `planning/WORK-PACK.md`
   - Selectors: control fields, Task Board, gate checks, G-06 through G-08
   - Obligations: O1, O7, O9
   - SHA-256: `25c52c64f71eb9d152742bae4da8f792cbf910c6ca645a34a3a29c1ccb772673`
2. `planning/SWU-MANIFEST.json`
   - Selector: SWU-OEWSN-006 object
   - Obligations: O1 through O6
   - SHA-256: `9f46cf228a930fe18098330889dbee18fec69a85ebde0e786630e11ff423cd84`
3. `planning/MUTATION-ADMISSION-CONTRACT.json`
   - Selectors: required-before-mutation, forbidden, selected-successor-contract
   - Obligations: O4, O5, O7
   - SHA-256: `fb65841bf6db8663cacd32422b22d7047ec8bc9fb579f220a0dcae183c69ffff`
4. `planning/CLOSEOUT-SYNC-INVENTORY.json`
   - Selector: SWU-OEWSN-006 row
   - Obligations: O8, O9, O13
   - SHA-256: `9a685ae947151ea6d94de8368d2b653ac3ef11a53e9611b5d29294b3dde5e8ab`
5. `planning/work-pack/tasks/TASK-OEWSN-02-RELATION-UI.md`
   - Selectors: SWU006; Failure modes; SWU005 cumulative build contract
   - Obligations: O2 through O6
   - SHA-256: `3508ba9985301631a2812c8ff8fcf352467c2055e6dce64277685db3b9c4bb73`
6. `design/UX-PLAN.md`
   - Selectors: Relation Visual Language; Evidence Matrix
   - Obligations: O2, O3, O6
   - SHA-256: `3a0edf2256b377b438eb029e5f9d20ecbfbe26c3ca9621464c02afb80830d0c8`
7. `design/VALIDATION-CONTRACTS.md`
   - Selectors: CR-02; Required Browser Matrices
   - Obligations: O2, O6
   - SHA-256: `ba229bf2df50bf81080fd56e9a7b48635f40e2658e80f8a4c71c546153d67414`
8. `define/operations.md`
   - Selector: ApplyAccessibleControlContract
   - Obligations: O2, O3
   - SHA-256: `d924a9ad06fd03f1b58c3a6bd37a3c617c2d5a7bde60c7735c7165da3a627f01`
9. `design/PLANNED-WITNESSES.json`
   - Selector: witness:edge-keyboard-role
   - Obligations: O3, O6
   - SHA-256: `0b6f79386468e619fd0f1b551b2249e3dc144461469be6be496a1d63d820062a`
10. `planning/work-pack/session-evidence/SWU-OEWSN-005/20260803T154613Z/receipt.json`
    - Selectors: PASS, material identities, protected identity equality
    - Obligations: O1, O5
    - SHA-256: `26435619ac852c6faed03d2211ed688d57550f4709a6ddd78384c04220b90184`
11. `planning/refresh-runs/20260803T154613Z-SWU-OEWSN-005-closeout/refresh-report.json`
    - Selectors: PASS, unique successor SWU006
    - Obligations: O1
    - SHA-256: `8b246f8ff6cdadb83a068e14447a60533cb6364e815b9cf7c0978fbfd22eccea`
12. `.arcanum/task-session-until-blocker/chains/20260803T154203Z-oewsn.json`
    - Selectors: expected selector, remaining frontier, approval boundary
    - Obligations: O1, O7, O9, O10
    - SHA-256: `2c4a9325385129808f9026ec4815d8ccfa10356615e73df4b210ad879c53462b`
13. `.arcanum/task-session-until-blocker/chains/20260803T154203Z-oewsn.continuity-cursor.json`
    - Selector: next_swu/next_route
    - Obligations: O1, O10
    - SHA-256: `4d35c4cc7685b5d7b380e7063164fe5c2300b4ad34ca4bbc5001b48f44249fb8`
14. `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/OEWSN-BUILD.SWU-OEWSN-005.binding.json`
    - Selectors: identity, predecessor, semantic_patches
    - Obligations: O5
    - SHA-256: `d66c0262994fd3ace8335b67da260663f307bd6708d4bc5089c6a8c07f738275`

## Exact Contradiction

The declared SWU006 material set is:

- historical `keyboard.ts`
- historical `store.ts`
- historical `OewApp.tsx`
- historical `navigation.test.tsx`
- cumulative patch `0003-oew-semantic-navigation.patch`

The same controlling contracts state that direct mutation of historical overlay
UI files blocks the task. They also preserve patch 0003 as a SWU005-owned,
digest-bound cumulative artifact. The SWU005 binding records patch 0003 at
`f862611f93e718997aedf2eb987fc5f6d018facad8096b357095caafaf4c5f58`.
Changing patch 0003 without a successor binding invalidates that protected
identity, and no SWU006-owned binding or patch 0004 path appears in the allowed
write inventory. The required material-write equality therefore cannot pass.

## Write Scope

No product material write is admissible. The only current-session writes are
attempt-scoped context, preflight, continuation, and terminal receipt evidence,
followed by the separately owned four-target closeout package.

## Validation Surface

The focused tests and keyboard-only Chromium matrix are acceptance-critical but
must not run against invented or unowned material. The valid pre-mutation
validation is contract identity, write-set algebra, predecessor receipts,
closeout baseline completeness, JSON validity, Markdown links and scoped
whitespace for generated evidence.

## Blocker

- ID: `BLK-OEWSN-006-MATERIAL-OWNERSHIP-CONTRADICTION`
- Class: contradictory-context / owner-contract gap
- Result: terminal BLOCK before product mutation
- Unblock action: the Invoke planning owner must choose and bind one coherent
  model: either (a) declare a new SWU006 per-unit cumulative binding plus a new
  successor patch path while keeping historical overlay bytes and SWU005 patch
  immutable, or (b) explicitly change the historical-overlay ownership policy
  and rebind every invalidated identity. Then revalidate the manifest,
  admission contract, task failure policy, producer package, and fresh consumer
  admission as one exact contract.

## Authority Precedence

1. Current mutation-admission forbidden boundaries and task failure policy.
2. Manifest material inventory and Work Pack selector.
3. Define/design behavior and validation obligations.
4. Continuity selector evidence.

No lower-precedence selector can waive a write prohibition or invent a missing
binding path.
