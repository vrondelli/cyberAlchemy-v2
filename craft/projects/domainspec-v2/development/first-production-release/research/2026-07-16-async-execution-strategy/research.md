# FPR Async Execution Strategy — Explorer Research

Dispatch: `2026-07-16-fpr-async-execution-strategy`

This file preserves the three explorer returns verbatim. It is evidence input, not synthesis, approval, or execution authority.

## Agent 1 — Goldratt, Eliyahu

## Current state

The formal FPR graph is a receipt-gated chain, not a parallel execution DAG. Craft owns continuation, while the work-pack is only a planning projection; any mismatch requires refresh before advancement (`foundation-execution/work-pack/shared/context.md:7-10`; `foundation-execution/WORK-PACK.md:106-111`).

Live artifacts disagree:

- `SWU-FPR01-001` has a complete/PASS receipt and deterministic census (`foundation-execution/runs/SWU-FPR01-001/TASK-SESSION-RESULT.md:3-17,53-70`).
- `SWU-FPR01-002` has an accepted Decision Gate, all five queues resolved, PASS, and handoff to `FPR01-003` (`evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md:1-17,478-492`).
- Its machine packet says `approved`, but explicitly says FPR-01 is incomplete and `FPR01-003` is not execution-authorized (`evidence/authority-source-dispositions.json:1-30,477-480`).
- Craft/work-pack/roadmap remain stale at “FPR01-001 selected/unexecuted” (`projects/domainspec-v2/.craft/ledger.yml:77-82,302-305`; `projects/domainspec-v2/CRAFT.md:36-39`; `foundation-execution/EXECUTION-PACK.md:64-69`).
- Read-only `git status --short -- <FPR paths>` shows both FPR01-002 artifacts as untracked; there is no `runs/SWU-FPR01-002/TASK-SESSION-RESULT.md`.

Therefore: dependency evidence suggests `FPR01-002` content is complete, but continuation closure is not proven. The authorized execution queue is empty until tracking/verification/state refresh and separate successor selection occur.

## Exact formal node/edge table

| Segment | Formal nodes and edges | Exit evidence/current state |
|---|---|---|
| FPR-01 | `01-001 → 01-002 → 01-003 → 01-004` | Only verified `01-004` ratification opens FPR-02 (`tasks/TASK-FPR-01-AUTHORITY-BASELINE.md:31-64`). `001` receipt PASS; `002` accepted but unsynchronized; `003/004` blocked. |
| FPR-02 | `02-001 → 02-002 → 02-003` | Entry is verified FPR-01 ratification; verified profile digest plus negative matrix opens FPR-03 (`tasks/TASK-FPR-02-SUPPORTED-PROFILE.md:14-16,28-52`). |
| FPR-03 | `03-001 → 03-002 → 03-003` | Entry is verified FPR-02 digest/matrix; `003` total-map receipt opens FPR-04 (`tasks/TASK-FPR-03-BUSINESS-SPEC.md:14-26,28-55`). |
| FPR-04 | `04-001 → 04-002 → 04-003 → 04-004` | Entry is verified FPR-03 direction/map receipt; only `004` independent retraction receipt closes the bounded projection (`tasks/TASK-FPR-04-SPEC-PROJECTION.md:14-30,32-73`). |

Expanded chain:

`FPR-00 → 01-001 → 01-002 → 01-003 → 01-004 → 02-001 → 02-002 → 02-003 → 03-001 → 03-002 → 03-003 → 04-001 → 04-002 → 04-003 → 04-004`.

The top-level edges independently confirm `FPR-01 → FPR-02 → FPR-03 → FPR-04` (`craft/expected-node-edge-manifest.yml:417-421`), and every artifact-chain arrow is receipt-gated rather than file-existence-gated (`foundation-execution/work-pack/shared/traceability.md:11-23`).

## Antichains and critical path

Formal DAG width is **1**. Every maximal executable antichain is a singleton containing the first unfinished node; the protocol selects exactly one SWU and synchronizes only from a verified receipt (`foundation-execution/EXECUTION-PACK.md:28-39`).

- Receipt-strict dependency frontier: `{FPR01-002}`.
- If the accepted but untracked FPR01-002 packet is verified and continuation-synchronized: `{FPR01-003}`.
- Authorized frontier now: `∅`, because the packet denies successor authorization and Craft is stale.
- Future antichains are singleton successors in the expanded chain above.

With no duration estimates, the structural critical path is the entire 14-SWU FPR-01–04 chain; every node is critical. Remaining length is 13 SWUs after verified `01-001`, or provisionally 12 after treating `01-002` content as complete. Wall-clock critical path is unknowable.

## Safe precomputation

These can run concurrently as **preparation**, never as node completion:

- FPR01-003 validator invariants, mutant catalog, and FPR01-004 receipt-verification checklist (`TASK-FPR-01-AUTHORITY-BASELINE.md:42-63`).
- FPR02-001 decision-field inventory and FPR02-003 negative-case plan; concrete schema authoring must wait for accepted decisions (`TASK-FPR-02-SUPPORTED-PROFILE.md:18-26,44-52`).
- FPR03 direction evidence/options, graph-schema questions, and CT-1/EC witness mapping plan (`TASK-FPR-03-BUSINESS-SPEC.md:18-40`).
- FPR04 source-manifest checks, independent-comparator protocol, and mutation catalog (`TASK-FPR-04-SPEC-PROJECTION.md:18-30,61-72`).

Each preparation result should be tagged with assumed predecessor digests, invalidated/rebased when the real receipt arrives, and forbidden from writing declared successor outputs or claiming acceptance.

## Ready-queue algorithm

```text
for each node in topological order:
  dependency_ready := every predecessor has a verified receipt/digest
  state_ready      := Craft, work-pack, wave, and roadmap agree
  authority_ready  := required Decision Gate and separate selection exist
  scope_ready      := exact write owner/scope is available
  evidence_ready   := required source artifacts exist and validate

  EXECUTE.enqueue(node) only if all five are true
  else PREP.enqueue(read_only(node)) when its static contract is known

on receipt:
  verify digest + positive/negative evidence
  refresh continuation/read models
  invalidate prep whose assumptions differ
  reconsider the unique successor
```

## Explicit unknowns

1. No duration/cost weights exist, so only structural—not temporal—critical-path analysis is possible.
2. FPR01-002 lacks tracked receipt/state synchronization; its exact lifecycle closure is unresolved.
3. The accepted decision says canonical definitions require reconciliation and FPR01-003 must validate the reconciled machine registry (`evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md:116-127,352-373`). That implies a possible missing Definitions-Governance predecessor not represented in the formal DAG.
4. Import-manifest repair is declared a separate bounded task, but the artifacts do not state whether it blocks FPR01-003 or remains side residue (`evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md:419-459`).
5. Preparatory activities have no governed sub-DAG or freshness contract; their concurrency is computationally safe only while explicitly non-executing and non-promotional.

## Agent 2 — Hewitt, Carl

## Verdict

The three subagent slots can be saturated with read-only research, review, and preparation, but safe FPR mutation concurrency is **one**. The work-pack explicitly allows only one selected SWU until a wave receipt closes, and every successor is receipt-gated (`projects/domainspec-v2/development/first-production-release/foundation-execution/WORK-PACK.md:96-110`). Governed `code` dispatch is also reserved, so no subagent lane currently owns code mutation (`implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/domainspec-subagents-strategy/SKILL.md:99-110`).

The live state is ahead of its planning read models:

- `SWU-FPR01-001` is complete (`foundation-execution/runs/SWU-FPR01-001/TASK-SESSION-RESULT.md:1-12`).
- The untracked FPR01-002 packet is approved but explicitly says FPR01-003 execution is **not authorized** (`evidence/authority-source-dispositions.json:17-30`).
- Craft still says “start SWU-FPR01-001” and gates all successors (`projects/domainspec-v2/.craft/ledger.yml:290-305`).
- Exact command evidence: `git status --porcelain=v1 --untracked-files=all -- projects/domainspec-v2/development/first-production-release` returned only the two untracked FPR01-002 files.

## Write/resource collision matrix

| Pair | Collision | Verdict |
|---|---|---|
| FPR01-002 disposition integration ↔ FPR01-003 baseline implementation | Paths differ, but 003 consumes approved 002 and is not authorized yet. | **Unsafe execution; serialize.** `TASK-FPR-01-AUTHORITY-BASELINE.md:31-54`; packet `:24-30`. |
| Any predecessor SWU ↔ successor SWU | Most paths are disjoint, but every FPR01→04 unit has an explicit receipt dependency. | **Unsafe as execution; safe only as read-only preparation.** `WORK-PACK.md:65-78`. |
| FPR01-003 writer ↔ its validator/reviewer | Same baseline, schema, tool, and fixtures can be observed mid-write. | **Unsafe until writer freeze; safe afterward read-only.** `TASK-FPR-01-AUTHORITY-BASELINE.md:42-53`. |
| FPR02-002 ↔ FPR02-003 | 003 consumes the validator/digest created by 002 and writes adjacent fixtures/evidence. | **Serialize.** `TASK-FPR-02-SUPPORTED-PROFILE.md:28-52`. |
| FPR03-002 ↔ FPR03-003 | Shared graph/schema namespace; 003 consumes the exact B manifest from 002. | **Serialize.** `TASK-FPR-03-BUSINESS-SPEC.md:28-55`. |
| FPR04-002 ↔ FPR04-003 | Hard file overlap under `impl/test-derivation-engine/src/spec-graph/`, plus sequential graph inputs. | **Hard collision; serialize.** `TASK-FPR-04-SPEC-PROJECTION.md:32-59`. |
| FPR04-003 ↔ FPR04-004 | Verifier files differ, but 004 consumes Sg/G/quotient and must remain independent of compiler ownership. | **Freeze first, then independent verification.** Same file `:61-73`. |
| Engine source mutation ↔ `build`/`vitest` | `build` emits shared `dist`; Vitest has an observed shared `node_modules/.vite/vitest/results.json`. | **Unsafe during mutation; one runner at a time.** `impl/test-derivation-engine/package.json:8-13`; `tsconfig.json:3-9`. |
| Static review ↔ root `typecheck` | `typecheck` is `tsc --noEmit`; both are read-only on a frozen source tree. | **Safe.** `impl/package.json:16-32`; `impl/tsconfig.json:2-11`. |
| Craft synchronization ↔ roadmap generation | Builder reads Craft and writes `roadmap-data.json` plus `roadmap.html`; those two writes are sequential, not transactional. | **Serialize after Craft settles.** `visibility/tools/build-roadmap.py:21-36,580-597,612-629`. `--check` is non-writing. |
| Concurrent dispatch close/inventory updates | Shared `telemetry/agents/subagents-dispatch.yaml` and `.arcanum/inventory/{index.json,index.md,log.md}` are already modified. | **Single parent writer.** Exact `git status --short` evidence; ledger appends must use the deterministic appender, not hand edits (`.../domainspec-subagents-strategy/SKILL.md:114-127`). |
| Concurrent Git/submodule publication | One shared master worktree/index; `implementation/domainspec` gitlink is advanced, `arcanum` is dirty. | **Serialize stage/commit/push.** Exact `git worktree list --porcelain`, `git diff --submodule=short`, and `git -C arcanum status` evidence; submodule-first/parent-last is required (`SUBMODULE-DISCIPLINE.md:18-25,60-63`). |

The future FPR validator commands are interfaces, not current executables (`foundation-execution/EXECUTION-PACK.md:41-50`). Exact filesystem evidence found the planned root `schemas/`, `tools/`, `fixtures/`, `graphs/`, `registries/`, and `manifests/` absent, and `impl/test-derivation-engine/src/spec-graph/` absent.

## Concrete three-slot schedule

| Epoch | Slot 1 | Slot 2 | Slot 3 | Parent/serialization gate |
|---|---|---|---|---|
| **Now** | Review FPR01-002 packet completeness | Prepare FPR01-003 baseline/schema/mutant design in chat only | Prepare FPR02 decision questions/input census only | Bind the untracked packet, refresh stale Craft/work-pack, explicitly authorize/select FPR01-003 |
| **Authorized mutation** | Upstream drift watch only | Successor research excluding mutable outputs | Owner/receipt checklist preparation | Parent or authorized Task Session is the sole writer |
| **Frozen candidate** | Run one positive/negative validator suite | Static exact-set/schema/digest review | Prepare next receipt/decision envelope | No source writes while checks run |
| **Gate close** | Independent receipt verification | Read-only downstream context pack | Roadmap `--check` after refresh | Parent integrates fixes, obtains owner decision, writes receipt, synchronizes Craft, regenerates roadmap, then selects next SWU |

Repeat this epoch pattern for every SWU. Never occupy two slots with separate mutations merely because their destination files differ.

## Operational failure modes

- **Stale-ready scheduling:** Craft launches completed FPR01-001 again or treats untracked FPR01-002 as synchronized authority.
- **Mid-write false green:** validators read a mixture of old/new baseline, graph, or generated output.
- **Runner-output race:** `tsc build` competes over `dist`, Vitest competes over shared cache, or dependency installation mutates shared `node_modules`/lockfiles.
- **Projection skew:** roadmap JSON and HTML are generated across a Craft change.
- **Lost shared-state update:** parallel Git staging, dispatch append, inventory rebuild, or submodule bump overwrites/unintentionally absorbs another run.
- **Independence collapse:** FPR04 compiler author or implementation is reused as the comparator oracle despite the explicit separate-verifier rule.
- **Preparation inflation:** downstream fixture design or research is reported as executed progress before predecessor receipt and authorization.

## Agent 3 — van Lamsweerde, Axel

## Authority verdict

Maximum safe concurrency is read-only epistemic work. FPR execution remains a receipt-serial authority spine. The current research dispatch authorizes analysis, not FPR mutation (`telemetry/agents/subagents-dispatch.yaml:3400-3412`).

The repository is currently split:

- `SWU-FPR01-001` has a complete, validated Task Session receipt (`projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-001/TASK-SESSION-RESULT.md:1-17,53-83`).
- Craft continuation authority is stale: it still reports FPR01-001 as unexecuted and keeps the context at `gate: block` (`projects/domainspec-v2/.craft/ledger.yml:290-305`; `projects/domainspec-v2/CRAFT.md:25,36`).
- The owner-disposition artifacts say all FPR01-002 choices passed, but explicitly deny FPR-01 completion, production authority, and next-SWU execution authorization (`projects/domainspec-v2/development/first-production-release/evidence/authority-source-dispositions.json:17-30`; `.../FPR01-OWNER-DISPOSITIONS-DECISION.md:463-491`). The registered dispatch additionally records that these files are untracked and planning is stale (`telemetry/agents/subagents-dispatch.yaml:3404-3406`).
- A Craft/package mismatch defers to Craft and requires plan refresh (`projects/domainspec-v2/development/first-production-release/foundation-execution/WORK-PACK.md:104-111`).

Therefore neither the technically present census nor the accepted-looking disposition packet presently opens FPR01-003.

## Permission matrix

| Activity | Status | Permitted boundary / exact unblock |
|---|---|---|
| Research | **Runnable now** | Read-only evidence gathering and synthesis are authorized by the registered `research` dispatch; they create no FPR authority or completion effect (`telemetry/agents/subagents-dispatch.yaml:3404-3412`). Research/local synthesis cannot become policy by proximity (`projects/domainspec-v2/authority/AUTHORITY-MODEL.md:60-64`). |
| Review | **Runnable now** | Read-only artifact attack is permitted, including review of the untracked FPR01-002 packet. Formal reviewer stages run only after their declared predecessors are ready (`.claude/skills/domainspec-subagents-strategy/SKILL.md:18-21`). Review cannot substitute for source-owner or ratification authority (`projects/domainspec-v2/authority/AUTHORITY-MODEL.md:54-64`). |
| Experiment | **Preparable only** | A hypothesis and criterion may be designed, but persisted pre-registration requires a separately confirmed `experiment` dispatch and frozen `criterion.md` (`.claude/skills/experiment/SKILL.md:18-23,57-72`). A probe requiring code execution remains blocked because the code runner/type is reserved (`.claude/skills/experiment/SKILL.md:151-160`). |
| Context preparation | **Preparable only** | Source selectors, obligations, write scopes, and validation commands may be assembled in research. A valid execution context requires a separately selected single SWU and Task Session; stale/contradictory context blocks before mutation (`arcanum/arcana/task-session/SKILL.md:69-85,104-109`). Immediate unblock: separately approve synchronization of the FPR01-001 receipt, refresh Craft, and select FPR01-002. |
| Fixture planning | **Preparable only** | Negative cases and expected codes may be sketched, but future commands are only planned interfaces until their owning SWU creates them (`projects/domainspec-v2/development/first-production-release/foundation-execution/EXECUTION-PACK.md:41-51`). Final fixtures remain predecessor- and owner-decision-bound; e.g. FPR-02 forbids schema authoring before its decision acceptance (`.../work-pack/tasks/TASK-FPR-02-SUPPORTED-PROFILE.md:18-27`). |
| Code mutation | **Blocked** | Current dispatch is read-only, and asynchronous `dispatch_type: code` is reserved and must be refused (`.claude/skills/domainspec-subagents-strategy/SKILL.md:39-50`). Local mutation can resume only after: (1) approved FPR01-001 state sync, (2) a bounded Task Session adopts/validates FPR01-002 and emits its receipt, (3) separate approved sync selects FPR01-003, and (4) an exact-scope FPR01-003 Task Session runs (`.../TASK-FPR-01-AUTHORITY-BASELINE.md:31-54`). Agent-dispatched mutation additionally requires owner promotion of `code` to LIVE. |
| Authority mutation | **Blocked** | The present decision explicitly changes no canonical definition, source, runtime, or production authority (`.../FPR01-OWNER-DISPOSITIONS-DECISION.md:11-17`). Authority moves only through DomainSpec-v2’s own owner route (`projects/domainspec-v2/authority/source-spine.md:34-53`), with source-kind, authority, derivation, layering, and convergence gates (`projects/domainspec-v2/authority/promotion-policy.md:24-45`). Unblock: named owner-route promotion after the relevant Task Session witness and review; generated projections may never be promoted by hand. |
| Verification | **Runnable now** | Non-mutating parse, digest, repeatability, and source-existence checks may run now, but are diagnostic only. Gate-effective verification requires the owning SWU’s artifacts, all done criteria, and its named independent verifier (`arcanum/arcana/task-session/SKILL.md:126-141`). FPR04 acceptance specifically forbids the compiler author/owner from serving as acceptance verifier (`.../TASK-FPR-04-SPEC-PROJECTION.md:61-73`). |
| Ratification | **Blocked** | FPR-01 ratification requires FPR01-003’s baseline, schema, validator, source census, dispositions, guard receipt, and negative controls bound by digest, then independently verified in FPR01-004 (`.../TASK-FPR-01-AUTHORITY-BASELINE.md:56-64`). Passing tests alone cannot establish runtime correctness or production satisfaction (`projects/domainspec-v2/authority/AUTHORITY-MODEL.md:40-47,152-165`). |
| Synchronization | **Blocked** | Continuation state may move only from a verified receipt and with separate approval (`projects/domainspec-v2/development/first-production-release/foundation-execution/EXECUTION-PACK.md:28-39,53-62`). The FPR01-001 receipt exists, so the immediate missing evidence is explicit approval for its Craft/plan synchronization; afterward FPR01-002 can be selected. The untracked FPR01-002 packet must then receive its own Task Session receipt and separate synchronization before FPR01-003 is selectable. |

## Safe immediate sequence

1. Continue parallel read-only research, artifact review, context indexing, fixture-plan sketches, and diagnostic verification.
2. Obtain a separate approved synchronization action that consumes the verified FPR01-001 receipt and refreshes Craft.
3. Run exactly one Task Session for FPR01-002, adopting and validating the existing owner selections rather than re-inferring them.
4. Synchronize FPR01-002 only from its verified receipt and separate approval.
5. Then select FPR01-003 for bounded local mutation. No asynchronous code-agent dispatch is authorized until `dispatch_type: code` becomes LIVE.
