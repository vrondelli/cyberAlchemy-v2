# ARE multi-cycle evolution runtime implementation plan

Status: working local prototype through P4 under bounded owner decisions; not admitted execution state  
Project: `CA2-PROJECT-AGENT-REASONING-ENGINE`  
Goal: `CA2-GOAL-AGENT-REASONING-ENGINE-MULTI-CYCLE-EVOLUTION-RUNTIME` (draft candidate)  
Product Capability: `CA2-CAP-REASON-AND-MANAGE-CONTEXT` (existing adopted parent; no new capability)  
Construction candidate: `CONSTRUCTION-BINDING-P4.v1-candidate.json` (project-local, unregistered)  
Authority effect: none  
Implementation authority: PL-04-A, PL-05-A, PL-06-A, and the explicit working-prototype request consumed through P4; none for benchmark execution, providers, activation, or P5 operational effects

## Outcome

Extend the existing ARE `evolution-runtime` into one small JSON-controlled
runtime that owns the durable state, generated data, evidence, receipts,
accounting, recovery, and typed handoffs of five independently defined evolution
cycles. Deliver the benchmark-research vertical first far enough to reconstruct
the current GLM 8K ContextBench H-EN candidate and resume its independent
validation and experiment cycle under a separately approved execution envelope.

The plan does not create a second runtime, does not treat benchmark research as
the universal evolution lifecycle, and does not require all five cycle adapters
to be complete before the H-EN benchmark can resume.

## Authority and current boundary

This plan remains planning evidence. The user separately selected PL-04-A,
PL-05-A, PL-06-A, and the explicit working-prototype continuation; the P1 through P4 implementations ran through `CA2-ROUTE-IMPLEMENT` as
bounded native repository work. CyberAlchemy-v2 Goals validation remains blocked. Therefore
this document:

- records a dedicated draft Goal but does not admit a construction binding or
  execution state;
- does not admit any cycle definition;
- records the completed P1 through P4 evidence but grants no authority for benchmark execution or later operational
  code change, artifact migration, provider call, benchmark execution,
  activation, release, or deployment;
- cannot be used as an execution queue; every later slice requires its own
  exact route, effect assessment, and owner decision.

## Bound inputs

| Input | SHA-256 | Use |
| --- | --- | --- |
| `goals/projects/agent-reasoning-engine/goals/multi-cycle-evolution-runtime.goal.json` | `dbd633c197c46819c65caf8bf70df2314c5950fa433f225b43ea349a30ed9b81` | Dedicated draft Goal through PL-05 |
| `agent-reasoning-engine/product-capability.json` | `cee60707cef50f386ce34241525fe1748f8dc9af066192abb6c7a7f000d4c236` | Existing parent Product Capability selected by PL-02 |
| `agent-reasoning-engine/product-capability-support.json` | `fc98925584141503c56a33e85557f311332a2650e990a707b2b1cc3a957f1528` | Existing measured-evolution policy and predecessor runtime binding |
| `define/candidates/are-multi-cycle-evolution-runtime/ARE-MULTI-CYCLE-EVOLUTION-RUNTIME-DEFINITION-PACK.v1-candidate.json` | `1d5e90d30abebe3cc1aff130946a45e8cf5631f4e5d562bd018bbbb095e2591c` | Candidate product meaning and 46 resolved decisions |
| `define/candidates/are-multi-cycle-evolution-runtime/ARCHITECTURE.md` | `0a84f584f68bd562e066998536c41c839980b7bd906711ba9c4493a89e7dba6a` | Candidate conceptual architecture |
| `implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs` | `10de87607edada20485e8610e0f8c389efa00e65219c828fd8c61cffbdd5ae4e` | Working-prototype runtime export surface |
| `implementation/agent-reasoning-engine/packages/evolution-runtime/README.md` | `887e228b73f00a82054ecbd4e8e463250255148ff0727c6f1a6c74ccdd1f9f71` | Working-prototype public runtime contract |
| `implementation/agent-reasoning-engine/packages/evolution-runtime/registry/hen-frontier-import.v1.json` | `f762970e7322287df2d2f63d31ed7c68f7558df9b2c36b08093d70aa91051af2` | Eleven-artifact H-EN executable evidence closure |
| `implementation/agent-reasoning-engine/packages/evolution-runtime/test/benchmark-research-v1.test.mjs` | `5063a04e2bae67c6967b2e8a9dffa3670d869457d27d2f1f165a314e84f3c517` | Focused closure, replay, recovery, and CLI tests |
| `goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/P1-COMPLETION.v1.json` | `98cc0dda2cc5042818849e7f8094f881733612836826f8a4a929110c57406a6a` | Exact focused P1 completion evidence |
| `goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/P2-COMPLETION.v1.json` | `142b5c86c8a055b6aa80778abaa0d346ab9bcfbdc6bb48e34554d3e543a122b4` | Exact focused P2 completion evidence |
| `goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/P3-COMPLETION.v1.json` | `a7022947eec3c34adf3162e305517e7f8c908a620f6511fa1bf0429ec852be34` | Exact focused P3 completion evidence |
| `goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/P4-COMPLETION.v1.json` | `5c139d345f9a309d2013dbb2085e461783b1e7e776d09101c8f0003100c41e25` | Working-prototype P4 completion with accepted HEN-06 rereview |
| `goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/WORKING-PROTOTYPE.v1.json` | `19c3a0222eb12ce45197a59aeab3ac6467711496d3f920d1c285d746c767cc63` | Machine-readable prototype acceptance and operation surface |
| `goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/HEN-06-INDEPENDENT-REVIEW.v1.json` | `848f434a3056853a8571dce86bebe403963d3fa856ba76b1e8e400bd16861b91` | Independent finding that required PL-09 evidence-closure repair |
| `goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/PL09-EVIDENCE-CLOSURE-REPAIR.v1.json` | `7f6503db64caef9aa1815889c459765eae543e1e071ff3eb3288e7b64c639500` | Exact successor manifest repair and focused verification |
| `goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/HEN-06-INDEPENDENT-REREVIEW.v1.json` | `77297e2cb67818c762c86ed5a767dd41c69872f7ccc04810c0665284d3ec1087` | Independent acceptance of all HEN-06 construction criteria |
| `work-orchestration/README.md` | `ca43c09d9668a268ab59e7d74c32e73dcf27f22c9bf4d66e96351624f3fd1032` | RWO capability boundary used as reference evidence only |
| `work-orchestration-implementation/RWO-EXPLAINED.md` | `90d422a1a73de51dcdbd6ce32da3a8fb74f686d25c507326c6e3606b48e0dfa2` | RWO ownership and structural-reduction explanation |
| `work-orchestration-implementation/ports/accepted-history.json` | `2967aa93c3b6212d192b74333a11ee35fb60ab10742f1b4465facbc02bae8292` | Compare-and-append invariant reference; not an ARE history port |

The predecessor runtime passed 54 of 54 package tests during definition review.
After P1, the expanded runtime passed 64 of 64 package tests. After P2 it passed
78 of 78; after P3 it passed 84 of 84; the working P4 prototype passes 92 of
92 package tests. These results are
bounded implementation evidence, not proof of the complete architecture.

## Delivery shape

Construction is organized as independently reviewable vertical slices. Each
slice freezes its input identities, produces deterministic tests and receipts,
and stops at its completion gate. Later slices cannot silently revise earlier
contracts; material changes create a successor plan or definition decision.

```text
P0 product carrier and exact baseline
 └─ P1 protocol, schemas, and definition registry
     └─ P2 durable kernel, recovery, and projections
         ├─ P3 work admission, leases, settlement, and handoffs
         │   └─ P4 benchmark-research/H-EN reconstruction
         │       └─ P5 H-EN validation and benchmark-resume gate
         ├─ P6 remaining cycle adapters
         └─ P7 archive and restore lifecycle
             └─ P8 frozen product candidate and conformance assessment
```

P6 and P7 may proceed after P3 without delaying P4-P5. Controlled upgrade in P6
remains non-activating and isolated from the benchmark path.

## Product construction lane

### P0 — Bind the product carrier and baseline

Outcome: one exact, non-authorizing construction identity for this capability.

Work:

- Carry the resolved `PL-01` binding to the dedicated draft Goal
  `CA2-GOAL-AGENT-REASONING-ENGINE-MULTI-CYCLE-EVOLUTION-RUNTIME` under the
  existing ARE Project.
- Carry the resolved PL-02 Product Capability
  `CA2-CAP-REASON-AND-MANAGE-CONTEXT`, with
  `CA2-CAP-POLICY-ARE-MEASURED-EVOLUTION` as the supporting policy and
  `CA2-CAP-BIND-ARE-EVOLUTION-RUNTIME` as predecessor realization evidence.
- Bind the Definition Pack, architecture, current source tree, test set, Node
  runtime, and relevant toolchain identities by digest.
- Record predecessor gaps without changing accepted predecessor evidence.

Completion gate: exact Project, Goal, Product Capability, definition, source,
and validator identities are available for a D65 construction chain, and the
Goals blocker is either repaired or explicitly carried as a blocking result.

### P1 — Freeze the JSON protocol and cycle-definition contracts

Outcome: closed, versioned schemas for commands, results, events, receipts,
artifacts, effect envelopes, admissions, handoffs, and cycle definitions.

Work:

- Verify the selected existing Product Capability bytes and adoption/currentness
  evidence without changing its meaning.
- Author the bounded multi-cycle business-ontology delta required by the
  Definition Pack, then author its DomainSpec source and deterministically
  materialize the compiled graph and system-ontology projection before runtime
  implementation begins.
- Define stable command identity, idempotency key, expected event revision,
  actor/worker attribution, cycle and target-record identity, and payload digest.
- Define receipts for accepted and rejected commands with reason codes and no
  direct state assignment field.
- Define the shared cycle-definition envelope and typed policy extension point
  required by CR-02.
- Represent all five registry entries as candidate definitions. Registry scope
  does not mark them admitted or enabled; DG-01 admission is recorded separately.
- Define compatibility and successor-version rules.

Verification: capability-currentness check; business-ontology and DomainSpec
validation; deterministic graph/system-ontology materialization; schema
fixtures; unknown-field rejection; malformed hash, revision, replay, and
definition-substitution tests; receipt determinism tests.

Completion gate: the P1 D65 stages close in order through tested protocol
implementation; all public JSON boundaries are closed and versioned, and no
schema can directly mutate projection state or transfer authority.

### P2 — Implement the durable kernel and reconstruction path

Status: implemented under PL-05-A; focused and package regression validation
passing. The production-default JSON CLI rejects all five still-disabled cycle
definitions, and no benchmark was run.

Outcome: one authoritative event chain with atomic receipts and three rebuildable
projection layers.

Work:

- Add append-only event and receipt ledgers plus a global content-addressed
  object store.
- Add a transactional SQLite index as a disposable operational projection.
- Commit command deduplication, event append, receipt append, object references,
  and index revision as one recoverable unit of work.
- Derive aggregate cycle, subordinate-record, and executable-work projections
  from the same verified event revision as required by CR-01.
- Rebuild after index loss; reconcile interrupted writes; reject corrupt,
  contradictory, or missing durable evidence.
- Prohibit secrets and credential material from stored commands and artifacts.

Verification: crash-point matrix, replay and duplicate-command tests, index
deletion/rebuild, object-integrity checks, concurrent expected-revision tests,
secret-rejection tests, and deterministic three-layer inspection snapshots.

Completion gate: a fresh process can reconstruct byte-identical authoritative
state and receipts from durable inputs without trusting SQLite or status files.

Completion evidence: `P2-COMPLETION.v1.json`, the frozen three-layer snapshot,
14 focused kernel tests, 78 package tests, and deterministic DomainSpec
materialization. The package-wide validator still carries the same two
pre-existing non-P2 product-schema blockers.

### P3 — Add bounded work coordination and cross-cycle handoffs

Status: implemented under PL-06-A; six focused P3 tests and all 84 package
tests pass. No cycle definition was admitted or enabled and no benchmark ran.

Architecture: `PL-06R-A` selects native coordination inside the ARE
`evolution-runtime`. RWO supplies reference invariants and conformance ideas
only. It is not a runtime dependency, scheduler, executor, cursor, journal, or
accepted-history owner. See `ARCHITECTURE.md`.

Outcome: ready work can be proposed and settled without giving agents ownership
of state or authority.

Work:

- Reuse the Research DAG as a dependency projection and Research Work Plan as
  the exact task declaration; do not turn either into a second executor.
- Keep the P2 durable kernel as the sole command, event, receipt, revision, and
  accepted-state authority. Do not instantiate an RWO history store or translate
  the work plan into a second authoritative DAG.
- Implement ready-work derivation, caller selection, leases, expiry, recovery,
  accounting, evidence-bound completion, and retry lineage.
- Implement the generic envelope/admission mechanism with cycle-specific typed
  validators and named phases.
- Implement typed handoff offers and receiving-cycle acceptance receipts. Never
  transfer mutable state, credentials, budgets, or authority.
- Keep external dispatch disabled unless an exact admitted envelope permits it.

Verification: stale-revision races, lease expiry and replay, over-budget and
out-of-envelope rejection, missing-validator blocking, handoff substitution,
and recovery-before-redispatch tests.

Completion gate: all effectful work requires a current phase admission and ends
in exactly one durable settlement while informational work remains non-authorizing.

Completion evidence: `P3-COMPLETION.v1.json`, the closed coordination protocol,
native coordinator, JSON stdin boundary, durable P2 integration, and hostile
lease, recovery, budget, validator, evidence, handoff, and injection tests.

### P4 — Deliver the benchmark-research H-EN vertical

Status: implemented as the working local prototype under the user's explicit
continuation request. Eight focused P4 tests and all 92 package tests pass. No
model, provider, evaluator, Docker, network, or benchmark execution occurred.

Outcome: the first useful end-to-end consumer reconstructs the current H-EN
frontier without falsifying history.

Work:

- Implement `benchmark-research/v1` semantic records, transitions, frozen metric
  policy, hypothesis portfolio, experiment freeze, attempts, evaluations, and
  independent-review tasks.
- Create a ContextBench adapter that speaks the common JSON protocol and stores
  outputs through runtime artifact APIs.
- Import only the DG-05 closure: the current GLM 8K ContextBench H-EN hypothesis
  and candidate as `awaiting-validation`, retaining `E5` solely as a legacy alias.
- Preserve original paths, hashes, chronology posture, exposure classification,
  known/failed/unknown accounting, and missing evidence as missing.
- Exclude the complete old ContextBench campaign, ARE-DSH branch, older branches,
  and the third benchmark from this import.

Verification: dry-run import manifest, source-byte digest comparison, repeated
import idempotency, full reconstruction, no synthetic event or receipt tests,
and inspection showing all three projection layers at one revision.

Completion gate: the runtime reconstructs the current H-EN candidate at
`awaiting-validation` with an explicit retrospective import receipt and no
benchmark execution.

Completion evidence: `P4-COMPLETION.v1.json`. The bounded manifest imports the
controlling workflow, rejected R1 candidate and review, repaired R2 candidate,
and supervised R7 replay. It explicitly excludes ARE-DSH rounds 73–78 and the
complete historical ContextBench campaign. Restart and deleted-index recovery
rebuild a byte-identical semantic projection and provider-free reconstruction
bundle index.

### P5 — Qualify benchmark resumption

Outcome: one exact next H-EN experiment can be proposed safely after independent
construction validation.

Work:

- Send the candidate output and immutable evidence bundle to an evaluation agent
  distinct from its producer; accept only its structured recommendation and
  validation receipt, not direct state mutation.
- Resolve validation findings and freeze the exact next experiment: candidate
  bytes, GLM/model settings, 8K context cohort, prompts, primary metrics,
  guardrails, diagnostics, frozen baseline, budgets, retries, adapters, and stop
  rules.
- Run WSL/toolchain, Docker, dataset, model-provider, credential-slot, disk, and
  resource preflight without persisting secrets.
- Present one user decision for the immutable benchmark effect envelope. After
  approval, obtain runtime launch admission before any measurement call.
- Execute and settle only through a separately authorized operational request.

Verification: independent-review identity check, freeze determinism, leakage
and cohort checks, provider dry run, budget rejection tests, kill-and-recover
canary, and complete attempt accounting.

Completion gate: before execution, a user-approved envelope and runtime launch
admission bind the exact experiment. After execution, the first runtime-native
H-EN attempt is reconstructible with all outputs, costs, failures, and receipts.

### P6 — Add the remaining cycle adapters

Outcome: the common kernel supports all initial cycle types without merging
their meanings.

Sequence:

1. `research-learning/v1`: answerability contract, evidence portfolio, question
   disposition, Research Finding Bundle.
2. `engine-improvement/v1`: isolated variants, staged comparison, recommend-only
   decision, currentness-bound retention.
3. `interaction-learning/v1`: minimized attributed evidence, scoped lesson,
   application outcome, expiry and revocation.
4. `controlled-upgrade/v1`: isolated process and credential domain, immutable
   Activation Binding, final readiness compare, fail-closed canary, idempotent
   recovery and rollback.

Each adapter requires its own DG-01 admission, conformance fixtures, hostile
boundary tests, recovery tests, and non-authorizing handoff tests. The controlled
upgrade adapter must prove its process and credentials are unavailable to all
other workers; no live activation is part of this phase.

Completion gate: each admitted adapter passes the same kernel conformance suite
plus its cycle-specific validators without expanding another cycle's policy.

### P7 — Add the space-first archive lifecycle

Outcome: distant-cycle evidence occupies less hot storage while preserving
identity and reliable restoration.

Work:

- Keep identity, event, receipt, hash, accounting, decision, handoff, and archive
  metadata hot.
- Deduplicate globally by immutable content identity; compress warm objects.
- Pack only terminal, unpinned, settled, lease-free, non-immediate heavy objects
  into verified cold archives.
- Verify archive manifest and bytes before changing locality; periodically restore
  samples and verify original hashes.
- Automatically remove only temporary or proven-unreferenced disposable data.
  Permanent evidence deletion remains a separate user gate.

Verification: dedup accounting, archive eligibility, interrupted pack/recovery,
bit-rot detection, full restore, pin/reference races, and prohibited-deletion
tests with measured hot/warm/cold storage reports.

Completion gate: archived cycles remain fully navigable and reconstructible, and
no authoritative evidence can disappear through compaction or index cleanup.

### P8 — Freeze and assess the product candidate

Outcome: one exact implementation candidate and collect-all assessment suitable
for a later acceptance decision.

Work:

- Freeze complete implementation, schemas, cycle definitions, migrations,
  dependencies, toolchains, tests, and documentation by digest.
- Run existing regression tests, kernel conformance, all admitted adapter suites,
  recovery/corruption matrices, archive restore tests, and security boundary tests.
- Record every unmet or not-evaluable requirement; do not collapse tests into
  adoption or claim the five definitions were admitted merely by implementation.

Completion gate: an immutable candidate bundle and evidence index exist for a
separate product-owner acceptance decision. Publication, installation,
activation, release, deployment, and external effects remain out of scope.

## Operational support lane

These tasks support construction but do not redefine the Product Capability:

| Support item | Needed by | Required evidence |
| --- | --- | --- |
| WSL Node, Python, Rust, native linker, and Docker preflight | P2, P5, P6 | Exact versions, executable paths, container smoke test; use the repository Rust launcher |
| Benchmark dataset and model/provider readiness | P5 | Dataset digest, model/settings identity, credential-slot presence without secret capture, bounded dry run |
| Storage capacity and archive destination | P7 | Capacity estimate, locality policy, restore test destination, failure behavior |
| Upgrade process and credential isolation | P6 controlled upgrade | Separate process identity, least-privilege credential slot, denial proof from other workers |
| Backup and recovery exercises | P2, P7 | Crash matrix, rebuild logs, archive restore receipts, measured recovery time |

Missing operational support blocks only the dependent phase. For example,
upgrade credentials do not block H-EN benchmark reconstruction or resumption.

## Acceptance matrix

| Milestone | Minimum proof | Does not prove |
| --- | --- | --- |
| Kernel ready | Closed protocol, atomic durable chain, deterministic rebuild, layered projections | Any cycle definition is admitted |
| Coordination ready | Envelope/admission, leases, settlement, typed handoffs pass hostile tests | External dispatch is authorized |
| H-EN reconstructed | Exact retrospective import, current candidate at `awaiting-validation` | Construction validation or benchmark success |
| H-EN resumable | Independent validation, frozen experiment, preflight, approved envelope, launch admission | Results or objective completion |
| Five adapters conform | Kernel plus cycle-specific conformance suites pass | Upgrade, release, or deployment authority |
| Archive ready | Verified pack and restoration preserve original hashes | Permission to delete evidence |
| Product candidate frozen | Complete exact candidate and collect-all assessment | Adoption or activation |

## Current construction boundary

PL-04-A, PL-05-A, PL-06-A, and the explicit working-prototype continuation authorized P1 through P4. The runtime now has a closed
protocol plus atomic durable commit visibility, append-only event and receipt
entries, a global content-addressed object store, deterministic three-layer
reconstruction, a disposable SQLite index, recovery, diagnosis, and a JSON
stdin boundary. It also has phase admission, derived readiness, bounded leasing,
explicit recovery-before-redispatch, evidence-bound settlement, accounting,
retry lineage, and typed handoffs through the same durable authority. All five
cycle definitions remain candidate and disabled. The local prototype reconstructs
H-EN R2 at the historically imported `awaiting-validation` state. A different
evaluator identity accepted all HEN-06 construction criteria after PL-09 closed
the executable-evidence gap. The current runtime does not yet ingest that review
as a durable transition, so it does not rewrite the retrospective projection.
HEN-07 compression is the next construction frontier; tokenizer qualification,
provider use, and benchmark execution remain later exact gates.

## Open questions

### PL-01 — Goal carrier — resolved

The user selected option A. The dedicated draft Goal is
`CA2-GOAL-AGENT-REASONING-ENGINE-MULTI-CYCLE-EVOLUTION-RUNTIME`; the existing
continuous-construction task-loop Goal remains unchanged. This records planning
identity only and does not admit a D65 construction binding.

### PL-02 — Product Capability carrier — resolved

The user selected option A. The Goal retains the existing parent Product
Capability `CA2-CAP-REASON-AND-MANAGE-CONTEXT`. Its existing
`CA2-CAP-POLICY-ARE-MEASURED-EVOLUTION` policy and
`CA2-CAP-BIND-ARE-EVOLUTION-RUNTIME` realization binding are predecessor
evidence specialized by the new Definition Pack. No new Product Capability or
adoption decision was created.

### PL-03 — D65 construction-record posture — resolved

The user selected option A. The project-local
`CONSTRUCTION-BINDING-P1.v1-candidate.json` binds the exact D65 revision-2
prototype contract, Goal, Product Capability, Definition Pack, baseline runtime,
and P1 boundary. It is deliberately absent from the central construction-binding
registry and from the Project's `construction_binding_refs` while Goals
validation is blocked.

### PL-04 — First implementation authorization — resolved

The user selected option A. P1 added the business-ontology delta, DomainSpec
source and deterministic generated projections, closed JSON schemas, structural
validators, a five-definition candidate registry, deterministic accepted and
rejected receipts, hostile-boundary tests, and updated runtime documentation.
It did not implement P2 storage, projections, recovery, dispatch, migration,
provider use, benchmark execution, or activation.

### PL-05 — P2 implementation authorization — resolved

The user selected option A. P2 added the durable kernel, JSON stdin CLI,
content-addressed objects, atomic commit markers, append-only event and receipt
entries, three derived projection layers, disposable SQLite index, explicit
recovery and diagnosis, stale-lock handling, and crash/corruption tests. It did
not admit definitions, dispatch work, migrate evidence, run benchmarks or use
providers.

### PL-06 — P3 implementation authorization — resolved

The user selected option A. P3 added native ready-work derivation, bounded
leases, explicit recovery-before-redispatch, evidence-bound settlement,
accounting and retry lineage, phase admission, and typed non-authorizing
handoffs. It did not migrate benchmark evidence, admit or enable definitions,
dispatch externally, use providers, run benchmarks, or activate anything.

### PL-06R — P3 orchestrator integration boundary — resolved

The user selected option A. P3 coordination will be implemented natively inside
the ARE `evolution-runtime`; the P2 durable kernel remains the sole state and
accepted-history authority. The RWO package is retained as reference and
conformance evidence for root authority, deterministic reduction, replay,
compare-bound acceptance, and separation of coordination from execution.

P3 will not depend on the Rust RWO runtime, instantiate its accepted-history
ports, use its `DagEngine` as a parallel scheduler, or use its structured-agent
shell as an automatically enabled dispatcher. This architecture decision was
realized only through the later, separately authorized PL-06-A slice.

### PL-07 — P4 H-EN reconstruction authorization

Resolved by the user's instruction to execute until a working prototype. The P4
prototype reconstructs only the current H-EN evidence closure at
`awaiting-validation`. It does not independently approve H-EN or authorize
tokenizer qualification, providers, model calls, or benchmark runs.

### PL-08 — Prototype continuation boundary

The working prototype is complete. Its next product task is independent R2
construction review by an evaluator identity different from the producer.
The user selected independent review. Its first pass found an executable-source
identity gap, and the separately authorized PL-09 repair closed that gap. The
independent rereview accepted all three HEN-06 construction criteria. This does
not constitute scientific validation or benchmark admission.

### PL-09 — Frozen evidence-closure repair — resolved

The user selected option A. The successor manifest binds eleven artifacts,
including the repaired worker, both transitive ranking modules, supervisor,
R7 analyzer, and exact 11-test source. The runtime passes 92/92 package tests,
the H-EN suite passes 11/11, and independent rereview closed HEN-06.

### PL-10 — HEN-07 hint representation — resolved

The user selected option A. HEN-07 will plan deterministic compact path-and-span
reference records carrying the normalized repository-relative path, inclusive
line span, pinned content SHA-256, integer score units, and originating facet.
Records deduplicate by path, span, and content hash; deterministic score and
lexical tie-breaks retain the best duplicate. The records contain references,
not source excerpts, model-generated summaries, or gold-derived locations.

### PL-11 — HEN-07 serialized payload ceiling — resolved

The user selected option A. The complete canonical serialized HEN-07 hint
payload is limited to 4,096 UTF-8 bytes, measured over the deterministic compact
JSON encoding including its enclosing structure. This is a provider-independent
storage and transport bound, not a token estimate. Real full-prompt token
admission remains HEN-09 work and cannot be inferred from this ceiling.

### PL-12 — HEN-07 aggregate record-count ceiling — resolved

The user selected option A. At most sixteen deduplicated path-and-span records
may compete for space inside the 4,096-byte canonical payload. The byte ceiling
remains independently controlling: sixteen records are not guaranteed when
their canonical encoding is larger than the available space.

### PL-13 — HEN-07 per-path record ceiling — resolved

Under the user's automode authorization, the runtime selected the balanced
default of four records from one normalized repository-relative path. This
keeps any one file below one quarter of the sixteen-record payload while still
allowing multiple relevant spans from concentrated evidence.

### PL-14 — Evidence-driven H-EN automode — active

Low-level reversible hypothesis parameters are now selected by the runtime from
declared objectives, constraints, and local evidence rather than returned to the
user one number at a time. Automode may construct and validate provider-free
successors inside the current repository envelope. It stops at credentials,
provider or model calls, live benchmark execution, destructive evidence action,
publication, release, deployment, or a change to the objective or claim ceiling.

The selected HEN-07 hypothesis uses deterministic facet round-robin selection
after exact deduplication, with score ordering inside each facet. It passes nine
focused tests and the complete 101-test evolution-runtime suite. On the frozen
four-task R7 replay it reduced 320 raw hints to 64 selected hints, kept every
payload between 2,740 and 3,174 bytes, and retained seven of nine previously
missing labeled paths in post-hoc evaluation. Labels were not selection inputs.

HEN-08 now wraps each task payload in a separate digest-bound candidate view
with exact source-query, raw-hint, omission, selected-hint, byte, provider-call,
and model-call accounting. HEN-07 and HEN-08 are provider-free local
construction evidence, not independent approval or a benchmark result.

### HEN-09 — external tokenizer boundary

The next frontier is initial, populated, and terminal full-request tokenizer
qualification. The historical exact tokenizer uses the Z.AI tokenizer endpoint,
so progress requires a frozen prompt contract, credential-slot readiness, and a
separate external-call effect envelope. The 4,096-byte hint ceiling cannot be
treated as proof of 8K token admission.

### Deferred implementation choices

These are selected inside their owning phase, not product-meaning gates now:

- ContextBench adapter process boundary and exact import manifest in P4;
- provider/model/credential slot and concrete H-EN limits in P5;
- archive codec, pack size, locality thresholds, and restore cadence in P7.

Every choice must be bound in the relevant phase evidence and may not weaken the
Definition Pack's claim ceiling.
