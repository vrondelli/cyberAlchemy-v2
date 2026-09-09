# Constitution Foundry development-package review findings

Review target: `cyberAlchemy-v2/development/refinement-runs/20260806T184230Z-constitution-foundry-architecture/`

Review verdict: **FIX; block implementation entry.** The package contains a coherent candidate architecture, but its formal evidence bindings, executable route contract, recovery plan, and closure path are not yet safe for Task Session admission. The review changed only this evidence folder; the target package remained read-only.

## What should be kept

Preserve the Author -> Prove -> Decide -> Cast decomposition; native-source/Constitution-IR separation; directional, partial, loss-aware translation; backend-native statuses and proof ceilings; obligation aggregation; orthogonal case projections; distinct ratification and casting authorization; Mint-only target effects; installation/observation separation; L1 integrity ceiling; and self-standing interpretation with pinned meta semantics.

These are candidate design properties, not executed runtime or authority proof.

## Surviving findings

### CF-REV-001 - MAJOR - Executable routes do not encode the prerequisite state machine

- Evidence: `stages/S09-EXECUTION-ENTRY.json:/execution_policy/route_policy` is `automatic-in-scope`. `/execution_policy/allowed_routes/1/required_inputs` for `route-swu-cf-001-execute` includes the Work Pack, manifest, and task file but not the owner-entry receipt. Later execute routes likewise omit exact predecessor terminal/closeout receipts. All 19 closeout routes target the shared `S09-WORK-PACK.md` and `S09-SWU-MANIFEST.json` without a serialized or compare-and-swap update rule.
- Impact: a machine consumer can select work with stale or absent prerequisite evidence, and concurrent closeout can lose state.
- Fix: add digest-bound owner and predecessor readiness predicates to each execute route and serialize or CAS-protect shared closeout updates.
- Owners: execution-entry/Plan owner, Orchestrate, Task Session, Invoke Refresh/closeout owner.
- Downstream: SWU-CF-001 through SWU-CF-019 and W1-W5.
- Severity boundary: MAJOR, not CRITICAL, because prose still blocks ownerless admission, `RESULT.md` says no Task Session was admitted, and no route or authority effect executed.

### CF-REV-002 - MAJOR - Seven frozen dispatch references do not resolve

- Evidence: `REFINE-DISPATCH.json:/steps/2/outputs/0/ref`, `/steps/2/outputs/1/ref`, `/steps/4/outputs/0/ref`, `/steps/5/outputs/1/ref`, `/steps/7/outputs/0/ref`, and `/steps/9/outputs/0/ref` name absent S03, S05, S06, S08, and S10 outputs. Its helper input also names absent `stages/S01-CONTEXT-BUILDER.md`. Current receipts name substitutes without a deviation or supersession artifact.
- Impact: the frozen dispatch cannot be replayed or audited from its declared artifact graph.
- Fix: restore the seven exact artifacts or publish one explicit supersession map and refresh every dependent selector, digest, receipt, manifest, and Result reference.
- Owners: Refine dispatch/receipt owner, Context Builder, Interrogation, Distill, Invoke.
- Downstream: S03-S10 and every plan consumer.

### CF-REV-003 - MAJOR - S06 design selection passes on a pre-design readiness signal

- Evidence: `stages/S06-DESIGN-SCOPE-MANIFEST.json:/acceptance_and_readiness_claims/0` marks the six-view design `authored-complete` while its source selector points to `S05-DISTILL.md`, which says Design must author those views. The manifest's `/human_actors` and `/unknowns` are empty; `S06-DESIGN-DENOMINATOR-RECEIPT.json:/authored_concern_ids` is empty, while `S06-DESIGN-SELECTION-RESULT.json` claims `fixed_point=true` and `design-validator-pass`.
- Impact: the pass proves consistency of a misbound denominator, not completeness of the current S06 design bundle.
- Fix: derive readiness from current S06 design selectors, populate or explicitly justify actor/unknown denominators, then regenerate the denominator, selection, transport, and S06 receipt.
- Owners: Invoke Design selection/validator owner.
- Downstream: S06 receipt, S07-S10, Plan, Work Pack, and implementation-readiness consumers.

### CF-REV-004 - MAJOR - N2 and N8 contradict the unique-outcome claim

- Evidence: `stages/S08-DISTILL-REPAIR.md` claims `12/12 mutations have a unique typed blocking or residue outcome`. `stages/S08-REFERENCE-CASTING-FIXTURE.json:/negative_cases/1/expected` (N2) is `translation-error-or-stale`; `/negative_cases/7/expected` (N8) is `recovered-or-manual-never-installed`.
- Impact: those cases are not exact discriminating oracles for SWU-018/019 acceptance.
- Fix: split N2 and N8 into separately conditioned fixtures with one exact expected result each; bind executable descendants to exact subject and artifact digests.
- Owners: S08 fixture/design-witness owner, Distill.
- Downstream: SWU-CF-018, SWU-CF-019, TASK-CF-VERIFY.
- Claim boundary: symbolic simulated fixture identities are not a defect; the finding concerns the literal uniqueness claim only.

### CF-REV-005 - MAJOR - SWU-CF-001 cannot produce its declared proof within owned scope

- Evidence: `stages/S09-SWU-MANIFEST.json:/units/0/write_scope` owns only the schema and fixture directory, while `/units/0/validation` invokes `test_case_schema.py`. `stages/work-pack/tasks/TASK-CF-CORE.md` and the execute route preserve the same omission.
- Impact: the first unit cannot author or identity-bind the validator required for acceptance.
- Fix: add the exact test file to SWU-001's owned scope and route, or name and digest-bind an already-owned validator.
- Owners: SWU-CF-001 Plan/Task Session owner, TASK-CF-CORE owner.
- Downstream: SWU-CF-001 and every successor.

### CF-REV-006 - MAJOR - SWU-CF-002 cannot reject duplicate keys from its declared input type

- Evidence: `stages/work-pack/tasks/TASK-CF-CORE.md` declares `parsed JSON value -> canonical UTF-8 bytes and digest` while requiring duplicate-key rejection at the parse boundary. `stages/S09-SWU-MANIFEST.json:/units/1` carries the same contract.
- Impact: ordinary parsing makes `{"a":1,"a":2}` indistinguishable from `{"a":2}`, so the required negative cannot be detected downstream.
- Fix: move duplicate-key rejection to raw bytes or a pairs-preserving parse boundary, or assign it to an explicit parser contract before canonicalization.
- Owners: canonical-parser contract owner, TASK-CF-CORE owner.
- Downstream: SWU-CF-002, artifact identities, and every digest-bound decision/report/receipt.

### CF-REV-007 - MAJOR - Mint crash recovery lacks a durable attempt-journal contract

- Evidence: `stages/work-pack/tasks/TASK-CF-MINT.md` and `stages/S09-SWU-MANIFEST.json:/units/11` require interruption before/after each effect, resume, abandon, replay, and rollback-failure behavior. SWU-012 owns no journal path/schema and defines no write-before-effect order, stable effect identity, persistence/atomicity ceiling, or idempotency rule.
- Impact: a crash after effect E2 but before receipt persistence is indistinguishable from E2 not applied.
- Fix: define a fixture-local durable write-ahead journal with stable effect IDs, write-before-effect ordering, bounded persistence/atomicity, replay/idempotency rules, and crash-point fixtures.
- Owners: Mint transaction/recovery owner.
- Downstream: SWU-CF-012/013, reference casting, SWU-CF-018/019, and TASK-CF-VERIFY.
- Scope boundary: the abstract S06 recovery architecture is adequate; the concrete defect belongs to the implementation plan/task contract.

### CF-REV-008 - MAJOR - The route chain ends before independent verification

- Evidence: `stages/S09-EXECUTION-ENTRY.json:/execution_policy/allowed_routes` contains 39 routes: owner entry plus execute/closeout pairs for 19 SWUs. It ends at `route-swu-cf-019-closeout`. `stages/S09-WORK-PACK.md` names `TASK-CF-VERIFY` as successor, while `stages/work-pack/tasks/TASK-CF-VERIFY.md` and `stages/work-pack/waves/W5.md` require independent closure.
- Impact: the executable contract dead-ends before its declared evidence closure and governance handoff.
- Fix: add a non-mutating W5/TASK-CF-VERIFY route with required inputs, exact receipt, and continuation/closeout rule.
- Owners: execution-entry/verification-route owner, Orchestrate/Plan.
- Downstream: W5 and later owner handoffs.

### CF-REV-009 - MAJOR - Machine owner entry binds only a generic Decision Gate receipt

- Evidence: prose in `stages/S09-PLAN-CONTEXT.md` correctly requires `Decision Gate plus the relevant constitution/authority owners`, and the Work Pack keeps the owner/subject model unadmitted. But `stages/S09-EXECUTION-ENTRY.json:/pre_execution_owner_prerequisite/owner` names only `decision-gate:generic`, and the owner-entry route expects one generic receipt for protocol, authority-subject, repository/runtime, fixture, and sink decisions.
- Impact: one generic receipt can satisfy machine entry without proving digest-bound participation and acceptance by every relevant owner.
- Fix: keep Decision Gate as the route/options decision, then require separately typed, digest-bound acceptance artifacts from the exact constitution, authority, runtime/root, and data/sink owners.
- Owners: entry-gate owner plus the exact constitution, authority, runtime/root, and data/sink owners.
- Downstream: W0, SWU-CF-001 admission, and all downstream subject assumptions.
- Distinction: CF-REV-001 concerns missing route prerequisites; this finding concerns the semantics and issuer set of the owner-entry evidence itself.

### CF-REV-012 - MAJOR - Symbolic SWU source anchors lack a versioned resolver

- Evidence: the symbolic subset of `stages/S09-SWU-MANIFEST.json:/units/*/source_anchors` uses aliases such as `S08#Repair-1`, `S07#DR-01`, `formal-semantics-receipt#R-FSB-02`, and `S09-MINT-AUDIT-MAPPING#C03-C08`. The manifest binds no versioned path/selector/digest resolver, while `stages/S09-WORK-PACK.md` requires Context Builder consumption.
- Impact: a heading rename or changed source bytes can leave the alias unchanged and silently stale Task Session context.
- Fix: replace each symbolic alias with exact repository path, selector/JSON pointer, and digest, or bind one versioned resolver artifact.
- Owners: Work Pack/Plan and Context Builder owners.
- Downstream: every SWU that consumes a symbolic anchor.
- Scope correction: literal filename anchors are not included in this finding.

### CF-REV-013 - MINOR - S08's mutation denominator is inconsistent

- Evidence: `stages/S08-DISTILL-REPAIR.md` first says ten negative mutations, then enumerates N1-N12 and claims 12/12.
- Impact: review and coverage consumers can infer the wrong denominator.
- Fix: replace `ten` with `twelve` and refresh affected receipt/count wording.
- Owners: S08 artifact/receipt owner, Distill.
- Downstream: S08 receipt, Result navigation, VERIFY coverage.

### CF-REV-014 - MINOR - W1 labels candidate evidence as promotion evidence

- Evidence: `stages/work-pack/waves/W1.md` says `Promotion evidence is the complete L0 unit receipt chain and negative vector`, then correctly says no target mutation or real authority occurs.
- Impact: the label can be misread as proof sufficient for promotion.
- Fix: rename it `layer-exit candidate evidence` or `input to a later promotion-owner decision`.
- Owners: Work Pack/wave author, later constitution-governance owner.
- Downstream: W1 closeout and later reviewers.

## Verification exclusions

Two synthesized candidates were not admitted as findings:

- `CF-REV-010`: one verifier found no evidence that the two internal SWU-013 proofs require independent mutation/admission owners; coherent integration behaviors may have separately failing predicates.
- `CF-REV-011`: one verifier found that breadth and multiple test files do not establish non-atomicity for a frozen layer-exit acceptance matrix without distinct admission, write, or closeout owners.

Their evidence and the genuine disagreement remain in `attacks.md` and `verification.md`; neither was softened or averaged into the final set.

## Complete 63-artifact verdict matrix

| # | Artifact | Verdict | Finding |
|---:|---|---|---|
| 1 | `REFINE-DISPATCH.json` | FIX | 002 |
| 2 | `REFINE-SEED-PROPOSAL.md` | KEEP | - |
| 3 | `RESULT.md` | FIX | 001, 008, 009 |
| 4 | `RUN-MANIFEST.md` | KEEP | - |
| 5 | `RUNTIME-HANDOFF.md` | KEEP | - |
| 6 | `context-builder/context-pack.json` | KEEP | - |
| 7 | `context-builder/context-pack.md` | KEEP | - |
| 8 | `context-builder/runtime-handoff-index.json` | KEEP | - |
| 9 | `evidence-index.json` | KEEP | - |
| 10 | `receipts/S01.json` | KEEP | - |
| 11 | `receipts/S02.json` | KEEP | - |
| 12 | `receipts/S03.json` | FIX | 002 |
| 13 | `receipts/S04.json` | KEEP | - |
| 14 | `receipts/S05.json` | FIX | 002 |
| 15 | `receipts/S06.json` | FIX | 003 |
| 16 | `receipts/S07.json` | KEEP | - |
| 17 | `receipts/S08.json` | FIX | 004, 013 |
| 18 | `receipts/S09-EXECUTION-ENTRY-VALIDATION.json` | FIX | 001, 008 |
| 19 | `receipts/S09.json` | FIX | 001, 005-009, 012 |
| 20 | `receipts/S10.json` | FIX | 002, 009 |
| 21 | `receipts/dispatch-validation.json` | KEEP | structural pre-run pass only |
| 22 | `receipts/formal-semantics-boundary-reviewer.json` | KEEP | - |
| 23 | `stages/S02-INVOKE-DEFINE.md` | KEEP | - |
| 24 | `stages/S03-INTERROGATION-REVIEW.md` | KEEP | historical residue defended |
| 25 | `stages/S04-RESEARCH-DECISION.md` | KEEP | - |
| 26 | `stages/S05-DISTILL.md` | KEEP | architecture retained |
| 27 | `stages/S06-AUTHORED-CONCERNS.json` | KEEP | - |
| 28 | `stages/S06-DESIGN-DENOMINATOR-RECEIPT.json` | FIX | 003 |
| 29 | `stages/S06-DESIGN-SCOPE-MANIFEST.json` | FIX | 003 |
| 30 | `stages/S06-DESIGN-SELECTION-RESULT.json` | FIX | 003 |
| 31 | `stages/S06-DESIGN-TRANSPORT.md` | FIX | 003 |
| 32 | `stages/S06-GLOSSARY-CONSISTENCY.md` | KEEP | - |
| 33 | `stages/S06-IMPLEMENTATION-LAYERING-SEED.md` | KEEP | - |
| 34 | `stages/S06-INVOKE-DESIGN.md` | KEEP | abstract recovery boundary retained |
| 35 | `stages/S06-PLANNED-WITNESSES.json` | KEEP | explicitly unexecuted |
| 36 | `stages/S07-INTERROGATION-DESIGN-REVIEW.md` | KEEP | - |
| 37 | `stages/S08-DISTILL-REPAIR.md` | FIX | 004, 013 |
| 38 | `stages/S08-REFERENCE-CASTING-FIXTURE.json` | FIX | 004 |
| 39 | `stages/S09-DISTILL-VALIDATION.md` | FIX | 005, 006 |
| 40 | `stages/S09-EXECUTION-ENTRY.json` | FIX | 001, 008, 009, 012 |
| 41 | `stages/S09-EXECUTION-PACK.md` | FIX | 001, 008 |
| 42 | `stages/S09-IMPLEMENTATION-LAYERING.md` | KEEP | integration boundary retained |
| 43 | `stages/S09-INVOKE-PLAN.md` | FIX | 001, 008, 009 |
| 44 | `stages/S09-MINT-AUDIT-MAPPING.md` | KEEP | mapping ceiling retained |
| 45 | `stages/S09-PLAN-CONTEXT.md` | FIX | 009 |
| 46 | `stages/S09-PLAN-TRANSPORT.md` | KEEP | - |
| 47 | `stages/S09-SWU-MANIFEST.json` | FIX | 005-007, 012 |
| 48 | `stages/S09-WORK-PACK.md` | FIX | 001, 008, 009, 012 |
| 49 | `stages/S10-FINAL-INTERROGATION.md` | FIX | 002, 009 |
| 50 | `stages/work-pack/tasks/TASK-CF-AUTHORITY.md` | KEEP | owner-artifact separation retained |
| 51 | `stages/work-pack/tasks/TASK-CF-BACKENDS.md` | KEEP | backend ceilings retained |
| 52 | `stages/work-pack/tasks/TASK-CF-CORE.md` | FIX | 005, 006 |
| 53 | `stages/work-pack/tasks/TASK-CF-MINT.md` | FIX | 007 |
| 54 | `stages/work-pack/tasks/TASK-CF-REFERENCE.md` | KEEP | frozen layer-exit matrix retained |
| 55 | `stages/work-pack/tasks/TASK-CF-RUNTIME.md` | KEEP | - |
| 56 | `stages/work-pack/tasks/TASK-CF-SEMANTICS.md` | KEEP | - |
| 57 | `stages/work-pack/tasks/TASK-CF-VERIFY.md` | KEEP | content sound; route defect elsewhere |
| 58 | `stages/work-pack/waves/W0.md` | FIX | 009 |
| 59 | `stages/work-pack/waves/W1.md` | FIX | 014 |
| 60 | `stages/work-pack/waves/W2.md` | KEEP | - |
| 61 | `stages/work-pack/waves/W3.md` | KEEP | - |
| 62 | `stages/work-pack/waves/W4.md` | KEEP | - |
| 63 | `stages/work-pack/waves/W5.md` | KEEP | content sound; route defect elsewhere |

Totals: **27 FIX / 36 KEEP**.

## Smallest claim-bounded next route

If the user approves repair work, run one exact-target `invoke:refresh` limited to the 27 FIX artifacts and the twelve surviving findings, followed by deterministic reference, digest, receipt, route, graph, matrix, and negative-fixture validation. Do not run Decision Gate, Implementation Readiness, Task Session, Mint, or owner admission before that refresh is separately approved and completed.

