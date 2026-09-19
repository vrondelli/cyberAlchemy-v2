# Bolina × DomainSpec formal modeling: findings

> **Research status:** source-bound proposed synthesis pending independent source replay and owner acceptance.
>
> The joined evidence closure marks this writer stage ready because the named synthesis and reviews were admitted. That readiness is a writing gate only. It does **not** establish a Bolina model, valid model syntax, a solver run, a killed mutant, bounded no-counterexample evidence, finite-state invariant checking, theorem proof, Zig conformance, filesystem correctness, exactly-once publication, security, owner acceptance, authority, adoption, promotion, publication, deployment, release, or production readiness.

## Executive finding

Bolina is a three-band identity, transport, and capability system. Its grant path binds a human-signed, single-use grant to an exact intent, executor, resource, action digest, nonce, and expiry. The source archaeology admitted into this research reports volatile `PENDING` admission, checks 0 through 10, durable grant consumption at check 11, and then effect handling. It also reports that the implementation performs the effect and durable publication tombstone before `beginExecuting`, while the normative lifecycle requires execution entry to precede the effect. That discrepancy is unresolved and is a separate implementation-conformance blocker; this research does not decide which bytes should change.

The smallest defensible formal-method pilot is:

1. a **TLA+/TLC-first Bolina projection** for ordering, crash, restart, time, recovery, resource interference, and the abstract no-bypass transition obligation;
2. a **separate Zig conformance lane** for CFG coverage, effect-entry reachability, exact call order, durability behavior, restart reconstruction, and correspondence between code and model; and
3. an **owner-gated Alloy deferral** until a distinct structural obligation is approved and shown to add discriminating evidence beyond the TLA projection and Zig lane.

This is a **build-from-owned** recommendation. Bolina already owns protocol meaning. DomainSpec already has the relevant obligation IR, case/evaluation/replay mechanics, formal-tool harness, and implementation-binding precedents. The missing work is Bolina-specific semantic extraction, projection, evaluation integration, and conformance evidence—not a new standalone formal-proof framework.

## Evidence basis and interpretation rules

The writer used the exact review bytes admitted by [evidence closure](./receipts/evidence-closure-retry-003.json):

| Input | Bound identity | Admitted scope |
|---|---|---|
| Bolina source | `projects/bolina@d9cff4ef37603e2725f737af48d92fbaefb46ecf` | Reported static source and test archaeology; not executed in this writer stage |
| DomainSpec source | `domainspec-core@3fe0d8399de8f8e75aebea4bf5e88a64f8b38184` | Owner and precedent classification |
| Supplied brief | `sha256:3c4c5d7018d98c546649ee1b6bf82dc8aa0bf57c0c45687e9b36b89d4ded931f` | Non-authoritative candidate brief, independently closed-input reviewed |
| [Precedent review](./receipts/reviewer-precedent.json) | `sha256:f768cf9681a325243f006b5e7a63d560ed3dc3d9083d4950ba8d51f6eda35480` | Source-level ownership and precedent classification |
| [Non-vacuity review](./receipts/reviewer-non-vacuity.json) | `sha256:d7b231b0d9a3fe702d8f8b8a07979e12241b66315562c441e3ab860d810ad474` | Proposed paper-executable contract; no model or solver evidence |
| [Proof-boundary review](./receipts/reviewer-proof-boundary.json) | `sha256:d15b3c1efb18b5b6cb002b47d1cf4d2bc5b3ec2a86383b5fb35ebd6b3b2e0acc` | Fresh closed-input review of claim boundaries, not source replay |

Source selectors quoted below are bindings carried by the joined evidence package. This writer did not independently reopen or replay the underlying archaeology. In particular, the proof-boundary reviewer followed no citations and did not independently verify the synthesis's source-reading claims.

The status vocabulary is deliberately strict:

| Status | Meaning here |
|---|---|
| **Specified** | A normative source or reviewed requirement states the behavior; contradictions may still be open. |
| **Observed** | Reported static inspection at a pinned commit; not a current execution result. |
| **Proposed** | A candidate artifact, mapping, model boundary, fixture, or process for later implementation. |
| **Executed** | A bound command actually ran and produced admitted evidence. No Bolina model, solver, mutant, or conformance action has this status. |
| **Absent** | The Bolina-specific artifact or evidence does not exist in the joined package. |
| **Blocked** | An owner decision, semantic contradiction, assumption, or prerequisite prevents a stronger claim. |

## Plain-language Bolina grant flow

The grant mechanism is meant to prevent a capability from drifting away from the exact action a human approved. A grant is tied to who may execute, what resource is affected, the action bytes, a nonce, and an expiry. The candidate formalization must keep those bindings visible rather than compressing them into an unexamined “authorized” flag.

The evidence package distinguishes two sequences:

| Sequence | Bound account |
|---|---|
| Normative obligation | Admit a volatile pending intent and resource lock; perform checks 0–10; durably consume the grant at check 11; enter `EXECUTING` only through the authorized transition; then attempt the effect, publish, tombstone, and finish. |
| Reported implementation order | Admit and verify; durably consume; perform the effect; publish and durably tombstone; call `beginExecuting` afterward. |

The second sequence is not silently normalized into the first. The discrepancy is bound to the reported comparison between `SPEC.md:1337-1349,1373-1481`, `src/verify.zig:182-263`, `src/dispatch.zig:232-249`, and `tools/prumo-verify:511-538` at the pinned Bolina commit. A future model can express the normative transition restriction; only a separately source-bound Zig conformance lane can determine whether all implementation paths correspond to it.

One further distinction is essential: the action effect is intended to be attempted at most once, while interrupted **publication/reporting** may be re-emitted until a durable published tombstone exists. The joined evidence does not support unconditional exactly-once external publication.

## Supplied-brief concordance and correction matrix

The supplied brief is a candidate input, not Bolina or DomainSpec authority. Its exact bytes were admitted to the fresh closed-input proof-boundary review. The following corrections are required before any derived plan is treated as semantically aligned:

| Candidate wording or assumption | Required correction | Why |
|---|---|---|
| Simplified `DONE` lifecycle | Preserve `APPROVED`, `EXECUTED`, and `EXECUTION_FAILED`, or publish an explicit abstraction map approved by the Bolina owner. | `DONE` is not established as a normative synonym. |
| “Consumed forever” | Say “not replayable while the grant remains acceptable under declared expiry, pruning, clock, and first-receipt assumptions.” | Expired consumed rows are intentionally pruned. |
| Exactly one interrupted effect/publication | Preserve at-most-one **action-effect attempt**, but describe recovery publication as at-least-once re-emission until durable tombstone; any stronger external guarantee is an owner gate. | The supplied brief conflicts with the synthesis-reported source and inspected-test behavior. |
| “All interleavings” | Say “all reachable states and interleavings within the exact finite model, constants, bounds, configuration, and declared assumptions after exhaustive solver completion.” | A finite configured run is not an unbounded universal result. |
| “Crash-safe by construction” | Say “checked for the exact storage model and assumptions, pending separately bound implementation-conformance evidence.” | Rename alone does not establish complete writes, sync behavior, directory-entry durability, device semantics, clock behavior, or code correspondence. |
| “Converts tested into proved” | Say “adds counterexample search or finite-state invariant evidence for the exact model and configuration.” | Model checking neither turns implementation tests into a theorem nor establishes implementation correctness. |
| BE-GRANT-03 is outside the model | Model the abstract no-bypass transition obligation; keep Zig CFG, reachability, ordering, and refinement checks separate. | A state model can express the transition restriction but cannot establish correspondence to every Zig execution path. |
| A “known-good” fixture | Use `proposed_positive_reachability_fixture` until the fixture is implemented and executed. | The candidate witness is currently descriptive and includes unresolved lifecycle semantics. |
| “Externally reviewed” | Use `independently_closed_input_reviewed` unless a genuinely external reviewer is bound. | A fresh native reviewer is independent of the synthesizer but not necessarily external. |
| Generated model as protocol authority | Treat every generated model as a non-authoritative projection with source bindings, preservation mapping, discrepancies, and an owner acceptance gate. | Bolina source owners retain protocol meaning. |

## Current evidence and status matrix

| Surface | Current status | Finding |
|---|---|---|
| Normative lifecycle and BE-GRANT families | **Specified, with unresolved contradictions** | Section 11.4 owns an open model-checking obligation distinct from tests and soak. |
| Bolina architecture and grant path | **Observed by reported static inspection** | Bound to the pinned Bolina commit; no code or test execution occurred in this writer stage. |
| Brief concordance | **Independently closed-input reviewed** | Corrections are identified, but the brief remains non-authoritative. |
| TLA model and configurations | **Absent** | No exact `Init`, `Next`, enabledness, invariant formulas, fairness configuration, or model files are in evidence. |
| Bolina model syntax validation and solver execution | **Absent** | No Alloy or TLC command ran for Bolina. |
| Positive witnesses and mutants | **Proposed, unexecuted** | Expected outcomes are specified; none is witnessed or killed. |
| Zig implementation conformance | **Absent and blocked** | A reported lifecycle-order discrepancy must be resolved or explicitly accepted before correspondence can pass. |
| Generic Alloy/TLA wrappers, fixture schema, and bounded receipt precedents | **Already deployed as repository research harness** | This does not mean Bolina adapters, external deployment, adoption, or production readiness. |
| Bolina semantic extractors/projections | **Absent** | These are the principal new integration artifacts. |
| Canonical generic formal evaluator | **Absent** | Existing evaluation, receipt, and replay mechanics must be composed; they must not be duplicated. |
| Security, theorem proof, authority, promotion, and owner acceptance | **Not established** | Each belongs to a separate evidence or authority route. |

## Interpretation of Bolina section 11.4

Section 11.4's open model-checking obligation is separate from unit/integration tests and differential soak. The admitted interpretation covers BE-GRANT-01, BE-GRANT-03, BE-GRANT-04, and BE-GRANT-06 families, including crash and restart behavior, ordering around durable consumption and effect entry, no bypass into execution, volatile pending-state loss, and resource exclusivity.

The minimum selection is TLA+/TLC first because the proposed pilot is dominated by ordered transitions, temporal behavior, crash/restart cuts, bounded time, recovery, and two-resource interference. This is a Bolina-specific scope choice, not a claim that Alloy cannot express temporal behavior. Alloy 6 supports temporal models; a Bolina Alloy adapter is deferred because the joined evidence establishes no distinct structural obligation that would justify one in the minimum pilot.

Abstract no-bypass belongs in the model: only an authorized transition may enter `EXECUTING`. The stronger implementation claim—every Zig path to `EXECUTING` or effect entry corresponds to that transition—belongs in a separate CFG/reachability/refinement lane.

## BE-GRANT obligation map

| Marker | Candidate formal obligation | Boundary |
|---|---|---|
| BE-GRANT-01 | Durable consumption precedes effect; at most one action-effect attempt; restart cannot make a still-acceptable consumed grant executable; expiry check 10 precedes ledger check 11. | Publication retry is not the action effect. |
| BE-GRANT-01a | Never automatically retry an orphaned action; release the volatile lock; do not report after a durable tombstone; eventual reporting requires explicit stability and fairness. | Permanent crash or permanent external refusal is outside the liveness claim. |
| BE-GRANT-03 | Only the verification/start transition enters `EXECUTING`; checks 0–10 precede durable check 11; commit precedes effect; failures cannot fabricate an orphan. | Zig reachability and refinement remain separate. |
| BE-GRANT-03a | Lifecycle and resource remain frozen during verification; no timeout or lock-reacquisition window appears before `EXECUTING`. | Requires exact enabledness and transition definitions. |
| BE-GRANT-03b | No persistent verified-token state exists; verification completion and execution start share one modeled control frame. | The abstraction map must address the reported implementation order. |
| BE-GRANT-04 | Restart clears volatile `PENDING` state and locks and reconstructs no pending intent. | Restart does not logically reconstruct `EXPIRED` without an owner-approved rule. |
| BE-GRANT-06 | No two active intents share a canonical resource; conflicts are rejected; different resources can progress concurrently. | Two intents and two resources are required to avoid vacuous scope. |
| BE-GRANT-06a | At the pending deadline, `PENDING` becomes `EXPIRED` and releases its lock; eventual expiry needs explicit time fairness. | Deadline must lie within the finite time bound. |
| BE-GRANT-06b | At most one active pending intent exists per `intent_id`. | Identity and resource uniqueness must not be encoded as facts that make the checks tautological. |

## Minimum TLA+/TLC model candidate

This section is a reviewer-specified paper-executable contract, not an implemented model.

### Finite scope

| Dimension | Candidate bound |
|---|---|
| Intents | `i1`, `i2` |
| Grants | `gLive`, `gOld` |
| Resources | `r1`, `r2` |
| Epochs | `e0`, `e1` |
| Time | `0..2`, monotonic and capped; `gOld` expires at 1 and `gLive` remains acceptable through a D-063 crash at time 1 |
| Counters | `0`, `1`, `2`, where `2` means two-or-more |
| Storage phases | `idle`, `temp_partial`, `temp_complete`, `temp_synced`, `renamed`, `directory_synced`, `legacy_truncated` |

### State map

| State | Purpose |
|---|---|
| `intentMode[i] ∈ {Absent, Pending, Verifying, Executing, Executed, Failed, Rejected, Expired}` | Observe lifecycle transitions without inventing a `DONE` synonym. The role of `APPROVED` remains an owner decision or explicit abstraction-map obligation. |
| `resourceOf[i]`, `lockOwner[r]` | Check canonical-resource exclusion, lock retention, restart release, and non-global serialization. |
| `verificationPC[i] ∈ {none, 0..11, done}` | Make checks 0–10 and durable check 11 independently observable. |
| `stableConsumed`, `stablePublished`, `everCommitted ⊆ Grants` | Separate durable consumption, durable publication tombstones, and historical commit. |
| `effectCount[g]`, `interruptedPublicationCount[g]` | Separate action-effect attempts from recovery publication attempts. |
| `validExecutingEntry[i]` | Detect bypass into execution. |
| `commitSeenBeforeFirstEffect[g]` | Detect effect-before-commit. |
| `executingSeenBeforeEffectOrPublication[g]` | Detect effect/publication before execution entry. |
| `processUp`, `epoch`, `now` | Express crash, restart, bounded time, and liveness configurations. |
| storage phase, stable ledger image, candidate ledger image | Express complete writes, sync, rename, directory sync, malformed/partial residue, and the legacy truncation mutant. |
| `lastAction` | Support action coverage, trace classification, and exact expected-counterexample checks. |

### Initialization and action map

`Init` must start with all intents absent, locks free, counters/history bits zero or false, durable sets empty, the process up in `e0` at time 0, and storage idle with no candidate image. No target invariant may be smuggled into `Init` as a fact.

| Action | Required semantics |
|---|---|
| `ReceiveIntent` | Admit only when the canonical resource has no active owner. |
| `BeginVerify` | Preserve the resource lock and initialize `verificationPC`. |
| `VerifyCheck(k)`, `k = 0..10` | Advance exactly one check; do not commit or execute. |
| `CommitConsumedCheck11` | Add a grant only after a complete checked write and successful sync. |
| `EnterExecuting` | Require completed verification and durable consumption; be the only base action setting valid execution entry. |
| `AttemptEffect` | Require valid execution entry and durable consumption; increment the action-effect counter. |
| `PublishEffect` / `MarkPublished` | Keep external publication and durable tombstoning separately observable. |
| `FinishExecutedOrFailed` | Enter the explicit terminal state and release the volatile lock. |
| `ExpirePending` | Require `now` at or beyond the deadline and release the lock. |
| `Crash` / `Restart` | Preserve only declared durable state; do not reconstruct `PENDING`. |
| `RecoverPublishInterrupted` | Increment only recovery-publication count; never retry the action effect. |
| `RecoverMarkPublished` | Durably record the publication tombstone. |
| Safe-prune actions | Keep temp write, temp sync, rename, and optional directory sync as separate steps. |

The base model must check at least `CommitBeforeEffect`, `AtMostOneActionEffectAttempt`, `ConsumedEvidenceSurvivesRestartWhileGrantAcceptable`, `NoUnauthorizedExecuting`, `RestartClearsPending`, `ResourceExclusive`, `VerificationLockHeld`, `ExecutingPrecedesEffectAndPublication`, `NoRecoveryPublicationAfterDurableTombstone`, and `RecoveryNeverRetriesActionEffect`.

### Fairness and storage configurations

Safety runs use no fairness assumptions. Pending-expiry liveness uses monotonic bounded time, a deadline inside the bound, weak fairness on `AdvanceTime` until the cap, and weak fairness on `ExpirePending` once enabled. Orphan-reporting liveness additionally requires an eventual stable-process interval, eventual external-publication availability, and weak fairness for recovery publication and tombstoning. One fairness bundle must not be applied to every run or used to hide a safety mutant.

Storage must be partitioned into explicit configurations:

- With parent-directory fsync, only a synced namespace mapping may survive after directory sync.
- Without parent-directory fsync, a crash after rename may expose the old or new mapping, but every allowed outcome must retain each still-acceptable consumed grant.
- The D-063 legacy mutant may expose an empty or partial live ledger after truncation and must be rejected by the named durability property.

Complete checked writes, successful sync, same-filesystem rename, fail-closed malformed residue, nondecreasing clock behavior, and first-receipt semantics are explicit assumptions or owner gates—not ambient facts.

## Positive witnesses and discriminating fixtures

Every row below is a **specified expected outcome**, not an executed result.

| Fixture | Discriminating behavior | Expected later result |
|---|---|---|
| `proposed_positive_reachability_fixture_single_use_grant` | Receive `i1/r1`; run checks 0–10; durably consume `gLive`; enter execution; attempt one effect; publish; tombstone; finish. | Base safety passes and the exact witness is reachable with `effectCount[gLive] = 1`. |
| `proposed_positive_reachability_fixture_two_resources` | Admit `i1/r1` and `i2/r2`; demonstrate both can progress. | Positive witness prevents accidental global serialization. |
| `proposed_positive_reachability_fixture_pending_expiry` | Without restart, advance time to the pending deadline and expire with lock release. | Pass only in the dedicated fair-liveness configuration. |
| `pre_fix_D_063_truncate_before_rewrite_crash` | Truncate the live ledger before a complete replacement is synced; crash while `gLive` is acceptable. | Named durability invariant produces the expected TLC counterexample; parser/config/runtime failure does not count. |
| `bypass_edge_to_EXECUTING` | Change intent mode without checks 0–11 or valid entry. | `NoUnauthorizedExecuting` produces the expected counterexample. |
| `persisted_PENDING_across_restart` | Retain pending state or its lock across an epoch change. | `RestartClearsPending` produces the expected counterexample. |
| `two_active_intents_one_resource` | Admit `i2/r1` while `i1/r1` is active. | `ResourceExclusive` produces the expected counterexample. |
| `durable_commit_after_effect` | Increment effect count before check-11 durable commit. | `CommitBeforeEffect` fails at the effect transition. |
| `interrupted_publication_then_crash_before_tombstone` | Publish during recovery, crash before tombstone, then publish again after restart. | Kill unconditional exactly-once publication; retain at-least-once-until-tombstone semantics plus no action-effect retry. |
| `effect_and_tombstone_before_EXECUTING` | Effect, publication, and tombstone precede execution entry. | `ExecutingPrecedesEffectAndPublication` produces the expected model counterexample; the separately bound Zig lane is expected to expose the reported implementation discrepancy, but no conformance run exists yet. |
| `always_refuse_machine` | Route every valid input only to rejection. | Fail the positive-witness and nonzero-action-coverage gate even if safety stays green. |
| `timeout_action_absent` | Remove `ExpirePending` while time can advance. | `PendingEventuallyExpires` produces an expected counterexample only in its fair-liveness configuration. |
| `projection_drops_source_clause_or_lifecycle_state` | Omit a source-bound item in the adapter. | Fail source-manifest, preservation-map, and parse-completeness gates before solver execution; do not mislabel this as a solver invariant failure. |

Anti-vacuity acceptance also requires:

- at least two intents and two resources for exclusivity and non-global-serialization claims;
- every mutant to be reachable from honest `Init`, rather than starting in an impossible bad state;
- invariants not encoded as facts;
- separate actions for commit, execution entry, effect, publication, tombstone, and terminalization;
- nonzero coverage of verification, durable commit, execution entry, effect, publication, tombstone, and terminal actions;
- a positive witness plus queue exhaustion and generated/distinct-state counts; and
- recorded symmetry and state constraints that preserve every named witness and mutant.

## TLA+/TLC versus Alloy

| Decision | Finding |
|---|---|
| **Keep: TLA+/TLC-first pilot** | Use TLA+ Tools `1.7.4`, matching the repository owner pin recorded by the precedent review. The pilot targets temporal ordering, crash/restart cuts, time, recovery, and interference. |
| **Keep separate: Zig conformance** | Model checking can reject an abstract bypass but cannot establish that every Zig CFG path or storage behavior refines the abstraction. |
| **Merge: shared typed obligations** | Exact-binding and relational-uniqueness obligations belong in the shared obligation set and can be exercised by the TLA-first pilot. Tool projections, configurations, and receipts stay tool-specific. |
| **Defer: Bolina Alloy adapter** | The admitted review records Alloy `6.2.0` as the official released build at review time, but establishes no distinct Bolina structural obligation for the minimum pilot. |
| **Owner gate for future Alloy** | Require a distinct structural obligation, preservation map, adequacy tests, exact scope/configuration, and a separate claim-limited receipt before adding the adapter. |

No future TLC or Alloy result may be summarized as “proof” without its exact claim type. `bounded_no_counterexample` requires exact scope, bounds, assumptions, configuration, completed command, and result binding. `finite_state_invariant_checked` additionally requires exhaustive exploration of the exact finite graph and queue exhaustion. Neither is `theorem_proved`.

## Build-from-owned DomainSpec integration

### Owner and dependency map

| Surface | Existing owner or precedent | Required treatment | Gate |
|---|---|---|---|
| Protocol meaning and section 11.4 | Bolina SPEC, decision log, and implementation sources | Generate non-authoritative semantic projections. | Bolina owner resolves contradictions and accepts the projection boundary. |
| Constraint and Obligation | Active test-derivation engine and evolvable-validation research | Extend/project the deterministic Obligation IR; preserve `obligation_key` and closed-union owner gates. | No second formal Obligation IR. |
| Model cases and evaluation | Existing `TestCase` and case/evaluation patterns | Specialize a `ModelCheckCase`; attach tool-native output. | No independent case identity or verdict semantics. |
| Alloy/TLA execution | Existing Alloy/TLA research tower | Reuse pinned wrappers, shared fixture schema, and bounded tool receipts. | Add only Bolina semantic extractors/projections. |
| Proof receipts, stale detection, replay | SFOL proof/replay mechanics, source manifests, and research-evidence harness | Reuse digest binding, set-equality/freshness patterns, stale diagnostics, and replay admission without claiming SFOL is generic. | One claim-limited evaluation receipt family. |
| Implementation identity and cases | Code-tag owner and implementation-conformance package; minted-project already owns a namespaced `ConformanceCase` | Reconcile `ImplementationBinding`; namespace any formal conformance case. | No generic `ConformanceCase` collision. |
| Source binding | Existing private Mint authority-package design already uses `SourceBinding` with authority-effect semantics | Use `FormalSourceBinding` unless a shared-owner decision explicitly reconciles the name. | Naming and ownership decision. |
| Acceptance | Bolina and DomainSpec owners | Record acceptance as a separate event bound to exact candidate bytes. | Receipts do not create authority or acceptance. |

### Candidate artifact shapes

These are illustrative interface shapes for owner review, not canonical types or implemented schemas.

| Candidate | Minimum proposed fields | Ownership constraint |
|---|---|---|
| `FormalSourceBinding` | binding ID; source repository and commit; path/selectors; source digest; authority role; extraction version | Namespaced to avoid the existing private `SourceBinding` meaning. |
| `SourceDiscrepancy` | discrepancy ID; normative binding; observed binding; category; impact; open owner question; status | Preserves contradictions instead of resolving them in generation. |
| Existing `Constraint → Obligation` projection | existing obligation key; bound source IDs; BE-GRANT family; formalization status; coverage/residue | Must enter the deterministic Obligation IR and its closed-union gate. |
| `ModelProjection` | projection ID/version; obligation keys; tool; model/config digests; preservation map; assumptions; bounds; known discrepancies | Non-authoritative, replayable projection of pinned sources. |
| `ModelCheckCase` specialization | existing case identity; projection/config binding; fixture kind; mutant identity; expected claim/property; verdict rule | Specializes existing case/evaluation semantics. |
| Code-tag-owned `ImplementationBinding` | source commit; code-tag/selectors; correspondence-map digest; build/toolchain binding | Reconciled with implementation-conformance ownership. |
| Claim-limited `EvaluationReceipt` | all input/tool/config/model/fixture digests; exact command/exit; exploration completion; state counts; action coverage; witness or counterexample digest; typed claim; stale/replay status | Records evidence only; never implies correctness, security, acceptance, or authority. |
| Separate owner-acceptance event | candidate digest set; accepted scope; decision; owner identity; timestamp; supersession/freshness rule | Must be renewed when acceptance-bound bytes change. |

The resulting pipeline is:

`FormalSourceBinding + SourceDiscrepancy → existing Constraint/Obligation IR → tool-specific ModelProjection → existing TestCase-specialized ModelCheckCase → existing formal-tool runner → claim-limited EvaluationReceipt → existing stale/replay admission → separate owner acceptance`

The Zig lane joins only through a separately source-bound `ImplementationBinding` and implementation-conformance cases. A model result does not implicitly cross that bridge.

## Drift and reproducibility contract

Every later run must bind:

- the exact Bolina and DomainSpec source commits and source-manifest selectors;
- the supplied-brief digest when the brief remains an input;
- model, module, configuration, preservation-map, and read-set digests;
- TLA+ Tools distribution/version (`1.7.4` for this candidate), executable identity, and environment assumptions;
- constants, finite bounds, symmetry/state constraints, fairness configuration, storage configuration, mutant, and fixture;
- exact command, exit status, queue exhaustion, generated/distinct-state counts, and action coverage;
- positive-witness trace digest for positive cases; and
- named property plus counterexample trace digest for expected-negative cases.

Parser failure, configuration failure, deadlock not named by the case, timeout, incomplete search, resource exhaustion, or an unrelated invariant failure is not a killed mutant. Base, mutant, liveness, and Zig-conformance receipts remain separate.

Any drift in an acceptance-bound source, projection, configuration, tool, fixture, mutant, correspondence map, or result invalidates freshness for the affected claim. Replay admission may establish that exact evidence is current under its declared policy; it still does not create protocol meaning or owner acceptance.

## Phased implementation proposal

No phase below is authorized by this findings artifact.

### Phase 0 — owner decisions

Resolve or explicitly defer:

- at-least-once-until-tombstone versus any stronger external-publication guarantee;
- `APPROVED`, verification-in-progress, and crash-state semantics;
- retention and no-replay after expiry and pruning;
- the reported effect/tombstone-before-`beginExecuting` discrepancy;
- filesystem, device, complete-write, rename, directory-fsync, malformed-tail, clock, and first-receipt assumptions;
- owners and repository placement for projections, model files, conformance artifacts, receipts, and acceptance; and
- the distinct structural obligation required before any Alloy adapter.

**Gate:** no semantic projection or canonical placement until the relevant owner accepts the unresolved choices.

### Phase 1 — source binding and obligation integration

Create a candidate `FormalSourceBinding`, discrepancy ledger, parse-completeness checks, preservation map, and projection into the existing deterministic Obligation IR. Preserve every selected lifecycle state, property marker, and source discrepancy.

**Gate:** exact source inventory, no dropped selectors, stable obligation keys, closed-union owner admission, and explicit non-authority labeling.

### Phase 2 — paper-executable TLA candidate

Implement exact typed `Init`, `Next`, action enabledness, history variables, invariants, temporal properties, finite bounds, storage configurations, and separate safety/liveness configurations. Keep commit, execution entry, effect, publication, tombstone, and terminal actions independently observable.

**Gate:** syntax/configuration validation, model review, no invariant encoded as an initial fact, and an accepted abstraction map for unresolved lifecycle terms.

### Phase 3 — witnessed base and mutant evaluation

Reuse the existing TLA runner and fixture/receipt tower. Run the positive witnesses and named reachable mutants. Require queue exhaustion, state counts, action coverage, exact witness/counterexample binding, and failure classification.

**Gate:** positive reachability plus each mutant killed by its named property; no parser/runtime failure counted as evidence.

### Phase 4 — separate Zig conformance

Bind the exact Zig commit/toolchain and code tags. Check CFG paths to execution/effect entry, exact call order, durable-commit failure cuts, restart reconstruction, pruning fault injection, canonical-resource concurrency, and correspondence to model actions.

**Gate:** a reviewed correspondence map and separate conformance receipts. Model evidence alone cannot open this gate.

### Phase 5 — optional Alloy decision

Only if an owner identifies a distinct structural obligation, define a separate Bolina Alloy projection, adequacy tests, scope, preservation map, and receipt. Do not add Alloy merely to duplicate exact-binding or resource-exclusivity checks already covered by the typed obligation set and TLA pilot.

**Gate:** distinct discriminating evidence and explicit owner approval.

### Phase 6 — acceptance, not automatic promotion

Join source, model, mutant, and conformance evidence without collapsing their claim types. Ask the appropriate Bolina and DomainSpec owners to accept exact candidate bytes and declared scope.

**Gate:** a separate acceptance event. Passing receipts do not promote or publish anything.

## Risks, evidence gaps, and typed negatives

| Risk or gap | Current consequence | Required response |
|---|---|---|
| Underlying source archaeology was not independently replayed by the fresh proof-boundary reviewer. | Source claims remain synthesis-reported at pinned commits. | Replay source selectors independently before owner acceptance. |
| No exact `Init`, `Next`, formulas, model, or configuration exists. | Non-vacuity and model adequacy are not established. | Implement and review the paper-executable contract. |
| No solver or mutant ran. | No bounded no-counterexample or killed-mutant claim is available. | Execute through the bound harness with typed receipts. |
| Normative lifecycle and reported code order disagree. | Implementation conformance is blocked. | Bolina owner resolves semantics; Zig lane checks exact correspondence. |
| Interrupted publication semantics conflict. | Unconditional exactly-once publication is killed. | Preserve action-effect at-most-once and publication at-least-once-until-tombstone until an owner decides otherwise. |
| Filesystem, clock, and first-receipt assumptions are unresolved. | Crash/prune safety cannot pass honestly. | Partition configurations and bind owner-approved assumptions. |
| Fairness can hide safety errors or overstate liveness. | A single green run would be non-discriminating. | Separate safety and liveness configurations and bind stability assumptions. |
| An over-constrained or always-refuse model can pass safety vacuously. | Green invariants alone are insufficient. | Require positive witnesses and nonzero action coverage. |
| A model abstraction can diverge from Zig. | Solver evidence does not establish code correctness. | Maintain the separate conformance lane. |
| New generic types could duplicate existing DomainSpec owners. | A standalone pipeline would violate precedent and drift semantics. | Merge with the existing obligation, case, receipt, replay, runner, and binding owners. |
| `SourceBinding` and `ConformanceCase` names already have owned meanings. | Unqualified reuse risks semantic collision. | Use `FormalSourceBinding` and owner-aligned/namespaced formal conformance cases. |

Typed negative claims for this research are:

- **Absent:** Bolina model files, syntax validation, solver runs, Bolina solver receipts, killed mutants, canonical formal evaluator, and Zig-to-model conformance evidence.
- **Not established:** bounded no-counterexample, finite-state invariant checked, theorem proved, filesystem correctness, exactly-once external publication, security, owner acceptance, authority, adoption, promotion, publication, deployment, release, and production readiness.
- **Deferred:** Bolina Alloy adapter and implementation conformance, each behind its named gate.
- **Killed as current recommendations:** unconditional exactly-once interrupted publication; composite actions that hide commit/effect/publication/tombstone/execution order; safety-only or always-refuse acceptance; impossible-`Init` negative fixtures; a new standalone DomainSpec formal-proof pipeline; any inference from bounded research to universal correctness or authority.

## Research verdict matrix

| Candidate | Owner | Witnessed now | Soundness finding | Verdict |
|---|---|---|---|---|
| TLA+/TLC-first Bolina pilot | Bolina section 11.4 plus the existing DomainSpec Alloy/TLA research tower | Positive and negative fixtures are specified, not implemented or executed. | Sound as a bounded proposal only after exact `Init`, `Next`, assumptions, bounds, fairness, coverage, and receipt gates are added. | **KEEP — BUILD FROM OWNED** |
| Bolina Alloy adapter in the minimum pilot | Existing Alloy runner/fixture tower; no Bolina structural-adapter owner yet | No distinct structural obligation or discriminating counterexample is established. | Not justified in minimum scope. | **KILL FROM MINIMUM PILOT — DEFER FUTURE** |
| Unconditional exactly-once interrupted publication | Bolina protocol owner | Reported source/test behavior instead supports re-emission until durable tombstone; no formal counterexample was executed. | Unsound as a current claim. | **KILL** |
| New standalone DomainSpec formal-proof pipeline | Existing Obligation IR, Alloy/TLA tower, SFOL proof/replay, code-tag, and implementation-conformance owners | Precedent review found owned layers and Bolina-specific projection/integration gaps. | Duplication would violate current ownership and identity semantics. | **MERGE — BUILD FROM OWNED** |
| Research or bounded model checking establishes security, theorem proof, Zig correctness, conformance, or authority | Separate Bolina, DomainSpec, security, conformance, and acceptance owners | No model, solver, conformance, security, or owner-acceptance evidence exists. | Unsupported. | **KILL** |

## Final recommendation

Proceed only as an owner-gated, build-from-owned research implementation proposal: bind Bolina sources, preserve discrepancies, project into the existing DomainSpec obligation machinery, implement the exact TLA candidate and anti-vacuity fixtures, evaluate it through the existing formal-tool harness, and keep Zig conformance separate. Defer Alloy until it has a distinct owner-approved structural job.

The immediate value of this research is not a proof result. It is a corrected boundary: what Bolina asks to be modeled, which claims a bounded model could later support, which implementation questions it cannot answer, which DomainSpec owners must be reused, and which decisions remain human-owned.
