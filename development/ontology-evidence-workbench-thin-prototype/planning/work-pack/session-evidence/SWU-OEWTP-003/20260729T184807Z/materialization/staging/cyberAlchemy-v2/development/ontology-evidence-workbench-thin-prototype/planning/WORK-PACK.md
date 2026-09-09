---
module: ontology-evidence-workbench-thin-prototype
version: current
status: approved-plan
updatedAt: 2026-07-29
docType: work-pack
---

# WORK-PACK: OEW Thin Prototype

## Control fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | pass | Distill, Dispatch, Design, JSON/link/diff, shape, and boundary checks pass |
| complexity | medium | Five tasks, four SWUs, protected boundaries, and six waves including admission/close |
| outputMode | split | Task and wave contracts are execution-bearing |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | Cross-task choreography |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | L0–L3 governance |
| dispatchTechniqueTrace | [PLAN-TECHNIQUE-TRACE.md](PLAN-TECHNIQUE-TRACE.md) | Full route in `../DISPATCH.json` |
| distillValidationStatus | pass | Four-round Proposer/Balancer validation closed with no blocker or flag |
| swuAtomicityStatus | pass | Four primary behaviors with independent acceptance |
| firstUnitNarrownessStatus | pass | SWU-OEWTP-001 only closes typed admission |
| closeoutSyncStatus | pass | Exact inventory in [CLOSEOUT-SYNC-INVENTORY.json](CLOSEOUT-SYNC-INVENTORY.json) |
| activeLayerWindow | L0 | Typed admission then build producer |
| readinessProfile | pilot | One local browser-testable fixture |
| selected_swu | SWU-OEWTP-001 | Selected for immediate Task Session preflight |
| mutation_authorized | true | Direct user implementation instruction; per-SWU admission remains mandatory |

## Objective and success

Deliver one receipt-bound local Chromium journey through the
Poker-Team OEW trust rail, grounding trace, conflict residue, view parity,
inspector, and receipt drawer while adding zero package manifests and leaving
the old OEW development package unchanged.

Success requires all four SWU source/owner receipt chains plus the read-only
recomposition audit. Plan authorship, a build artifact, or browser reachability
alone is insufficient. Independent immutable receipt verification remains L2.

## Delivery slices

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-001 | strict current overlay and exact same-origin loader composition are admitted | L0 | [W1](work-pack/waves/W1-L0-TYPED.md) | none | explicit typed tests, composed request probe, and `tsc -b` |
| S-002 | fresh pinned workspace produces retained immutable Vite dist | L0 | [W2](work-pack/waves/W2-L0-BUILD.md) | S-001 | retained build handle, negative fixture bank, zero new manifests |
| S-003 | exact dashboard/evidence gateway is fail-closed | L1 | [W3](work-pack/waves/W3-L1-GATEWAY.md) | S-002 | positive handle plus token/path/network negatives |
| S-004 | real Chromium completes the Poker-Team journey | L1 | [W4](work-pack/waves/W4-L1-BROWSER.md) | S-003 | thirteen named assertions and environment/teardown receipt |

## Task board

| Task | Goal | Layer | Wave | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-OEWTP-01-TYPED-ADMISSION](work-pack/tasks/TASK-OEWTP-01-TYPED-ADMISSION.md) | close strict typing, relative-base resolution, and source admission | L0 | W1 | source and owner closeout pass | complete |
| [TASK-OEWTP-02-BUILD-PRODUCER](work-pack/tasks/TASK-OEWTP-02-BUILD-PRODUCER.md) | produce immutable Vite build handle | L0 | W2 | source and owner closeout pass | complete |
| [TASK-OEWTP-03-EVIDENCE-GATEWAY](work-pack/tasks/TASK-OEWTP-03-EVIDENCE-GATEWAY.md) | serve exact evidence fail-closed | L1 | W3 | SWU-002 pass/closeout established; Task Session preflight required | selected |
| [TASK-OEWTP-04-BROWSER-ACCEPTANCE](work-pack/tasks/TASK-OEWTP-04-BROWSER-ACCEPTANCE.md) | execute real Poker-Team browser journey | L1 | W4 | after SWU-003 pass/closeout | not-started |
| [TASK-OEWTP-VERIFY](work-pack/tasks/TASK-OEWTP-VERIFY.md) | audit recomposition and claim ceiling | L1/L2 boundary | W5 close | after SWU-004 pass/closeout | not-started |

## SWU atomicity review

| SWU | Primary behavior | Independent acceptance | Candidate children | Why retained | Verdict |
| --- | --- | --- | --- | --- | --- |
| SWU-OEWTP-001 | typed executable loader admission | strict compile/tests, exact OewApp/loader composition, and manifest binding | type repair; relative-base repair; manifest updates | all repairs share one owned loader/admission boundary and the bytes are unusable while compilation, composed fetch, or either manifest fails | pass |
| SWU-OEWTP-002 | retained immutable build producer | retained dist handle from one fresh workroot | verify; install; build; retain; receipt | splitting creates hidden glue and no child except the retained terminal handle proves a usable build producer | pass |
| SWU-OEWTP-003 | exact evidence gateway | positive handle plus complete negative request bank | static serve; data map; auth; teardown | the security boundary is the combined route contract; partial server behavior is unsafe, not independently acceptable | pass |
| SWU-OEWTP-004 | real browser acceptance | complete bounded browser receipt | individual UI assertions; browser identity; teardown | assertions alone are fragments of one journey and cannot establish the receipt contract independently | pass |

SWU-OEWTP-001 passed and closed. SWU-OEWTP-002 is selected as the next
reversible unit: it owns the repeatable build producer and retained dist, while
gateway and browser behavior remain out of scope until that handle passes.

## SWU execution handoff

| SWU | Parent | Source anchors | Dependencies | Write scope summary | Acceptance | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-OEWTP-001 | [typed admission task](work-pack/tasks/TASK-OEWTP-01-TYPED-ADMISSION.md) | research `C-TS`; Design low-level component; three overlay modules | none | 3 TS files + 2 existing source manifests + pre-bound receipts | 21/21 focused tests, 6/6 typed tests, zero diagnostics, exact token probe, unchanged 42-manifest inventory | Task Session | complete |
| SWU-OEWTP-002 | [build task](work-pack/tasks/TASK-OEWTP-02-BUILD-PRODUCER.md) | Design workflow; existing lock as precedent; SWU-001 receipt | SWU-001 pass/closeout | build runner, schema, test, retained dist/handle | 4/4 producer tests; 6/6 typed tests; Vite build; retained 19-file immutable dist | Task Session | complete |
| SWU-OEWTP-003 | [gateway task](work-pack/tasks/TASK-OEWTP-03-EVIDENCE-GATEWAY.md) | Design interfaces/security; native viewer precedent; adapter run | SWU-002 pass/closeout | gateway, schema, test | route identity and full negative request bank | Task Session | selected |
| SWU-OEWTP-004 | [browser task](work-pack/tasks/TASK-OEWTP-04-BROWSER-ACCEPTANCE.md) | UX journey; validation assertions; global Playwright resolver | SWU-003 | browser test, schema | complete acceptance receipt | subagent with Task Session owner | ready-after-dependency |

Task files carry the complete algorithm, edge cases, exact source anchors,
validation commands, expected result shape, and handoff notes. Context Builder
must generate a strict Markdown plus JSON/index handoff pack at execution time.

## Task Session closeout synchronization

Every mutation-capable SWU has a closed row in
[CLOSEOUT-SYNC-INVENTORY.json](CLOSEOUT-SYNC-INVENTORY.json), including:

- split material-write and validation-owned execution-output admission through
  [MUTATION-ADMISSION-CONTRACT.json](MUTATION-ADMISSION-CONTRACT.json);
- exact lifecycle owner route;
- terminal source receipt shape;
- exact planning target inventory;
- exact source/generated/session/owner output inventory expanded from one
  collision-resistant attempt ID before source mutation;
- deterministic pre-mutation baseline rule;
- admitted and forbidden delta classes;
- owner validation commands;
- expected source and owner receipt paths;
- an explicit post-SWU-004 read-only verification owner, result, and receipt;
- a unique same-work-pack successor or none.

Closeout may update only this new development package. It cannot change
implementation source, SWU contracts, authority, promotion, publication,
deployment, risk acceptance, or unrelated targets.

## Validation

See [VALIDATION-STRATEGY.md](VALIDATION-STRATEGY.md). Every slice includes both
positive proof and at least one fail-closed negative proof.

## Blocker and gap ledger

### Acceptance blockers

None in the validated authored plan. Any stale source, changed Design digest, unavailable
exact toolchain, unresolved write overlap, failed Distill, or incomplete
closeout contract blocks Task Session admission.

### Execution gaps

| Gap | Owner | Repair path | Effect |
| --- | --- | --- | --- |
| four SWUs are unexecuted | Task Session, one SWU at a time | execute selected SWU and synchronize closeout | no runtime claim |
| browser identity is environment-current, not permanently pinned in Plan | browser Task Session | resolve/hash active Playwright-selected Chromium at preflight | drift blocks current run, not package topology |
| like-for-like simplification counts are unmeasured | closure audit | count identical boundary operations after full witness | no numerical simplification claim |
| shared overlay repair will stale historical `L1-BUILD.lock.json` | L2 independent-L1 owner | record expected staleness in SWU-001; rebind the old lane only after the prototype witness under separate authority | no fast-lane blocker; historical lane is not byte-current |

### Deferred non-blockers

- independent immutable L1 verification lane: L2 owner;
- full accessibility/responsive/Firefox matrix: later UX validation owner;
- editing, promotion, release, deployment, production: separate lifecycle
  owners.

## Dispatch trace

See [PLAN-TECHNIQUE-TRACE.md](PLAN-TECHNIQUE-TRACE.md) and `../DISPATCH.json`.
No listed technique is decorative.

## Distill validation

Automatic validation passes in [PLAN-DISTILL.md](PLAN-DISTILL.md). This opens
Task Session preflight only; implementation mutation remains separately gated.

## Gate checks

1. Design validator pass and immutable result digest: pass.
2. Medium-complexity split artifacts and execution pack: pass.
3. L0–L3 layering and wave mapping: pass.
4. Useful task-local implementation details: pass.
5. Four atomic SWUs and narrow first unit: pass.
6. Exact closeout synchronization: pass.
7. Dispatch Spec full route validation: pass.
8. Automatic Distill validation: pass after four Balancer rounds.
9. Implementation authorization: true from the direct user instruction; each
   SWU still requires passing material and mutation-admission receipts.

## Change log

| Date | Change | Author |
| --- | --- | --- |
| 2026-07-29 | Clean Define/Design/Plan package authored from approved rebuild research | Invoke |
| 2026-07-29 | Distill repaired retained-output, token, closeout, Playwright, UX, and composed relative-URL gaps; final pass | Invoke + bounded Balancer |
| 2026-07-29 | Shared runtime repaired; split-write admission and exact approval scope activated for direct implementation | Goal + Sigil Development + Spellcraft |
