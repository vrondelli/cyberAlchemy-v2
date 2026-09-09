## Agent 1 — Turing, Alan

Pinned snapshot verified: `33a17db3bb47a67270fc1e99fa0fd5f5446d7cf2`. Read-only inspection; no source-repository mutations.

Evidence key: **[P]** prose/design claim, **[C/T]** code or test, **[O]** observation in this inspection.

| Dimension | Evidence and assessment |
|---|---|
| Objective/work unit | **[P]** `README.md:5-10`; `plans/subagent-work-infrastructure/README.md:153-166`: task → Workflow Graph → immutable Dispatch → Run; Agent Node is the bounded responsibility unit. This is a candidate product model, not runtime proof. |
| Authority/approval | **[P]** `plans/.../README.md:67-76,243-302`: graph is intended authority envelope, Dispatch binds exact snapshot/digests, runtime may restrict/refuse but not invent behavior. Human approval is configurable, including none. **Conflict:** `CRAFT.md:312-328` and `.craft/ledger.yml:1880-1894` say no-approval cannot satisfy exact Confirmation View binding; `reviews/2026-08-31-project-proposal/review.md:101-108,207-217` calls free-form “established objective” a blank cheque. |
| State/identity | **[P]** `research/agent-invocation-and-collaboration-topology/findings.md:41-63`: node, Run invocation, attempt, provider observation, and routing identity must differ. **[C/T]** `experiments/message-delivery-lifecycle/criterion.md:20-41` defines command/key/message/publication/delivery/attempt/invocation/artifact identities with cardinality rules; `probe/store.py:115-145` implements key reuse and conflict detection locally. |
| Dependency/scheduling | **[P]** `research/...invocation.../findings.md:32-39`: readiness, routing, payload, visibility, repetition, and failure are separate relation facets. `plans/.../README.md:196-200` grants scheduler freedom except independence-sensitive simultaneity. **Contradiction:** `reviews/2026-08-31-project-proposal/review.md:231-240` shows order/retry timing can alter freshness, cost, shared state, and outputs; schedule invariance remains unproved. |
| Evidence/observability | **[C/T]** `criterion.md:43-75,109-138` gives producer-owned raw facts, causal edges, closed checkpoints, bounded unknowns; `probe/store.py:16-93,160-194,307-318` provides durable SQLite append/transaction/checkpoint mechanics. **[P]** `research/artifact-lineage-and-relation-semantics/findings.md:28-34` preserves task→Dispatch→Run→attempt→output→validation→acceptance distinctions. |
| Partial failure/cancel/repair/resume/join | **[P]** `plans/.../README.md:124-127,346-350` requires honest recovery but globally defaults after retries to proceeding without missing input. `CRAFT.md:302-332` says joins, retry context, and provider-neutral resume have no typed contract. `.craft/ledger.yml:1660-1686,1979-1997` selects logical-agent continuity but leaves crash/expiry/compaction/rehydration open. Cancellation/waiver states appear only as candidate obligation semantics (`research/event-driven-obligations-and-task-orchestration/findings.md:19-28,52-58`). |
| Context isolation | **[P]** `research/prompt-and-context-control-plane/findings.md:8-29` requires exact sources, selectors, transformations, omissions, ordering, and integrity; relevance/possession is not authority. `plans/.../README.md:208-226` separates mandatory inputs, optional discovery, forbidden inputs, and relation-derived recipients. **Negative:** `reviews/2026-08-31-project-proposal/review.md:144-151` demotes “dynamic data cannot bypass instructions” because host evidence cannot prove model use. |
| Operating cost | **[O]** 1,288 tracked files; message-lifecycle experiment is 714 files / 4.24 MB, with recorded runs 3.94 MB of 8.11 MB total. **[P]** `seed-hypothesis.md:99-103,256-269` correctly demands history change a future decision; review recommends tiered lineage (`reviews/...project-proposal/review.md:242-254`). The rich evidence apparatus risks becoming the product unless removal tests are enforced. |
| Proven versus claimed | **[O/C/T]** Focused projector tests: 3/3 pass when invoked with the required `PYTHONPATH`; they prove bounded-unknown snapshot behavior and import separation only (`tests/test_projector.py:12-69`). Replication-v2 on Linux: 11/13 pass, one Windows absolute-path assertion fails and one special Git ref is absent—portability/setup coupling. **[P/O]** Main experiment verdict is deliberately `INVALID`, despite 25 exact matches, because freeze ordering was not independently observable (`experiments/.../findings.md:3-21,99-110`). No production orchestration runtime exists. |

Lesson candidates:

1. Reuse the authority-preserving compilation rule: compilation can reject/restrict, never add tools, recipients, scopes, budgets, or effects (`research/...invocation.../findings.md:23-30`).
2. Preserve identity strata and bounded unknowns; absence of next-boundary evidence is not failure (`criterion.md:128-138`).
3. Bind immutable authorization separately from mutable launch eligibility, idempotent consumption, revocation, and replay fencing (`CRAFT.md:110-122`).
4. Make joins/degradation/promotions first-class typed objects; “continue without input” is unsafe when the missing input is an independent reviewer.
5. Retain typed negatives: output ≠ completion ≠ validation ≠ acceptance; event ≠ command; replay ≠ retry ≠ rerun ≠ resume (`research/event-driven.../findings.md:40-50`; `research/artifact-lineage.../findings.md:46-53`).
6. Require evidence portability: the otherwise disciplined experiment was invalidated by unavailable thread-order evidence, and replication tests embed Windows/ref assumptions.
7. Apply evidence tiers and removal tests to prevent provenance capture cost from dominating ordinary work.

Contradictions/missing contracts:

- Canonical Dispatch still mentions runtime-wide policy while a closed decision says all rules live in the graph (`CRAFT.md:373-379`; `.craft/ledger.yml:1928-1970`).
- Exact human confirmation binding conflicts with no-human-approval mode.
- Retry/degrade is selected but joins, quorum, required inputs, waiver authority, and official-result eligibility are untyped.
- Scheduler freedom is asserted without schedule-equivalence evidence.
- Logical continuity is selected, but durable context, message ordering, crash recovery, compaction, and continuity-failure identity are unspecified.
- Hooks are operational shells importing absent `implementations.server.runtime.*` (`.claude/hooks/host-dispatch-hook.py:8-15`, `host-ingestion-hook.py:9-16`); the mandatory dispatch registrar also depends on an absent registry (`CRAFT.md:124-170`). Thus orchestration is not executable here.
- The commit’s external-comparison receipt is `pass` only for revision/hash integrity, explicitly not adoption (`.craft/artifacts/external-agent-orchestration-comparison-reference.md:18-35`).

Open questions:

- What is the minimal typed control-node/join model?
- What standing authorization can replace per-Dispatch human confirmation?
- Which schedule dimensions are semantically free, and how are invariants tested?
- Where do cancellation, compensation, unknown external effects, and promotion eligibility live?
- What exact evidence distinguishes resumed logical identity from silent replacement?
- What provenance tier beats plain Git/logs on cost and decision quality?

The absent Inventory machine index provides no evidence either for or against precedent cleanliness. This seat does not select a successor or establish implementation readiness.

## Agent 2 — Shannon, Claude

Shannon explorer result — current-byte, read-only comparison (no validators/tests rerun because that could create build/cache evidence; no mutation or bridge stdout).

Evidence matrix
| Dimension | RWO / cyberalchemy-orchestrator | CA2 work-orchestration implementation | Assessment |
|---|---|---|---|
| Semantic kernel | Candidate definitions: compile explicit composition to closed graph; reduce one accepted event to Applied/Duplicate/DivergentDuplicate/Rejected, at most one immutable command; acceptance external. Historical DESIGN is proposal-only. | Authored DomainSpec adds Compile/ReadHistory/Reduce/PersistTransition/DispatchBatch; exact system bindings select frozen RWO core plus local DAG/host/executor/repository components. | Stronger definition→binding trace, but local extensions must not be mistaken for frozen-core semantics. |
| Graph/composition | Design describes sequence/fanout/fanin/gates/sidecars/repeat; implementation-evidence says host-local tests only. | `dag.rs` implements root/all/any/quorum, finite DAG validation, impossible-join blocking, duplicate/divergent duplicate, bounded retries/cancel; `composite.rs` flattens/gate-dominates L0 graphs. Tests name positive and hostile cases. | Backed by source/tests and current PASS receipt, but no fresh run this seat. |
| Acceptance/persistence | Cursor rebuildable; journal owns accepted history. 20260810 one-go run exposed schema/driver inability to admit a null-agent spawn failure or join two successful siblings. | DomainSpec requires one AcceptedHistoryPort authority and atomic event+cursor+complete command batch. `host.rs` compare-and-appends each transition; replay verification exists. | Atomic boundary is materially clearer. Production physical history remains deferred; micro-swarm reference history is in-memory. |
| Partial failure/recovery | Run-001: two spawn returns, third thread-limit failure; validation initially BLOCK (two missing joined receipts). Sidecar found driver lacked lawful partial-wave recovery; final 14-event stream validated PASS only after siblings closed and typed `run_blocked`; no dependent actions. | DAG marks impossible joins blocked, retries bounded; host deadline cancels; executor turns failures into typed node events. Focused tests cover retry, impossible join, replay, history conflict and resume guards. | Better local structural behavior, but no exact integrated witness of “two successful native seats + one host spawn failure + safe sibling cleanup + fresh-run retry authority.” That remains not_evaluable. |
| Effects/authority | RWO explicitly does not authorize, execute, accept events, or own retry policy. | Repository adapter stages work, enforces scopes/toolchain/protected digests/deadline, then can promote one exact output; DomainSpec and receipts say authority/external effect none. | Useful containment, but repository promotion is an implementation effect needing separate authority despite receipt field vocabulary. |
| Evidence | RWO README/definitions/evidence and one-go artifacts are untracked owner-controlled bytes; historical evidence explicitly limits portability, Eve compatibility, multi-host and power-loss claims. | HEAD-tracked package; conformance receipt says 43 Rust integration tests, 4 negative compiler controls, 42-role 27→9→3→3 content-flow PASS, adapter equivalence PASS; ETL initial load=1, replay load=0. | Current artifact-backed bounded local evidence only; reports are not fresh execution and generated graphs/ontologies are projections. |
| Governance/runtime cost | One-go required sidecar governance repair to close a runtime shape the driver schema could not express. OEW lead measured >=56 governance path-writes vs 28 runtime writes and stop–Refresh–reselect amplification; mixed reducer falsely blocked until runtime receipts isolated. | D65 chain and exact bindings reduce semantic ambiguity but add compiler/binding/digest/receipt surfaces. Runtime itself centralizes failure and replay semantics. | Successor should keep exact bindings while minimizing path-count and separating type-owner evidence from runtime receipts. |

Key lessons
1. Make partial-wave failure a first-class runtime transition, including an action with no agent binding; never require fabricated `agent_id`.
2. Separate four truths: route approval, owner call/binding, accepted event/history, and lifecycle join. A UI/projected state cannot collapse them.
3. Persist accepted event + cursor + full command batch atomically, then reconcile before retry; resume/new attempt must preserve immutable semantic identity and carry distinct run/attempt identity.
4. Keep fan-out/fan-in mechanics structural. Gates/join workers own semantic decisions; impossible joins block without releasing successors.
5. Compile from canonical definitions/Product Capability/business ontology/DomainSpec into exact bindings, but treat compiled graph/system ontology as deterministic candidate evidence only.
6. Optimize governance for causal coverage, not artifact volume: isolate reducer input classes and measure governance writes/decisions/refreshes alongside runtime work.

Contradictions/tensions
- Frozen RWO reducer contract emits at most one command intent per event; CA2 DomainSpec persists zero-or-more command batches and DAG root/fan-out emits batches. This may be a host-layer aggregation, but the binding needs an explicit non-collapse proof.
- RWO defines retry scheduling and cancellation policy outside the kernel; local `DagEngine` owns bounded retry transitions and host deadline cancellation. Correct if explicitly a CA2 adapter/domain extension, contradictory if described as frozen RWO semantics.
- CA2 README says “existing RunPod agent.sh compatible,” but current receipt explicitly does not prove live model delivery/model quality.
- RWO implementation-evidence says durable single-host candidate exists, while the CA2 package says physical history deferred/in-memory. Not contradictory if CA2 intentionally declines that host, but successor recovery remains absent.

Typed negatives/open questions
- NOT_EVALUABLE: native partial-wave recovery, durable restart/resume for micro-swarm, multi-host leases/consensus, real delivery, external Eve/RunPod compatibility, hardware power loss, portable Unicode, deployment/readiness.
- DESIGN_ONLY: Augmentor proposal→digest approval→registration→owner call→join→consumption UX and exact two-child browser witness; inventory lead says NO_WITNESS_CURRENT.
- OPEN: Which owner classifies host admission failure vs work failure? Can a failed pre-binding action enter accepted history without an agent id? Is command-batch aggregation formally outside one-event/one-intent RWO semantics? Which physical journal is selected, and how are in-progress command uncertainty/fencing reconciled? What measured budget caps governance path writes and refresh loops?

Current-state integrity: nested RWO HEAD `4821a8f4e2c69e3a11a38ae543dc65accca27a86`; parent HEAD `dc681a6d5b2fbc7876453072381f2ebd9d217517`. Exact frozen dependency hashes match CA2 receipt: `implementations/rwo-rust/src/lib.rs` 2238aca3… and Cargo.toml 0987855f…, but both are UNTRACKED in the dirty nested checkout.

Hash/state ledger (every comparison file used; `H`=HEAD tracked, `U`=untracked):
RWO H: AGENTS d7a597a3; plan README f7a6b8b7; DESIGN 457cea20. RWO U: README db819beb; DEFINITIONS bd37da0e; IMPLEMENTATION-EVIDENCE af7f2cea; one-go events dd216d21, state 73edc1f9, validation 1631c915, HOST-SPAWN-FAILURE 1cd8a320, EVENT-VALIDATION-AFTER 69d58214, PARTIAL-WAVE-CLOSEOUT 9ea12329, JOIN-SIDECAR 959b4f4b, POST-CLOSEOUT cf516846; frozen lib 2238aca3, Cargo 0987855f.
Parent H: routing profile 8083654c, routes 9e697ab0, ROUTER aec2b945, SOURCE-MAP 06af1232; inventory Augmentor 1f475079, OEW 06e13e44. Parent U: dispatch STRATEGY 6b6eb4f7.
CA2 package all H: README e365334d; profile 448293e1; bounded DomainSpec ac304403; system-bindings f202ba69; l0-bindings 2e4e4035; bindings 0e4a504d; src dag 0bfc8954, composite f628e833, executor 4aaf2bf9, host 2fd513ca, repository 075a44b5; tests dag 1d147515, composite 1b16e3b3, executor 625ec7d0, ports ea578536, micro-swarm e21ebb91, l0 b69fbec6; conformance afbaacfd, ETL fa3ef6fb; build receipts ddf83919/082f9332/f2fe9238; projections generic graph 73a49d9c, generic ontology c4fd07db, micro DAG 48b6df41, micro ontology ba1ac4ea.
(Full SHA-256 values are available from the recorded shell output; prefixes above are unique in this evidence set.)

Full SHA/state supplement (to satisfy exact-byte ledger; H=HEAD tracked, U=untracked).
RWO nested checkout:
H AGENTS.md=d7a597a3fa60edb57645cd2a242ead1466e92ee98ae263093631ebf24a085ada
H plans/.../README.md=f7a6b8b7527c126cbe9d139758be65182822d31583d241875f5d64fca2f11123
U docs/.../README.md=db819beb9117ef51878328ab36878bac0e94a71726db2497c97f9e4e4ce64f78
H docs/.../DESIGN.md=457cea208211395cd957236f1bbca6cdf49a0d1aaba257d3c7721e4579afcfef
U definitions/.../DEFINITIONS.md=bd37da0e3f151d129c1b3e831cb91152f34685bd03729cbb888d6c23ff3c35c1
U docs/.../RWO-IMPLEMENTATION-EVIDENCE-2026-08-13.md=af7f2cea938e128e404359db6d718fa30b89362d6c6947cdff4af8eeab6b53f4
U one-go/run-001/events.jsonl=dd216d211a869e8dd86ff5245f27a5ab17730fd6fe9f2c77bbc153bd649ce438
U state.json=73edc1f9fc69030f2103fd526652da3568478438e05bf03bf9fcc5c5ca9e4561
U validation.json=1631c9155e46a88f7e4ffd537c71bd35367a1629239430a6fe25f41e49765081
U HOST-SPAWN-FAILURE-0003.json=1cd8a320bacff82ce405ae48e79436fcd101b82d035d658703aece7c6257df6a
U EVENT-VALIDATION-AFTER-SPAWN-FAILURE.json=69d58214a8f6adfb27e2e0104dd320e6a9dcb955f957fcf260e7e9d6eab7a37b
U PARTIAL-WAVE-CLOSEOUT.json=9ea12329442c05a40710175175b7400c314e5fe40d6662378886c4df76f9d65e
U PARTIAL-WAVE-JOIN-SIDECAR-RECEIPT.json=959b4f4b18aa8f6b8d25e3314605bd5ea83214b2fbb917571e05cee571ff8075
U POST-CLOSEOUT-EVENT-VALIDATION.json=cf516846e328a8b6cf620161591336aeede96ef2f868221bf7cd3714ff2f7374
U implementations/rwo-rust/src/lib.rs=2238aca34a165f36335084a476997993ff23af261c9cc8ebf72a3535d337110f
U implementations/rwo-rust/Cargo.toml=0987855f19aa87818757e5286899ea2576fae43a44190869bbb88eadb21a8f4e
Parent/bootstrap/leads:
H agent-routing/profile=8083654caa0bf9527ed11ef2ef899356703e2f051795255cb1f8992bbd066bdb
H routes=9e697ab0b35d8012148285644af82f51643ce9035792622c160d20c6ea4723aa
H ROUTER=aec2b945695a9db3da5634d7db8d7856d8fdb387112bb8bee24c85d08ab4222d
H SOURCE-MAP=06af1232c1d391773d8afc946c74f4e01b9ff519fe33c347883bbcc0430fcb3c
U dispatch STRATEGY=6b6eb4f7a4e872843404b56d4d63063a706b2e83d7d807e491ad381d8206dd92
H Augmentor lead=1f475079cef32928971ff2850d12ff17efad5933d5eef3c0d0c1a80278add931
H OEW lead=06e13e4417006d3ea65bbea858843ccad75e70253833590b1a81b89555a1b4d5
CA2 package, all H:
README=e365334d6391a86c7b6d09aacdd1cdf916cb2cd97b126737418118369b760b5e
profile=448293e1411fb6e57d446a1122f0612324cb5cc36600c05cca3092933ad91fa7
bounded-composite-work=ac304403fd9d5815aa4ba5b7131fda817da1f43df776b762c50031f02ce00c6f
system-bindings=f202ba69b72aeb0f465f53e58ab6929c925a3b8cc448292431db37b24ea8b8fa
l0-bindings=2e4e403563b8a992d86385e2c8958d11e5cbcf27e014c2bec18d78e1d94006a1
bindings=0e4a504dee1eb0421f11fc19dd11f9dc4372817a3bb400714eecd1a9efa0540e
src/dag=0bfc895425a2f48d622a10ae5058db006c239e6491ff7ab1c258b2ba2d2d4230
src/composite=f628e8339023fd4db0e812c0725fe40fbcf46e87e93d086d9f1754618f8b66c8
src/executor=4aaf2bf9335574f6efa126d0734e97babb7cbfa2d5e7e785308aa75d6eb972aa
src/host=2fd513cabf022cd7680e7af2cad5af87cfa69d3bf77c6f5ef1640d6247f1dc79
src/repository=075a44b5eb4fdcd97357f050f4a7c29f2e907d1df94811a998549c501fdcf157
tests/dag=1d147515ccd47908c5c3c65c6a6b9e15088e7f554e21efe5fc88c24823bb8806
tests/composite=1b16e3b37d8a69fe3680fb786e4f4303be168820555ebf5d8e1ee55cda2e16d6
tests/executor=625ec7d01dc15bcb47accb1b259036cc18a37d57f2f34110ef6121d288f8d19d
tests/ports=ea578536dd4b9b1af8ae17dff7be88fe1fed9d161ecfbeecf997bc3f4c18c0a7
tests/micro_swarm=e21ebb914925107ca8d5b81b053cd0f9cc6160368388da4cb8f331c118d0c63a
tests/l0_bridge=b69fbec6d36122cb3b5e649247bbc7b18bcec256c0187da697303c1e4fba4a4b
conformance=afbaacfd92cfcdfce687ec1084bce3c0665c074d3cbbf2f3e130c3ae6121b938
etl-result=fa3ef6fbb436e1b8328a1e3f23489608055745b934f72746c06eacd46cb07522
build receipts: ddf839194e88f9a624f553824267086bc4bdb4a1f5fe1fa30b16a99ddc45fa39 / 082f9332e783194eb6406023f2b8348d0afa3419b54bef457e82a42f8033efc0 / f2fe92389565978e1d649914f94cbd8acc162b31fdc3adf22ac20929f2696ee3
projections: generic graph=73a49d9c29134512081565da6ff84c4589bc163d2303ec1c3c296417ad073a30; generic ontology=c4fd07dbdb0114dccced35b1c81e61432a1f2bb2f2824e687517d2af70b92623; micro DAG=48b6df410c067d1ec9eba3a4728eed5bea8f66533345a45912baf011d04897d5; micro ontology=ba1ac4ea0a294f69abdd08c35ae433641c0e26752c4377541c7a06e22ccf84df

Completed the bounded comparison and sent the parent:

- Evidence matrix across semantics, graph execution, persistence, recovery, authority, and cost
- Runtime-backed vs design-only claims
- Four contract tensions
- Typed negatives and open questions
- Full SHA-256/Git-state ledger for every file used

No files were mutated, no bridge output was persisted, and no readiness or owner-decision claim was made.

## Agent 3 — Hewitt, Carl

### Reconstructed control loop

| State / transition | Owner | Identity and authority | Failure / partial-result semantics |
|---|---|---|---|
| Authored objective, graph, SWU contracts | Invoke Define/Design/Plan | Canonical authored state; Plan PASS is not runtime readiness | Missing owner, dependency, command, material, validation, receipt, closeout, or successor bindings should return to the earliest authoring owner |
| Immutable readiness projection | Work Pack Readiness Audit | Frozen selectors, per-category semantic digests, projection digest; `authority_effect: none` | Collect-all audit; snapshot drift discards prior pass inference; deterministic omissions block before selection |
| Digest-bound approval | Decision Gate / human | Approval binds semantic projection, frontier, runtime identity, risk, and budget | Any bound semantic change invalidates approval; approval does not repair bytes or grant mutation by itself |
| Finite approved frontier | Task Session Until Blocker | Immutable chain plus hash-linked transitions, budget, visited selectors, receipt joins, cursor fingerprints | First blocker stops; unvisited suffix remains explicit; frontier expansion is rejected |
| Selected SWU admission | Task Session | One fresh session, one task/SWU, single-use admission, live baselines | Selection receipt is non-authoritative; stale package, baseline, dependency, or controlling evidence blocks before mutation |
| Execution and validation | Task Session | Exact write partitions, terminal receipt, acceptance-critical checks | Empirical command/environment/product failures and post-approval drift remain Task Session residue |
| Evidence synchronization | Invoke Refresh through Continuation Router | Exact receipt-bound closeout only; owner receipt or semantic `NO_OP` proof | Execution PASS can coexist with closeout BLOCK; execution evidence is preserved but the Task Session result blocks |
| Continuation | Continuation Router + Task Session Until Blocker | Exactly one canonical, dependency-ready successor; novel cursor | Ambiguous, repeated, out-of-order, cross-scope, unjoined, or budget-exhausted continuation stops |
| Chain closeout | Task Session Until Blocker | `COMPLETE` only after every captured unit has joined closeout and the final unit exposes no successor | Completion is not promotion or production readiness |
| Goal-loop progress | Goal + Craft + human | Goal owns Craft-frontier routing and staged ledger proposals; Craft applies only an approved batch | Audit veto, open lane, missing approval, protected risk, or budget stop prevents promotion |

### Comparison dimensions

- **Objective/work unit:** Goal operates Craft nodes; Task Session Until Blocker operates one finite work-pack frontier; Task Session owns exactly one SWU.
- **Authority/approval:** authoring, audit, approval, execution, closeout, and promotion are separately owned. Generated projections, route outputs, receipts, and telemetry never inherit authority.
- **State/identity:** plan epoch, semantic digest, unit-contract digest, attempt/run ID, cursor, blocker fingerprint, terminal receipt, and owner-closeout receipt are distinct identities.
- **Dependency/scheduling:** deterministic ordered frontier, unique canonical successor, dependency receipts, serial fresh sessions, finite request budget.
- **Evidence/observability:** append-only receipts and chain records; observability is non-authority and cannot alter verdicts.
- **Failure/repair/resume/join:** fail closed at first execution-chain blocker; deterministic defects route backward to their earliest owner; runtime defects remain terminal Task Session evidence; closeout joins are mandatory; compensation is never automatic.
- **Context isolation:** exact context pack per selected SWU, fresh Task Session per unit, no recursive resume, no conversation-only continuation. This is strong logical isolation, but not proof of actor/mailbox or process isolation.
- **Operating cost:** deterministic replay, repeated hashes, live baseline checks, per-unit admission, terminalization, owner closeout, and fresh sessions create substantial serial overhead. Goal alone contains an explicit proportionality/down-route guard.
- **Proven versus claimed:** contracts prove intended fail-closed structure; the private research reaches only `frozen-input-contractual-readiness`. Its 19 acceptance fixtures remain proposed, unverified, and unexecuted.

### Actor-model reading

A safe successor can treat each lifecycle owner as an actor with an immutable message/receipt boundary:

`Plan → WPRA → Approval → Frontier reducer → Task Session → Router/Closeout owner → next reducer step`

The chain/supervisor is a reducer over durable messages, not a super-owner. Fresh Task Sessions approximate per-message actor isolation. Receipts approximate immutable messages. Cursor replay and digest checks approximate idempotence. What is missing is demonstrated cancellation acknowledgement, mailbox ordering under concurrency, late-result quarantine, child supervision, and restart reconciliation.

### Observed defects

1. **Delayed defect detection:** deterministic omissions crossed Plan into Task Session before being discovered.
2. **Retry amplification:** generic Refresh was overloaded with planning repair, projection synchronization, and material production, producing valid transitions without forward progress.
3. **Duplicate-ownership pressure:** Goal and Task Session Until Blocker are both loops; Invoke Plan and WPRA both touch readiness-shaped information. Boundaries must remain Goal/Craft promotion versus finite work-pack execution, and canonical Plan versus non-authoritative projection.
4. **Stale-evidence hazards:** semantic drift, projection regeneration, target-byte drift, mutable status/receipt drift, cursor reuse, and fresh-epoch reuse have different invalidation semantics and cannot share one “stale” bit.
5. **Partial-result ambiguity:** implementation may pass while closeout blocks; the inner PASS must survive, but chain advancement must not.
6. **Repair-loop risk:** unchanged blocker fingerprints and unchanged evidence must not re-enter Task Session.
7. **Orchestration defects recorded by the Inventory lead:** later-wave action numbering resets, and a blocked gate cannot reopen after authorized feedback without a separate continuation segment.

### Invariant candidates

- One canonical owner per state mutation; orchestration owns sequencing only.
- One fresh Task Session and at most one terminal receipt per SWU attempt.
- No Task Session request for a deterministic pre-route omission.
- Approval binds immutable semantics, frontier, risk, runtime, and budget.
- Projection regeneration preserves an epoch only with pinned normalization and equivalence evidence.
- Execution PASS never implies closeout PASS; closeout PASS never implies promotion.
- Continue only after terminal receipt, owner join or validated `NO_OP`, unique successor, novel cursor, unchanged epoch, and remaining budget.
- Runtime failures cannot be reclassified as preflight defects after execution.
- Cancellation, compensation, repair, resume, and join must be separate typed transitions.
- Context is explicitly attached; no sibling or later task inherits conversational state implicitly.

### Typed negatives / open questions

- `NO_ACTOR_RUNTIME_PROOF`: the documents specify reducers and receipts, not actual actor-mailbox semantics.
- `NO_CANCELLATION_ACK_CONTRACT`: cancellation outcome, late receipt handling, and irrevocable-effect boundaries remain unspecified.
- `NO_CONCURRENT_BRANCH_SEMANTICS`: the work-pack loop is intentionally serial; independent-child scheduling and joins are not proven.
- `NO_AUTOMATIC_COMPENSATION`: compensation is `none` with rationale or owner-routed stop.
- `NO_FIXTURE_EXECUTION`: the 19 research fixtures do not yet witness the proposed behavior.
- `NO_PRODUCTION_CLAIM`: readiness, chain completion, and Goal promotion remain below deployment/production evidence.
- Open: which successor owns durable scheduling, cancellation acknowledgement, late-result quarantine, context retention, restart reconciliation, cost budgets, and fairness without becoming a second execution or authority owner?

### Inventory leads verified

Both exact leads exist and are indexed:

- `invoke-one-shot-workflow-research-findings-synthesis`: candidate, high confidence; directly supports the readiness/one-SWU/closeout architecture and preserves the unexecuted-fixture ceiling.
- `augmentor-routing-session-fabric-research-result-synthesis`: verified research read model; supplies the complementary thread-local interaction, immutable route-decision, run-correlation, child isolation, cancellation/join/resume, notification, and late-result-quarantine questions—explicitly without claiming current implementation.

### Load-bearing current-byte digests

- `arcanum/spells/work-pack-readiness-audit/README.md` — `7942d0e7d80b74bc9a400773244ad071b79fe93c54ba204ab6ab3a31f3359401`
- `arcanum/spells/task-session-until-blocker/README.md` — `2528c3df04305509bd5ba464d7be5ffe41005254f2838998dbd992e65156efa5`
- `arcanum/arcana/task-session/SKILL.md` — `937940ac49f0bfe8018dc3b9010feacba34ff2fee22a3269f4f904da416c2909`
- `arcanum/spells/goal/README.md` — `874ce5bff7606265b388b737b929d4ac970ce624b986266662a61adf3063bdfa`
- `ops/development/2026-07-30-invoke-one-shot-workflow-research/findings.md` — `ba739376af94416d3c880bece01fe6698d60c615a4caf0ae64b0d1b4668617ce`
- Inventory lead, invoke synthesis — `fc8414d5ecec2fe499a16ae44dd9bcbff7808afccd64c9e6b13620c0e0967804`
- Inventory lead, routing/session synthesis — `c3beab8bcefedd647af6281d5b0b96871e876aa5590092bb2a142e3442d1a224`

No files were mutated, and no implementation authority is implied.
