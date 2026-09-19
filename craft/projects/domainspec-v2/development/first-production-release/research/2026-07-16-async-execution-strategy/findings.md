# FPR-01–04 Asynchronous Execution Strategy Findings

- Dispatch: `2026-07-16-fpr-async-execution-strategy`
- Status: research finding; manual operating proposal only
- Evidence boundary: the bounded FPR-01–04 projection and repository state observed on 2026-07-16
- Authority boundary: this report does not complete an FPR task, alter authority, authorize execution, select a successor, synchronize Craft, or implement scheduling machinery

## 1. Executive verdict

Use all three available agent slots for registered read-only research, review, diagnostics, and tightly allowlisted preparation. Do **not** run two FPR mutations concurrently. Within the current FPR-01–04 projection, the executable dependency graph has width one: each SWU consumes a predecessor receipt, and the protocol permits exactly one selected SWU until its wave receipt closes (`projects/domainspec-v2/development/first-production-release/foundation-execution/WORK-PACK.md:104-110`; `projects/domainspec-v2/development/first-production-release/foundation-execution/EXECUTION-PACK.md:28-39`).

The present authorized execution queue is empty. The FPR01-002 decision packet is accepted-looking content, but it is untracked, has no Task Session receipt, has not been synchronized into continuation state, and explicitly denies authorization for FPR01-003 (`projects/domainspec-v2/development/first-production-release/evidence/authority-source-dispositions.json:17-30`). Current capacity therefore increases epistemic throughput, not proven FPR delivery speed.

This is a parent-enforced schedule for present operations. It is **not** an implemented scheduler, lock manager, Task Session authority, or permission to mutate FPR artifacts.

## 2. Current non-collapsed state and queue

The state must remain five separate facts:

| Dimension | Observed state | Consequence |
|---|---|---|
| Decision packet | `accepted` / packet `status: approved` | The five owner dispositions may be preserved as inputs; acceptance alone is not task closure. |
| Git tracking | `untracked` | The two FPR01-002 evidence files are not yet durable tracked evidence. |
| Task receipt | `absent` | No `runs/SWU-FPR01-002/TASK-SESSION-RESULT.md` proves bounded execution and validation. |
| Continuation synchronization | `stale` | Craft still directs a Task Session for FPR01-001 and keeps the context blocked (`projects/domainspec-v2/.craft/ledger.yml:290-305`). |
| Successor authorization | `denied` | The packet names FPR01-003 but sets `next_swu_execution_authorized: false` (`projects/domainspec-v2/development/first-production-release/evidence/authority-source-dispositions.json:24-30`). |

`SWU-FPR01-001` is independently complete/PASS, with repeatable validation and a bound census digest (`projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-001/TASK-SESSION-RESULT.md:1-17,53-83`). That does not collapse the other four dimensions.

```text
EXECUTE queue = empty
diagnostic/read-only queue = available
allowlisted PREP queue = provisional and non-promotional
```

The direct 2026-07-16 Git observation found only the owner-disposition Markdown, its JSON packet, and this research corpus untracked under the FPR folder before this findings file was added. The three explorer observations are preserved without synthesis in [research.md](./research.md).

## 3. FPR dependency and concurrency model

The bounded execution chain is:

```text
FPR-00
  -> 01-001 -> 01-002 -> 01-003 -> 01-004
  -> 02-001 -> 02-002 -> 02-003
  -> 03-001 -> 03-002 -> 03-003
  -> 04-001 -> 04-002 -> 04-003 -> 04-004
```

Only the independently verified FPR01-004 receipt opens FPR-02 (`projects/domainspec-v2/development/first-production-release/foundation-execution/work-pack/tasks/TASK-FPR-01-AUTHORITY-BASELINE.md:56-68`). Equivalent receipt dependencies gate FPR-02, FPR-03, and FPR-04 (`projects/domainspec-v2/development/first-production-release/foundation-execution/work-pack/tasks/TASK-FPR-02-SUPPORTED-PROFILE.md:14-16,44-52`; `projects/domainspec-v2/development/first-production-release/foundation-execution/work-pack/tasks/TASK-FPR-03-BUSINESS-SPEC.md:14-16,42-55`; `projects/domainspec-v2/development/first-production-release/foundation-execution/work-pack/tasks/TASK-FPR-04-SPEC-PROJECTION.md:14-16,61-73`).

Consequently:

- executable DAG width for this projection: **1**;
- safe registered agent occupancy now: **3 read-only/review/preparation slots**;
- authorized executable frontier now: **empty**;
- structural critical path: the entire 14-SWU chain;
- temporal speedup: **unknown**, because no duration or cost weights exist.

Preparation may overlap only when it cannot claim completion, write declared successor outputs, or pre-decide an unresolved authority choice. Disjoint file paths do not override semantic or receipt dependencies.

## 4. Mechanism status matrix

“Present” below means evidenced repository procedure, not an automated production service.

| Mechanism | Status | Evidence or boundary |
|---|---|---|
| Exactly one selected SWU | **Present, manual** | The work-pack requires one and only one selected SWU until wave receipt close (`foundation-execution/WORK-PACK.md:104-110`). |
| Predecessor receipt gates | **Present, manual** | Execution protocol synchronizes only from verified receipts (`foundation-execution/EXECUTION-PACK.md:28-39`). |
| Decision Gate before consequential choice | **Present, manual** | Named in the execution protocol and FPR task contracts (`foundation-execution/EXECUTION-PACK.md:30-39`). |
| Declared write scope and authorized owner | **Present, manual** | Every FPR SWU names write scope and owner; FPR01 examples are explicit (`work-pack/tasks/TASK-FPR-01-AUTHORITY-BASELINE.md:20-64`). |
| Positive/negative validation | **Present as obligation** | The protocol requires it, while future validator commands remain planned interfaces until their SWUs create them (`foundation-execution/EXECUTION-PACK.md:36-50`). |
| Named independent verification | **Present as obligation** | FPR01-004 and FPR04-004 explicitly require an independent verifier (`work-pack/tasks/TASK-FPR-01-AUTHORITY-BASELINE.md:56-64`; `work-pack/tasks/TASK-FPR-04-SPEC-PROJECTION.md:61-73`). |
| Separate continuation synchronization | **Present, manual** | Sync requires a verified receipt and separate approval (`foundation-execution/EXECUTION-PACK.md:36-39,53-62`). |
| Craft continuation authority | **Present** | A Craft/package mismatch defers to Craft and triggers refresh (`foundation-execution/WORK-PACK.md:104-110`). |
| Registered research dispatch | **Present** | This dispatch is registered at `telemetry/agents/subagents-dispatch.yaml:3400-3412`. |
| Async code dispatch | **Reserved/unavailable** | `code` is RESERVED and has no owner skill (`implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/domainspec-subagents-strategy/SKILL.md:99-110`). |
| State reconciler and explicit state vector | **Build from owned rules** | The authoritative dimensions already exist; no mechanism currently computes and enforces their agreement. |
| Side-effect/collision registry and projection checks | **Build from owned rules** | Task write scopes and known shared outputs supply inputs; no executable collision checker is evidenced. |
| Automated scheduler and `WorkItem` schema | **Absent; proposed here** | This report defines a candidate model only. |
| PREP lifecycle, manifests, TTLs, and rework budgets | **Absent; proposed here** | No governed preparation sub-DAG or freshness contract is evidenced ([Goldratt lens](./research.md#agent-1--goldratt-eliyahu)). |
| Locks, immutable snapshots, or runner isolation | **Absent** | Current safety comes from parent serialization and a procedural no-write interval. |
| Adopt-existing-packet route | **Absent/unresolved** | The packet preserves decisions but does not define how an existing untracked packet becomes a Task Session receipt. |

## 5. Lifecycle glossary

These terms describe this operating proposal; they do not add ontology kinds or authority states.

| Term | Meaning |
|---|---|
| `DIAGNOSTIC` | Read-only observation that may report inconsistency but cannot satisfy a gate. |
| `PREP` | Allowlisted, non-promotional preparation bound to explicit assumptions and predecessor digests. |
| `EXEC_READY` | A proposed manual predicate indicating that all existing authorization and safety conditions have been checked. It does not itself grant authority. |
| `MUTATE` | The one bounded Task Session writer changes only declared paths. |
| `VALIDATE` | Positive and negative checks over a procedurally frozen candidate. |
| `CANDIDATE_RECEIPT` | Evidence binding outputs, inputs, checks, identity/version information, and outcome for independent review. |
| `GATE_VERIFY` | Independent gate-effective receipt/evidence verification; distinct from diagnostics. |
| `SYNC` | A separately approved Craft continuation update based on a verified receipt. |
| `REFRESH` | Regeneration/checking of derived views after Craft settles. |
| `SELECT` | Separate choice of the unique successor after synchronization; never implied by a handoff name. |
| `STALE` | PREP whose assumption anchors no longer match; lineage is retained but the artifact cannot be consumed unchanged. |

`AUX` names the heterogeneous pool used to schedule diagnostic, PREP, research, and review work. It is not an ontology kind.

## 6. Manual present-day scheduling model

The parent schedules all three slots and serializes mutation, shared runners, authority changes, receipts, continuation state, and publication.

| Epoch | Slot 1 | Slot 2 | Slot 3 | Parent / serialization gate |
|---|---|---|---|---|
| **A — present stale state** | Diagnostic FPR01-001 receipt/Craft reconciliation report | FPR01-002 packet, tracking, and missing-closure-route review | Provisionally allowed FPR01-003 questions, invariants, mutant catalog, and checklist after command side-effect review | Define and obtain the missing authorization route; no FPR mutation. |
| **B — authorized mutation** | Sole authorized local Task Session writer | Side-effect-reviewed source-drift diagnostic | Allowlisted successor preparation only | Manually schedule exclusive resources; async code dispatch is unavailable. |
| **C — procedural no-write validation interval** | Positive/negative validation, serialized where runners share outputs | Static review of the complete candidate tree and input bindings | Receipt and independent-verification checklist preparation only | Candidate mutation stops procedurally; no immutable snapshot is implied. Do not start independent gate verification before evidence is complete. |
| **D — receipt and independent verification** | Independent `GATE_VERIFY` | Diagnostic receipt/evidence consistency check | Allowlisted next-node preparation | First emit a candidate receipt binding outputs, input digests, validation evidence, validator identity/version, timestamp/result where available, and declared independence. Failure returns to mutation and then a new no-write validation interval; pass closes the task. |
| **E — continuation** | Parent/continuation action: obtain separate sync approval and update Craft from the verified receipt | Read-only consistency check after derived views are regenerated | Allowlisted preparation only | Regenerate/check derived views after Craft settles. Only then may the unique successor be selected; there are no concurrent authority writers. |

This pattern repeats per SWU. It maximizes useful occupancy without presenting concurrent preparation as concurrent execution.

## 7. Proposed machine model — not implemented

### 7.1 Work item

A future scheduler-facing `WorkItem` should minimally carry:

| Field | Purpose |
|---|---|
| `operation_kind` | Distinguish diagnostic, PREP, mutation, validation, gate verification, sync, refresh, and selection. |
| `mutation_class` | Express read-only, derived-write, canonical-write, authority-write, or shared-state-write behavior. |
| `declared_write_paths` | Exact durable writes. |
| `declared_transient_paths` | Caches, build output, temp files, package state, and other side effects. |
| `authority_effect` | None, candidate evidence, gate-effective verification, continuation mutation, or promotion. |
| `target_swu` | The one bounded SWU or explicit `none`. |
| `prerequisites` | Verified receipts, accepted decisions, state requirements, and source anchors. |
| `assumptions` | Digests and decisions against which PREP was created. |
| `resources` | Exclusive runner, worktree, index, ledger, inventory, roadmap, or authority surfaces. |
| `output_scope` | Allowed result classes and forbidden promotion/completion effects. |

Diagnostic checks and gate-effective verification must be different operation kinds. A successful diagnostic must never silently become a receipt or gate pass.

### 7.2 Manual `EXEC_READY` predicate

Until machinery exists, a parent may classify a work item `EXEC_READY` only when **all** are true:

1. every predecessor receipt is present and verified;
2. Craft is current;
3. every derived continuation view agrees with Craft;
4. exactly one SWU is selected;
5. there is no unresolved decision obligation, or an accepted decision is explicitly bound into the context;
6. the execution context is valid and non-contradictory;
7. durable and transient write scope is declared;
8. the writer is authorized for that scope;
9. all required inputs exist and validate;
10. a positive/negative validation plan is bound; and
11. the parent has scheduled all exclusive resources.

This predicate checks existing authority; it does not create it and is not executable machinery.

### 7.3 PREP allowlist and freshness

Allowed PREP outputs:

- questions and decision-field inventories;
- source indexes;
- invariants;
- mutant catalogs;
- verification checklists; and
- test plans.

Forbidden PREP outputs:

- final schemas or fixtures;
- validator or production code;
- canonical or authority artifacts;
- receipts or ratifications;
- generated projections; and
- declared successor outputs.

Every PREP item must bind all assumptions: predecessor receipt digests, accepted-decision IDs/digests, relevant source digests, target SWU, and profile/baseline identity. Any mismatch makes it `STALE`; preserve provenance and rebase or discard rather than silently updating it. TTL, graph-distance, and rework-budget policies remain proposals and must not be represented as current controls.

## 8. Shared-resource and authority serialization rules

1. **Authority dependency wins over path disjointness.** A successor cannot mutate merely because its files do not overlap its predecessor's.
2. **One authorized writer.** The exact Task Session writer alone mutates declared FPR paths during Epoch B.
3. **Freeze before observing.** Static review and validation consume a complete candidate during a procedural no-write interval; this is not snapshot isolation.
4. **Serialize shared runner output.** Build output, test caches, package state, and lockfiles are exclusive resources unless isolation is evidenced ([Hewitt collision matrix](./research.md#agent-2--hewitt-carl)).
5. **Keep independent verification independent.** FPR04-004 cannot use the compiler's own projection/retraction as its oracle, and its acceptance owner cannot be the compiler author/owner (`work-pack/tasks/TASK-FPR-04-SPEC-PROJECTION.md:61-72`).
6. **Serialize continuation projections.** Update Craft only after separate approval, then regenerate/check roadmap or other derived views after Craft settles.
7. **Single parent for shared ledgers and Git state.** Dispatch ledger appends use the deterministic appender, while Git stage/commit/push, inventory refresh, and roadmap writes are parent-serialized (`implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/domainspec-subagents-strategy/SKILL.md:114-127`).
8. **No authority from proximity.** Research, review, PREP, diagnostics, passing tests, or handoff language cannot substitute for the named owner, receipt, or ratification route ([van Lamsweerde permission matrix](./research.md#agent-3--van-lamsweerde-axel)).

## 9. Immediate next governed move

Preserve the FPR01-002 owner decisions; do not re-infer them. The missing capability is adoption semantics: a governed route that explains how the existing untracked decision packet becomes the input and evidence of one exact Task Session without pretending it already has a receipt.

A narrow **candidate authorization**, if separately proposed and approved by the proper owner, may combine:

1. reconciliation and refresh from the verified FPR01-001 receipt;
2. exact selection of SWU-FPR01-002; and
3. exact Task Session binding of the existing FPR01-002 packet for tracking, validation, and receipt emission.

That candidate route is not granted by this report. It must define acceptance checks, write scope, the existing packet's provenance, failure behavior, and whether unchanged adoption is permitted. Post-task Craft synchronization remains a separate approved action. Only after the FPR01-002 receipt is verified and synchronized may FPR01-003 be selected; the packet itself already denies its execution authorization (`evidence/authority-source-dispositions.json:24-30`).

## 10. Implementation-gap backlog ordered by leverage

1. **State reconciler:** compute the non-collapsed state vector from packet, Git tracking, receipt, Craft/derived views, and authorization; fail closed on disagreement.
2. **FPR01-002 adoption route:** define how pre-existing owner decisions are bound into exactly one Task Session and receipt without replaying or silently promoting them.
3. **WorkItem, side-effect, and collision schemas:** make durable/transient paths, resources, authority effects, and operation kinds machine-checkable.
4. **PREP manifest and freshness transition:** bind assumption anchors, support `FRESH -> STALE -> REBASED|DISCARDED`, and forbid promotional outputs.
5. **Typed definitions/import dependency edges:** represent whether definition reconciliation and import-manifest repair are blocking predecessors rather than prose residue.
6. **Runner/worktree isolation:** isolate build output, caches, package state, and candidate trees before increasing mutation concurrency.
7. **Bounded async code owner:** only after isolation and machine-enforced scopes exist, decide whether `dispatch_type: code` can move from RESERVED to a narrow LIVE contract.
8. **Telemetry before optimization claims:** capture queue time, work time, rework, staleness, conflicts, and gate outcomes before claiming speedup.

The first two gaps unblock truthful continuation. The next four make concurrency mechanically safer. The final two make later optimization measurable rather than aspirational.

## 11. Claims not established and unresolved questions

This research does **not** establish:

- any wall-clock speedup, because no task-duration baseline or experiment exists;
- that DomainSpec generally has DAG width one outside this FPR projection;
- an automated ready queue, scheduler, collision checker, lock manager, snapshot, or isolated runner;
- that FPR01-002 has a Task Session receipt or synchronized continuation status;
- that FPR01-003 or any later SWU is authorized;
- FPR-01 completion, production authorization, or authority promotion;
- that preparatory artifacts remain valid after predecessor decisions change; or
- that passing tests alone proves gate closure.

Still unresolved:

1. The accepted dispositions require canonical-definition reconciliation before FPR01-003 validates the machine registry; the formal DAG does not say whether this is an explicit predecessor (`evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md:116-127,352-373`).
2. Import-manifest repair is assigned to a separate bounded task, but its blocking relationship to FPR01-003 is not explicit (`evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md:419-459`).
3. The repository has no governed PREP lifecycle or freshness policy.
4. The exact owner and acceptance contract for adopting the FPR01-002 packet remain undefined.

## 12. Provenance and method

Three independent explorer lenses supplied the evidence corpus:

- **Eliyahu Goldratt:** formal dependency graph, antichains, critical path, and safe precomputation;
- **Carl Hewitt:** actor/resource concurrency, write and runner collisions, and concrete three-slot scheduling; and
- **Axel van Lamsweerde:** authority, permission, ownership, and exact unblocks.

The verbatim returns are preserved in [research.md](./research.md). Stafford Beer synthesized the system model. It was then attacked through three distinct reviewer vectors: **Philip Tetlock** on precedent and calibrated claims, **Karl Popper** on falsifiability and non-vacuity, and **Bertrand Russell** on definitional soundness. The converged result deliberately separates current evidence, manual procedure, buildable mechanisms, and absent proposals.

No finding in this document alters FPR completion, authority, continuation, or execution authorization.
